class TestCase {
	constructor(input, output) {
		this.test = {
			input: input,
			output: output
		};
	}

	get input() {
		return this.test.input;
	}

	get output() {
		return this.test.output;
	}

	set input(input) {
		this.test.input = input;
	}

	set output(output) {
		this.test.output = output;
	}
}

class Checkpoint {
	constructor() {
		/**
		 * there is always one test case 
		 * for a specific input
		 */
		this.testCases = [];
		this.description = '';
		this.done = false;
	}

	addTest(newTest) {
		if (!newTest.input()) return;
		if (!newTest.output()) return;

		this.testCases.forEach((testCase, idx) => {
			if (testCase.input() === newTest.input()) {
				this.testCases[i].setOutput(newTest.output());
				return;
			}
		});
		this.testCases.push(newTest);
	}

	removeTest(input) {
		this.testCases.forEach((testCase, idx) => {
			if (testCase.input() === input) {
				this.removeTestAti(idx);
			}
		});
	}

	removeTestAti(i) {
		if (i < 0) return;
		if (i >= this.testCases.length) return;
		this.testCases.splice(i, 1);
	}
}

class Lab {
	constructor(checkpoints) {
		// array of checkpoints
		this.checkpoints = checkpoints;
		this.questionBtn = $('#checkpoint1-question-btn');

		// Question Modal
		this.questionModal = $('#question-modal');
		this.questionModalClose = $('#question-modal-close');
		this.questionModalDesc = $('#question-modal-desc');
		this.questionModalTestCases = $('#question-modal-testcases');
		this.questionModalText = $('#question-modal-text');
		this.questionModalSubmitBtn = $('#question-modal-submit-btn');

		//Notification Modal
		this.questionNotificationModal = $('#question-notification-modal');
		this.questionNotificationModalClose = $('#question-notification-modal-close');
		this.questionNotificationModalContent = $('#question-notification-modal-content');
		this.questionNotificationModalText = $('#question-notification-modal-text');
		// TODO: This should be moved to somewhere else
		this.socket = io.connect("https://labyrinth1.herokuapp.com");
		this.init();
	}

	init() {
		this.addQuestionBtnHandler();
		this.addModalHandler();
		// TODO: Move this to somewher else
		this.socket.on('question', (msg) => {
			this.questionNotificationModal.css('display', 'inline');
			var lines = msg.split("\n");
			var content = '';

			for (var line of lines) {
				content += line;
				content += '<br>';
			}

			this.questionNotificationModalText.html('<p>' + content + '</p>');		
			setTimeout(() => {
				this.questionNotificationModal.fadeOut();
			}, 6000);
		});
	}

	addQuestionBtnHandler() {
		/* Question modal handling */
		this.questionBtn.on("click", (e) => {
			this.questionModal.css('display', 'block');
		});

		this.questionModalClose.on("click", (e) => {
			this.questionModal.css('display', 'none');
		});

		this.questionModalSubmitBtn.on("click", (e) => {
			this.socket.emit('question', 'Shawn asks \n"' + this.questionModalText.val() + 
				'"\n about checkpoint 1: ' + this.questionModalDesc.text() + 
				' Would you like to help?');
			this.questionModal.css('display', 'none');
		});

		// TODO: Move this somewhere?? I mean question modal handling is just above though ...
		/* Notification modal handling */
		this.questionNotificationModalClose.on("click", (e) => {
			this.questionNotificationModal.css('display', 'none');
		});
	}

	addModalHandler() {
		window.onclick = (e) => {
			if (e.target.id === 'question-modal') {
				this.questionModal.css('display', 'none');
			} else if (e.target.id === 'question-notification-modal') {
				this.questionNotificationModal.css('display', 'none');
			}
		};
	}

	addCheckpoint(checkpoint) {
		// test for duplicity?
		this.push(checkpoint);
	}

	completed() {
		var done = true;
		for (var ckpt of this.checkpoints) {
			done &= ckpt.done;
		}
		return done;
	}
}

class EditorObj {
	constructor() {
		this.editor = ace.edit("editor"); // takes time
		this.editor.setTheme("ace/theme/monokai");
		this.editor.getSession().setMode("ace/mode/python");
	}

	get code() {
		return this.editor.getSession().getValue();
	}

	set code(value) {
		this.editor.setValue(value);
	}
}

class EditorController {
	constructor() {
		this.runBtn = $('#runBtn');
		this.editorObj = new EditorObj();
		this.serverURL = "https://labyrinth1.herokuapp.com";

		this.editorContent = '';
		this.init();

		// this should be in the authoring environment
		var c1 = new Checkpoint();
		c1.description = 'Write a function hello() that prints "Hello, world!" to the console.';
		c1.testCases = [new TestCase(null, 'Hello, world!')];
		var checkpoints = [c1];
		this.lab = new Lab(checkpoints);
	}

	init() {
		this.addRunBtnHandler();
		this.addEditorContentChangeEventHandler();
	}

	addRunBtnHandler() {
		this.runBtn.on('click', (e) => { 
			// arrow function lets 'this' to be looked up in the lexical scope
			this.editorContent = this.editorObj.code;
			$.post({
				url: this.serverURL,
				data: {
					code: this.editorContent
				},
				success: (data) => {
					var output = this.lab.checkpoints[0].testCases[0].output;
					var res = data.toString('utf-8').trim();
					if (output === res) {
						$('#checkpoint1-state-img').attr('src', 'images/success.png');
						$('#checkpoint1-testcase1-state-img').attr('src', 'images/success.png');
					} else {
						$('#checkpoint1-state-img').attr('src', 'images/error.png');
						$('#checkpoint1-testcase1-state-img').attr('src', 'images/error.png');
					}
				},
				dataType: "text"
			});
		});
	}

	// currently no-use
	addEditorContentChangeEventHandler() {
		this.editorObj.editor.getSession().on('change', function() {
			// do something
		});
	}
}

$(document).ready(function() {
	var editorCtrl = new EditorController();
});

