'use strict';

module.exports = function(io, db) {
	var express = require('express');
	var router = express.Router();
	var cprocess = require('child_process');
	var stream = require('stream');

	function computeIndentLevel(lineTabSplitted) {
		var indentLevel = 0;
		lineTabSplitted.forEach((e, idx) => {
			if (e === '') { indentLevel++; }
			if (e !== '') { return indentLevel; } // break when first sees a non 4-space char
		});
		return indentLevel;
	}

	function commentAndInjectPass(lines, start, end, indentLevel) {
		for (let i = start; i < end; ++i) {
			lines[i] = '#' + lines[i].slice(1);
		}
		var passStr = 'pass';
		for (let i = 0; i < indentLevel; ++i) {
			passStr = '    ' + passStr;
		}
		lines.splice(end, 1, passStr); // Don't append another line in order to maintain the
									   // line no. information of where the actual syntax error happened
		return lines.join('\n');
	}

	function commentContainingFunctionBody(code, errorLineNo) {
		var lines = code.split('\n');
		var tabSpliitedLines = [];
		var lineNo = lines.length;
		var indentLevel = 0;

		lines.forEach((line, idx) => {
			tabSpliitedLines[idx] = line.split('    '); // TODO: TEST - 4 spaces or \t?
		});

		var errorLineIdx = errorLineNo - 1;
		var indentLevel = computeIndentLevel(tabSpliitedLines[errorLineIdx]);

		var up = errorLineIdx - 1;
		while (up > -1) {
			if (computeIndentLevel(tabSpliitedLines[up]) >= indentLevel) up--;
			else break; // break as soon as a different indentation level seen
		}

		var down = errorLineIdx + 1;
		var lastLineIdx = lineNo - 1;
		while (down <= lastLineIdx) {
			if (computeIndentLevel(tabSpliitedLines[down]) >= indentLevel) down++;
			else break; // break as soon as a different indentation level seen
		}

		return commentAndInjectPass(lines, up+1, down-1, indentLevel);
	}

	function commentErrorLines(code, obj, cb) {
		var runningCode = '';

		//const pyprocess = cprocess.spawn('python', ['./public/python/ast.py', code]);
		var s = new stream.Readable();
		var pyprocess = cprocess.spawn('python');

		s.push(code);
		s.push(null);
		s.pipe(pyprocess.stdin);

		// execute the code 
		const chunks = [];

		pyprocess.stderr.on('data', (chunk) => {
			chunks.push(chunk);
		});

		pyprocess.stdout.on('data', function(chunk) {
			chunks.push(chunk);
		});

		pyprocess.stdout.on('end', () => {
			/*
			// There's no need to do AST analysis to catch syntactic errors.
			// Just run the code itself with python
			var errorHandle = 'pythonparser.diagnostic.Error: <unknown>:';
			var handleLength = errorHandle.length;
			var bufferStr = Buffer.concat(chunks).toString('utf-8').trim();
			console.log(bufferStr);
			var split = bufferStr.slice(bufferStr.search(errorHandle) + handleLength).split(/:|-/);
			if (split.length < 4) {
				// No syntactic error found <-- TODO: TEST
				console.log('No syntactic error!');
				obj.runningCode = code;
				return cb();
			}
			console.log('Yes syntactic error!');
			var startLineNo = split[0];
			var endLineNo = split[2];
			var startColNo = split[1];
			var endColNo = split[3];

			obj.syntaxErrorRanges.push({start: {row: startLineNo, col: startColNo}, end: {row: endLineNo, col: endColNo}});
			*/

			var errorHandle = 'File "<stdin>", line ';
			var handleLength = errorHandle.length;
			var bufferStr = Buffer.concat(chunks).toString('utf-8').trim();
			console.log(bufferStr);
			var start = bufferStr.search(errorHandle)
			if (start < 0) {
				// No syntax error
				console.log('No syntactic error!');
				obj.runningCode = code;
				return cb();
			}

			console.log('Yes syntactic error!');
			var lineNo = parseInt(bufferStr.slice(start + handleLength).split(/\s/)[0]);

			if (isNaN(lineNo)) {
				// Line number parse error
				return cb();
			}

			obj.syntaxErrorRanges.push({start: {row: lineNo, col: 0}, end: {row: lineNo, col: 0}});
			var newCode = commentContainingFunctionBody(code, lineNo);
			commentErrorLines(newCode, obj, cb);
		});
		return runningCode;
	}

	function findUser(users, userName) {
		var userIdx = -1;
		users.forEach((user, idx) => {
			if (user.userName === userName) {
				userIdx = idx;
			}
		});
		return userIdx;
	}

	// /lab/intro_programming?user=test&password=test
	router.get('/:labID', (req, res, next) => {
		var labID = req.params.labID;

		db.find({labID: labID}, (err, docs) => {
			if (err) {
				console.error(err);
				return res.sendStatus(500);
			} else {
				if (docs.length !== 1) {
					docs.forEach((doc, idx) => {
						console.log(doc);
					});
					return res.status(500).render('error',
					{
						title: 'Labyrinth - ' + labID,
						errorMsg: "Something went wrong ... Please check the lab ID and the URL"
					});
				} else {
					var userName = req.query.user;
					var password = req.query.password;

					if (!userName || !password) {
					  	return res.status(200).render(
					  		'main',
					  		{ 
					  			title: 'Labyrinth - ' + labID,
					  			labID: labID,
					  			language: 'python',
					  			labDoc: docs[0].labDoc,
					  			loggedIn: false,
					  			user: docs[0].users[findUser(docs[0].users, userName)]
					  		}
					  	);
					}

					var loggedIn = false;
					docs[0].users.forEach((user, idx) => {
						if (user.userName === userName) {
							loggedIn = user.password === password;
						}
					});

				  	return res.status(200).render(
				  		'main',
				  		{ 
				  			title: 'Labyrinth - ' + labID,
				  			labID: labID,
				  			language: 'python',
				  			labDoc: docs[0].labDoc,
				  			loggedIn: loggedIn,
				  			user: docs[0].users[findUser(docs[0].users, userName)]
				  		}
				  	);
				}
			}
		});
	});

	router.post('/', (req, res, next) => {
		var body = req.body;
		var command = body.command; // Command strings are in globals.js

		if (command === "searchLabIDs") {
			var data = {labIDs: []};
			db.find({}, (err, docs) => {
				if (err) {
					console.log(err);
					return res.sendStatus(500);
				}

				docs.forEach((doc, idx) => {
					data.labIDs.push(doc.labID);
				});

				return res.status(200).send(data);
			});
		}
	});

	router.post('/:labID', (req, res, next) => {
		var body = req.body;
		var labID = req.params.labID;
		var command = body.command;

		if (command === "run") {
			var code = body.code;
			var lang = body.language;
			var s = new stream.Readable();
			var process = cprocess.spawn('python');

			// execute the code
			s.push(code);
			s.push(null);
			s.pipe(process.stdin);
			var chunks = [];

			process.stderr.on('data', (chunk) => {
				chunks.push(chunk);
			});

			process.stdout.on('data', function(chunk) {
				chunks.push(chunk);
			});

			process.stdout.on('end', () => {
				res.status(200).send(Buffer.concat(chunks));
			});

			return;
		} else if (command === "runAllTests") {
			////////////////////////////
			// Run all the test cases
			////////////////////////////
			var lang = body.language;
			var execFilePath = './public/python/PythonTutor/doctest_exec.py';

			db.find({labID: labID}, (err, docs) => {
				if (err) {
					return console.error(err);
				}

				if (docs.length !== 1) {
					return console.log("Lab ID not uniquified");
				}

				var code = body.code;
				var fixObj = {runningCode: '', syntaxErrorRanges: []};
				commentErrorLines(code, fixObj, () => {
					var pickleFilePath = docs[0].pickleFilePath;
					var results = [];
					var count = 0;
					var numToDo = 0;
					docs[0].labDoc.checkpoints.forEach((cp, cp_idx) => {
						numToDo += cp.testCases.length;
						cp.testCases.forEach((testcase, case_idx) => {
							// Test the code and comment out parts that return syntactic errors
							var runningCode = fixObj.runningCode;
							var syntaxErrorRanges = fixObj.syntaxErrorRanges;

							var execProcess = cprocess.spawn(lang, [execFilePath, pickleFilePath, cp.name, case_idx, runningCode]);
							var errChunks = [];
							var resultChunks = [];

							execProcess.stderr.on('data', (chunk) => {
								errChunks.push(chunk);
							});

							execProcess.stdout.on('data', (chunk) => {
								resultChunks.push(chunk);
							});

							execProcess.stdout.on('end', () => {
								if (!results[cp_idx]) results[cp_idx] = [];
								if (!results[cp_idx][case_idx]) results[cp_idx][case_idx] = [];
								var trace = JSON.parse(Buffer.concat(resultChunks).toString('utf-8').trim())["opt_trace"];
								results[cp_idx][case_idx].push(trace);
								count += 1;
								if (count === numToDo) {
									res.status(200).send({results: results, runningCode: runningCode, syntaxErrorRanges: syntaxErrorRanges});
								}
							});
						});
					});
				}, true);
			});
		} else if (command === "debug") {
			var code = body.code;
			var lang = body.language;

			var s = new stream.Readable();

			var traceProcess = cprocess.spawn('python', ['./public/python/PythonTutor/generate_json_trace.py', '--code', code]);
			// execute the code
			var chunks = [];

			protraceProcesscess.stderr.on('data', (chunk) => {
				chunks.push(chunk);
			});

			traceProcess.stdout.on('data', (chunk) => {
				chunks.push(chunk);
			});

			traceProcess.stdout.on('end', () => {
				// JSON trace is generated
				res.status(200).send(Buffer.concat(chunks));
			});

			return;

		} else if (command === "save") {
			db.find({labID: labID}, (err, docs) => {
				if (err) {
					console.log(err);
					res.status(500).render('error',
					{
						title: 'Labyrinth - ' + labID,
						errorMsg: "Something went wrong ... Please check the lab ID and the URL"
					});
					return;
				} else {
					if (docs.length !== 1) {
						console.log("Error, lab doc is not uniquified by labID");
						res.render('error',
						{
							title: 'Labyrinth - ' + labID,
							errorMsg: "Something went wrong ... Please check the lab ID and the URL"
						});
						return;
					} else {
						var userName = body.userName;
						var userIdx = findUser(docs[0].users, userName);
						var password = docs[0].users[userIdx].password;
						var role = docs[0].users[userIdx].role;
						var checkpointStatus = body.checkpointStatus;
						var code = body.code;
						var codeEdits = docs[0].users[userIdx].codeEdits;
						var console_ = body.console;
						var debugger_ = body.debugger;
						var notificationPaneContent = body.notificationPaneContent;

						var userSearchQueryStr = 'users.' + userIdx;
						var userStatusObj = {};
						userStatusObj[userSearchQueryStr] = {
							userName: userName,
							password: password,
							role: role,
							checkpointStatus: checkpointStatus,
							code: code,
							codeEdits: codeEdits,
							console: console_,
							debugger: debugger_,
							notificationPaneContent: notificationPaneContent
						};

						db.update({labID: labID}, {$set: userStatusObj}, {}, () => {});
						res.sendStatus(200);
						return;
					}
				}
			});
		} else if (command === "signup") {
			console.log('in1');
			db.find({ labID: labID }, (err, docs) => {
				if (err) {
					console.log(err);
					res.sendStatus(500);
				} else {
					if (docs.length !== 1) {
						console.log("Error, lab doc is not uniquified by labID");
						res.render('error',
						{
							title: 'Labyrinth - ' + labID,
							errorMsg: "Something went wrong ... Please check the lab ID and the URL"
						});
					} else {
						var userName = body.userName;
						var userInDB = docs[0].users[findUser(docs[0].users, userName)];
						if (!userInDB) {
							var newUser = {
								userName: userName,
								password: body.password,
								role: 'student',
								checkpointStatus: {},
								code: docs[0].labDoc.skeletonCode,
								// when first signing up, the skeleton code is fetched from the doc
								codeEdits: [],
								console: {
									content: '',
									history: []
								},
								debugger:  {
									debugTraces: [],
									handlePosition: 0,
									highlightedStr: ''
								},
								notificationPaneContent: {}
							};
							db.update({labID: labID}, {$push: {users: newUser}}, {}, () => {});

							res.status(200).send({ok: true}); // THIS IS WEIRD! IT SENDS A STRING <-- because I set dataType: "text" ... SMH
						} else {
							res.status(200).send({ok: false, reason: "User name already exists"});
						}
					}
				}
			});
		} else if (command === "login") {
			var userName = body.userName;
			db.find({ labID: labID }, (err, docs) => {
				if (err) {
					console.log(err);
					res.sendStatus(500);
				} else {
					if (docs.length !== 1) {
						console.log("Error, lab doc is not uniquified by labID");
						res.status(500).render('error',
						{
							title: 'Labyrinth - ' + labID,
							errorMsg: "Something went wrong ... Please check the lab ID and the URL"
						});
					} else {
						var userInDB = docs[0].users[findUser(docs[0].users, userName)];
						if (userInDB) {
							if (userInDB.password === body.password) {
								res.status(200).send({ok: true, userData: userInDB});
							} else {
								res.status(200).send({ok: false, reason: "Password doesn't match"});
							}
						} else {
							res.status(200).send({ok: false, reason: "User name doesn't exist"});
						}
					}
				}
			});
		} else if (command === "getStatus") {
			var userName = body.userName;
			db.find({labID: labID}, (err, docs) => {
				if (err) {
					console.log(err);
					res.status(500).send('DB find operation error');
					return;
				}

				if (docs.length !== 1) {
					console.log("Error, lab doc is not uniquified by labID");
					res.status(500).render('error',
					{
						title: 'Labyrinth - ' + labID,
						errorMsg: "Something went wrong ... Please check the lab ID and the URL"
					});
					return;
				}

				var userInDB = docs[0].users[findUser(docs[0].users, userName)];
				if (userInDB) {
					res.status(200).send({ok: true, userData: userInDB, checkpoints: docs[0].labDoc.checkpoints});
				} else {
					res.status(200).send({ok: false, reason: "User name doesn't exist"});
				}
			});
		} else if (command === "codeEditSave") {
			//////////////////////////////////
			// Save code edits handler
			//////////////////////////////////
			// TODO: added another field "codeEdits" in each user's objective.
			// Change the handler for save and signup commands
			db.find({labID: labID}, (err, docs) => {
				if (err) {
					console.log(err);
					return res.sendStatus(500);
				} else {
					if (docs.length !== 1) {
						return console.log("Error, lab doc is not uniquified by labID");
					} else {
						var userName = body.userName;
						var userIdx = findUser(docs[0].users, userName);
						if (userIdx < 0) {
							return res.status(200).send({ok: false, reason: "User name doesn't exist"});
						}

						var userQueryStr = 'users.' + userIdx;
						var newUserObj = docs[0].users[userIdx];
						newUserObj.codeEdits.push(body.delta); // Incremental delta
						newUserObj.code = body.code; // The most recent status of the modified code
						var userQueryObj = {};
						userQueryObj[userQueryStr] = newUserObj;
						db.update({labID: labID}, {$set: userQueryObj}, {}, () => {});
						return res.status(200).send({ok: true});
					}
				}
			});
		} else {
			return console.log("Unsupported command");
		}
	});

	return router;
}