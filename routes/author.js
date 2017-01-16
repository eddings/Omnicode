module.exports = function(io, db) {
	var express = require('express');
	var cprocess = require('child_process');
	var stream = require('stream');
	var router = express.Router();
	var questions = [];

	// TODO: Dup from main.js
	function findUser(users, userName) {
		var userIdx = -1;
		users.forEach((user, idx) => {
			if (user.userName === userName) {
				userIdx = idx;
			}
		});
		return userIdx;
	}

	router.get('/', (req, res, next) => {
		res.render('author');
	});

	// /author/labID?user=test&password=test
	router.get('/:labID', (req, res, next) => {
		var labID = req.params.labID;
		var userName = req.query.user;
		var password = req.query.password;
		var authorRole = "author";

		if (labID && userName && password) {
			db.find(
				{$and: [
						{labID: labID},
						{'users.userName': userName},
						{'users.password': password},
						{'users.role': authorRole}
				]},
				(err, docs) => {
					if (docs.length === 1) {
						res.render('author',
							{
					  			title: 'Labyrinth - ' + labID,
					  			labID: labID,
					  			language: 'python',
					  			labDoc: docs[0].labDoc,
					  			authorLoggedIn: true,
					  			user: docs[0].users[findUser(docs[0].users, userName)]
							}
						);
						return;
					} else {
						console.log('You do not have permission to author this lab');
						res.status(500).send('You do not have permission to author this lab');
						return;
					}
				}
			);
		} else {
			console.log('Error, invalid URL');
			res.status(500).render('error',
			{
				title: 'Labyrinth - ' + labID,
				errorMsg: "Something went wrong ... Please check the lab ID and the URL"
			});
			return;
		}
	});

	router.post('/', (req, res, next) => {
		var body = req.body;
		var command = body.command;

		if (command === "newLabID") {
			//////////////////////////////////////////////
			// Check whether the new lab ID to be created
			// already exists in the db
			//////////////////////////////////////////////
			var labID = body.labID;
			if (!labID) {
				console.log('Lab ID not given');
				res.status(500).send("Lab ID not given");
				return;
			}

			db.find({labID: labID}, (err, docs) => {
				if (err) {
					console.log(err);
					res.status(500).send("DB find operation error. Lab ID to look for: " + labID);
					return;
				}

				if (docs.length > 0) {
					res.status(200).send({ok: false, reason: "Lab ID already exists"});
					return;
				}

				res.status(200).send({ok: true});
				return;
			});
		} else if (command === "signup") {
			//////////////////////////////////////////////
			// Signup command handler for the new lab
			//////////////////////////////////////////////
			var labID = body.labID;
			// TODO: Dup from main.js
			db.find({ labID: labID }, (err, docs) => {
				if (err) {
					console.log(err);
					res.status(500).send("DB find operation error. Lab ID to look for: " + labID);
					return;
				}

				if (docs.length > 0) {
					res.status(200).send({ok: false, reason: "Lab ID already exists"});
					return;
				}

			    var newLabDoc = {
			        labID: labID,
			        labDoc: {
			            labDesc: '',
			            checkpoints: []
			        },
			        users: [{
						userName: body.userName,
						password: body.password,
						role: body.role,
						checkpointStatus: body.checkpointStatus,
						code: body.code,
						codeEdits: body.codeEdits,
						console: body.console,
						debugger: body.debugger,
						notificationPaneContent: body.notificationPaneContent
					}],
			        timelineQuestions: []
			    };
				db.insert(newLabDoc);
				res.status(200).send({ok: true});
				return;
			});
		} else if (command === "view") {
			//////////////////////////////////////////////
			// View command handler for the new lab.
			// The author wants to see how the code parses
			// down to markdown and test cases.
			//////////////////////////////////////////////
			var code = body.code;
			var lang = body.language;

			// execute the code
			var pickleProcess = cprocess.spawn('python', ['./public/python/PythonTutor/doctest_splitter.py', './public/python/PythonTutor/lab.py']);
			
			var pickleProcess_stderrData = [];
			var pickleProcess_stdoutData = [];

			var readerProcess_stderrData = [];
			var readerProcess_stdoutData = [];

			pickleProcess.stderr.on('data', (chunk) => {
				pickleProcess_stderrData.push(chunk);
			});

			pickleProcess.stdout.on('data', (chunk) => {
				pickleProcess_stdoutData.push(chunk);
			});

			pickleProcess.stdout.on('end', () => {
				// JSON trace is generated
				if (pickleProcess_stderrData.length !== 0) {
					res.status(500).send(Buffer.concat(pickleProcess_stderrData));
				} else {
					// Ignore the stdout data from pickleProcess (mostly uninformative status strings)
					var readerProcess = cprocess.spawn('python', ['./public/python/PythonTutor/doctest_reader.py', './lab_doctests.pickle']);

					readerProcess.stderr.on('data', (chunk) => {
						readerProcess_stderrData.push(chunk);
					});

					readerProcess.stdout.on('data', (chunk) => {
						readerProcess_stdoutData.push(chunk);
					});

					readerProcess.stdout.on('end', () => {
						// JSON trace is generated
						if (readerProcess_stderrData.length !== 0) {
							console.log(Buffer.concat(readerProcess_stderrData).toString('utf-8').trim());
							console.log(Buffer.concat(readerProcess_stdoutData).toString('utf-8').trim());
							res.status(500).send(Buffer.concat(readerProcess_stderrData));
						} else {

							res.status(200).send(Buffer.concat(readerProcess_stdoutData));
						}
					});
				}
			});
			return;
		} else {
			console.log("Unsupported command");
			res.status(500).send("Unsupported command");
			return;
		}

	});

	return router;
}