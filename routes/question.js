module.exports = function(io, db, handlebars) {
	var express = require('express');
	var ast = require('./ast');

	var router = express.Router();
	var analyzer = new ast(db);

	function findUser(users, userName) {
		var userIdx = -1;
		users.forEach((user, idx) => {
			if (user.userName === userName) {
				userIdx = idx;
			}
		});
		return userIdx;
	}

	// /question/intro_programming?user=asdf
	router.get('/:labID', function(req, res, next) {
		var labID = req.params.labID;
		var userName = req.query.user;
		var password = req.query.password;

		db.find({labID: labID}, (err, docs) => {
			if (err) {
				console.log(err);
				res.sendStatus(500);
			} else {
				if (docs.length === 1) {
					var loggedIn = false;
					docs[0].users.forEach((user, idx) => {
						if (user.userName === userName) {
							loggedIn = user.password === password;
						}
					});
				  	res.status(200).render('question',
				  		{
				  			title: 'Labyrinth - ' + labID,
				  			labID: labID,
				  			language: 'python',
				  			labDoc: docs[0].labDoc,
				  			loggedIn: loggedIn,
				  			user: docs[0].users[findUser(docs[0].users, userName)],
				  			timelineQuestions: docs[0].timelineQuestions
				  		}
				  	);
				} else {
					res.render('error',
					{
						title: 'Labyrinth - ' + labID,
						errorMsg: "Something went wrong ... Please check the lab ID and the URL"
					});
				}
			}
		});
	});

	router.post('/:labID', (req, res, next) => {
		var labID = req.params.labID;
		var command = req.body.command;

		if (command === "question") {
			// checkpoint numbering is ensured
			var question = req.body.question;
			var checkpointID = req.body.checkpointID;
			var testCases = req.body.testCases;
			var userName = req.body.userName;
			var checkpointQuestionsQueryStr = 'labDoc.checkpoints.' + checkpointID + '.questions';
			var code = req.body.code;
			var questionObj = {
				questioner: userName,
				question: question,
				answers: []
			};
			var questionQueryObj = {};
			questionQueryObj[checkpointQuestionsQueryStr] = questionObj;

			/* Update both the questions array inside the labDoc field 
			 * and the timelineQuestions field. In the timelineQuestions
			 * field, we need to add the checkpoint information. */
			db.update({labID: labID}, {$push: questionQueryObj}, {}, () => {});
			db.find({labID: labID}, (err, docs) => {
				if (err) {
					console.log(err);
					res.sendStatus(500);
					return;
				} else {
					if (docs.length === 1) {
						questionObj.checkpoint = docs[0].labDoc.checkpoints[checkpointID]; // extend the question object with the corresponding checkpoint
						questionObj.checkpoint.questions = undefined; // but drop the 'questions' field -- NeDB does not add undefined fields
						questionObj.checkpoint.checkpointIdx = checkpointID;
						// Each lab has an array of "timelineQuestions"
						db.update(
							{labID: labID},
							{$push: {timelineQuestions: questionObj}},
							{},
							() => {}
						);

						var users = docs[0].users;
						analyzer.findRelevantUsers(users, code, questionObj, () => { res.status(200).json(questionObj); });
					} else {
						res.render('error',
						{
							title: 'Labyrinth - ' + labID,
							errorMsg: "Something went wrong ... "
						});
					}
				}
			});
		} else if (command === "answer") {
			var userName = req.body.userName;
			var answer = req.body.answer;
			var checkpointIdx = req.body.checkpointIdx;
			var questionIdx = req.body.questionIdx;
			var answerObj = {
				answerer: userName,
				answer: answer
			};
			
			var answerQueryStr = 'timelineQuestions.' + questionIdx + '.answers';
			var answerQueryObj = {};
			answerQueryObj[answerQueryStr] = answerObj;

			/* We need to update both the questions array inside the labDoc field 
			 * and the timelineQuestions field. In the timelineQuestions
			 * field, we need to add the checkpoint information. */
			db.update({labID: labID}, {$push: answerQueryObj}, {}, () => {});

			db.find({labID: labID}, (err, docs) => {
				if (err) {
					console.log(err);
					res.sendStatus(500);
				} else {
					if (docs.length === 1) {
						var questioner = docs[0].timelineQuestions[questionIdx].questioner;
						var checkpointAnswersQueryStr = 'labDoc.checkpoints.' + checkpointIdx + '.questions.' + questionIdx + '.answers';
						var checkpointAnswerQueryObj = {};
						checkpointAnswerQueryObj[checkpointAnswersQueryStr] = answerObj;
						db.update(
							{labID: labID},
							{$push: checkpointAnswerQueryObj},
							{},
							() => {}
						);
						answerObj.questioner = questioner;
						res.status(200).json(answerObj);
					} else {
						res.render('error',
						{
							title: 'Labyrinth - ' + labID,
							errorMsg: "Something went wrong ... "
						});
					}
				}
			});			
		}
	});

	return router;
}