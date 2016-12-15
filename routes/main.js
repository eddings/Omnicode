module.exports = function(io) {
	var express = require('express');
	var router = express.Router();

	router.get('/', function(req, res, next) {
	  	res.render('main', { title: 'Labyrinth' });
	});

	router.post('/', function(req, res, next) {
		var code = req.body.code;
		var s = new require('stream').Readable();
		const process = require('child_process').spawn('python');

		// execute the code
		s.push(code);
		s.push(null);
		s.pipe(process.stdin);
		const chunks = [];
		process.stdout.on('data', function(chunk) {
			chunks.push(chunk);
		});
		process.stdout.on('end', function() {
			res.send(Buffer.concat(chunks));
		});
	});

	return router;
}