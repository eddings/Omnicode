'use strict';

module.exports = function JsonASTParser() {
	var cprocess = require('child_process');

	/////////////////////////////////////////////
	// Find all function names and their line no.
	// ranges
	/////////////////////////////////////////////
	this.findFunctionRanges = function(jsonObj) {
		function helper(jsonObj, functionRanges) {
			if (jsonObj.type === 'FunctionDef') {
				var start = jsonObj.loc.start;
				var end = jsonObj.loc.end;
				var loc = {start:{row:start.line-1,column:start.column},end:{row:end.line-1,column:end.column}};
				functionRanges.push(loc);
			}

			jsonObj['_fields'].forEach((field, i) => {
				if (Object.prototype.toString.call(jsonObj[field]) === '[object Array]') {
					jsonObj[field].forEach((subfield, j) => {
						helper(subfield, functionRanges);
					});
				}
			});
		}

		var res = [];
		helper(jsonObj, res);
		return res;
	};


};