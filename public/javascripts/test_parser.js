class TestParser {
	constructor(parseStr) {
		if (!parseStr)
			this.parseStr = '';
		else
			this.parseStr = parseStr;
	}

	parse() {
		var tests = [];
		var copy = this.parseStr;

		while (true) {
			var regex = /'''\s+@test:\s*(.*?|[\s\S]*?)'''/;
			var matched = copy.match(regex);
			if (matched && matched.length === 2) {
				tests.push(matched[1]);
			} else {
				break;
			}
			copy = copy.replace(regex, '');
		}

		var testObjs = [];
		for (let i = 0; i < tests.length; ++i) {
			testObjs.push(JSON.parse(tests[i]));
		}

		return {
			code: this.parseStr,
			test: testObjs
		}
	}
}