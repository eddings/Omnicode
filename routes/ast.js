module.exports = function ast(db) {
	this.db = db;

	this.compareCode = function(othrCode, qstrCode, name, targets, cb) {
		// Run a python script to determine whether or not
		// otherStudentCode is "similar" to questionerCode
		var s = new require('stream').Readable();
		const process = require('child_process').spawn('python', ['./public/python/ast.py', othrCode, qstrCode]);

		// execute the code
		const chunks = [];

		process.stderr.on('data', (chunk) => {
			chunks.push(chunk);
		});

		process.stdout.on('data', function(chunk) {
			chunks.push(chunk);
		});

		process.stdout.on('end', () => {
			// Python return string: False | True
			if (Buffer.concat(chunks).toString('utf-8').trim() === "True") {
				targets.push(name);
			}
			cb();
		});
	}

	this.findRelevantUsers = function(users, qstrCode, questionObjToModify, cb) {
		var targets = [];
		var itemsProcessed = 0;
		((inner_cb) => {
			users.forEach((otherStudent, idx, users) => {
				this.compareCode(
					otherStudent.code,
					qstrCode,
					otherStudent.userName,
					targets,
					() => {
						itemsProcessed++;
						if (itemsProcessed === users.length) {
							inner_cb();
						}
					}
				);
			});
		})(
			// inner_cb
			() => {
				questionObjToModify.targetUsers = targets;
				cb();
			}
		);
	}
}