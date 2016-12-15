module.exports = function(io) {
	var express = require('express');
	var router = express.Router();
	var questions = [];

	router.get('/', function(req, res, next) {
		console.log(questions);
	  	res.render('question', { title: 'Labyrinth', questions: questions });
	});

	router.post('/', function(req, res, next) {
		console.log(req.body.question);
		questions.push({question: req.body.question, testCases: req.body.testCases});
	});

	return router;
}