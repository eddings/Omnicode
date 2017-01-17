module.exports = function(io, db) {
	var express = require('express');
	var router = express.Router();

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
				console.log('in1');
				console.error(err);
				return res.sendStatus(500);
			} else {
				if (docs.length !== 1) {
					console.log('in2');
					return res.status(500).render('error',
					{
						title: 'Labyrinth - ' + labID,
						errorMsg: "Something went wrong ... Please check the lab ID and the URL"
					});
				} else {
					var userName = req.query.user;
					var password = req.query.password;

					if (!userName || password) {
						console.log('in3');
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
					console.log('in4');

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
					res.sendStatus(500);
					return;
				}

				docs.forEach((doc, idx) => {
					data.labIDs.push(doc.labID);
				});

				res.status(200).send(data);
				return;
			});
		} else {
			console.log("Not supported request");
			res.status(500).send("Not supported request");
			return;
		}
	});

	router.post('/:labID', (req, res, next) => {
		var body = req.body;
		var labID = req.params.labID;
		var command = body.command;

		if (command === "run") {
			var code = body.code;
			var lang = body.language;
			var s = new require('stream').Readable();
			var process = require('child_process').spawn('python');

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

		} else if (command === "debug") {
			var code = body.code;
			var lang = body.language;

			var s = new require('stream').Readable();

			var process = require('child_process').spawn('python', ['./public/python/PythonTutor/generate_json_trace.py', '--code', code]);
			// execute the code
			var chunks = [];

			process.stderr.on('data', (chunk) => {
				chunks.push(chunk);
			});

			process.stdout.on('data', function(chunk) {
				chunks.push(chunk);
			});

			process.stdout.on('end', () => {
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
								role: body.role,
								checkpointStatus: body.checkpointStatus,
								code: body.code,
								codeEdits: body.codeEdits,
								console: body.console,
								debugger: body.debugger,
								notificationPaneContent: body.notificationPaneContent
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
		} else if (command === "getUser") {
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
					res.status(200).send({ok: true, userData: userInDB});
				} else {
					res.status(200).send({ok: false, reason: "User name doesn't exist"});
				}
			});
		} else if (command === "codeEditSave") {
			// TODO: added another field "codeEdits" in each user's objective.
			// Change the handler for save and signup commands
			
			db.find({labID: labID}, (err, docs) => {
				if (err) {
					console.log(err);
					res.sendStatus(500);
					return;
				} else {
					if (docs.length !== 1) {
						console.log("Error, lab doc is not uniquified by labID");
					} else {
						var userName = body.userName;
						var userIdx = findUser(docs[0].users, userName);
						if (userIdx < 0) {
							res.status(200).send({ok: false, reason: "User name doesn't exist"});
							return;
						}

						var userQueryStr = 'users.' + userIdx;
						var newUserObj = docs[0].users[userIdx];
						newUserObj.codeEdits.push(body.delta);
						newUserObj.code = body.code;
						var userQueryObj = {};
						userQueryObj[userQueryStr] = newUserObj;
						db.update({labID: labID}, {$set: userQueryObj}, {}, () => {});
						res.status(200).send({ok: true});
					}
				}
			});
		} else {
			console.log("Unsupported command");
		}

	});

	return router;
}