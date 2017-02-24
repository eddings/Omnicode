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
		this.consoleID = '#console';
		this.console = $(this.consoleID);
		this.consoleObj = null;
		this.consoleClearID = '#console-clear';
		this.consoleClear = $(this.consoleClearID);

		// Debugger
		this.debuggerViewDiv = $('#debugger-view-div');
		this.debuggerRangeSlider = $('#debugger-range-slider');
		this.debuggerRangeSliderSpan = $('#debugger-range-slider-span');
		this.debugTraces = [];
		this.debugStr = '';
		this.debugStrLoc = {};

		// Visual Debugger
		this.visualDebuggerViewDivID = '#visual-debugger-view-div';
		this.visualDebuggerViewDiv = $(this.visualDebuggerViewDivID);
		this.graphicViewDivID = "#graphic-view-div";
		this.tabularViewDivID = "#tabular-view-div";

		this.elements = {};
		this.elements[this.visualDebuggerViewDivID] = this.visualDebuggerViewDiv;
		this.elements[this.consoleID] = this.console;
		this.elements[this.consoleClearID] = this.consoleClear;

		// Tabs
		this.tabs = $("#tabs");

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
		this.saveTestcaseMenuID = "menu-testcase-save";
		// Without debugging
		this.viewHintMenuID = "menu-view-a-hint";
		this.askQuestionMenuID = "menu-ask-a-question";
		this.highlightOnSelectionMenuID = "menu-highlight-data";
		this.dehighlightOnSelectionMenuID = "menu-dehighlight-data";

		this.menuClickID = {checkpoint: -1, testcase: -1};

		// Debouncing and code auto save
		this.dmp = new diff_match_patch();
		this.DEBOUNCE_MS = 3000;// milliseconds of debouncing (i.e., 'clustering' a
								// rapid series of edit actions as a single diff)
								// set to 'null' for no debouncing
		this.curText = '';

		// Visible Testcase indices
		this.visibleTestcaseIdx = [];

		// History
		this.history = [];
		this.currentHistSelection = -1;

		// Visualization
		this.historySVGDivs = [];
		this.historySVGs = [];
		this.debugData = [];
		this.isHighlightStrSelected = false;

		// Code line highlights for point selection in the vis
		this.prevHighlightedCodeLines = [];

		// Mouse-up event 
		this.isMouseupHighlightedLineIndices = [];
		this.isMouseupHighlighted = false;

		// To separate the first initialization call
		//this.initialized = false;

		this.init();
	}

	collectQuestionBtns() {
		$("button[id$='-question-btn']").each((i, el) => {
			this.questionBtns.push($(el));
		});
	}

	initTabs() {
		this.tabs.tabs();
	}

	// Dedup; this code is from author.js (public javascript)
	addTestcaseClickEvent() {
		$("a[id^='testcase-link']").each((i, el) => {
			$(el).on("click", (e) => {
				e.preventDefault();
				// Remove previously selected element's visual indication
				$("#testcase-link" + this.menuClickID.checkpoint + "-" + this.menuClickID.testcase).css("text-decoration", "none");

				// Show some visual indication of "this" element being selected
				$(el).css("text-decoration", "underline");

				var nums = $(el).attr("id").split("testcase-link")[1].split("-");
				var cp_idx = nums[0];
				var tc_idx = nums[1];

				this.menuClickID = {checkpoint: cp_idx, testcase: tc_idx};

				// Hide the previously shown history of another testcase
				if (this.visibleTestcaseIdx.length === 2) {
					var hideID = "testcase-body" + this.visibleTestcaseIdx[0] + "-" + this.visibleTestcaseIdx[1];
					$("#" + hideID).attr("style", "display: none;");
				}

				// Show the new history & store the current index of the history
				var id = "testcase-body" + cp_idx + "-" + tc_idx;
				$("#" + id).attr("style", "display: block;");
				this.visibleTestcaseIdx = [cp_idx, tc_idx];
				this.showHistory(cp_idx, tc_idx);

				// Run this testcase
				this.handleRunRequest(RUN_TEST_COMMAND, cp_idx, tc_idx);
			});
		});
	}

	addCreateCustomVisBtnHandler() {
		$("button[id^='user-defined-vis-open-btn']").each((i, el) => {
			$(el).on("click", (e) => {
				e.preventDefault();
				var nums = $(el).attr("id").split("user-defined-vis-open-btn")[1].split("-");
				var cp_idx = nums[0];
				var tc_idx = nums[1];

				var xInputID = "x-var-input" + cp_idx + "-" + tc_idx;
				var yInputID = "y-var-input" + cp_idx + "-" + tc_idx;

				var xVarName = $("#" + xInputID).val();
				var yVarName = $("#" + yInputID).val();
				if (xVarName !== "" && yVarName !== "") {
					this.createCustomVis(cp_idx, tc_idx, [xVarName, yVarName]);

					// Show the close-the-vis button
					$("#custom-vis-close" + cp_idx + "-" + tc_idx).css("display", "block");

					// Show the vis pane
					$("#user-defined-vis-div" + cp_idx + "-" + tc_idx).css("display", "block");

					// Add the close-the-vis button click handler
					$("#custom-vis-close" + cp_idx + "-" + tc_idx).on("click", (e) => {
						e.preventDefault();
						var nums = $(el).attr("id").split("user-defined-vis-open-btn")[1].split("-");
						var cp_idx = nums[0];
						var tc_idx = nums[1];

						// Hide the created custom vis
						$("#user-defined-vis-div" + cp_idx + "-" + tc_idx).css("display", "none");
						// Hide the close button
						$("#custom-vis-close" + cp_idx + "-" + tc_idx).css("display", "none");
					});
				} else {
					$("#input-status" + cp_idx + "-" + tc_idx).html("Type in the variable names");
				}
			});
		});
	}

	init() {
		this.initTabs();
		this.addTestcaseClickEvent();
		this.addCreateCustomVisBtnHandler();

		this.collectQuestionBtns();
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

		// Add mouseup listener
		this.addMouseupListener();

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

	showHighlightMenu() {
		$("#" + this.highlightOnSelectionMenuID).css("display", "block");
	}

	hideHighlightMenu() {
		$("#" + this.highlightOnSelectionMenuID).css("display", "none");
	}

	showDehighlightMenu() {
		$("#" + this.dehighlightOnSelectionMenuID).css("display", "block");
	}

	hideDehighlightMenu() {
		$("#" + this.dehighlightOnSelectionMenuID).css("display", "none");
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

	highlightErrorGutters(errorRanges) {
		var errorIndicationStyle = 'redGutter';

		// Remove previous gutter highlights (squiggly lines are removed when the editor content is changed)
		//this.prevSyntaxErrorRanges.forEach((range, idx) => {
		//	this.editor.session.removeGutterDecoration(range.start.row, errorIndicationStyle);
		//});

		// Add new gutter highlights
		errorRanges.forEach((range, idx) => {
			this.editor.session.addGutterDecoration(range.start.row, errorIndicationStyle);
		});
	}

	addSquigglyLines(errorRanges) {
		errorRanges.forEach((range, idx) => {
			this.prevErrorMarkers.push(
				{
					id: this.editor.session.addMarker(
						new Range(range.start.row, range.start.column, range.end.row, range.end.column),
						"syntaxErrorHighlight",
						"text"),
					startLine: range.start.row,
					endLine: range.end.row
				}
			);
		});
	}
	////////////////////////////////////
	// Highlight all the syntax errors
	////////////////////////////////////
	highlightSyntaxErrors(errorRanges) {
		this.highlightErrorGutters(errorRanges);
		this.addSquigglyLines(errorRanges);
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
		//this.prevCommentRows.forEach((row, idx) => {
		//	this.editor.session.removeGutterDecoration(row, commentIndicationStyle);
		//});

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

	////////////////////////////////////////////
	// Hides or shows a jquery element given the
	// ID
	////////////////////////////////////////////
	view(elementID, command = 'show') {
		var elem = this.elements[elementID];
		if (elem) {
			if (command === 'show') {
				elem.css('display', 'block');	
			} else if (command === 'hide') {
				elem.css('display', 'none');
			}
		}
	}

	/////////////////////////////////////////////////////
	// Add button click handlers for the visualization
	// div
	/////////////////////////////////////////////////////
	addVisBtnHandlers() {
		var visualDebuggerViewDivID = 'visual-debugger-view-div';
		var graphicViewDivID = 'graphic-view-div';
		var closeBtnID = 'vis-close';

		$('#' + closeBtnID).on('click', (e) => {
			e.preventDefault();
			$('#' + visualDebuggerViewDivID).remove();
		});
	}

	/////////////////////////////////////////////////////
	// Insert and reserve space for the visual debugger
	// pane
	/////////////////////////////////////////////////////
	insertVisualDebuggerViewDiv(checkpoint, testcase, varPairsLen) {
		// Remove the previously existing #visual-debugger-view-div
		if ($('#visual-debugger-view-div')) { $('#visual-debugger-view-div').remove(); }

		var testcaseHTMLDivID = '#testcase-html-div' + checkpoint + '_' + testcase;
		var testcaseHTMLDiv = $(testcaseHTMLDivID);
		var html = '<div id="visual-debugger-view-div">\
						<span class="vis-close" id="vis-close">&times;</span>\
						<div class="container" id="graphic-view-div"></div>\
					</div>';
		testcaseHTMLDiv.append(html);
		
		html = '<div class="row" style="inline-block;">\
					<div class="col-6" id="whole-vis-div">\
					</div>\
				</div>';
		$('#graphic-view-div').append(html);

		html = '<div class="row" style="inline-block;">\
					<div class="col-12" id="cross-vis-div">\
					</div>\
				</div>';
		$('#graphic-view-div').append(html);

		// Add close button interactivity
		this.addVisBtnHandlers();
	}

	/////////////////////////////////////////
	// Create a data object for visualization
	/////////////////////////////////////////
	createDebugVizData(trace) {
		var dataArray = [];
		var localVarNames = new Set();
		trace.forEach((t, i) => {
			var orderedGlobals = t['ordered_globals'];
			if (!orderedGlobals) {
				if (t['event'] === 'uncaught_exception') {
					return dataArray;
				}
			}

			var stackFs = t['stack_to_render']; // Array of stack frames to render
			if (stackFs) {
				stackFs.forEach((f, j) => {
					var encodedLocalNames = Object.keys(f['encoded_locals']);
					var stackObj = {};
					encodedLocalNames.forEach((name, k) => {
						var obj = {};
						if (!isNaN(f['encoded_locals'][name])) {
							obj['@value'] = f['encoded_locals'][name];
							obj['@name'] = name;
							stackObj[name] = f['encoded_locals'][name];
							localVarNames.add(name);
						}
						obj['@execution_step'] = i;
						obj['@executed_code'] = this.editor.session.getLine(t['line'] - 1);
						obj['@line number'] = t['line'];
						dataArray.push(obj); // each local variable found is stored as an object that
											 // contains @value and @name fields
					});
					stackObj['@execution_step'] = i;
					stackObj['@executed_code'] = this.editor.session.getLine(t['line'] - 1);
					stackObj['@line number'] = t['line'];
					dataArray.push(stackObj); // all of local variables found are stored together in
										 	  // an object
				});
			}
		});
		return {dataArray: dataArray, localVarNames: localVarNames};
	}

	cross(a, b) {
	  var c = [], n = a.length, m = b.length, i, j;
	  for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
	  return c;
	}

	exclusiveCross(a, b) {
		return [{x: a[0], i: 0, y: b[0], j: 0}];
	}

	//////////////////////////////////////
	// Creates a custom visualization
	// using the debug data stored and
	// x- and y-axis variable names
	//////////////////////////////////////
	createCustomVis(cp_idx, tc_idx, varNames) {
		var data = this.debugData.dataArray;
		var varData = Array.from(this.debugData.localVarNames);
		varData.push("@line number");
		varData.push("@execution_step");

		var padding = 20,
			width = 300,
			height = 300;

		var x = d3.scale.linear()
		    .range([padding / 2, width - padding / 2]);

		var y = d3.scale.linear()
		    .range([height - padding / 2, padding / 2]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom")
		    .ticks(6);

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left")
		    .ticks(6);

		var domainByVarName = {};
		varNames.forEach(function (name) {
			var tmpDomain = d3.extent(data, function(d) { return d[name]; });
			if (tmpDomain[0] === tmpDomain[1]) { // If there's only value in the domain, extend it
												 // by including its -1 and +1 values
				domainByVarName[name] = [tmpDomain[0] - 1, tmpDomain[1] + 1];
			} else {
				domainByVarName[name] = tmpDomain;
			}
		});

		// Remove the old SVG
		d3.select("#user-defined-vis-div-svg" + cp_idx + "-" + tc_idx).remove();

		// Create a new one
		var svg = d3.select("#user-defined-vis-div" + cp_idx + "-" + tc_idx)
				    .append("svg")
				    .attr("id", () => { return "user-defined-vis-div-svg" + cp_idx + "-" + tc_idx; })
					.attr("width", width + 2 * padding)
					.attr("height", height + 2 * padding)
					.attr("transform", function(d, i) { return "translate(" + padding + "," + padding +")"; });

		// Clear the previously-active brush, if any.
		function brushstart(p) {
			if (brushCell !== this) {
				d3.select(brushCell).call(brush.clear());		
				x.domain(domainByVarName[p.x]);		
				y.domain(domainByVarName[p.y]);		
				brushCell = this;		
			}
		}

		var brush = d3.svg.brush()		
		    .x(x)		
		    .y(y)		
		    .on("brushstart", brushstart)
		    .on("brush", (p) => { // Highlight the selected circles.
				var e = brush.extent();
				var brushedCircleLines = new Set();
				svg.selectAll("circle").classed("hidden", function(d) {
					if (e[0][0] > d[p.x] || d[p.x] > e[1][0]
					|| e[0][1] > d[p.y] || d[p.y] > e[1][1]) {
						return true;
					}

					brushedCircleLines.add(d["@line number"])
					return false;
				});

				this.removeMouseupGutterHighlights();
				this.highlightCodeLines(Array.from(brushedCircleLines));
		    })
		    .on("brushend", () => { // If the brush is empty, select all circles.
		    	if (brush.empty()) {
		    		svg.selectAll(".hidden").classed("hidden", false);
		    		this.removeMouseupGutterHighlights();
		    		this.dehighlightPrevCodeLinesInDiffView();
		    	}
		    });

		svg.selectAll(".x.axis")
			.data([varNames[0]]) // x var
		.enter().append("g")
			.attr("class", "x axis")
			.attr("transform", function(d, i) { return "translate(0," + height + ")"; })
			.each(function(d) { x.domain(domainByVarName[d]); d3.select(this).call(xAxis); });

		svg.selectAll(".y.axis")
			.data([varNames[1]]) // y var
		.enter().append("g")
			.attr("class", "y axis")
			.attr("transform", function(d, i) { return "translate(" + padding + ",0)"; })
			.each(function(d) { y.domain(domainByVarName[d]); d3.select(this).call(yAxis); });

		var cell = svg.selectAll(".cell")
			.data(this.exclusiveCross(varNames, varNames))
		.enter().append("g")
			.attr("class", "cell")
			.attr("transform", function(d, i) { return "translate(" + padding + ",0)"; })

		var xVar = varNames[0];
		var yVar = varNames[1];
		cell.call(brush); // add brushing
		cell.each(plot); // draw chart -- !important: this should be placed after the brush call
		cell.selectAll("circle")
		    .on("mouseover", function() {
		    	return tooltip.style("visibility", "visible");
		    })
	  		.on("mousemove", (d) => {
	  			var cell = d3.select(this);
	  			var coordinates = d3.mouse(svg.node()); // position relative to the svg element
	  			
	  			tooltip.html("<p><strong>" + xVar + ": " + d[xVar] + "</strong></p><p><strong>" + yVar + ": " + (d[yVar] + 1) + "</strong></p>");

	  			this.removeMouseupGutterHighlights();
	  			this.highlightCodeLines([d["@line number"]]);

	  			return tooltip.style("top", (coordinates[1] + 500) + "px")
	  						  .style("left", coordinates[0] + "px");
	  		})
	  		.on("mouseout", () => {
	  			this.removeMouseupGutterHighlights();
	  			return tooltip.style("visibility", "hidden");
	  		});

		var svgContainer = d3.select("#user-defined-vis-div" + cp_idx + "-" + tc_idx);
		var tooltip = svgContainer.append("div")
							  		.style("position", "absolute")
							  		.style("z-index", "1001")
							  		.style("visibility", "hidden");

		var brushCell;

		function plot(p) {
			var cell = d3.select(this);

			x.domain(domainByVarName[p.x]);
			y.domain(domainByVarName[p.y]);

			cell.append("rect")
			    .attr("class", "frame")
			    .attr("x", padding / 2)
			    .attr("y", padding / 2)
			    .attr("width", width - padding)
			    .attr("height", height - padding)
			    .style("pointer-events", "none");

			cell.selectAll("circle")
			    .data(data)
			  .enter().append("circle")
			  .filter(function(d) { return d[p.x] && d[p.y]; })
			    .attr("cx", function(d) { return x(d[p.x]); })
			    .attr("cy", function(d) { return y(d[p.y]); })
			    .attr("r", 2)
			    .style("fill", d3.rgb(255,127,80,0.2));
		}
	}

	//////////////////////////////////////
	// Create the scatterplot matrix vis
	//////////////////////////////////////
	createVis(debugData, otherDebugData, cp_idx, tc_idx) {
		// Deep copy object arrays. Transform it to
		// be able to differentiate between the current
		// run's and the other run's data
		var dataArr1 = debugData.dataArray.map((el, i) => {
			return JSON.parse(JSON.stringify(el));
		});
		var dataArr2 = otherDebugData.dataArray.map((el, i) => {
			return JSON.parse(JSON.stringify(el));
		});

		var data1 = dataArr1.map((el, i) => {
			if (el["@current"] === undefined) el["@current"] = true;
			return el;
		});
		var data2 = dataArr2.map((el, i) => {
			if (el["@current"] === undefined) el["@current"] = false;
			return el;
		});

		// Trick to maintain the color saliency of rendering; if we have
		// the display of data of another run overlaid, we want to maintain
		// the color mapping of (blue: another run result, orange: this run result)
		//var data = data2.concat(data1);
		var data = data2.concat(data1);

		// If the student changed the variable names...
		var varDataSet1 = debugData.localVarNames;
		var varDataSet2 = otherDebugData.localVarNames;
		var varData = Array.from(new Set(function*() { yield* varDataSet1; yield* varDataSet2; }()));
		varData.push("@line number");
		varData.push("@execution_step");

		var width = 780,
			height = 780,
			padding = 20,
		    size = (width - 2 * padding) / varData.length;
		
		var x = d3.scale.linear()
		    .range([padding / 2, size - padding / 2]);

		var y = d3.scale.linear()
		    .range([size - padding / 2, padding / 2]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom")
		    .ticks(6);

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left")
		    .ticks(6);

		var color = d3.scale.category10();

		var domainByVarName = {},
			varNames = d3.values(varData),
			n = varData.length;

		varData.forEach(function (name) {
			var tmpDomain = d3.extent(data, function(d) { return d[name]; });
			if (tmpDomain[0] === tmpDomain[1]) { // If there's only value in the domain, extend it
												 // by including its -1 and +1 values
				domainByVarName[name] = [tmpDomain[0] - 1, tmpDomain[1] + 1];
			} else {
				domainByVarName[name] = tmpDomain;
			}
		});

		xAxis.tickSize(size * n);
		yAxis.tickSize(-size * n);
		
		// Remove the old SVG
		d3.select("#cross-vis-div-svg" + cp_idx + "-" + tc_idx).remove();

		// Create a new one
		var svg = d3.select("#cross-vis-div" + cp_idx + "-" + tc_idx)
				    .append("svg")
				    .attr("id", () => { return "cross-vis-div-svg" + cp_idx + "-" + tc_idx; })
					.attr("width", width)
					.attr("height", height)
					.append("g")
					.attr("transform", "translate(" + padding + "," + padding + ")");

		var brush = d3.svg.brush()		
		    .x(x)		
		    .y(y)		
		    .on("brushstart", brushstart)
		    .on("brush", (p) => { // Highlight the selected circles.
				var e = brush.extent();
				var brushedCircleLines1 = new Set();
				var brushedCircleLines2 = new Set();
				svg.selectAll("circle").classed("hidden", function(d) {
					// NOTE: e[0][0] = x0, e[0][1] = y0, e[1][0] = x1, e[1][1] = y1,
					// where [x0, y0] is the top-left corner
					// and [x1, y1] is the bottom-right corner
					if (e[0][0] > d[p.x] || d[p.x] > e[1][0]
					|| e[0][1] > d[p.y] || d[p.y] > e[1][1]) {
						// Hide the circles
						return true;
					}

					d["@current"] ? brushedCircleLines1.add(d["@line number"])
								  : brushedCircleLines2.add(d["@line number"]);
					return false;
				});

				this.removeMouseupGutterHighlights();
				this.highlightCodeLines(Array.from(brushedCircleLines1));
				this.highlightCodeLinesInDiffView(Array.from(brushedCircleLines2));
		    })
		    .on("brushend", () => { // If the brush is empty, select all circles.
		    	if (brush.empty()) {
		    		svg.selectAll(".hidden").classed("hidden", false);
		    		this.removeMouseupGutterHighlights();
		    		this.dehighlightPrevCodeLinesInDiffView();
		    	}
		    });

		svg.selectAll(".x.axis")
			.data(varNames)
		.enter().append("g")
			.attr("class", "x axis")
			.attr("transform", function(d,i) { return "translate(" + (n - i - 1) * size + ",0)"; })
			.each(function(d) { x.domain(domainByVarName[d]); d3.select(this).call(xAxis); });

		svg.selectAll(".y.axis")
			.data(varNames)
		.enter().append("g")
			.attr("class", "y axis")
			.attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
			.each(function(d) { y.domain(domainByVarName[d]); d3.select(this).call(yAxis); });

		var cell = svg.selectAll(".cell")
					.data(this.cross(varNames, varNames))
				.enter().append("g")
					.filter(function(d) { return d.i > d.j; })
					.attr("class", "cell")
					.attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; });

		// y axis labels
		cell.filter(function(d) { console.log(d.i, d.j); return (d.i - d.j) === 1; })
			.append("text")
			.attr("x", function(d, i) { return d.i * size + padding; })
			.attr("y", function(d, i) { return size / 2; })
			.attr("dy", ".71em")
			.text(function(d) { return d.y; });

		// x axis labels
		cell.filter(function(d) { return (d.i - d.j) === 1; })
			.append("text")
			.attr("x", function(d, i) { return padding; })
			.attr("y", function(d, i) { return (n - 1 - d.j) * size + padding; })
			.attr("dy", ".71em")
			.text(function(d) { return d.x; });

		cell.call(brush);
		cell.each(plot);
		cell.selectAll("circle")
		    .on("mouseover", function() {
		    	return tooltip.style("visibility", "visible");
		    })
	  		.on("mousemove", (d) => {
	  			var cell = d3.select(this);
	  			//console.log(d);
	  			//console.log(cell.data()[0]);
	  			//var x = cell.data()[0].x;
	  			//var y = cell.data()[0].y;
	  			//var translate = d3.transform(cell.attr("transform")).translate;
	  			var coordinates = d3.mouse(svg.node()); // position relative to the svg element
	  			
	  			tooltip.html("<p><strong>Execution Step" + ": " + d["@execution_step"] + "</strong></p><p><strong>Code line: " + d["@line number"] + "</strong></p>");
	  			this.removeMouseupGutterHighlights();
	  			d["@current"] ? this.highlightCodeLines([d["@line number"]])
	  						  : this.highlightCodeLinesInDiffView([d["@line number"]]);

	  			return tooltip.style("top", (coordinates[1] + 500) + "px")
	  						  .style("left", coordinates[0] + "px");
	  		})
	  		.on("mouseout", () => {
	  			this.removeMouseupGutterHighlights();
	  			this.dehighlightPrevCodeLinesInDiffView();
	  			return tooltip.style("visibility", "hidden");
	  		});

		var svgContainer = d3.select("#cross-vis-div" + cp_idx + "-" + tc_idx);
		var tooltip = svgContainer.append("div")
								  .style("position", "absolute")
								  .style("z-index", "1001")
								  .style("visibility", "hidden");

		var brushCell;

		function plot(p) {
			var cell = d3.select(this);

			x.domain(domainByVarName[p.x]);
			y.domain(domainByVarName[p.y]);

			cell.append("rect")
			    .attr("class", "frame")
			    .attr("x", padding / 2)
			    .attr("y", padding / 2)
			    .attr("width", size - padding)
			    .attr("height", size - padding)
			    .style("pointer-events", "none");

			// Cross for other data
			cell.selectAll("path")
			    .data(data)
			  .enter().append("path")
			  .filter(function(d) { return d[p.x] && d[p.y] && !d["@current"]; })
			  	.attr("d", d3.svg.symbol()
			  		.size(function(d) { return 5 * 5; }) // size in square pixels
			  		.type(function(d) { return "diamond"; }))
			  	.attr("transform", function(d) { return "translate(" + x(d[p.x]) + "," + y(d[p.y]) +")"; })
			    .style("fill", function(d) { return d3.rgb(82,209,255,0.2); });

			// Dot for current data
			cell.selectAll("circle")
			    .data(data)
			  .enter().append("circle")
			  .filter(function(d) { return d[p.x] && d[p.y] && d["@current"]; })
			    .attr("cx", function(d) { return x(d[p.x]); })
			    .attr("cy", function(d) { return y(d[p.y]); })
			    .attr("r", 2)
			    .style("fill", function(d) { return d3.rgb(255,127,80,0.2); });
		}

		// Clear the previously-active brush, if any.
		function brushstart(p) {
			if (brushCell !== this) {		
				d3.select(brushCell).call(brush.clear());		
				x.domain(domainByVarName[p.x]);		
				y.domain(domainByVarName[p.y]);		
				brushCell = this;		
			}		
		}
	}

	dehighlightPrevCodeLinesInDiffView() {}

	highlightCodeLines(lineNumbers) {
		this.addMouseupGutterHighlights(lineNumbers.map((v, i) => v - 1));
	}

	highlightCodeLinesInDiffView(lineNumbers) {}

	displayDiffCodePanelContent(codeStr) {
		$("#diff-code-panel-title").attr("style", "display: block;");
		$("#diff-code-panel").attr("style", "display: block;");
		$("#diff-code-panel").html(
			"<pre id='diff-code-panel-pre' style='line-hight: 1;'>"
				+ codeStr
			+ "</pre>");

		// For line-numbered <pre> elements
	    var pre = document.getElementById("diff-code-panel-pre");
        pre.innerHTML = '<span class="line-number"></span>' + pre.innerHTML + '<span class="cl"></span>';
        var num = pre.innerHTML.split(/\n/).length;
        for (let i = -1; ++i < num;) {
            var line_num = pre.getElementsByTagName('span')[0];
            line_num.innerHTML += '<span>' + (i + 1) + '</span>';
        }
	}

	temp () {
		/*
		var padding = 20,
			width = screen.width - 500 - 500 - 2 * padding,
			height = 50;
		this.historySVGs[cp_i][tc_i] = d3.select("#history" + cp_i + "-" + tc_i).append("svg")
											.attr("width", width) // padding 40
											.attr("height", height);
		var svg = this.historySVGs[cp_i][tc_i],
			g = svg.append("g")
					.attr("transform", "translate(" + padding + "," + padding + ")"),
			r = 6,
			dist = 8,
			n = Math.floor((this.historySVGs[cp_i][tc_i].attr("width") - dist) / (r * 2 + dist));

		var x = d3.scale.linear()
		    .domain([1, n])
		    .range([0, width]);

		var y = d3.scale.linear()
		    .domain([0])
		    .range([height, 0]);

		var circle = d3.svg.symbol()
						.size(function(d) { return r * r; })
						.type(function(d) { return "circle"; }),
			data = this.history[cp_i][tc_i];

		if (data.length < n) data.push(newData);

		g.append("defs").append("clipPath")
			.attr("id", "clip")
		 .append("rect")
		 	.attr("width", width)
		 	.attr("height", height);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left");

		g.append("g")
			.attr("class", "axis axis--x")
			//.attr("transform", "translate(0," + y(0) + ")")
			.call(xAxis);

		g.append("g")
			.attr("class", "axis axis--y")
			.call(yAxis);

		g.append("g")
			.attr("clip-path", "url(#clip)")
		 .append("path")
		 	.datum(data)
		 	.filter(function(d) { console.log(d); return false; })
		 	.attr("class", "circle")
		 .transition()
		 	.duration(500)
		 	.ease("linear")
		 	.on("start", () => { draw(newData); });

		function draw(newData) {
			data.push(newData);

			// Redraw the circle
			d3.select(this)
				.attr("d", circle)
				.style("fill", function(d) {
					return d.result ? d3.rgb(51,255,51) : d3.rgb(255,51,51);
				})
				.attr("transform", null);

			d3.active(this)
				.attr("transform", "translate(" + x(-1) + ",0)")
			  .transition();

			data.shift();
		}
		*/		
	}
	
	updateHistory(cp_i, tc_i, newData) {
		this.history[cp_i][tc_i].push(newData);

		this.historySVGs[cp_i][tc_i].selectAll("circle")
			.data(this.history[cp_i][tc_i]).enter()
			.append("circle")
			.attr("r", 6)
			.attr("cx", (d) => { return this.history[cp_i][tc_i].length * (6 + 14); })
			.attr("cy", (d) => { return 5; })
			.style("fill", (d) => {
				return d.result ? d3.rgb(51,255,51) : d3.rgb(255,51,51);
			})
			.on("mouseover", (d, i) => {
				this.historySVGs[cp_i][tc_i].append("line")
											.attr("x1", (i + 1) * (6 + 14) - 6)
											.attr("y1", 22)
											.attr("x2", (i + 1) * (6 + 14) + 6)
											.attr("y2", 22)
											.attr("stroke-width", 3)
											.attr("stroke", "grey");
			})
			.on("mouseout", (d, i) => {
				this.historySVGs[cp_i][tc_i].selectAll("line").remove();
			})
			.on("click", (d, i) => {
				if (this.currentHistSelection !== i) {
					this.currentHistSelection = i;
					// Remove existing circles
					this.historySVGs[cp_i][tc_i].selectAll("circle.clicked").remove();
					this.historySVGs[cp_i][tc_i].append("circle")
												.attr("class", "clicked")
												.attr("r", 10)
												.attr("cx", (i + 1) * (6 + 14))
												.attr("cy", 5)
												.attr("stroke-width", 2)
												.attr("stroke", "grey")
												.style("fill", "none");	
					this.createVis(this.debugData, d, cp_i, tc_i);
					this.displayDiffCodePanelContent(diffString(d.code, this.debugData.code));
				} else {
					// Clicked the same history again -- remove it
					this.currentHistSelection = -1; // set it to an initial value to enable the same selection again
					this.historySVGs[cp_i][tc_i].selectAll("circle.clicked").remove();
					this.createVis(this.debugData, {dataArray: [], localVarNames: []}, cp_i, tc_i);

					// Hide the panel and the title
					$("#diff-code-panel-title").attr("style", "display: none;");
					$("#diff-code-panel").attr("style", "display: none;");
				}
			});
	}

	showHistory(cp_i, tc_i) {
		if (this.prevShownHistoryIdx && this.prevShownHistoryIdx.length === 2) {
			var _cp_i = this.prevShownHistoryIdx[0];
			var _tc_i = this.prevShownHistoryIdx[1];
			this.historySVGDivs[_cp_i][_tc_i].attr("style", "display: none;");
		}
		this.historySVGDivs[cp_i][tc_i].attr("style", "display: block;");
		this.prevShownHistoryIdx = [cp_i, tc_i];
	}

	handleVisualDebugRequest(mode, checkpoint, testcase, result) {
		if (mode === RUN_TEST_COMMAND) {
			if (checkpoint < 0 || testcase < 0) {
				return this.postWarningNotificationModal({
						msg: 'Invalid test case'
				});
			}

			if (!this.runResults                     			// Sanity checks. Should pass after proper initialization
				|| !this.runResults[checkpoint]          		//
				|| !this.runResults[checkpoint][testcase]  		//
				|| !this.runResults[checkpoint][testcase][0]) 	// This is set only after an actual run of the testcase
			{
				return this.postWarningNotificationModal({
					msg: 'Run the test case first'
				});
			}
		}

		this.debugData = this.createDebugVizData(this.runResults[checkpoint][testcase][0]);
		console.log(this.debugData);
		this.createVis(this.debugData, {dataArray: [], localVarNames: []}, checkpoint, testcase);

		//this.showHistory(checkpoint, testcase);
		this.debugData["result"] = result;
		this.debugData["code"] = this.editorObj.code;
		//this.updateHistory(checkpoint, testcase, this.debugData);
	}

	sendRunRequestAndVisualize(URL, dataObj, mode, checkpoint_idx, testcase_idx) {
		$.post({
			url: URL,
			data: JSON.stringify(dataObj),
			success: (data) => {
				this.editorStatus.html("Done");
				setTimeout(() => {
					this.editorStatus.fadeOut();
				}, 2000);

				var json = JSON.parse(data);
				console.log(json);

				// Set gutter highlight (red) to indicate syntax error
				//this.highlightSyntaxErrors(json.syntaxErrorRanges);

				// Set gutter highlight (yellow) to indicate commented function ranges
				//this.colorCommentedOutFunctions(json.commentedFuncRanges);

				var correct = false;

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

							// Update with the result value
							// The run result in the testcase html
							$('#testcase-run-result' + cp_idx + '_' + testcase_idx).html('<b>Run result:</b> ' + result);
							var testcaseResImg = $('#case' + cp_idx + '_' + testcase_idx);
							var testcaseResImgInLink = $("#testcase-result" + cp_idx + "-" + testcase_idx);
							if (correct = (testcase.want === result)) {
								testcaseResImg.attr('src', '../images/success.png');
								testcaseResImgInLink.attr("src", "../images/success.png");
							} else {
								testcaseResImg.attr('src', '../images/error.png');
								testcaseResImgInLink.attr("src", "../images/error.png");
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

					console.log(traceLen, result);
					// Update with the result value
					$('#testcase-run-result' + cp_idx + '_' + testcase_idx).html('<b>Run result:</b> ' + result);

					// Update the status image
					var testcase = this.checkpoints[cp_idx].testCases[testcase_idx];										
					var testcaseResImg = $('#case' + cp_idx + '_' + testcase_idx);
					var testcaseResImgInLink = $("#testcase-result" + cp_idx + "-" + testcase_idx);
					if (correct = (testcase.want === result)) {
						testcaseResImg.attr('src', '../images/success.png');
						testcaseResImgInLink.attr("src", "../images/success.png");
					} else {
						testcaseResImg.attr('src', '../images/error.png');
						testcaseResImgInLink.attr("src", "../images/error.png");
					}
				}

				// Visualization function
				this.handleVisualDebugRequest(mode, checkpoint_idx, testcase_idx, correct);

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

		this.sendRunRequestAndVisualize(URL, dataObj, mode, checkpoint, testcase);
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
		console.log(trace);
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
		//var editLine = this.editor.getSelectionRange().start.row;

		// If the edited content's line no. overlaps with any of the lines of the
		// previously created error, remove squiggly lines in those lines
		// --> Change: remove squiggly lines when the edited content's line no.
		//             is before the error line no.
		// --> Change: remove all squiggly lines in the code editor as soon as its
		//             content has been changed
		var idx = 0;
		while (idx < this.prevErrorMarkers.length) {
			var marker = this.prevErrorMarkers[idx];
/*
			if (marker.startLine <= editLine
				&& editLine <= marker.endLine) {
				this.editor.session.removeMarker(marker.id);
				this.prevErrorMarkers.splice(idx, 1);
			} else {
				idx++;
			}
*/
/*
			if (editLine <= marker.startLine) {
				this.editor.session.removeMarker(marker.id);
				this.prevErrorMarkers.splice(idx, 1);
			} else {
				idx++;
			}
*/
			this.editor.session.removeMarker(marker.id);
			this.prevErrorMarkers.splice(idx, 1);
		}
	}

	removeErrorGutterHighlights() {
		var redGutter = "redGutter";
		this.prevSyntaxErrorRanges.forEach((range, i) => {
			this.editor.session.removeGutterDecoration(range.start.row, redGutter);
		});
	}

	removeCommentGutterHighlights() {
		var commentIndicationStyle = 'greyGutter';
		this.prevCommentRows.forEach((row, idx) => {
			this.editor.session.removeGutterDecoration(row, commentIndicationStyle);
		});
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

	///////////////////////////////////////////////////////
	// Initializes the history SVGs and the data structure
	///////////////////////////////////////////////////////
	initHistory() {
		var padding = 20,
			marginWidth = 100,
			width = screen.width - 500 - 500 - 2 * padding - marginWidth,
			height = 50;

		this.checkpoints.forEach((cp, cp_i) => {
			this.history[cp_i] = [];
			this.historySVGDivs[cp_i] = [];
			this.historySVGs[cp_i] = [];
			cp.testCases.forEach((testcase, tc_i) => {
				this.history[cp_i][tc_i] = [];
				this.historySVGDivs[cp_i][tc_i] = $("#history" + cp_i + "-" + tc_i);
				this.historySVGs[cp_i][tc_i] = d3.select("#history" + cp_i + "-" + tc_i).append("svg")
													.attr("width", width)
													.attr("height", height);
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
						this.initHistory();

						this.userData = data.userData;
						this.editor.setValue(data.userData.code, -1); // Set value without selecting the entire editor content
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

	highlightSelectedLines(cp_i, tc_i) {
		var line_idx = [this.editor.selection.getRange().start.row, this.editor.selection.getRange().end.row];
		var start = line_idx[0];
		var end = line_idx[1];
		d3.select("#cross-vis-div" + cp_i + "-" + tc_i).select("svg")
			.selectAll("circle").classed("hidden", function(d) {
				return !(start <= (d["@line number"] - 1) && (d["@line number"] - 1) <= end);
			});

		this.isHighlightStrSelected = (start >= 0 && end >= 0);
	}

	dehighlightSelectedLines(cp_i, tc_i) {
		d3.select("#cross-vis-div" + cp_i + "-" + tc_i).select("svg")
			.selectAll(".hidden").classed("hidden", false);
		this.isHighlightStrSelected = false;
	}

	convertToIndexArray(arr) {
		var start = arr[0];
		var end = arr[1];
		var res = [];
		for (let i = start - 1; ++i <= end;) res.push(i);
		return res;
	}

	// Array of indices
	addMouseupGutterHighlights(indices) {
		indices.forEach((index, i) => {
			this.editor.session.addGutterDecoration(index, "orangeGutter");
		});

		this.isMouseupHighlightedLineIndices = indices;
		this.isMouseupHighlighted = true;
	}

	removeMouseupGutterHighlights() {
		this.isMouseupHighlightedLineIndices.forEach((index, i) => {
			this.editor.session.removeGutterDecoration(index, "orangeGutter");
		});
			
		this.isMouseupHighlighted = false;
	}

	addMouseupListener() {
		// The semantics:
		//   Only when the mouseup event was followed after a dragging event
		//   (some text was selected) does the gutter highlight and the viz
		//   filtering get performed. A mouseup event without dragging (i.e.
		//   a simple click on the editor) or a mouseup dragging event that 
		//   selects the same lines of code releases the highlight and the
		//   filter
		$("#editor").mouseup((e) => {
			//console.log(e);
			e.preventDefault();
			var cp_i = this.menuClickID.checkpoint;
			var tc_i = this.menuClickID.testcase;

			var line_idx = [this.editor.selection.getRange().start.row, this.editor.selection.getRange().end.row];
			var start = line_idx[0];
			var end = line_idx[1];

			var textSelected = this.editor.getSession().doc.getTextRange(this.editor.selection.getRange()) !== "";
			var isOneLine = start === end;
			var clickMadeInPrevRangeNext = this.convertToIndexArray(line_idx).every((v, i) => v === this.isMouseupHighlightedLineIndices[i]);

			var shouldFilter = textSelected && !this.isMouseupHighlighted;
			// !textSelected && isOneLine will hold in a normal situation with clicking on a line in the editor
			// this.isMouseupHighlighted && clickMadeInPrevRangeNext is necessary since there's a DOM event
			// mismatch within the editor it seems. When a mouse click happens in the range of a previously
			// selected range, it will still return the same range of text as selected, which isn't true.
			var shouldRelease = (!textSelected && isOneLine) || (this.isMouseupHighlighted && clickMadeInPrevRangeNext);

			if (shouldFilter) {
				// When there's a selection range and a mouse click happens
				// within that range, the editor.selection.getRange() method
				// doesn't correctly return the clicked line index.
				//   Instead, it keeps thinking that the same range is selected.
				//   I cannot reproduce the same kind of reaction in other
				// cases, hence putting in code for this special case
				// treatment below. (seems to be like an error to
				// me that the ace editor doesn't respond equally to
				// regular DOM events)
				d3.select("#cross-vis-div" + cp_i + "-" + tc_i).select("svg")
					.selectAll("circle").classed("hidden", function(d) {
						return !(start <= (d["@line number"] - 1) && (d["@line number"] - 1) <= end);
					});

				// Highlight the gutter in the editor
				this.addMouseupGutterHighlights(this.convertToIndexArray(line_idx));

				// Hide all the data points from the history
				d3.select("#cross-vis-div" + cp_i + "-" + tc_i).select("svg")
					.selectAll("path").classed("hidden", true);
			} else if (shouldRelease) {
				// Dehighlight
				d3.select("#cross-vis-div" + cp_i + "-" + tc_i).select("svg")
					.selectAll("circle").classed("hidden", false);

				d3.select("#cross-vis-div" + cp_i + "-" + tc_i).select("svg")
					.selectAll("path").classed("hidden", false);

				this.removeMouseupGutterHighlights();
			}
		});

		$("#diff-code-panel").mouseup((e) => {
			// The semantics of selection in the diff panel maybe doesn't really make sense
			e.preventDefault();
			var code = "";
			if (window.getSelection) { code = window.getSelection().toString(); }
			else if (document.selection && document.selection.type !== "Control") {
				code = document.selection.createRange().text;
			}
			// ...
		});
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
				//this.togglecontextMenuWithDebugHighlightOn();
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
					//this.handleDebugRequest();
				} else if (e.target.id === this.runTestcaseID) {
					this.handleRunRequest(RUN_TEST_COMMAND, this.menuClickID.checkpoint, this.menuClickID.testcase);
				} else if (e.target.id === this.debugHighlightMenuID) {
					//this.populateDebugFuzzySelectionView();				
					//this.highlightDebugString();
				} else if (e.target.id === this.debugDehighlightMenuID) {
					//this.dehighlightDebugString();
				} else if (e.target.id === this.visualDebugMenuID) {
					//this.handleVisualDebugRequest(RUN_TEST_COMMAND, this.menuClickID.checkpoint, this.menuClickID.testcase);
				} else if (e.target.id === this.saveTestcaseMenuID) {
					// Save the testcase run result. When this button is clicked, the testcase has already
					// been run.
					this.updateHistory(this.menuClickID.checkpoint, this.menuClickID.testcase, this.debugData);
				} else if (e.target.id === this.highlightOnSelectionMenuID) {
					//this.highlightSelectedLines(this.menuClickID.checkpoint, this.menuClickID.testcase);
				} else if (e.target.id === this.dehighlightOnSelectionMenuID) {
					//this.dehighlightSelectedLines(this.menuClickID.checkpoint, this.menuClickID.testcase);
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

	///////////////////////////////////////////////
	// Name piggy-backing; the context menu
	// has been changed to support highlighting of
	// data points rather than debug highlighting
	///////////////////////////////////////////////
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

			// If the highlight string selected
			if (this.isHighlightStrSelected) {
				this.hideHighlightMenu();
				this.showDehighlightMenu();
			} else {
				this.showHighlightMenu();
				this.hideDehighlightMenu();
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

				// self.menuClickID is set when any testcase link is clicked
				if (self.menuClickID.checkpoint > -1 && self.menuClickID.testcase > -1) {
					self.handleRunRequest(RUN_TEST_COMMAND, self.menuClickID.checkpoint, self.menuClickID.testcase);
				}
				self.curText = newText;
		  	}
		}

		this.editor.on('change', (e) => {
			// Remove the syntax error squiggly lines
			this.removeMarkersInEditorSelection();

			// Remove syntax error gutter highlights
			this.removeErrorGutterHighlights();

			// Remove comment gutter highlights
			this.removeCommentGutterHighlights();

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

