'use strict';

module.exports = function(io, db) {
	var express = require('express');
	var router = express.Router();
	var cprocess = require('child_process');
	var stream = require('stream');
	var jsonParser = require('./parseASTJson');
	var parser = new jsonParser();

	function computeIndentLevel(lineTabSplitted) {
		var indentLevel = 0;
		lineTabSplitted.forEach((e, idx) => {
			if (e === '') { indentLevel++; }
			if (e !== '') { return indentLevel; } // break when first sees a non 4-space char
		});
		return indentLevel;
	}

	function comment(lines, start, end) {
		// Inclusive of both ends (start, end)
		for (let i = start; i <= end; ++i) {
			lines[i] = '#' + lines[i].slice(1);
		}
	}

	function addPassStatement(lines, end, indentLevel) {
		// Construct a pass statement with the corresponding indentation level
		var passStr = 'pass';
		for (let i = 0; i < indentLevel; ++i) {
			passStr = '    ' + passStr;
		}

		lines.splice(end, 1, passStr); // Don't append another line in order to 
									   // maintain the line no. information of 
									   // where the actual syntax error happened
	}

	function commentAndInjectPass(lines, start, end, indentLevel) {
		// Inclusive of both ends (start, end)
		comment(lines, start, end);
		addPassStatement(lines, end, indentLevel);
		return lines.join('\n');
	}

	function commentThisLineAndLower(code, errorLineIdx) {
		////////////////////////////////////////////////////
		// Uses heuristics; comment out the error line 
		// and lower if those lines have the same or higher
		// level of indentation
		////////////////////////////////////////////////////
		var lines = code.split('\n');
		var tabSpliitedLines = [];
		var lastLineIdx = lines.length - 1;

		lines.forEach((line, idx) => {
			// Heuristics; the indentation level will hopefully 
			// be the same
			tabSpliitedLines[idx] = line.split('    ');
		});

		var indentLevel = computeIndentLevel(tabSpliitedLines[errorLineIdx]);
		var down = errorLineIdx + 1;
		
		while (down < lastLineIdx) {
			if (computeIndentLevel(tabSpliitedLines[down]) >= indentLevel) down++;
			else break; // break as soon as a different indentation level seen
		}

		// The down variable is off the boundary of the function body by 1 -- adjust for it
		return {
			code: commentAndInjectPass(lines, errorLineIdx, down-1, indentLevel),
			range: {
				start: {
					row: errorLineIdx,
					column: -1 // Filler value. DO NOT USE THIS
				},
				end: {
					row: down-1,
					column: -1 // Filler value. DO NOT USE THIS
				}
			}
		};
	}

	////////////////////////////////////////////////////
	// Comments out function lines 'from' to 'to'
	////////////////////////////////////////////////////
	function commentFromTo(code, from, to) {
		// Inclusive of both ends (start, end)
		var lines = code.split('\n');
		comment(lines, from, to);
		return lines.join('\n');
	}

	////////////////////////////////////////////////////
	// Line-wise comparison and tests whether the ranges
	// overlap with each other
	////////////////////////////////////////////////////
	function overlaps(range1, range2) {
		// Checks whether range1 and range2 are well-formed ranges
		if (range1.start.row > range1.end.row
			|| range2.start.row > range2.end.row) {
			// Ill-formed
			return false;
		}

		// Both end inclusive. No matter what, either the start or
		// the end of a range should be included in the other range.
		// The role of the ranges is irrelevant, since if one of the 
		// ranges' ends is included in the other, it implies an
		// equivalent inclusion with roles interchanged.
		// Notice that the following if statements simply test whether
		// either end point of range1 (start.row or end.row) is contained
		// in the either range
		if (range2.start.row <= range1.start.row
			&& range1.start.row <= range2.end.row) {
			return true;
		}

		if (range2.start.row <= range1.end.row
			&& range1.end.row <= range2.end.row) {
			return true;
		}

		return false;
	}

	////////////////////////////////////////////////////
	// This function comments out only the body of the 
	// containing function that the given line of code
	// is included in, and replaces its last statement
	// with a pass statement. Uses heuristics (assumes
	// uniform 4-space indentation at all times)
	// DO NOT USE THIS FUNCTION IF YOU NEED TO PRECISELY 
	// COMMENT OUT THE BODY OF A FUNCTION IN ALL CASES
	////////////////////////////////////////////////////
	function commentContainingFunctionBody(code, errorLineNo) {
		var lines = code.split('\n');
		var tabSpliitedLines = [];
		var lineLen = lines.length;
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
		var lastLineIdx = lineLen - 1;
		while (down <= lastLineIdx) {
			if (computeIndentLevel(tabSpliitedLines[down]) >= indentLevel) down++;
			else break; // break as soon as a different indentation level seen
		}

		return commentAndInjectPass(lines, up+1, down-1, indentLevel);
	}

	////////////////////////////////////////////////////
	// This function comments out the entire function
	// that the given line of code is included in
	////////////////////////////////////////////////////
	function commentContainingFunction(code, errorLineNo) {
	}

	function commentErrorLines(obj, cb) {
		const pyprocess = cprocess.spawn('python', ['./public/python/parse_python_to_json.py', obj.code]);

		// execute the code
		const stdoutChunks = [];
		const errorChunks = [];

		pyprocess.stderr.on('data', (chunk) => {
			errorChunks.push(chunk);
		});

		pyprocess.stdout.on('data', function(chunk) {
			stdoutChunks.push(chunk);
		});

		pyprocess.stdout.on('end', () => {
			var bufferStr = Buffer.concat(stdoutChunks).toString('utf-8').trim();
			var jsonObj = {};

			try {
				jsonObj = JSON.parse(bufferStr);
			} catch(e) {
				return cb();
			}

			// If there was a parse error, perform commenting recursively until
			// the error is gone
			if (jsonObj.type === 'parse_error') {
				var start = jsonObj.loc.start;
				var end = jsonObj.loc.end;
				var errorLoc = {start:{row:start.line-1,column:start.column},end:{row:end.line-1,column:end.column}};
				var processedCodeObj = commentThisLineAndLower(obj.code, errorLoc.start.row);
				obj.code = processedCodeObj.code;
				obj.syntaxErrorRanges.push(errorLoc);
				obj.commentRanges.push(processedCodeObj.range);
				return commentErrorLines(obj, cb);
			}

			// At the point, there is no parse error in the code, 
			// find all the comment ranges and
			// see if there are any other leftover statements in the containing
			// function that hasn't been commented out. In this pass, we 
			// also comment out the function signature line(s) as well as the 
			// deliberately inserted last pass statement.
			var functionRanges = parser.findFunctionRanges(jsonObj);
			functionRanges.forEach((range, i) => {
				var j = 0;
				while (obj.commentRanges.length > j) {
					if (overlaps(obj.commentRanges[j], range)) {
						obj.commentedFuncRanges.push(range);
						obj.commentRanges.splice(j, 1);
						obj.code = commentFromTo(obj.code, range.start.row, range.end.row);
					} else {
						j++;
					}
				}
			});

			obj.obj = jsonObj;
			return cb();
		});
		// Error stdout did not end
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
				return res.status(500).render('error',
				{
					title: 'Labyrinth - ' + labID,
					errorMsg: "Something went wrong ... Please check the lab ID and the URL"
				});
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
					  			loggedIn: false
					  			//user: docs[0].users[findUser(docs[0].users, userName)]
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

	function runTest(lang, execFilePath, pickleFilePath, code, results, cp, cp_idx, testcase, case_idx, cb) {
		var execProcess = cprocess.spawn(lang, [execFilePath, pickleFilePath, cp.name, case_idx, code]);
		var errChunks = [];
		var resultChunks = [];

		execProcess.stderr.on('data', (chunk) => {
			errChunks.push(chunk);
		});

		execProcess.stdout.on('data', (chunk) => {
			resultChunks.push(chunk);
		});

		execProcess.stdout.on('end', () => {
			// TODO: You can maybe compress this for a single testcase run
			if (!results[cp_idx]) results[cp_idx] = [];
			if (!results[cp_idx][case_idx]) results[cp_idx][case_idx] = [];
			var traceObj = {};

			try {
				traceObj = JSON.parse(Buffer.concat(resultChunks).toString('utf-8').trim())["opt_trace"];
			} catch(e) {
				return cb();
			}

			if (traceObj.length === 0) {
				// Function did not exist and nothing was output
				// <-- this is PythonTutor backend's behavior
				results[cp_idx][case_idx].push([
					{
						"event": "exception",
						"exception_msg": "Function Definition Nonexistent"
					}
				]);
			} else {
				results[cp_idx][case_idx].push(traceObj);
			}

			 return cb();
		});
	}

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
		} else if (command === "runAllTests" || command === "runTest") {
			////////////////////////////////////////////
			// Run all test cases or a single test case
			////////////////////////////////////////////
			db.find({labID: labID}, (err, docs) => {
				if (err) {
					return console.error(err);
				}

				if (docs.length !== 1) {
					return console.log("Lab ID not uniquified");
				}

				var fixObj = {code: body.code, syntaxErrorRanges: [], commentRanges: [], commentedFuncRanges: []};
				var lang = body.language;
				var execFilePath = './public/python/PythonTutor/doctest_exec.py';
				var pickleFilePath = docs[0].pickleFilePath;

				commentErrorLines(fixObj, () => {
					var results = [];
					// Test the code and comment out parts that return syntactic errors
					var runningCode = fixObj.code;
					var syntaxErrorRanges = fixObj.syntaxErrorRanges;
					var commentedFuncRanges = fixObj.commentedFuncRanges;
					if (command === "runAllTests") {
						var count = 0;
						var numToDo = 0;
						docs[0].labDoc.checkpoints.forEach((cp, cp_idx) => {
							numToDo += cp.testCases.length;
							cp.testCases.forEach((testcase, case_idx) => {
								runTest(lang, execFilePath, pickleFilePath, runningCode, results, cp, cp_idx, testcase, case_idx, () => {
									count += 1;
									if (count === numToDo) {
										return res.status(200).send(
											{
												results: results,
												runningCode: runningCode,
												syntaxErrorRanges: syntaxErrorRanges,
												commentedFuncRanges: commentedFuncRanges
											}
										);
									}									
								});
							});
						});						
					} else if (command === "runTest") {
						var cp_idx = body.checkpoint;
						var cp = docs[0].labDoc.checkpoints[cp_idx];
						var case_idx = body.testcase;
						var testcase = cp.testCases[body.case_idx];
						runTest(lang, execFilePath, pickleFilePath, runningCode, results, cp, cp_idx, testcase, case_idx, () => {
							return res.status(200).send(
								{
									results: results,
									runningCode: runningCode,
									syntaxErrorRanges: syntaxErrorRanges,
									commentedFuncRanges: commentedFuncRanges
								}
							);							
						});
					}
				});
			});
		} else if (command === "fuzzySelect") {
			var selectedStr = body.str;
			var selectedLoc = body.loc;
			var code = body.code;

			const pyprocess = cprocess.spawn('python', ['./public/python/parse_python_to_json.py', code]);

			// execute the code
			const stdoutChunks = [];
			const errorChunks = [];

			pyprocess.stderr.on('data', (chunk) => {
				errorChunks.push(chunk);
			});

			pyprocess.stdout.on('data', function(chunk) {
				stdoutChunks.push(chunk);
			});

			pyprocess.stdout.on('end', () => {
				var bufferStr = Buffer.concat(stdoutChunks).toString('utf-8').trim();
				var jsonObj = {};

				try {
					jsonObj = JSON.parse(bufferStr);
				} catch(e) {
					return res.status(200).send({originalSelectionRange: selectedLoc, extendedSelectionRanges: []});
				}

				var functionRanges = parser.findFunctionRanges(jsonObj);

				var extendedSelections = [];
				functionRanges.forEach((range, i) => {
					// TODO: Instead of a simple overlaps() function, we need to
					//       know whether the selected location touches any node
					//       that will be present in the debug result
					if (overlaps(range, selectedLoc)) {
						extendedSelections.push(range);
					}
				});

				return res.status(200).send({originalSelectionRange: selectedLoc, extendedSelectionRanges: extendedSelections});
			});
		} else if (command === "debug") {
			var code = body.code;
			var lang = body.language;

			var traceProcess = cprocess.spawn('python', ['./public/python/PythonTutor/generate_json_trace.py', '--code', code]);
			// execute the code
			var errChunks = [];
			var stdoutChunks = [];

			traceProcess.stderr.on('data', (chunk) => {
				errChunks.push(chunk);
			});

			traceProcess.stdout.on('data', (chunk) => {
				stdoutChunks.push(chunk);
			});

			traceProcess.stdout.on('end', () => {
				// JSON trace is generated
				return res.status(200).send(Buffer.concat(stdoutChunks).toString('utf-8').trim());
			});
		} else if (command === "save") {
			db.find({labID: labID}, (err, docs) => {
				if (err) {
					console.log(err);
					return res.status(500).render('error',
					{
						title: 'Labyrinth - ' + labID,
						errorMsg: "Something went wrong ... Please check the lab ID and the URL"
					});
				} else {
					if (docs.length !== 1) {
						console.log("Error, lab doc is not uniquified by labID");
						return res.render('error',
						{
							title: 'Labyrinth - ' + labID,
							errorMsg: "Something went wrong ... Please check the lab ID and the URL"
						});
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
						return res.sendStatus(200);
					}
				}
			});
		} else if (command === "signup") {
			db.find({ labID: labID }, (err, docs) => {
				if (err) {
					console.error(err);
					return res.status(500).render('error',
					{
						title: 'Labyrinth - ' + labID,
						errorMsg: 'System Error'
					});
				} else {
					if (docs.length !== 1) {
						return res.render('error',
						{
							title: 'Labyrinth - ' + labID,
							errorMsg: "Something went wrong ... Please check the lab ID and the URL"
						});
					} else {
						var userName = body.userName;
						var userInDB = docs[0].users[findUser(docs[0].users, userName)];
						if (!userInDB) {
							console.log('new user signed up. Skeleton code:');
							console.log(docs[0].labDoc.skeletonCode);
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

							return res.status(200).send({ok: true}); // THIS IS WEIRD! IT SENDS A STRING <-- because I set dataType: "text" ... SMH
						} else {
							return res.status(200).send({ok: false, reason: "User name already exists"});
						}
					}
				}
			});
		} else if (command === "login") {
			var userName = body.userName;
			db.find({ labID: labID }, (err, docs) => {
				if (err) {
					console.log(err);
					return res.sendStatus(500);
				} else {
					if (docs.length !== 1) {
						console.log("Error, lab doc is not uniquified by labID");
						return res.status(500).render('error',
						{
							title: 'Labyrinth - ' + labID,
							errorMsg: "Something went wrong ... Please check the lab ID and the URL"
						});
					} else {
						var userInDB = docs[0].users[findUser(docs[0].users, userName)];
						if (userInDB) {
							if (userInDB.password === body.password) {
								return res.status(200).send({ok: true, userData: userInDB});
							} else {
								return res.status(200).send({ok: false, reason: "Password doesn't match"});
							}
						} else {
							return res.status(200).send({ok: false, reason: "User name doesn't exist"});
						}
					}
				}
			});
		} else if (command === "getStatus") {
			var userName = body.userName;
			db.find({labID: labID}, (err, docs) => {
				if (err) {
					console.error(err);
					return res.status(500).render('error',
					{
						title: 'Labyrinth - ' + labID,
						errorMsg: 'DB find error'
					});
				}

				if (docs.length !== 1) {
					return res.status(500).render('error',
					{
						title: 'Labyrinth - ' + labID,
						errorMsg: 'Something went wrong ... Please check the lab ID and the URL'
					});
				}

				var userInDB = docs[0].users[findUser(docs[0].users, userName)];
				if (userInDB) {
					return res.status(200).send({ok: true, userData: userInDB, checkpoints: docs[0].labDoc.checkpoints});
				} else {
					return res.status(200).send({ok: false, reason: "User name doesn't exist"});
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
						///////////////////////////////
						// Save the new code in the DB
						///////////////////////////////
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

						/////////////////////////////////////
						// Extract syntactic errors (if any)
						/////////////////////////////////////
						var fixObj = {code: body.code, syntaxErrorRanges: [], commentRanges: [], commentedFuncRanges: []};
						commentErrorLines(fixObj, () => {
							// Test the code and comment out parts that return syntactic errors
							var syntaxErrorRanges = fixObj.syntaxErrorRanges;
							var commentedFuncRanges = fixObj.commentedFuncRanges;
							return res.status(200).send({syntaxErrorRanges: syntaxErrorRanges, commentedFuncRanges: commentedFuncRanges});
						});
					}
				}
			});
		} else {
			console.log("Unsupported comment");
			return res.status(500).send("Unsupported comment");
		}
	});

	return router;
}