module.exports = function(io, db) {
	var express = require('express');
	var cprocess = require('child_process');
	var stream = require('stream');
	var fs = require('fs');
	var mkdirp = require('mkdirp');
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
					} else {
						console.log('You do not have permission to author this lab');
						res.status(500).send('You do not have permission to author this lab');
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
				return res.status(500).send("Lab ID not given");
			}

			db.find({labID: labID}, (err, docs) => {
				if (err) {
					console.log(err);
					return res.status(500).send("DB find operation error. Lab ID to look for: " + labID);
				}

				if (docs.length > 0) {
					return res.status(200).send({ok: false, reason: "Lab ID already exists"});
				}

				res.status(200).send({ok: true});
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
					return res.status(500).send("DB find operation error. Lab ID to look for: " + labID);
				}

				if (docs.length > 0) {
					return res.status(200).send({ok: false, reason: "Lab ID already exists"});
				}

			    var newLab = {
			        labID: labID,
			        labDoc: {
			            labDesc: '',
			            skeletonCode: '',
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
				db.insert(newLab);
				return res.status(200).send({ok: true});
			});
		} else if (command === "load") {
			//////////////////////////////////////////////
			// Load command handler for the new lab.
			// The author wants to see how the code parses
			// down to markdown and test cases.
			//////////////////////////////////////////////
			var labID = body.labID;
			var fileName = body.fileName;
			var fileContent = body.fileContent;
			var lang = body.language;

			if (lang !== 'python') {
				return console.error("Not supported language");
			}

			var dirPath = './labs/' + labID;
			var filePath = dirPath + '/' + fileName;

			mkdirp(dirPath, (err) => {
				// Create the lab directory
				if (err) return console.error(err);

				fs.writeFile(filePath, fileContent, (err) => {
					// Create the lab file
					if (err) return console.error(err);

					var splitterFilePath = './public/python/PythonTutor/doctest_splitter.py';
					var readerFilePath = './public/python/PythonTutor/doctest_reader.py';
					// execute the code
					var pickleProcess = cprocess.spawn(lang, [splitterFilePath, filePath]);
					
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
							return res.status(500).send(Buffer.concat(pickleProcess_stderrData));
						} else {
							var doctestsFileName = fileName.split('.')[0] + '_doctests.pickle';
							var doctestsFilePath = './' + doctestsFileName;
							// Ignore the stdout data from pickleProcess (mostly uninformative status strings)
							var readerProcess = cprocess.spawn('python', [readerFilePath, doctestsFilePath]);

							readerProcess.stderr.on('data', (chunk) => {
								readerProcess_stderrData.push(chunk);
							});

							readerProcess.stdout.on('data', (chunk) => {
								readerProcess_stdoutData.push(chunk);
							});

							readerProcess.stdout.on('end', () => {
								// JSON trace is generated
								if (readerProcess_stderrData.length !== 0) {
									return res.status(500).send(Buffer.concat(readerProcess_stderrData));
								} else {
									var skeletonFileName = fileName.split('.')[0] + '_skeleton.py';
									var skeletonFilePath = './' + skeletonFileName;
									// Read the generated skeleton file
									fs.readFile(skeletonFilePath, 'utf8', (err, data) => {
										if (err) {
											return console.error('Skeleton file read error: ' + err);
										}
										return res.status(200).send({docstrings: Buffer.concat(readerProcess_stdoutData).toString('utf-8').trim(), skeleton: data});
									});
								}
							});
						}
					});
				});
			});
		} else if (command === "saveAndPublish") {
			//////////////////////////////////////////////
			// Save and publish command handler for the
			// newly created lab
			//////////////////////////////////////////////
			var labID = body.labID;
			var doc = body.doc;

			var labDocSearchStr = 'labDoc';
			var labDocObj = {};
			labDocObj[labDocSearchStr] = doc;

			db.update({labID: labID}, {$set: labDocObj}, {}, () => {});
			res.status(200).send({ok: true, reason: "The lab is saved and published"});
		} else {
			console.log("Unsupported command");
			res.status(500).send("Unsupported command");
		}
	});

	return router;
}