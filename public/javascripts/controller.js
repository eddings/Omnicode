"use strict";

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

class RightClickController {
	constructor(editorObj) {
		this.editor = editorObj.editor;

		this.contextMenu = null;
		this.contextMenuPos = null;
		this.windowWidth = -1;
		this.windowHeight = -1;
		this.clickCoords = null;
		this.clickCoordsX = -1;
		this.clickCoordsY = -1;

		this.isContextMenuVisible = false;
		this.activeClassName = "context-menu--active";
		this.debugMenuID = "menu-debug";
		this.viewHintMenuID = "menu-view-a-hint";
		this.askQuestionMenuID = "menu-ask-a-question";

		this.questionModal = []; // Question Modal; should not be an array

		this.init();
	}

	init() {
		this.collectContextMenu();
		this.collectQuestionModal();
		this.addContextListener();
		this.addKeyUpListner();
		this.addQusetionModalHandler();
	}

	collectContextMenu() {
		this.contextMenu = $("#context-menu");
	}

	/* TODO: Duplicate. Also, there will be only 1 question modal -- the content of it
	 *       will be dynamically populated, instead of rolling a separate question modal for each
	 *       ckpt.
	 */
	collectQuestionModal() {
		// TODO: Check if i matches with the index included in the identifier of el
		$("div[id^='question-modal']").each((i, el) => {
			this.questionModal.push(
			{
				questionID: i,
				questionModal: $(el),
				questionModalCheckpoint: $('#question-modal-checkpoint' + i),
				questionModalTestCases: $('#question-modal-testcases' + i),
				questionModalCode: $('#question-modal-code' + i),
				questionModalText: $('#question-modal-text' + i),
				questionModalSubmitBtn: $('#question-modal-submit-btn' + i),
				questionModalCloseBtn: $('#question-modal-close' + i)
			});
		});     
	}

	addContextListener() {
		/* IE >= 9 */
		document.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			this.toggleMenuOn();
			this.positionMenu(e);
		});

		document.addEventListener("click", (e) => {
			var button = e.which || e.button;
			if (button === 1) {
				this.toggleMenuOff();
				if (e.target.id === this.askQuestionMenuID) {
					var textBlock = this.editor.getSession().doc.getTextRange(this.editor.selection.getRange());
					$('#question-modal-code0').text(textBlock);
					this.questionModal[0].questionModal.css('display', 'block');
				} else if (e.target.id === this.viewHintMenuID) {
					// TODO: implement me...
				} else if (e.target.id === this.debugMenuID) {
					this.debugStr = this.editor.getSession().doc.getTextRange(this.editor.selection.getRange());
					// TODO: this is not separated... having a separate class like this doesn't make
					//       sense b/c this class would need access to other elements in the DOM.
					// 		 Also, how would you make it so that the text selection is maintained (and
					//		 highlighted) across different tabs in the execution slider?
					$('#debugger-view-div').highlight(this.debugStr); // TODO: remove this separate id tag
				}
			} else {
				this.toggleMenuOff();
				// TODO: Turn off the highlight as well?
			}
			return true;
		});
	}

	addKeyUpListner() {
		/* Remove the context menu on pressing the ESC key */
		window.onkeyup = (e) => {
			if (e.keyCode === 27) {
				this.toggleMenuOff();
			}
		};
	}

	toggleMenuOn() {
		if (!this.isContextMenuVisible) {
			this.isContextMenuVisible = true;
			this.contextMenu.addClass(this.activeClassName);
		}
	}

	toggleMenuOff() {
		if (this.isContextMenuVisible) {
			this.isContextMenuVisible = false;
			this.contextMenu.removeClass(this.activeClassName);
		}
	}

	getPosition(e) {
		var posx = 0;
		var posy = 0;

		if (!e) { var e = window.event; }

		if (e.pageX || e.pageY) {
			posx = e.pageX;
			posy = e.pageY;
		} else if (e.clientX || e.clientY) {
			posx = e.clientX + document.body.scrollLeft + 
					document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + 
					document.documentElement.scrollTop;
		}
		return {
			x: posx,
			y: posy
		}
	}

	positionMenu(e) {
		this.clickCoords = this.getPosition(e);
		this.clickCoordsX = this.clickCoords.x;
		this.clickCoordsY = this.clickCoords.y;

		this.contextMenuWidth = this.contextMenu.width() + 4;
		this.contextMenuHeight = this.contextMenu.height() + 4;

		this.windowWidth = window.innerWidth;
		this.windowHeight = window.innerHeight;

		var styleStr = '';

		if ((this.windowWidth - this.clickCoordsX) < this.contextMenuWidth) {
			styleStr += "left: " + (this.windowWidth - this.contextMenuWidth) + "px;";
		} else {
			styleStr += "left: " + this.clickCoordsX + "px;";
		}

		if ((this.windowHeight - this.clickCoordsY) < this.contextMenuHeight) {
			styleStr += "top: " + (this.windowHeight - this.contextMenuHeight) + "px;";
		} else {
			styleStr += "top: " + this.clickCoordsY + "px;";
		}

		this.contextMenu.attr("style", styleStr);
	}

	/* TODO: Dup. */
	addQusetionModalHandler() {
		this.questionModal.forEach((obj, idx) => {
			obj.questionModalSubmitBtn.on("click", (e) => {
				// Assumes that the user selected an appropriate block of code
				var textBlock = this.editor.getSession().doc.getTextRange(this.editor.selection.getRange());
				obj.questionModalCode.text(textBlock);
				var question = obj.questionModalText.val();
				var checkpointID = obj.questionID;
				var testCases = obj.questionModalTestCases.html();
				var data = {
					command: QUESTION_COMMAND,
					question: question, // TODO: modify this
					checkpointID: checkpointID, // TODO: check if the IDs actually match
					testCases: testCases, // TODO: modify the format
					userName: USER_NAME, // should've been already logged in and the userName is set
					language: LAB_LANG,
					code: textBlock
				};
				var URL = QUESTION_URL + "/" + LAB_ID;
				//-- preferrably we will show a pop up to fill out the rest of the question details

				$.post(
				{
					url: URL,
					data: JSON.stringify(data),
					success: (data, status) => {
						// Send the message to a subset of people based on the result of AST analysis
						QUESTION_SOCKET.emit('question', data); // Transfer the question in 'data'
						obj.questionModal.css('display', 'none');
					},
					error: (req, status, err) => {
						console.log(err);
					},
					dataType: "json",
					contentType: "application/json"
				});
			});

			obj.questionModalCloseBtn.on("click", (e) => {
				obj.questionModal.css('display', 'none');
			});
		});
	}

	sendQuestionRequest(textBlock) {
	}
}

class EditorObj {
	constructor() {
		this.editor = ace.edit("editor"); // takes time
		//this.editor.setTheme("ace/theme/terminal");
		this.editor.getSession().setMode("ace/mode/python");
		this.editor.setShowPrintMargin(false); // vertical line at char 80
		this.editor.$blockScrolling = Infinity; // remove scrolling warnings
	}

	get code() {
		return this.editor.getSession().getValue();
	}

	set code(value) {
		this.editor.setValue(value);
	}
}

class Lab {
	constructor(checkpoints = []) {
		this.checkpoints = checkpoints; // Array of checkpoints
		this.questionBtns = []; // Question Buttons
		this.questionModals = []; // Question Modal

		// Test Case Spans
		this.testCaseSpans = [];

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

		// Code Editor Control Buttons
		this.runBtn = $('#runBtn');
		this.saveBtn = $('#saveBtn');
		this.debugBtn = $('#debugBtn');

		// Editor-related
		this.editorObj = new EditorObj();
		this.editorStatus = $('#editor-status');

		// Console
		this.console = $('#console');
		this.consoleObj = null;
		this.consoleClear = $('#console-clear');

		// Debugger
		this.debuggerViewDiv = $('#debugger-view-div');
		this.debuggerRangeSlider = $('#debugger-range-slider');
		this.debuggerRangeSliderSpan = $('#debugger-range-slider-span');
		this.debugTraces = [];
		this.debugStr = '';

		// Logged-in user data
		this.userData = {};

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
			});
		});     
	}

	collectTestCaseSpans() {
	}

	init() {
		this.collectQuestionBtns();
		this.collectQuestionModals();
		this.collectTestCaseSpans();

		this.addModalHandlers();
		this.addBtnHandlers();

		this.addQuestionNotificationHandler();
		this.addAnswerNotificationHandler();

		this.initConsole();
		this.initDebugger();

		// Initialize the user status
		this.initUserStatus();
	}

	addQuestionNotificationHandler() {
		LAB_SOCKET.on('question', (data) => {
			this.questionNotificationModal.css('display', 'inline');
			var content = '<b>' + data.questioner + '</b> asked<br>"' + data.question + '"';
			this.questionNotificationModalText.html('<p>' + content + '</p>');      
			setTimeout(() => {
				this.questionNotificationModal.fadeOut();
			}, 6000);
		});     
	}

	addAnswerNotificationHandler() {
		LAB_SOCKET.on('answer-posted', (data) => {
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
		});
	}

	notificationModalHandler() {
		// When clicking the notification itself
		this.questionNotificationModal.on("click", (e) => {
			window.location.href = "/question/" + LAB_ID + "?user=" + USER_NAME + "&password=" + PASSWORD;
		});

		this.answerNotificationModal.on("click", (e) => {
			window.location.href = "/question/" + LAB_ID + "?user=" + USER_NAME + "&password=" + PASSWORD;
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
			// TODO: Currently this is v messy; the USER_NAME value in the globals.js
			// file is populated before the page is loaded, and it is inconsistent.
			// In order to fetch the correct value, we're redirecting to a new URL
			// with appropriate query parameters such that the router can feed all
			// the necessary information before rendering the page.
			var userName = this.loginModalLoginInput.val();

			if (userName) {
				var password = this.loginModalLoginPass.val();
				var dataObj = {
					command: LOGIN_COMMAND,
					userName: userName,
					password: this.loginModalLoginPass.val()
				};

				if (password) {
					$.post({
						url: LAB_URL + '/' + LAB_ID,
						data: JSON.stringify(dataObj),
						success: (data) => {
							if (data.ok) {
								window.location.href = "/lab/" + LAB_ID + "?user=" + userName + "&password=" + password;
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
			if (userName) {
				var pass1 = this.loginModalSignupPass1.val();
				if (pass1) {
					var pass2 = this.loginModalSignupPass2.val();
					if (pass1 === pass2) {
						var userDataObj = {
							command: SIGNUP_COMMAND,
							userName: userName,
							password: pass1
						};
						$.post({
							url: LAB_URL + "/" + LAB_ID,
							data: JSON.stringify(userDataObj),
							success: (data) => {
								if (data.ok) {
									window.location.href = LAB_URL + "/" + LAB_ID + "?user=" + userName + "&password=" + pass1;
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
			// Show the console
			this.console.attr("style", "display: block;");
			this.consoleClear.attr("style", "display: block;");
			this.debuggerViewDiv.attr("style", "display: none;");
			this.debuggerRangeSlider.attr("style", "display: none;");
			this.debuggerRangeSliderSpan.attr("style", "display: none;");

			// arrow function lets 'this' to be looked up in the lexical scope
			var URL = LAB_URL + '/' + LAB_ID;
			var dataObj = {
				command: RUN_COMMAND,
				code: this.editorObj.code,
				language: LAB_LANG
			};
			$.post({
				url: URL,
				data: JSON.stringify(dataObj),
				success: (data) => {
					var output = this.checkpoints[0].testCases[0].output;
					var res = data.toString('utf-8').trim();
					if (output === res) {
						$('#state-img-checkpoint0').attr('src', '../images/success.png');
						$('#state-img-checkpoint0-testcase0').attr('src', '../images/success.png');
					} else {
						$('#state-img-checkpoint0').attr('src', '../images/error.png');
						$('#state-img-checkpoint0-testcase0').attr('src', '../images/error.png');
					}
					this.consoleObj.Write(res + '\n', 'jqconsole-output');
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
			var URL = LAB_URL + '/' + LAB_ID;
			// Console data
			var consoleContent = this.consoleObj.Dump();
			var consoleHistory = this.consoleObj.GetHistory();
			// Debugger data
			var debugTraces = this.debugTraces;
			var handlePosition = this.debuggerRangeSlider.slider('option', 'value');
			var highlightedStr = this.debugStr;
			var dataObj = {
				command: SAVE_COMMAND,
				userName: USER_NAME,
				checkpointStatus: {},
				code: this.editorObj.code,
				console: {
					content: consoleContent,
					history: consoleHistory,
				},
                debugger: {
                    debugTraces: debugTraces,
                    handlePosition: handlePosition,
                    highlightedStr: highlightedStr
                },
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

	createDebugTrace(data) {
		// Take the JSON string data and create it into an array of info
		var JSONObj = JSON.parse(data);
		var trace = JSONObj['trace'];

		var executionText = '';
		var executionTraces = [];
		for (let i = 0; i < trace.length; ++i) {
			var orderedGlobals = trace[i]['ordered_globals'];
			if (orderedGlobals.length > 0) {
				executionText += 'Global Frame<br>';
				executionText += '<ul>'
				for (let j = 0; j < orderedGlobals.length; ++j) {
					executionText += '<li>' + orderedGlobals[j] + '</li>';
				}
				executionText += '</ul>'
			}

			var printOutput = trace[i]['stdout'];
			if (printOutput) {
				executionText += 'Print output: ' + printOutput + '<br>';
			}

			var stackElems = trace[i]['stack_to_render'];
			if (stackElems.length > 0) {
				executionText += 'Stack Frame<br>'
				executionText += '<ul>'
				for (let j = 0; j < stackElems.length; ++j) {
					var elem = stackElems[j];
					var encodedLocalNames = Object.keys(elem['encoded_locals']);
					encodedLocalNames.forEach((name, k) => {
						if (name === "__return__") {
							executionText += '<li>Return' + ':' + elem['encoded_locals'][name] + '</li>';
						} else {
							executionText += '<li>' + name + ':' + elem['encoded_locals'][name] + '</li>';
						}
					});
				}
				executionText += '</ul>'
			}

			if (executionText !== '') {
				executionTraces.push(executionText);
				executionText = '';
			}
		}

		return executionTraces;
	}

	addDebugBtnHandler() {
		this.debugBtn.on('click', (e) => {
			// Show the debugger
			this.console.attr("style", "display: none;");
			this.consoleClear.attr("style", "display: none;");
			this.debuggerViewDiv.attr("style", "display: block;");
			this.debuggerRangeSlider.attr("style", "display: block;");
			this.debuggerRangeSliderSpan.attr("style", "display: block;");

			// arrow function lets 'this' to be looked up in the lexical scope
			var URL = LAB_URL + '/' + LAB_ID;
			var dataObj = {
				command: DEBUG_COMMAND,
				code: this.editorObj.code,
				language: LAB_LANG
			};
			$.post({
				url: URL,
				data: JSON.stringify(dataObj),
				success: (data) => {
					var traces = this.createDebugTrace(data);
					if (traces.length > 0) {
						this.debugTraces = traces;
						this.debuggerViewDiv.html(this.debugTraces[0]);
						this.debuggerRangeSlider.slider('option', 'min', 1);
						this.debuggerRangeSlider.slider('option', 'max', traces.length);
						this.debuggerRangeSlider.slider('option', 'value', 1);
						this.debuggerRangeSliderSpan.text(this.createDebuggerSpanText(1, traces.length));
					}
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
			// chunking every 10 second? Would there be a good behavioral cue that 
			// can tell us that the student's thought train has stopped and 
			// the working code is produced? I.e. how do we know from behavioral cues
			// that one has produced a syntax-error free chunk of code?
			// probably not ... we will just let the server do the work.

			// Send the server the code to parse every 3 second or so, and the server will
			// Parse it and store it to the database ... what will happen if there are many
			// duplicates? Should we dedup the database every once in a while?
		});
	}

	addBtnHandlers() {
		this.addRunBtnHandler();
		this.addDebugBtnHandler();
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

	startConsole() {
		var startPrompt = () => {
			this.consoleObj.Prompt(true, (input) => {
				// TODO: dedup
				var URL = LAB_URL + '/' + LAB_ID;
				var dataObj = {
					command: RUN_COMMAND,
					code: input,
					language: LAB_LANG
				};
				$.post({
					url: URL,
					data: JSON.stringify(dataObj),
					success: (data) => {
						var res = data.toString('utf-8').trim();
						this.consoleObj.Write(res + '\n', 'jqconsole-output');
					},
					error: (req, status, err) => {
						console.log(err);
					},
					dataType: "text",
					contentType: 'application/json'
				});
				startPrompt();
			});
		};
		startPrompt();		
	}

	initConsole() {
		this.consoleObj = this.console.jqconsole('', '>>>');
		this.startConsole();
		this.consoleClear.on("click", (e) => {
			e.preventDefault();
			this.consoleObj.Reset();
			this.startConsole();
		});
	}

	createDebuggerSpanText(val, max) {
		return 'Execution step ' + val + ' out of ' + max;
	}

	initDebugger() {
		this.debuggerRangeSlider.slider({
			range: 'max',
			min: 0,
			max: 0,
			value: 0
		});

		this.debuggerRangeSlider.on('slide', (event, ui) => {
			this.debuggerRangeSliderSpan.text(
				this.createDebuggerSpanText(ui.value, this.debuggerRangeSlider.slider('option', 'max'))
			);
			this.debuggerViewDiv.html(this.debugTraces[ui.value - 1]);
		});

		this.debuggerRangeSliderSpan.text(
			this.createDebuggerSpanText(0, 0)
		);
	}

	initUserStatus() {
		if (USER_NAME) {
			var URL = LAB_URL + '/' + LAB_ID;
			var dataObj = {
				command: GET_USER_COMMAND,
				userName: USER_NAME
			};
			$.post({
				url: URL,
				data: JSON.stringify(dataObj),
				success: (data) => {
					if (data.ok) {
						this.userData = data.userData;
						// TODO: Why creating a new object everytime?
						//var testParser = new TestParser(this.userData.code);
						//var parsedObj = testParser.parse();
						//this.editorObj.code = parsedObj.code; // inject the last saved code w/o test cases
						
						this.consoleObj.Write(this.userData.console.content, 'jqconsole-output');
						this.consoleObj.SetHistory(this.userData.console.history);
					}
				},
				error: (req, status, err) => {
					console.log(err);
				},
				contentType: 'application/json'
			});
		}
	}
}

class EditorController {
	constructor() {
		this.init();
		// Lab-related; this should be in the authoring environment
		var c1 = new Checkpoint();
		c1.description = 'Write a function hello() that prints "Hello, world!" to the console.';
		c1.testCases = [new TestCase(null, 'Hello, world!')];
		var checkpoints = [c1];
		this.lab = new Lab(checkpoints, SERVER_URL);
	}

	init() {
	}
}

$(document).ready(function() {
	var editorCtrl = new EditorController();
	var rightClickCtrl = new RightClickController(editorCtrl.lab.editorObj);
});

