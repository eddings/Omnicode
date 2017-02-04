"use strict";

var Range = ace.require('ace/range').Range;

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
		this.editor = ace.edit("editor"); // takes time?
		//this.editor.setTheme("ace/theme/terminal");
		this.editor.getSession().setMode("ace/mode/python");
		this.editor.setShowPrintMargin(false); // vertical line at char 80
		this.editor.$blockScrolling = Infinity; // remove scrolling warnings
		//this.editor.setHighlightGutterLine(false);
	}

	get code() {
		return this.editor.getSession().getValue();
	}

	set code(value) {
		this.editor.setValue(value);
	}
}

class Lab {
	constructor() {
		this.checkpoints = []; // Array of checkpoints
		this.questionBtns = []; // Question Buttons

		// Testcase HTML Div (for highlighting)
		this.prevTestcaseHTMLDiv = null;

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

		// System warning modal
		this.warningNotificationModal = $('#warning-notification-modal');
		this.warningNotificationModalClose = $('#warning-notification-modal-close');
		this.warningNotificationModalContent = $('#warning-notification-modal-content');
		this.warningNotificationModalText = $('#warning-notification-modal-text');

		// Debug modal
		this.debugModal = $('#debug-modal');
		this.debugModalClose = $('#debug-modal-close');
		this.debugModalContent = $('#debug-modal-content');
		this.debugModalCodeDiv = $('#debug-modal-code-div')
		this.debugModalStatus = $('#debug-modal-status');
		this.debugModalOkBtn = $('#debug-modal-ok-btn');

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

		// Sign out
		this.signoutBtn = $('#sign-out');

		// Question Modal
		this.questionModal = null;

		// Code Editor Control Buttons
		this.runAllTestsBtn = $('#runAllTestsBtn');
		this.saveBtn = $('#saveBtn');
		this.debugBtn = $('#debugBtn');

		// Editor-related
		this.editorObj = new EditorObj();
		this.editor = this.editorObj.editor;
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
		this.debugStrLoc = {};

		// Logged-in user data
		this.userData = {};

		// Run results
		this.runResults = [];
		this.runningCode = '';
		this.syntaxErrorRanges = null;
		this.prevSyntaxErrorRanges = [];
		this.prevCommentRows = [];
		this.prevErrorMarkers = [];

		// Context menu
		this.contextMenuWithDebug = null;
		this.contextMenuWithDebugHighlight = null;
		this.windowWidth = -1;
		this.windowHeight = -1;
		this.clickCoords = null;
		this.clickCoordsX = -1;
		this.clickCoordsY = -1;

		this.isContextMenuVisible = false;
		this.isDebugStrHighlighted = false;
		this.activeClassName = "context-menu--active";
		// With debugging
		this.debugMenuID = "menu-debug";
		this.visualDebugMenuID = "menu-visual-debug";
		this.debugHighlightMenuID = "menu-debug-highlight";
		this.debugDehighlightMenuID = "menu-debug-dehighlight";
		this.runTestcaseID = "menu-run";
		this.viewHintMenuIDDebug = "menu-view-a-hint-debug";
		this.askQuestionMenuIDDebug = "menu-ask-a-question-debug";
		// Without debugging
		this.viewHintMenuID = "menu-view-a-hint";
		this.askQuestionMenuID = "menu-ask-a-question";

		this.menuClickID = {checkpoint: -1, testcase: -1};

		// Debouncing and code auto save
		this.dmp = new diff_match_patch();
		this.DEBOUNCE_MS = 3000;// milliseconds of debouncing (i.e., 'clustering' a
								// rapid series of edit actions as a single diff)
								// set to 'null' for no debouncing
		this.curText = '';

		this.init();
	}

	collectQuestionBtns() {
		$("button[id$='-question-btn']").each((i, el) => {
			this.questionBtns.push($(el));
		});
	}

	collectTestCaseSpans() {
	}

	init() {
		this.collectQuestionBtns();
		this.collectTestCaseSpans();
		this.collectQuestionModal();

		this.addModalHandlers();
		this.addBtnHandlers();

		// Add notification handlers
		this.addQuestionNotificationHandler();
		this.addAnswerNotificationHandler();

		// Context menu handler
		this.collectContextMenu();
		this.addContextListener();
		this.addKeyUpListner();

		// Initialize other panels
		this.initConsole();
		this.initDebugger();

		// Debouncing and auto code save + syntax error visualization
		this.addContentChangeHandler();

		// Initialize the user status
		this.initStatus();
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

	postWarningNotificationModal(data) {
		this.warningNotificationModal.css('display', 'inline');
		var content = data.msg;
		this.warningNotificationModalText.html('<p>' + content + '</p>');        
		setTimeout(() => {
			this.warningNotificationModal.fadeOut();
		}, 2000);
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

		this.warningNotificationModalClose.on("click", (e) => {
			this.warningNotificationModal.css('display', 'none');
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
						dataType: 'json',
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
							dataType: 'json',
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

	showQuestionModal(codeStr) {
		if (codeStr === '') {
			this.questionModal.questionModalCode.css('display', 'none');
			var selectCodeBlockFirstMsg = 'To add a code block that you are confused about,\
										   simply select the relevant portion of your code\
										   before asking a question';
			this.questionModal.questionModalStatus.text(selectCodeBlockFirstMsg);
		} else {
			this.questionModal.questionModalCode.css('display', 'block');
			this.questionModal.questionModalCode.text(codeStr);
		}
		this.questionModal.questionModal.css('display', 'block');
	}

	hideQuestionModal() {
		this.questionModal.questionModal.css('display', 'none');
	}

	showDebugModal() {
		this.debugModal.css('display', 'block');
	}

	hideDebugModal() {
		this.debugModal.css('display', 'none');
	}

	showDebugHighlightMenu() {
		$('#' + this.debugHighlightMenuID).css('display', 'block');
	}

	hideDebugHighlightMenu() {
		$('#' + this.debugHighlightMenuID).css('display', 'none');
	}

	showDebugDehighlightMenu() {
		$('#' + this.debugDehighlightMenuID).css('display', 'block');
	}

	hideDebugDehighlightMenu() {
		$('#' + this.debugDehighlightMenuID).css('display', 'none');
	}

	addModalBackgroundClickHandler() {
		/* Dismiss the question modal when the background is clicked */
		// TODO: TEST
		window.onclick = (e) => {
			if (e.target.id === this.questionModal.questionModal.attr('id')) {
				// Hide the question modal
				this.hideQuestionModal();
			} else if (e.target.id === this.debugModal.attr('id')) {	
				// Hide the debug modal
				this.hideDebugModal();
			}
		};
	}

	////////////////////////////////////
	// Highlight all the syntax errors
	////////////////////////////////////
	highlightSyntaxErrors(errorRanges) {
		var errorIndicationStyle = 'redGutter';
		// Remove previous gutter highlights (squiggly lines are removed when the editor content is changed)
		this.prevSyntaxErrorRanges.forEach((range, idx) => {
			this.editor.session.removeGutterDecoration(range.start.row, errorIndicationStyle);
		});
		// Add new gutter highlights and squiggly lines
		errorRanges.forEach((range, idx) => {
			this.editor.session.addGutterDecoration(range.start.row, errorIndicationStyle);
			this.prevErrorMarkers.push(
				{
					id: this.editor.session.addMarker(
						new Range(range.start.row, range.start.column, range.end.row, range.end.column),
						"syntaxErrorHighlight",
						"text"),
					startLine: range.start.row,
					endLine: range.end.row
				});
		});

		this.prevSyntaxErrorRanges = errorRanges;
	}

	///////////////////////////////////////////////////
	// Highlight the gutter of the commented function
	// lines in grey to indicate that these functions
	// are not executed
	///////////////////////////////////////////////////
	colorCommentedOutFunctions(commentedFuncRanges) {
		var commentIndicationStyle = 'greyGutter';
		// Remove previous gutter highlights
		this.prevCommentRows.forEach((row, idx) => {
			this.editor.session.removeGutterDecoration(row, commentIndicationStyle);
		});

		// Unroll the comment function ranges into row indices
		var commentRows = [];
		commentedFuncRanges.forEach((range, idx) => {
			for (let i = range.start.row; i <= range.end.row; ++i) {
				commentRows.push(i);
			}
		});

		// Unroll the previous syntax error ranges into row indices
		var prevSyntaxErrorRows = [];
		this.prevSyntaxErrorRanges.forEach((sRange, idx) => {
			prevSyntaxErrorRows.push(sRange.start.row);
		});

		for (let i = 0; i < commentRows.length;) {
			if (prevSyntaxErrorRows.indexOf(commentRows[i]) > -1) {
				commentRows.splice(i, 1);
			} else {
				i++;
			}
		}

		commentRows.forEach((row, idx) => {
			this.editor.session.addGutterDecoration(row, commentIndicationStyle);
		});

		this.prevCommentRows = commentRows;
	}

	showConsole() {
		this.console.attr("style", "display: block;");
		this.consoleClear.attr("style", "display: block;");
		this.debuggerViewDiv.attr("style", "display: none;");
		this.debuggerRangeSlider.attr("style", "display: none;");
		this.debuggerRangeSliderSpan.attr("style", "display: none;");		
	}

	showDebugger() {
		this.console.attr("style", "display: none;");
		this.consoleClear.attr("style", "display: none;");
		this.debuggerViewDiv.attr("style", "display: block;");
		this.debuggerRangeSlider.attr("style", "display: block;");
		this.debuggerRangeSliderSpan.attr("style", "display: block;");
	}

	addSelectionClickHandlers(selectionIds) {
		selectionIds.forEach((id, i) => {
			$('#' + id).on('click', (e) => {
				this.debugStr = $('#' + id).text(); // TODO: convert the whole string into some sort of representation...
				this.hideDebugModal();
			});
		});
	}

	createSelectionChoiceHTML(doc, originalSelectionRange, extendedSelectionRanges) {
		var msgHTML = '<p>' + 'You selected this in the editor' + '</p>'
				    + '<pre>' + doc.getTextRange(originalSelectionRange) + '</pre>'
				    + '<p>' + 'But did you mean one of these?' + '</p>';

		var selectionIds = [];
		extendedSelectionRanges.forEach((range, i) => {
			var id = 'fuzzySelectionOption' + i;
			selectionIds.push(id);
			var html = '<pre id="' + id + '">' + doc.getTextRange(range) + '</pre>'
			msgHTML += html;
		});

		return {html:msgHTML, selectionIds:selectionIds};
	}

	populateDebugFuzzySelectionView() {
		this.showDebugModal();
		var selectedStr = this.editor.getSession().doc.getTextRange(this.editor.selection.getRange());
		var selectedLoc = this.editor.selection.getRange();
		// Fuzzy selection 101 -- find the containing function

		this.sendFuzzySelectionRequest(selectedStr, selectedLoc, (originalSelectionRange, extendedSelectionRanges) => {
			this.debugModalCodeDiv.html('');
			var ret = this.createSelectionChoiceHTML(this.editor.getSession().doc, originalSelectionRange, extendedSelectionRanges);
			this.debugModalCodeDiv.append(ret.html);
			this.addSelectionClickHandlers(ret.selectionIds);
		});
	}

	sendFuzzySelectionRequest(selectedStr, selectedLoc, cb) {
		var request = {
			command: FUZZY_SELECT_COMMAND,
			str: selectedStr,
			loc: selectedLoc, // {start: {row: 0, column: 0}, end: {row: 0, column: 0}} format, 0-indexed
			code: this.editorObj.code
		};
		$.post({
			url: LAB_URL + '/' + LAB_ID,
			data: JSON.stringify(request),
			success: (data) => {
				cb(data.originalSelectionRange, data.extendedSelectionRanges);
			},
			error: (req, status, err) => {
				console.error(err);
			},
			dataType: 'json',
			contentType: 'application/json'
		});
	}

	////////////////////////////////////////////////////////
	// Highlight the selected string in the code editor in
	// the debugger panel and vice versa
	////////////////////////////////////////////////////////
	highlightDebugString() {
		this.debugStr = this.editor.getSession().doc.getTextRange(this.editor.selection.getRange());
		this.isDebugStrHighlighted = (this.debugStr !== '');

		// Highlight the selected string (already set before this function is called) 
		// in the debugger panel
		this.debuggerViewDiv.highlight(this.debugStr);
	}

	dehighlightDebugString() {
		this.isDebugStrHighlighted = false;
		// TODO: What if there was no portion of text that was highlighted in the debugger panel
		this.debuggerViewDiv.removeHighlight();
	}

	handleDebugRequest(traceData) {
		// Populate the debugger panel content
		var traces = [];
		if (!traceData) {
			var ckptID = this.menuClickID.checkpoint;
			var testID = this.menuClickID.testcase;
			if (ckptID !== -1 && testID !== -1) {
				if (!this.runResults                     	// Sanity checks. Should pass after proper initialization
					|| !this.runResults[ckptID]          	//
					|| !this.runResults[ckptID][testID]  	//
					|| !this.runResults[ckptID][testID][0]) // This is set only after an actual run of the testcase
				{
					return this.postWarningNotificationModal({
						msg: 'Run the test case first'
					});
				}
				traces = this.createDebugTrace(this.runResults[ckptID][testID][0]);
			}
		} else {
			traces = this.createDebugTrace(traceData);
		}

		if (traces.length > 0) {
			this.debugTraces = traces;
			this.debuggerViewDiv.html(this.debugTraces[0]);
			this.debuggerRangeSlider.slider('option', 'min', 1);
			this.debuggerRangeSlider.slider('option', 'max', traces.length);
			this.debuggerRangeSlider.slider('option', 'value', 1);
			this.debuggerRangeSliderSpan.text(this.createDebuggerSpanText(1, traces.length));
		} else {
			return this.postWarningNotificationModal({
				msg: 'Run the test case first'
			});
		}

		// Show the debugger panel
		this.showDebugger();
	}

	sendRunRequeset(URL, dataObj, mode) {
		$.post({
			url: URL,
			data: JSON.stringify(dataObj),
			success: (data) => {
				this.editorStatus.html("Done");
				setTimeout(() => {
					this.editorStatus.fadeOut();
				}, 2000);

				var json = JSON.parse(data);

				// Set gutter highlight (red) to indicate syntax error
				this.highlightSyntaxErrors(json.syntaxErrorRanges);

				// Set gutter highlight (yellow) to indicate commented function ranges
				this.colorCommentedOutFunctions(json.commentedFuncRanges);

				// Either the result contains the entire result
				// or the specific one.
				if (mode === RUN_ALL_TESTS_COMMAND) {
					this.runResults = json.results;
					this.checkpoints.forEach((cp, cp_idx) => {
						cp.testCases.forEach((testcase, testcase_idx) => {
							var traceLen = this.runResults[cp_idx][testcase_idx][0].length;
							var result = '';
							if (this.runResults[cp_idx][testcase_idx][0][traceLen-1]["event"] === "return") {
								result = this.runResults[cp_idx][testcase_idx][0][traceLen-1]["stdout"]["__main__"];
							} else if (this.runResults[cp_idx][testcase_idx][0][traceLen-1]["event"] === "exception") {
								result = this.runResults[cp_idx][testcase_idx][0][traceLen-1]["exception_msg"];
							}
							var testcaseResImg = $('#case' + cp_idx + '_' + testcase_idx);
							if (testcase.want === result) {
								testcaseResImg.attr('src', '../images/success.png');
							} else {
								testcaseResImg.attr('src', '../images/error.png');
							}
						});
					});					
				} else if (mode === RUN_TEST_COMMAND) {
					var cp_idx = dataObj.checkpoint;
					var testcase_idx = dataObj.testcase;

					this.runResults[cp_idx][testcase_idx] = json.results[cp_idx][testcase_idx];

					var traceLen = this.runResults[cp_idx][testcase_idx][0].length;
					var result = '';
					if (this.runResults[cp_idx][testcase_idx][0][traceLen-1]["event"] === "return") {
						result = this.runResults[cp_idx][testcase_idx][0][traceLen-1]["stdout"]["__main__"];
					} else if (this.runResults[cp_idx][testcase_idx][0][traceLen-1]["event"] === "exception") {
						result = this.runResults[cp_idx][testcase_idx][0][traceLen-1]["exception_msg"];
					}

					// Update the status image
					var testcaseResImg = $('#case' + cp_idx + '_' + testcase_idx);
					var testcase = this.checkpoints[cp_idx].testCases[testcase_idx];
					if (testcase.want === result) {
						testcaseResImg.attr('src', '../images/success.png');
					} else {
						testcaseResImg.attr('src', '../images/error.png');
					}
				}
				//this.consoleObj.Write(res + '\n', 'jqconsole-output');
			},
			error: (req, status, err) => {
				console.log(err);
			},
			dataType: 'text',
			contentType: 'application/json'
		});		
	}

	//////////////////////////////////////////////////////
	// Handle run requests. There are two modes
	// mode := [RUN_ALL_TESTS_COMMAND | RUN_TEST_COMMAND]
	//////////////////////////////////////////////////////
	handleRunRequest(mode=RUN_ALL_TESTS_COMMAND, checkpoint=-1, testcase=-1) {
		var URL = LAB_URL + '/' + LAB_ID;
		var dataObj = {
			command: mode,
			code: this.editorObj.code,
			checkpoint: checkpoint,
			testcase: testcase,
			language: LAB_LANG
		};
		if (mode === RUN_ALL_TESTS_COMMAND) {
			this.editorStatus.html("Runnig tests ... ");
		} else if (mode === RUN_TEST_COMMAND) {
			this.editorStatus.html("Runnig a single test ... ");
		}

		this.sendRunRequeset(URL, dataObj, mode);
		this.showConsole();
		this.editorStatus.css('display', 'inline');
	}

	//////////////////////////////////////////////////////
	// Run all the test cases
	//////////////////////////////////////////////////////
	addRunAllTestsBtnHandler() {
		this.runAllTestsBtn.on('click', (e) => {
			this.handleRunRequest(RUN_ALL_TESTS_COMMAND);
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

	createDebugTrace(trace) {
		// Take the JSON string data and create it into an array of info
		var executionText = '';
		var executionTraces = [];
		for (let i = 0; i < trace.length; ++i) {
			var orderedGlobals = trace[i]['ordered_globals'];

			if (!orderedGlobals) {
				// Check whether there was an exception
				if (trace[i]['event'] === 'uncaught_exception') {
					executionText += 'Exception<br>';
					executionText += trace[i]['exception_msg'];
				}
			} else {
				if (orderedGlobals.length > 0) {
					executionText += 'Global Frame<br>';
					executionText += '<ul>'
					for (let j = 0; j < orderedGlobals.length; ++j) {
						executionText += '<li>' + orderedGlobals[j] + '</li>';
					}
					executionText += '</ul>'
				}
			}

			var printOutput = trace[i]['stdout'];
			if (printOutput) {
				executionText += 'Print output: ' + printOutput + '<br>';
			}

			var stackElems = trace[i]['stack_to_render'];

			if (!stackElems) {

			} else {
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
			}

			if (executionText !== '') {
				executionTraces.push(executionText);
				executionText = '';
			}
		}

		return executionTraces;
	}

	//////////////////////////////////////////////////////
	// Debugs the entire code 
	//////////////////////////////////////////////////////
	addDebugBtnHandler() {
		this.debugBtn.on('click', (e) => {
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
					this.handleDebugRequest(this.createDebugTrace(JSON.parse(data)['trace']));
				},
				error: (req, status, err) => {
					console.log(err);
				},
				dataType: "text",
				contentType: 'application/json'
			});
		});
	}

	removeMarkersInEditorSelection() {
		var editLine = this.editor.getSelectionRange().start.row;
		// If the edited content's line no. overlaps with any of the lines of the
		// previously created error, remove squiggly lines in those lines
		var idx = 0;
		while (idx < this.prevErrorMarkers.length) {
			var marker = this.prevErrorMarkers[idx];
			if (marker.startLine <= editLine
				&& editLine <= marker.endLine) {
				this.editor.session.removeMarker(marker.id);
				this.prevErrorMarkers.splice(idx, 1);
			} else {
				idx++;
			}
		}		
	}

	addBtnHandlers() {
		this.addRunAllTestsBtnHandler();
		this.addDebugBtnHandler();
		this.addSaveBtnHandler();
	}

	addModalHandlers() {
		this.addModalBackgroundClickHandler();
		this.notificationModalHandler();
		this.loginModalHandler();
		this.signupLinkClickHandler();
		this.loginLinkClickHandler();
		this.addQuestionModalHandler();
		this.addDebugModalHandler();
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

		// If the highlight string was saved before, highlight it
		if (this.debugStr) {
			this.highlightDebugString();
		}

		this.debuggerRangeSlider.on('slide', (event, ui) => {
			this.debuggerRangeSliderSpan.text(
				this.createDebuggerSpanText(ui.value, this.debuggerRangeSlider.slider('option', 'max'))
			);
			this.debuggerViewDiv.html(this.debugTraces[ui.value - 1]);

			if (this.isDebugStrHighlighted) {
				this.highlightDebugString();
			}
		});

		this.debuggerRangeSliderSpan.text(
			this.createDebuggerSpanText(0, 0)
		);
	}

	//////////////////////////////////////////////////////
	// Initializes the testcase results array
	// for use later
	//////////////////////////////////////////////////////
	initializeResultsArray() {
		// Can be run only after this.checkpoints are initialized
		this.checkpoints.forEach((cp, cp_i) => {
			this.runResults[cp_i] = [];
			cp.testCases.forEach((testcase, tc_i) => {
				this.runResults[cp_i][tc_i] = [];
			});
		});
	}

	initStatus() {
		if (USER_NAME) {
			var URL = LAB_URL + '/' + LAB_ID;
			var dataObj = {
				command: GET_STATUS_COMMAND,
				userName: USER_NAME
			};
			$.post({
				url: URL,
				data: JSON.stringify(dataObj),
				success: (data) => {
					if (data.ok) {
						this.checkpoints = data.checkpoints;

						// Initializing the results array with appropriate dimensions
						this.initializeResultsArray();

						this.userData = data.userData;
						this.editorObj.code = data.userData.code;
						// TODO: Why creating a new object everytime?
						//var testParser = new TestParser(this.userData.code);
						//var parsedObj = testParser.parse();
						//this.editorObj.code = parsedObj.code; // inject the last saved code w/o test cases
						
						// Console status initialization
						this.consoleObj.Write(this.userData.console.content, 'jqconsole-output');
						this.consoleObj.SetHistory(this.userData.console.history);

						// Debugger status initialization
						this.debugTraces = this.userData.debugger.debugTraces;
						this.debugStr = this.userData.debugger.highlightedStr;
						this.isDebugStrHighlighted = (this.debugStr !== '');

						// Add interaction (click) handlers. Added once the POST request
						// returns here, since it uses member variables that get set
						// with the request response
						this.addDoubleClickHandler();
					}
				},
				error: (req, status, err) => {
					console.log(err);
				},
				contentType: 'application/json'
			});
		}
	}

	addDoubleClickHandler() {
		function findFooLineNumber(editor, foo) {
			return editor.find(foo, {
				wrap: true,
				caseSensitive: true,
				wholeWord: true,
				preventScroll: true // do not change selection
			});
		}

		function moveEditorCursor(editor, range) {
			var row = range.start.row;
			editor.resize(true);
			editor.scrollToLine(row+1, true, true, () => {});
			editor.gotoLine(row+1, 0, true);
		}

		$('#labdoc-html-div').on('dblclick', (e) => {
			moveEditorCursor(this.editorObj.editor, {start: {row: 0, column: 0}, end: {row: 0, column: 0}});
		});

		$('div[id^="checkpoint-html-div"]').each((idx, el) => {
			$(el).on('dblclick', (e) => {
				var checkpointName = this.checkpoints[idx].name.split('.')[1];
				var searchStr = 'def ' + checkpointName;
				var range = findFooLineNumber(this.editorObj.editor, searchStr);

				if (!range) {
					return this.postWarningNotificationModal(
						{msg:
							'Function ' +
							'<i>' + checkpointName + '</i>' +
							' does not seem to exist.' +
							'<br>' +
							'Why don\'t you create one?' +
							'<br>' +
							'<b>' + 'def ' + checkpointName + '(...)' + '</b>'
						});
				}
				moveEditorCursor(this.editorObj.editor, range);
			});
		});

		$('div[id^="testcase-html-div"]').each((idx, el) => {
			$(el).on('dblclick', (e) => {
				var nums = el.id.split('testcase-html-div')[1].split('_');
				var checkpointNum = nums[0];
				var testcaseNum = nums[1];
				var checkpointName = this.checkpoints[checkpointNum].name.split('.')[1];
				var searchStr = 'def ' + checkpointName;
				var range = findFooLineNumber(this.editorObj.editor, searchStr);

				if (!range) {
					return this.postWarningNotificationModal(
						{msg:
							'Function ' +
							'<i>' + checkpointName + '</i>' +
							' does not seem to exist.' +
							'<br>' +
							'Why don\'t you create one?' +
							'<br>' +
							'<b>' + 'def ' + checkpointName + '(...)' + '</b>'
						});
				}
				moveEditorCursor(this.editorObj.editor, range);
			});
		});
	}

	//////////////////////////////////////////////////////
	// Context Menu Related
	//////////////////////////////////////////////////////
	collectContextMenu() {
		this.contextMenuWithDebug = $('#context-menu-with-debug');
		this.contextMenuWithDebugHighlight = $("#context-menu-with-debug-highlight");
	}

	collectQuestionModal() {
		// TODO: Check if i matches with the index included in the identifier of el
		this.questionModal = 
		{
			questionModal: $('#question-modal'), 						// the modal itself
			questionModalCheckpoint: $('#question-modal-checkpoint'), 	// user-facing checkpoint
			questionModalTestCases: $('#question-modal-testcases'), 	// user-facing test case results (to reassure
																		// them that they're asking a question for 
																		// the right testcase)
			questionModalCode: $('#question-modal-code'), 				// selected code block from the editor
			questionModalText: $('#question-modal-text'), 				// question text
			questionModalStatus: $('#question-modal-status'),
			questionModalSubmitBtn: $('#question-modal-submit-btn'), 	// the quesiton submit button
			questionModalCloseBtn: $('#question-modal-close') 			// the close button
		};
	}

	highlightBackdrop(testcaseHTMLDiv) {
		if (!testcaseHTMLDiv) return;
		testcaseHTMLDiv.setAttribute('style', 'background-color: rgba(255,255,0,0.2)');
	}

	dehighlightBackdrop(testcaseHTMLDiv) {
		if (!testcaseHTMLDiv) return;
		testcaseHTMLDiv.setAttribute('style', 'background-color: rgb(255,255,255)');
	}

	parseIDsFromDiv(div) {
		// div is not a jquery object
		var idStr = div.id;
		var handle = 'testcase-html-div';
		var ids = idStr.slice(handle.length).split(/_/);

		if (ids.length !== 2) { return null; } // ill-formed ID
		return {checkpoint: ids[0], testcase: ids[1]};
	}

	addContextListener() {
		/* IE >= 9 */
		document.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			// Prevent any pre-existing visual cues (if any)
			this.toggleContextMenuOff();
			this.dehighlightBackdrop(this.prevTestcaseHTMLDiv);
			var parentTestcaseHTMLDivArray = $(e.target).parents('div[id^="testcase-html-div"]');
			if (parentTestcaseHTMLDivArray.length !== 0) {
				// Dehighlight the previous selection from a click
				// Choose the closest parent from the parent selection above
				var testcaseHTMLDiv = parentTestcaseHTMLDivArray[0];

				// Highlight the new selection
				this.highlightBackdrop(testcaseHTMLDiv);

				// Update the previous selection with the new selection
				this.prevTestcaseHTMLDiv = testcaseHTMLDiv;

				// Extract the clicked menu IDs (e.g. checkpoint and testcase ID)
				this.menuClickID = this.parseIDsFromDiv(testcaseHTMLDiv);

				// Show the context menu
				this.toggleContextMenuWithDebugOn();
			} else {
				this.togglecontextMenuWithDebugHighlightOn();
			}
			this.positionMenu(e);
		});

		document.addEventListener("click", (e) => {
			var button = e.which || e.button;
			if (button === 1) {
				this.toggleContextMenuOff();
				this.dehighlightBackdrop(this.prevTestcaseHTMLDiv);
				if (e.target.id === this.askQuestionMenuID || e.target.id === this.askQuestionMenuIDDebug) {
					var codeBlock = this.editor.getSession().doc.getTextRange(this.editor.selection.getRange());
					this.showQuestionModal(codeBlock);
				} else if (e.target.id === this.viewHintMenuID || e.target.id === this.viewHintMenuIDDebug) {
					// TODO: implement me ...
				} else if (e.target.id === this.debugMenuID) {
					this.handleDebugRequest();
				} else if (e.target.id === this.runTestcaseID) {
					this.handleRunRequest(RUN_TEST_COMMAND, this.menuClickID.checkpoint, this.menuClickID.testcase);
				} else if (e.target.id === this.debugHighlightMenuID) {
					this.populateDebugFuzzySelectionView();				
					this.highlightDebugString();
				} else if (e.target.id === this.debugDehighlightMenuID) {
					this.dehighlightDebugString();
				} else if (e.target.id === this.visualDebugMenuID) {

				}
			} else {
				this.toggleContextOff();
				// TODO: Turn off the highlight as well?
			}
			return true;
		});
	}

	addKeyUpListner() {
		// Remove the context menu on pressing the ESC key
		window.onkeyup = (e) => {
			if (e.keyCode === 27) {
				// Close the context menu
				this.toggleContextMenuOff();

				// Close the question modal
				this.hideQuestionModal();

				// Close the debug modal
				this.hideDebugModal();

				// Remove the testcase div highlighting too, as the selection is withdrawn
				this.dehighlightBackdrop(this.prevTestcaseHTMLDiv);
			}
		};
	}

	toggleContextMenuWithDebugOn() {
		if (!this.isContextMenuVisible) {
			this.isContextMenuVisible = true;
			this.contextMenuWithDebug.addClass(this.activeClassName);
		}
	}

	togglecontextMenuWithDebugHighlightOn() {
		if (!this.isContextMenuVisible) {
			this.isContextMenuVisible = true;

			// Debug highlight is possible only when the code is runnable (free of syntax errors)
			if (this.prevSyntaxErrorRanges.length !== 0) {
				this.hideDebugHighlightMenu();
				this.hideDebugDehighlightMenu();
			} else {
				if (this.isDebugStrHighlighted) {
					this.hideDebugHighlightMenu();
					this.showDebugDehighlightMenu();
				} else {
					this.showDebugHighlightMenu();
					this.hideDebugDehighlightMenu();
				}
			}
			this.contextMenuWithDebugHighlight.addClass(this.activeClassName);
		}
	}

	toggleContextMenuOff() {
		if (this.isContextMenuVisible) {
			this.isContextMenuVisible = false;
			this.contextMenuWithDebug.removeClass(this.activeClassName);
			this.contextMenuWithDebugHighlight.removeClass(this.activeClassName);
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

		var contextMenuWithDebugWidth = this.contextMenuWithDebug.width() + 4;
		var contextMenuWithDebugHeight = this.contextMenuWithDebug.height() + 4;

		var contextMenuWithDebugHighlightWidth = this.contextMenuWithDebugHighlight.width() + 4;
		var contextMenuWithDebugHighlightHeight = this.contextMenuWithDebugHighlight.height() + 4;

		this.windowWidth = window.innerWidth;
		this.windowHeight = window.innerHeight;

		var styleStr = '';
		var styleStrDebugHighlight = '';

		if ((this.windowWidth - this.clickCoordsX) < contextMenuWithDebugWidth) {
			styleStr += "left: " + (this.windowWidth - contextMenuWithDebugWidth) + "px;";
		} else {
			styleStr += "left: " + this.clickCoordsX + "px;";
		}

		if ((this.windowHeight - this.clickCoordsY) < contextMenuWithDebugHeight) {
			styleStr += "top: " + (this.windowHeight - contextMenuWithDebugHeight) + "px;";
		} else {
			styleStr += "top: " + this.clickCoordsY + "px;";
		}

		if ((this.windowWidth - this.clickCoordsX) < contextMenuWithDebugHighlightWidth) {
			styleStrDebugHighlight += "left: " + (this.windowWidth - contextMenuWithDebugHighlightWidth) + "px;";
		} else {
			styleStrDebugHighlight += "left: " + this.clickCoordsX + "px;";
		}

		if ((this.windowHeight - this.clickCoordsY) < contextMenuWithDebugHighlightHeight) {
			styleStrDebugHighlight += "top: " + (this.windowHeight - contextMenuWithDebugHighlightHeight) + "px;";
		} else {
			styleStrDebugHighlight += "top: " + this.clickCoordsY + "px;";
		}

		this.contextMenuWithDebug.attr("style", styleStr);
		this.contextMenuWithDebugHighlight.attr("style", styleStrDebugHighlight);
	}

	addQuestionModalHandler() {
		// Submit button handling
		this.questionModal.questionModalSubmitBtn.on("click", (e) => {
			// Assumes that the user selected an appropriate block of code
			var data = {
				command: QUESTION_COMMAND,
				question: this.questionModal.questionModalText.val(),
				checkpoint: this.menuClickID.checkpoint,
				testcase: this.menuClickID.testcase,
				userName: USER_NAME,
				language: LAB_LANG,
				code: this.questionModal.questionModalCode.text()
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
					this.hideQuestionModal();
				},
				error: (req, status, err) => {
					console.log(err);
				},
				dataType: "json",
				contentType: "application/json"
			});
		});

		// Close button handling
		this.questionModal.questionModalCloseBtn.on("click", (e) => {
			this.hideQuestionModal();
		});
	}

	addDebugModalHandler() {
		this.debugModalClose.on('click', (e) => {
			this.hideDebugModal();
		});

		this.debugModalOkBtn.on('click', (e) => {
			this.hideDebugModal();
		});
	}

	//////////////////////////////////////////////////////
	// Debouncing and code auto save related functions
	//	Dependencies:
	//	- jQuery (included)
	//	- jQuery doTimeout (included) 
	//    benalman.com/projects/jquery-dotimeout-plugin/
	//	- diff-match-patch (included)
	//    code.google.com/p/google-diff-match-patch/
	//	- Ace (check out from GitHub into pwd)
	//    github.com/ajaxorg/ace-builds
	//////////////////////////////////////////////////////
	addContentChangeHandler() {
		function snapshotDiff(self) {
			var newText = self.editor.getValue();
			var timestamp = new Date().getTime();

			if (self.curText != newText) {
				/*
				The two key function calls here are diff_main followed by diff_toDelta
				Each 'd' field is in the following format:
				http://downloads.jahia.com/downloads/jahia/jahia6.6.1/jahia-root-6.6.1.0-aggregate-javadoc/name/fraser/neil/plaintext/DiffMatchPatch.html#diff_toDelta(java.util.LinkedList)
				Crush the diff into an encoded string which describes the operations
				required to transform text1 into text2. E.g. =3\t-2\t+ing -> Keep 3
				chars, delete 2 chars, insert 'ing'. Operations are tab-separated.
				Inserted text is escaped using %xx notation.
				*/
				var delta = {
					t: timestamp,
					d: self.dmp.diff_toDelta(self.dmp.diff_main(self.curText, newText))
				};
				self.sendCodeEditSaveRequest(delta);
				self.curText = newText;
		  	}
		}

		this.editor.on('change', (e) => {
			// Remove the syntax error squiggly lines
			this.removeMarkersInEditorSelection();

			// Debouncing and auto saving
			if (this.DEBOUNCE_MS > 0) {
				$.doTimeout('editorChange', this.DEBOUNCE_MS, () => { snapshotDiff(this); });
			} else {
				snapshotDiff(this);
			}
		});
	}

	sendCodeEditSaveRequest(delta) {
		var data = {
			command: CODE_EDIT_SAVE_COMMAND,
			userName: USER_NAME,
			delta: delta,
			code: this.editor.getValue()
		};
		var URL = LAB_URL + "/" + LAB_ID;
		$.post(
		{
			url: URL,
			data: JSON.stringify(data),
			success: (data) => {
				console.log(data);
				// Set gutter highlight to indicate syntax error
				this.highlightSyntaxErrors(data.syntaxErrorRanges);

				// Yellow out the functions that are commented out
				this.colorCommentedOutFunctions(data.commentedFuncRanges);
			},
			error: (req, status, err) => {
				console.log(err);
			},
			dataType: "json",
			contentType: "application/json"
		});
	}
}

class EditorController {
	constructor() {
		this.lab = new Lab();
	}
}

$(document).ready(function() {
	var editorCtrl = new EditorController();
});

