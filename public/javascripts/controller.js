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

class EditorObj {
	constructor() {
		this.editor = ace.edit("editor"); // takes time
		this.editor.setTheme("ace/theme/monokai");
		this.editor.getSession().setMode("ace/mode/python");
		this.editor.setShowPrintMargin(false); // vertical line at char 80
	}

	get code() {
		return this.editor.getSession().getValue();
	}

	set code(value) {
		this.editor.setValue(value);
	}
}

class Lab {
	constructor(checkpoints, serverURL = "http://localhost:3000") {
		this.labID = $('#lab-id-link').text(); // Lab ID
		this.labLanguage = $('#lab-lang').text(); // Lab programming language
		this.userName = $('#user-name').text(); // Current user name
		this.password = $('#user-password').val();

		this.checkpoints = checkpoints; // Array of checkpoints
		this.questionBtns = []; // Question Buttons
		this.questionModals = []; // Question Modal

		// Notification modal
		this.questionNotificationModal = $('#question-notification-modal');
		this.questionNotificationModalClose = $('#question-notification-modal-close');
		this.questionNotificationModalContent = $('#question-notification-modal-content');
		this.questionNotificationModalText = $('#question-notification-modal-text');
		this.questionIndexInput = $('#question-index');
		this.checkpointIndexInput = $('#checkpoint-index');

		// Notification modal for answers
		this.answerNotificationModal = $('#answer-notification-modal');
		this.answerNotificationModalClose = $('#answer-notification-modal-close');
		this.answerNotificationModalContent = $('#answer-notification-modal-content');
		this.answerNotificationModalText = $('#answer-notification-modal-text');

		// Login and signup modals
		this.loginModal = $('#login-modal');
		this.loginModalLoginInput = $('#user-name-login-input');
		this.loginModalLoginPass = $('#user-pass-login-input');
		this.loginModalSignupInput = $('#user-name-signup-input');
		this.loginModalSignupPass1 = $('#user-pass1-signup-input');
		this.loginModalSignupPass2 = $('#user-pass2-signup-input');
		this.loginModalLoginBtn = $('#login-modal-login-btn');
		this.loginModalSignupBtn = $('#login-modal-signup-btn');
		this.loginModalLoginStatus = $('#login-modal-login-status');
		this.loginModalSignupStatus = $('#login-modal-signup-status');
		this.loginModalDiv = $('#login-modal-content');
		this.signupModalDiv = $('#signup-modal-content');
		this.signupLink = $('#signup-link');
		this.loginLink = $('#login-link');

		// Buttons
		this.runBtn = $('#runBtn');
		this.saveBtn = $('#saveBtn');

		this.labURL = serverURL + '/lab';
		this.questionURL = serverURL + '/question';

		// Editor-related
		this.editorObj = new EditorObj();
		this.editorStatus = $('#editor-status');

		// Console
		this.console = $('#console');

		// Lab checkpoints
		this.checkpoints = checkpoints;

		// Side menu
		this.sideMenu = $('#side-menu');

		// Logged-in user data
		this.userData = {};

		// TODO: This should be moved to somewhere else
		var queryStr = 'labID=' + this.labID + '&userName=' + this.userName;
		this.labSocket = io.connect(this.labURL, { query: queryStr });
		this.questionSocket = io.connect(this.questionURL, { query: queryStr });

		// Constants
		// TODO: Consolidate these somewhere with other constants
		this.questionCmd = "question";
		this.loginCmd = "login";
		this.signupCmd = "signup";
		this.runCmd = "run";
		this.saveCmd = "save";
		this.getUserCmd = "getUser";

		this.init();
	}

	collectQuestionBtns() {
		$("button[id$='-question-btn']").each((i, el) => {
			this.questionBtns.push($(el));
		});
	}

	collectQuestionModals() {
		// TODO: Check if i matches with the index included in the identifier of el
		$("div[id^='question-modal']").each((i, el) => {
			this.questionModals.push(
			{
				questionID: i,
				questionModal: $(el),
				questionModalCheckpoint: $('#question-modal-checkpoint' + i),
				questionModalTestCases: $('#question-modal-testcases' + i),
				questionModalText: $('#question-modal-text' + i),
				questionModalSubmitBtn: $('#question-modal-submit-btn' + i),
				questionModalCloseBtn: $('#question-modal-close' + i)
			})
		});		
	}

	init() {
		this.collectQuestionBtns();
		this.collectQuestionModals();

		this.addModalHandlers();
		this.addBtnHandlers();

		this.addQuestionNotificationHandler();
		this.addAnswerNotificationHandler();

		// Initialize the side menu using the library function
		this.sideMenu.BootSideMenu({
			pushBody: false
		});

		// Initialize the user status
		this.initUserStatus();
	}

	addQuestionNotificationHandler() {
		this.labSocket.on('question', (data) => {
			this.questionNotificationModal.css('display', 'inline');
			var content = '<b>' + data.questioner + '</b> asked<br>"' + data.question + '"';
			this.questionNotificationModalText.html('<p>' + content + '</p>');		
			setTimeout(() => {
				this.questionNotificationModal.fadeOut();
			}, 6000);
		});		
	}

	addAnswerNotificationHandler() {
		this.labSocket.on('answer-posted', (data) => {
			this.answerNotificationModal.css('display', 'inline');
			var content = '<b>' + data.answerer + '</b> answered<br>"' + data.answer + '"<br> to your question';
			this.answerNotificationModalText.html('<p>' + content + '</p>');		
			setTimeout(() => {
				this.answerNotificationModal.fadeOut();
			}, 6000);
		});
	}

	qusetionModalHandler() {
		this.questionModals.forEach((obj, idx) => {
			obj.questionModalSubmitBtn.on("click", (e) => {
				var questionText = obj.questionModalText.val();
				var checkpointID = obj.questionID;
				var testCases = obj.questionModalTestCases.html();
				var dataObj = {
					command: this.questionCmd,
					question: questionText, // TODO: modify this
					checkpointID: checkpointID, // TODO: check if the IDs actually match
					testCases: testCases, // TODO: modify the format
					userName: this.userName // should've been already logged in and the userName is set
				};
				var URL = this.questionURL + '/' + this.labID;
				
				$.post({
					url: URL,
					data: JSON.stringify(dataObj),
					success: (questionObj, status) => {
						// Send the message to a subset of people based on the result of AST analysis
						this.questionSocket.emit('question', questionObj); // Transfer the question in 'data'
						obj.questionModal.css('display', 'none');
					},
					error: (req, status, err) => {
						console.log(err);
					},
					dataType: "json",
					contentType: 'application/json'
				});
			});

			obj.questionModalCloseBtn.on("click", (e) => {
				obj.questionModal.css('display', 'none');
			})
		});
	}

	notificationModalHandler() {
		// When clicking the notification itself
		this.questionNotificationModal.on("click", (e) => {
			window.location.href = "/question/" + this.labID + "?user=" + this.userName + "&password=" + this.password;
		});

		this.answerNotificationModal.on("click", (e) => {
			window.location.href = "/question/" + this.labID + "?user=" + this.userName + "&password=" + this.password;
		});

		this.questionNotificationModalClose.on("click", (e) => {
			this.questionNotificationModal.css('display', 'none');
		});

		this.answerNotificationModalClose.on("click", (e) => {
			this.answerNotificationModal.css('display', 'none');
		});
	}

	loginModalHandler() {
		this.loginModalLoginBtn.on("click", (e) => {
			var userName = this.loginModalLoginInput.val();
			var URL = this.labURL + '/' + this.labID;

			if (userName) {
				var password = this.loginModalLoginPass.val();
				var dataObj = {
					command: this.loginCmd,
					userName: userName,
					password: this.loginModalLoginPass.val()
				};

				if (password) {
					$.post({
						url: URL,
						data: JSON.stringify(dataObj),
						success: (data) => {
							if (data.ok) {
								window.location.href = "/lab/" + this.labID + "?user=" + userName + "&password=" + password;
							} else {
								this.loginModalLoginStatus.html(data.reason);
							}
						},
						error: (req, status, err) => {
							console.log(err);
						},
						contentType: 'application/json'
					});
				} else {
					this.loginModalLoginStatus.html('Please enter the password');
				}
			} else {
				this.loginModalLoginStatus.html('Please enter a user name');
			}
		});

		this.loginModalSignupBtn.on("click", (e) => {
			var userName = this.loginModalSignupInput.val();
			var URL = this.labURL + '/' + this.labID;

			var pass1 = this.loginModalSignupPass1.val();
			var pass2 = this.loginModalSignupPass2.val();

			if (userName) {
				if (pass1) {
					if (pass1 === pass2) {
						var userDataObj = {
							command: this.signupCmd,
							userName: userName,
							password: pass1,
							role: 'student',
							checkpointStatus: {},
							code: '',
							console: [],
							notificationPaneContent: {}
						};
						$.post({
							url: URL,
							data: JSON.stringify(userDataObj),
							success: (data) => {
								console.log(data);
								if (data.ok) {
									window.location.href = "/lab/" + this.labID + "?user=" + userName + "&password=" + pass1;
								} else {
									this.loginModalSignupStatus.html(data.reason);
								}
							},
							error: (req, status, err) => {
								console.log(err);
							},
							dataType: "json",
							contentType: 'application/json'
						});	
					} else {
						this.loginModalSignupStatus.html("Passwords do not match");
					}
				} else {
					this.loginModalSignupStatus.html("Please enter a password");
				}		
			} else {
				this.loginModalSignupStatus.html("Please enter a user name");
			}
		});
	}

	signupLinkClickHandler() {
		this.signupLink.on('click', (e) => {
			e.preventDefault();
			if (this.signupModalDiv.css('display') === 'none') {
				this.loginModalDiv.css('display', 'none');
				this.signupModalDiv.fadeIn();
			}
		});
	}

	loginLinkClickHandler() {
		this.loginLink.on('click', (e) => {
			e.preventDefault();
			if (this.loginModalDiv.css('display') === 'none') {
				this.signupModalDiv.css('display', 'none');
				this.loginModalDiv.fadeIn();
			}
		});
	}

	addQuestionBtnHandler() {
		this.questionBtns.forEach((btn, idx) => {
			btn.on("click", (e) => {
				this.questionModals[idx].questionModal.css('display', 'block');
			});
		});
	}

	addModalBackgroundClickHandler() {
		/* Dismiss the question modal when the background is clicked */
		this.questionModals.forEach((obj, idx) => {
			window.onclick = (e) => {
				if (e.target.id === obj.questionModal.attr('id')) {
					obj.questionModal.css('display', 'none');
				}
			};	
		});	
	}

	addRunBtnHandler() {
		this.runBtn.on('click', (e) => { 
			// arrow function lets 'this' to be looked up in the lexical scope
			var URL = this.labURL + '/' + this.labID;
			var dataObj = {
				command: this.runCmd,
				code: this.editorObj.code,
				language: this.labLanguage
			};
			$.post({
				url: URL,
				data: JSON.stringify(dataObj),
				success: (data) => {
					var output = this.checkpoints[0].testCases[0].output;
					var res = data.toString('utf-8').trim();
					if (output === res) {
						$('#checkpoint0-state-img').attr('src', '../images/success.png');
						$('#checkpoint0-testcase0-state-img').attr('src', '../images/success.png');
					} else {
						$('#checkpoint0-state-img').attr('src', '../images/error.png');
						$('#checkpoint0-testcase0-state-img').attr('src', '../images/error.png');
					}
					this.console.append('<p class="console-content">>' + res + '</p>');
				},
				error: (req, status, err) => {
					console.log(err);
				},
				dataType: "text",
				contentType: 'application/json'
			});
		});
	}

	addSaveBtnHandler() {

		this.saveBtn.on("click", (e) => {
			var URL = this.labURL + '/' + this.labID;
			var consoleContents = [];
			$("p[class^='console-content']").each((i, el) => {
				consoleContents.push($(el).text());
			});

			var dataObj = {
				command: this.saveCmd,
				userName: this.userName,
				checkpointStatus: {},
				code: this.editorObj.code,
				consoleContents: consoleContents,
				notificationPaneContent: {}
			};

			$.post({
				url: URL,
				data: JSON.stringify(dataObj),
				success: (data) => {
					var currentdate = new Date(); 
					var savedAt = "Last saved at: " + currentdate.getDate() + "/"
					                + (currentdate.getMonth()+1)  + "/" 
					                + currentdate.getFullYear() + " @ "  
					                + currentdate.getHours() + ":"  
					                + currentdate.getMinutes() + ":" 
					                + currentdate.getSeconds();
					this.editorStatus.text(savedAt);
					this.editorStatus.css('display', 'inline');
					setTimeout(() => {
						this.editorStatus.fadeOut();
					}, 2000);
				},
				error: (req, status, err) => {
					console.log(err);
				},
				dataType: "text",
				contentType: 'application/json'
			});
		});
	}

	// currently no-use
	addEditorContentChangeEventHandler() {
		this.editorObj.editor.getSession().on('change', function() {
			// do something
		});
	}

	addBtnHandlers() {
		this.addRunBtnHandler();
		this.addSaveBtnHandler();
	}

	addModalHandlers() {
		this.addModalBackgroundClickHandler();
		this.addQuestionBtnHandler();
		this.qusetionModalHandler();
		this.notificationModalHandler();
		this.loginModalHandler();
		this.signupLinkClickHandler();
		this.loginLinkClickHandler();
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

	initUserStatus() {
		var userName = this.userName;
		var URL = this.labURL + '/' + this.labID;
		var dataObj = {
			command: this.getUserCmd,
			userName: userName
		};
		$.post({
			url: URL,
			data: JSON.stringify(dataObj),
			success: (data) => {
				if (data.ok) {
					this.userData = data.userData;
					// Inject the most recently saved status
					this.editorObj.code = this.userData.code;
				} else {
				}
			},
			error: (req, status, err) => {
				console.log(err);
			},
			contentType: 'application/json'
		});
	}
}

class EditorController {
	constructor() {
		this.serverURL = "http://localhost:3000";
		this.init();
		// Lab-related; this should be in the authoring environment
		var c1 = new Checkpoint();
		c1.description = 'Write a function hello() that prints "Hello, world!" to the console.';
		c1.testCases = [new TestCase(null, 'Hello, world!')];
		var checkpoints = [c1];
		this.lab = new Lab(checkpoints, this.serverURL);
	}

	init() {
	}
}

$(document).ready(function() {
	var editorCtrl = new EditorController();
});

