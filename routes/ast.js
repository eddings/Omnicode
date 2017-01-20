module.exports = function ast(db) {
	var cprocess = require('child_process');
	this.db = db;

	this.compareCode = function(othrCode, qstrCode, name, targets, cb) {
		// Run a python script to determine whether or not
		// otherStudentCode is "similar" to questionerCode
		const pyprocess = cprocess.spawn('python', ['./public/python/astCompare.py', othrCode, qstrCode]);

		// execute the code 
		const chunks = [];

		pyprocess.stderr.on('data', (chunk) => {
			chunks.push(chunk);
		});
		pyprocess.stdout.on('data', function(chunk) {
			chunks.push(chunk);
		});

		pyprocess.stdout.on('end', () => {
			var errorHandle = 'pythonparser.diagnostic.Error: <unknown>:';
			var handleLength = errorHandle.length;
			var bufferStr = Buffer.concat(chunks).toString('utf-8').trim();
			var split = bufferStr.slice(bufferStr.search(errorHandle) + handleLength).split(/:|-/);

			var startLineNo = split[0];
			var endLineNo = split[2];
			var startColNo = split[1];
			var endColNo = split[3];
			
			// Python return string: False | True
			console.log(bufferStr.slice(bufferStr.search(errorHandle) + handleLength).split(/:|-/));
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