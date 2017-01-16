module.exports = function(io, db) {
	var express = require('express');
	var router = express.Router();

	router.get('/', (req, res, next) => {
		res.render('entry', {title: 'Labyrinth'});
	});
	return router;
}