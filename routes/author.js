module.exports = function(io, db) {
	var express = require('express');
	var router = express.Router();
	var questions = [];

	// /author/intro_programming?user=asdf
	router.get('/:labID', function(req, res, next) {
		var labID = req.params.labID; // string
		var userName = req.query.user; // string
		var authorRole = "author";

		db.find({$and: [{labID:labID}, {'users.userName':userName}, {'users.role':authorRole}]}, (err, docs) => {
			if (docs.length === 1) {
				res.render(
					'author',
					{
						authorLoggedIn: true
					}
				);
			}
		});
	});

	return router;
}