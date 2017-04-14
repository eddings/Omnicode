"use strict";
function addAll(s, a) {
	if (a)
		a.forEach((e, i) => { s.add(e); });
}

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
		this.editor.setFontSize(16);
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

		// System warning modal
		this.warningNotificationModal = $('#warning-notification-modal');
		this.warningNotificationModalClose = $('#warning-notification-modal-close');
		this.warningNotificationModalContent = $('#warning-notification-modal-content');
		this.warningNotificationModalText = $('#warning-notification-modal-text');

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

		// Editor-related
		this.editorObj = new EditorObj();
		this.editor = this.editorObj.editor;
		// Checkpoint status; make the status change when running a test, etc. more visible 

		this.elements = {};
		this.elements[this.visualDebuggerViewDivID] = this.visualDebuggerViewDiv;

		// Logged-in user data
		this.userData = {};

		// Run results
		this.runResults = [];
		this.runningCode = '';
		this.syntaxErrorRanges = null;
		this.prevSyntaxErrorRanges = [];
		this.prevCommentRows = [];
		this.prevErrorMarkers = [];

		this.tooltip = null;

		this.isTooltipVisible = false;
		this.isDebugStrHighlighted = false;
		this.activeClassName = "tooltip--active";
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
		this.DEBOUNCE_MS = 2000;// milliseconds of debouncing (i.e., 'clustering' a
								// rapid series of edit actions as a single diff)
								// set to 'null' for no debouncing
		this.curText = '';

		// Visible Testcase indices
		this.visibleTestcaseIdx = [];

		// History
		this.history = [];
		this.currentHistSelection = -1;
		this.prevShownHistoryIdx = -1;
		this.historyStarted = false;
		this.historySVGDivs = [];
		this.historySVGs = [];

		// Visualization
		this.debugData = [];
		this.isHighlightStrSelected = false;
		this.plotNumberComputed = false;
		this.prevRowNum = 0;
		this.brushes = {};
		this.varNames = [];
		this.onMatrixView = true;
		this.onFlowView = false;
		this.runStatus = $("#run-status");

		// PythonTutor Viz Tooltip
		this.textSelected = false;

		//
		//	this.plotPairs[checkpoint][0] := An array of value - @execution step pairs
		//	this.plotPairs[checkpoint][1] := An array of derived value - @execution step pairs
		//	this.plotPairs[checkpoint][2] := An array of ({value} + {derived value}) - ({value} + {derived value}) pairs
		//	this.plotPairs[checkpoint][3] := An array of custom value - custom value pairs
		//
		this.plotPairs = [];
		this.matrixPlotPairs = [];
		// The # of visualizations for each checkpoint
		this.checkpointVizNumber = [];
		this.checkpointScatterplotMatrixVizNumber = [];

		// Code line highlights for point selection in the vis
		this.prevHighlightedCodeLines = [];

		// Mouse-up event 
		this.isMouseupHighlightedLineIndices = [];
		this.isMouseupHighlighted = false;

		this.init();
	}

	collectQuestionBtns() {
		$("button[id$='-question-btn']").each((i, el) => {
			this.questionBtns.push($(el));
		});
	}

	addCustomVisBtnHandler() {
		this.checkpoints.forEach((cp, cp_i) => {
			$("#user-defined-vis-open-btn" + cp_i).on("click", (e) => {
				e.preventDefault();
				var xInputID = "x-var-input";
				var yInputID = "y-var-input";

				var xVarName = $("#" + xInputID).val();
				var yVarName = $("#" + yInputID).val();

				if (xVarName !== "" && yVarName !== "") {
					$("#input-status").html("");
					this.handleRunRequestWithCustomVars(
						RUN_TEST_COMMAND,
						this.menuClickID.checkpoint,
						this.menuClickID.testcase,
						[xVarName, yVarName], []);

					$("#user-defined-viz-rendered" + this.menuClickID.checkpoint).css("display", "block");
					$("#custom-vis-close" + cp_i).css("display", "block"); // Show the close-the-vis button
					$("#add-user-defined-viz-btn" + cp_i).css("display", "block"); // Show the add-to-the-collection button
				} else {
					$("#input-status").html("Type in the variable names");
				}
			});

			// Add the close-the-vis button click handler
			$("#custom-vis-close" + cp_i).on("click", (e) => {
				e.preventDefault();			
				$("#user-defined-viz-rendered" + cp_i).css("display", "none"); // Hide the created custom vis
				$("#custom-vis-close" + cp_i).css("display", "none"); // Hide the close button
				$("#add-user-defined-viz-btn" + cp_i).css("display", "none"); // Hide the add button
				this.hideCustomVizBackdrop(cp_i);
			});

			// Add the add-user-defined-viz-btn handler
			$("#add-user-defined-viz-btn" + cp_i).on("click", (e) => {
				e.preventDefault();
				// Update plotPairs
				var xInputID = "x-var-input";
				var yInputID = "y-var-input";

				var xVarName = $("#" + xInputID).val();
				var yVarName = $("#" + yInputID).val();

				this.plotPairs[cp_i][3].push({x: xVarName, y: yVarName});
				// Update the checkpoint viz number
				++this.checkpointVizNumber[cp_i];

				if (this.onFlowView) {
					this.addToCorrectGridPosition(cp_i, this.plotPairs[cp_i][3].length - 1); // Flow view, index is length - 1
				} else {
					// TODO: add to the correct position in the scatterplot matrix view
					this.addToCorrectGridPositionMatrix(cp_i, this.plotPairs[cp_i][3].length - 1);
				}
				$("#custom-vis-close" + cp_i).css("display", "none"); // Hide the close-the-vis button
				$("#add-user-defined-viz-btn" + cp_i).css("display", "none"); // Hide the add button
				this.hideCustomVizBackdrop(cp_i);
			});
		});
	}

	addToCorrectGridPositionMatrix(cp_i, i) {
		let cols = Math.max(isNaN(this.matrixPlotPairs[cp_i][0][0].length) ? 0 : this.matrixPlotPairs[cp_i][0][0].length, 5),
			width = 200,
			height = 200,
			padding = 40,
			dEl = document.createElement("div");

		dEl.className = "cellDiv";
		dEl.style.width = width + "px";
		dEl.style.height = height + "px";

		let pDiv = document.getElementById("matrix-viz" + cp_i),
			pOffsetTop = pDiv.offsetTop,
			pOffsetLeft = pDiv.offsetLeft;
		let numTitles = 0,
			titleHeight = 20;
		$("p[id^='matrix-viz-p-']").each((_) => { ++numTitles; });

		let idStr = "matrix-viz" + cp_i + "-custom-" + i;
		if (document.getElementById(idStr) === null) {
			let c = dEl.cloneNode(false);
			let adRows = isNaN(this.matrixPlotPairs[cp_i][0][0].length) ? 0 : this.matrixPlotPairs[cp_i][0][0].length; // The plot hasn't been added 
			adRows += Math.floor(i / cols);
			let top = pOffsetTop + adRows * (height + 2 * padding) + numTitles * titleHeight;

			// If this is the first custom plot added, add the title for the section
			let title = "Custom variable - custom variable plot(s)";
			if (document.getElementById("matrix-viz-p-1" + "-" + cp_i) === null) {
				let pEl = document.createElement("p");
				pEl.innerHTML = '<p id="matrix-viz-p-1' + '-' + cp_i + '" class="viz-title-p">\
									<b>' + title + '</b>\
								</p>';
				pEl.firstChild.style.top = top + "px";
				document.getElementById("matrix-viz-custom-value-custom-value" + cp_i).append(pEl.firstChild);
				c.style.top = (top + titleHeight) + "px"; /* Adjust for the title height when the title is first added */
			} else {
				c.style.top = top + "px";
			}
			c.style.left = pOffsetLeft + (i % cols) * (width + 2 * padding) + "px";
			c.id = idStr;
			$("#matrix-viz-custom-value-custom-value" + cp_i).append(c);
		}

		let svg = $("#user-defined-viz-rendered" + cp_i + "-svg").detach();
		svg.attr("id", "matrix-viz" + cp_i + "-custom-" + i + "-svg");
		$("#" + idStr).append(svg).hide().fadeIn(1000);		
	}

	// Detach the SVG from the custom viz pane and add it to the correct
	// position in grid
	addToCorrectGridPosition(cp_i, i) {
		let cols = 5,
			width = 200,
			height = 200,
			padding = 40,
			dEl = document.createElement("div");

		dEl.className = "cellDiv";
		dEl.style.width = width + "px";
		dEl.style.height = height + "px";

		let pDiv = document.getElementById("viz" + cp_i);
		let pOffsetTop = pDiv.offsetTop,
			pOffsetLeft = pDiv.offsetLeft;
		let numTitles = 0;
		let titleHeight = 20;
		$("p[id^='viz-p-']").each((i, _) => { ++numTitles; });

		let idStr = "viz" + cp_i + "-" + this.checkpointVizNumber[cp_i];
		if (document.getElementById(idStr) === null) {
			let c = dEl.cloneNode(false);
			let adRows = Math.ceil(this.plotPairs[cp_i][0].length / cols)
					   + Math.ceil(this.plotPairs[cp_i][1].length / cols)
					   + Math.ceil(this.plotPairs[cp_i][2].length / cols)
					   + Math.floor((this.plotPairs[cp_i][3].length - 1) / cols); // The plot hasn't been added 
			let top = pOffsetTop + adRows * (height + 2 * padding) + numTitles * titleHeight;

			// If this is the first custom plot added, add the title for the section
			let title = "Custom variable - custom variable plot(s)";
			if (document.getElementById("viz-p-3" + "-" + cp_i) === null) {
				let pEl = document.createElement("p");
				pEl.innerHTML = '<p id="viz-p-3' + '-' + cp_i + '" class="viz-title-p">\
									<b>' + title + '</b>\
								</p>';
				pEl.firstChild.style.top = top + "px";
				document.getElementById("viz-custom-value-custom-value" + cp_i).append(pEl.firstChild);
				c.style.top = (top + titleHeight) + "px";
			} else {
				c.style.top = top + "px";
			}
			c.style.left = pOffsetLeft + (i % cols) * (width + 2 * padding) + "px";
			c.id = idStr;
			$("#viz-custom-value-custom-value" + cp_i).append(c);
		}

		let svg = $("#user-defined-viz-rendered" + cp_i + "-svg").detach();
		svg.attr("id", "viz" + cp_i + "-" + i + "-svg");
		$("#" + idStr).append(svg).hide().fadeIn(1000);
	}

	bringUpCustomVizBackdrop(cp_i) {
		let dEl = document.getElementById("user-defined-viz-rendered" + cp_i);
		dEl.className = "modalBlurredBackgroundDiv";
	}

	hideCustomVizBackdrop(cp_i) {
		var dEl = document.getElementById("user-defined-viz-rendered" + cp_i);
		dEl.classList.remove("modalBlurredBackgroundDiv");
	}

	panelSwitchBtnHandler() {
		$("#diff-code-panel-switch").on("click", (e) => {
			$("#python-tutor-panel").hide().fadeIn(500);
			$("#diff-code-panel").show().fadeOut(500);
		});

		$("#python-tutor-viz-panel-switch").on("click", (e) => {
			$("#python-tutor-panel").show().fadeOut(500);
			$("#diff-code-panel").hide().fadeIn(500);
		});
	}

	viewSwitchBtnHandler() {
		$("#matrix-view-switch").on("click", (e) => {
			e.preventDefault();
			this.onFlowView = false;
			this.onMatrixView = true;
			let cp_i = this.menuClickID.checkpoint;
			let tc_i = this.menuClickID.testcase;
			$("#viz" + cp_i).css("display", "none");
			$("#matrix-viz" + cp_i).css("display", "block");

			// Send the run request
			this.handleRunRequest(RUN_TEST_COMMAND, cp_i, tc_i);

			// Update the visibility of switches
			$("#matrix-view-switch").hide();
			$("#flow-view-switch").show();
		});

		$("#flow-view-switch").on("click", (e) => {
			e.preventDefault();
			this.onFlowView = true;
			this.onMatrixView = false;
			let cp_i = this.menuClickID.checkpoint;
			let tc_i = this.menuClickID.testcase;
			$("#viz" + cp_i).css("display", "block");
			$("#matrix-viz" + cp_i).css("display", "none");

			// Send the run request
			this.handleRunRequest(RUN_TEST_COMMAND, cp_i, tc_i);

			// Update the visibility of switches
			$("#flow-view-switch").hide();
			$("#matrix-view-switch").show();
		});
	}

	init() {
		this.panelSwitchBtnHandler();
		this.viewSwitchBtnHandler();

		this.collectQuestionBtns();
		this.collectQuestionModal();

		this.addModalHandlers();

		// Editor content change handler
		this.addEditorChangeHandler();

		this.collectTooltip();
		this.addContextListener();
		this.addKeyUpListner();

		// Click handler
		this.addClickListener();

		// Add mouseup listener
		this.addEditorMouseupListener();

		// Initialize the user status
		this.initStatus();
	}

	mouseReleaseOnEditorHandler() {
		let cp_i = this.menuClickID.checkpoint;
		d3.selectAll("[id^='viz" + cp_i + "']").select("svg")
			.selectAll("circle").classed("hidden", false);

		d3.selectAll("[id^='viz" + cp_i + "']").select("svg")
			.selectAll("path").classed("hidden", false); // Display all data points in the comparison viz; currently not in use

		d3.selectAll("[id^='matrix-viz" + cp_i + "']").select("svg")
			.selectAll("circle").classed("hidden", false); // Matrix view 

		this.removeMouseupGutterHighlights();
		this.toggleTooltipOff();
		this.showAllPlots();
	}

	addEditorChangeHandler() {
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

		this.editor.on("change", (e) => {
			this.removeMarkersInEditorSelection(); // Remove the syntax error squiggly lines
			this.removeErrorGutterHighlights(); // Remove syntax error gutter highlights
			this.removeCommentGutterHighlights(); // Remove comment gutter highlights
			this.mouseReleaseOnEditorHandler(); // Mouseup handling

			if (this.DEBOUNCE_MS > 0) { // Debouncing and auto saving
				$.doTimeout("editorChange", this.DEBOUNCE_MS, () => { snapshotDiff(this); });
			} else {
				snapshotDiff(this);
			}
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
		let dataArray = [];
		let localVarNames = new Set();
		trace.forEach((t, i) => {
			let orderedGlobals = t['ordered_globals'];
			if (!orderedGlobals) {
				if (t['event'] === 'uncaught_exception') {
					return dataArray;
				}
			}

			let stackFs = t["stack_to_render"]; // Array of stack frames to render
			if (stackFs) {
				stackFs.forEach((f, j) => {
					let encodedLocalNames = Object.keys(f["encoded_locals"]);
					let stackObj = {};
					encodedLocalNames.forEach((name, k) => {
						if ((f['encoded_locals'][name] !== null)
							&& !isNaN(f['encoded_locals'][name])
							|| (Array.isArray(f['encoded_locals'][name]) && f['encoded_locals'][name][0] === "SPECIAL_FLOAT")) {							
							if (name === "__return__") {
								// Name change from __return__ to @return
								if (Array.isArray(f['encoded_locals'][name])) {
									if (f['encoded_locals'][name][0] === "SPECIAL_FLOAT")
										stackObj["@return"] = parseFloat(f['encoded_locals'][name][1]);
								} else {
									stackObj["@return"] = f['encoded_locals'][name];
								}
								localVarNames.add("@return");					
							} else {
								if (Array.isArray(f['encoded_locals'][name])) {
									if (f['encoded_locals'][name][0] === "SPECIAL_FLOAT")
										stackObj[name] = parseFloat(f['encoded_locals'][name][1]);
								} else {
									stackObj[name] = f['encoded_locals'][name];
								}
								localVarNames.add(name);								
							}

						}
					});
					stackObj['@execution step'] = i;
					stackObj['@executed_code'] = this.editor.session.getLine(t['line'] - 1);
					stackObj['@line no.'] = t['line'];

					let probe_exprs = t["probe_exprs"];
					if (probe_exprs) {
						Object.keys(probe_exprs).forEach((key, j) => {
							if (Array.isArray(probe_exprs[key])) {
								let val = parseFloat(probe_exprs[key][1]);
								if (probe_exprs[key][0] === "SPECIAL_FLOAT" && !isNaN(val)) {
									stackObj[key] = val;
								}
							} else {
								let val = parseInt(probe_exprs[key]);
								if (!isNaN(val)) {
									stackObj[key] = val;
								}
							}
						});
						stackObj['@execution step'] = i;
						stackObj['@executed_code'] = this.editor.session.getLine(t['line'] - 1);
						stackObj['@line no.'] = t['line'];
						// prob exprs are not stored in localVarNames
						//dataArray.push(stackObj);		
					}
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

	exclusiveCross(len2Arr) {
		return [{x: len2Arr[0], i: 0, y: len2Arr[1], j: 0}];
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Creates a custom visualization
	// using the debug data stored and
	// x- and y-axis variable names: varNames[0] for x-axis and varNames[1] for y-axis 
	////////////////////////////////////////////////////////////////////////////////////
	createCustomVis(cp_i, varNames) {
		if (varNames.length !== 2) { return console.log("[In createCustomVis()] Proper axes not provided."); }

		let data = this.debugData.dataArray;
		let varData = Array.from(this.debugData.localVarNames);
		varData.push("@line no.");
		varData.push("@execution step");

		let padding = 40,
			width = 200,
			height = 200;

		let x = d3.scale.linear()
		    .range([padding / 2, width - padding / 2]);

		let y = d3.scale.linear()
		    .range([height - padding / 2, padding / 2]);

		let xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom")
		    .ticks(6);

		let yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left")
		    .ticks(6);

		xAxis.tickSize(width);
		yAxis.tickSize(-height);

		let domainByVarName = {};
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
		d3.select("#user-defined-viz-rendered" + this.menuClickID.checkpoint + "-svg").remove();

		// Show the custom vis area with a higher z-index and background opacity
		this.bringUpCustomVizBackdrop(cp_i);

		// Create a new one
		let svg = d3.select("#user-defined-viz-rendered" + this.menuClickID.checkpoint)
				    .append("svg")
				    .attr("id", () => { return "user-defined-viz-rendered" + this.menuClickID.checkpoint + "-svg"; })
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

		let select = this.onFlowView ? d3.selectAll("svg[id^='viz" + cp_i + "-']") : d3.selectAll("svg[id^='matrix-viz" + cp_i + "-']");
		let brush = d3.svg.brush() // this brush is different from the brush created in createViz(), and therefore, even if you start brushing
		    .x(x)		           // in the custom viz and then later brushes on one of the non-custom vizzes, the brush on the custom viz
		    .y(y)		           // still remains
		    .on("brushstart", brushstart)
		    .on("brush", (p) => { // Highlight the selected circles.
				let e = brush.extent();
				let brushedCircleLines = new Set();
				
				svg.selectAll("circle").classed("hidden", function(d) { // The svg itself 
					if (e[0][0] > d[p.x] || d[p.x] > e[1][0]
					|| e[0][1] > d[p.y] || d[p.y] > e[1][1]) {
						return true;
					}

					brushedCircleLines.add(d["@line no."]);
					return false;
				});
				select.selectAll("circle").classed("hidden", function(d) { // The svg itself 
					if (e[0][0] > d[p.x] || d[p.x] > e[1][0]
					|| e[0][1] > d[p.y] || d[p.y] > e[1][1]) {
						return true;
					}

					brushedCircleLines.add(d["@line no."]);
					return false;
				});

				this.removeMouseupGutterHighlights();
				this.highlightCodeLines(Array.from(brushedCircleLines));
		    })
		    .on("brushend", () => { // If the brush is empty, select all circles.
		    	if (brush.empty()) {
		    		svg.selectAll(".hidden").classed("hidden", false);
		    		select.selectAll(".hidden").classed("hidden", false);
		    		this.removeMouseupGutterHighlights();
		    		this.dehighlightPrevCodeLinesInDiffView();
		    	}
		    });

		svg.selectAll(".x.axis")
			.data([varNames[0]]) // x var
		.enter().append("g")
			.attr("class", "x axis")
			.attr("transform", function(d, i) { return "translate(" + padding  + ",0)"; })
			.each(function(d) {
				x.domain(domainByVarName[d]);
				d3.select(this).call(xAxis);
					// X-axis label
					d3.select(this)
						.append("text")
						.attr("transform", "translate(" + (width / 2 - 50) + "," + (height + padding + 5) + ")")
						.attr("font-size", "18px")
						.text(d);
				});

		svg.selectAll(".y.axis")
			.data([varNames[1]]) // y var
		.enter().append("g")
			.attr("class", "y axis")
			.attr("transform", function(d, i) { return "translate(" + padding + ",0)"; })
			.each(function(d) {
				y.domain(domainByVarName[d]);
				d3.select(this).call(yAxis);
				// Y-axis label
				d3.select(this)
					.append("text")
					.attr("transform", "translate(" + (5 - padding) + "," + height / 2 + ")rotate(-90)")
					.style("text-anchor", "middle")
					.attr("font-size", "18px")
					.text(d);
			});

		let cell = svg.selectAll(".cell")
			.data(this.exclusiveCross(varNames))
		.enter().append("g")
			.attr("class", "cell")
			.attr("transform", function(d, i) { return "translate(" + padding + ",0)"; });

		let xVar = varNames[0];
		let yVar = varNames[1];
		cell.call(brush); // add brushing
		cell.each(plot); // draw chart -- !important: this should be placed after the brush call
		cell.selectAll("circle")
		    .on("mouseover", function() {
		    	return tooltip.style("visibility", "visible");
		    })
	  		.on("mousemove", (d) => {
	  			this.removeMouseupGutterHighlights();
	  			this.highlightCodeLines([d["@line no."]]);
	  			/*
	  			var coordinates = d3.mouse(svg.node()); // position relative to the svg element
	  			var tooltipHTML = "<p>\
	  								<strong>" + xVar + ": " + d[xVar] + "</strong>\
	  							   </p>\
	  							   <p>\
	  							   	<strong>" + yVar + ": " + d[yVar] + "</strong>\
	  							   </p>";
	  			tooltip.html(tooltipHTML);

	  			return tooltip.style("top", coordinates[1] + "px")
	  						  .style("left", coordinates[0] + "px");
	  			*/
	  		})
	  		.on("mouseout", () => {
	  			this.removeMouseupGutterHighlights();
	  			return tooltip.style("visibility", "hidden");
	  		});

		let svgContainer = d3.select("#user-defined-viz-rendered" + this.menuClickID.checkpoint);
		let tooltip = svgContainer.append("div")
							  		.style("position", "absolute")
							  		.style("z-index", "1001")
							  		.style("visibility", "hidden");

		let brushCell;

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
			  .filter(function(d) { return (d[p.x] !== undefined) && (d[p.y] !== undefined); })
			    .attr("cx", function(d) { return x(d[p.x]); })
			    .attr("cy", function(d) { return y(d[p.y]); })
			    .attr("r", 3)
			    .style("fill", d3.rgb(255,127,80,0.2));
		}
	}

	vizIndexToPlotPair(cp_i, i) {
		if (i < 0 || i >= this.checkpointVizNumber[cp_i]) { return {x: undefined, y: undefined}; }

		let len0 = this.plotPairs[cp_i][0].length;
		let len1 = this.plotPairs[cp_i][1].length;
		let len2 = this.plotPairs[cp_i][2].length;
		let len3 = this.plotPairs[cp_i][3].length;

		if (i < len0) return this.plotPairs[cp_i][0][i];
		if (i < len0 + len1) return this.plotPairs[cp_i][1][i - len0];
		if (i < len0 + len1 + len2) return this.plotPairs[cp_i][2][i - (len0 + len1)];
		if (i < len0 + len1 + len2 + len3) return this.plotPairs[cp_i][3][i - (len0 + len1 + len2)];
	}

	vizIndexToPlotPairMatrix(cp_i, i) {
		if (i < 0 || i >= this.checkpointScatterplotMatrixVizNumber[cp_i] + this.plotPairs[cp_i][3].length) { return {x: undefined, y: undefined}; }
		let base = 0;
		let scatterPlotMatrixW = this.matrixPlotPairs[cp_i][0].length;
		for (let j = -1; ++j < scatterPlotMatrixW;) {
			if (base + this.matrixPlotPairs[cp_i][0][j].length > i) {
				return this.matrixPlotPairs[cp_i][0][j][i - base];
			} else {
				base += this.matrixPlotPairs[cp_i][0][j].length;
			}
		}		
		return this.matrixPlotPairs[cp_i][1][i - base];
	}

	plotPairToVizIndex(cp_i, pair) {
		var base = 0;
		for (let i = -1; ++i < 4;) {
			this.plotPairs[cp_i][i].forEach((cPair, j) => {
				if (cPair.x === pair.x && cPair.y === pair.y) return base + j;
			});
			base += this.plotPairs[cp_i][i].length;
		}
		return -1;
	}

	initPlotPairs(cp_i) {
		// Initialize plot-rendering related data structures
		this.prepareVizPairArray();
		this.checkpointVizNumber[cp_i] = 0;
		this.checkpointScatterplotMatrixVizNumber[cp_i] = 0;
	}

	// Only after this.plotPairs[cp_i] has been initialized,
	// can this function be properly called
	setMatrixPairsFromPlotPairs(cp_i) {
		if (!this.plotPairs[cp_i]) { return; }

		let locals = this.plotPairs[cp_i][0].map(o => o.y);
		let derivs = this.plotPairs[cp_i][1].map(o => o.y);

		let concatenated = locals.concat(derivs); //.concat(customs);
		concatenated.push("@execution step");
		let reversed = concatenated.slice().reverse();
		let len = concatenated.length - 1;
		this.matrixPlotPairs[cp_i][0] = [];
		for (let i = -1; ++i < len;) {
			this.matrixPlotPairs[cp_i][0][i] = [];
		}
		for (let i = -1; ++i < len;) {
			for (let j = -1; ++j < len - i;) {
				this.matrixPlotPairs[cp_i][0][i][j] = {x: reversed[i], y: concatenated[j]};
			}
		}
		this.matrixPlotPairs[cp_i][1] = [];
		let customs = this.plotPairs[cp_i][3];
		for (let i = -1; ++i < customs.length;) {
			this.matrixPlotPairs[cp_i][1][i] = {x: customs[i].x, y: customs[i].y};
		}

		this.checkpointScatterplotMatrixVizNumber[cp_i] = len * (len + 1) / 2;
	}

	// Sets the this.checkpointVizNumber[cp_i] and this.plotPairs[cp_i]
	computePlotNumbers(cp_i, varData /* Array */, derivedExprPairs /* Array of objects {x: "", y: ""} */) {
		// When the varData changes 					
		this.initializeVizPairArrayExceptCustomPairs(cp_i);
		if (!varData) { return; }

		for (let i = -1; ++i < varData.length;) {
			let varName = varData[i];
			this.plotPairs[cp_i][0].push({x: "@execution step", y: varName}); // value - execution step plots
			++this.checkpointVizNumber[cp_i];
		}

		let concatenated = varData.concat(derivedExprPairs.map(o => o.y));
		for (let i = -1; ++i < concatenated.length;) {
			for (let j = i; ++j < concatenated.length;) {
				this.plotPairs[cp_i][2].push({x: concatenated[i], y: concatenated[j]});
				++this.checkpointVizNumber[cp_i];
			}
		}
		this.plotNumberComputed = true;

		if (!derivedExprPairs) { return; }
		derivedExprPairs.forEach((pair, i) => {
			this.plotPairs[cp_i][1].push(pair);
			++this.checkpointVizNumber[cp_i];
		});
	}

	// Removes the existing divs and then add and position new ones
	addRemoveDivsMatrix(cp_i) {
		this.setMatrixPairsFromPlotPairs(cp_i);
		if (this.matrixPlotPairs[cp_i][0].length === 0 && this.plotPairs[cp_i][3].length === 0) { return; }
		let cols = this.matrixPlotPairs[cp_i][0].length > 0 ? this.matrixPlotPairs[cp_i][0][0].length : 0; // The first row is the widest
		cols = Math.max(cols, 5);
		let width = 200,
			height = 200,
			padding = 40,
			dEl = document.createElement("div");

		dEl.className = "cellDiv";
		dEl.style.width = width + "px";
		dEl.style.height = height + "px";

		// Remove divs
		$("div[id^='matrix-viz" + cp_i + "-']").each((_, el) => { $(el).remove(); });

		let pDiv = document.getElementById("matrix-viz" + cp_i),
			pOffsetTop = pDiv.offsetTop,
			pOffsetLeft = pDiv.offsetLeft;

		let scatterPlotMatrixW = this.matrixPlotPairs[cp_i][0].length;
		let base = 0,
			titleHeight = 20,
			titleNum = 0;

		let ids = [
			"matrix-viz-value-value" + cp_i,
			"matrix-viz-custom-value-custom-value" + cp_i
		];
		let titles = [
			"Variable - variable plot(s)",
			"Custom variable - custom variable plot(s)"
		];
		for (let i = -1; ++i < 2;) { // Necessary for title repositioning
			if (document.getElementById("matrix-viz-p-" + i + "-" + cp_i) !== null) {
				document.getElementById("matrix-viz-p-" + i + "-" + cp_i).remove();
			}
		}

		let lastTop = document.getElementById(ids[0]).offsetTop;
		if (scatterPlotMatrixW > 0) {
			let pEl = document.createElement("p");
			pEl.innerHTML = '<p id="matrix-viz-p-' + 0 + '-' + cp_i + '" class="viz-title-p">\
								<b>' + titles[0] + '</b>\
								<hr>\
							</p>';
			pEl.firstChild.style.top = lastTop + "px";
			document.getElementById(ids[0]).append(pEl.firstChild);
			++titleNum;
		}

		for (let i = -1; ++i < scatterPlotMatrixW;) {
			base = i > 0 ? (base + scatterPlotMatrixW) : 0;	
			for (let j = -1; ++j < scatterPlotMatrixW;) {
				let idStr = "matrix-viz" + cp_i + "-" + (base + j);
				if (document.getElementById(idStr) === null) {
					let c = dEl.cloneNode(false);
					c.style.top = (pOffsetTop + titleNum * titleHeight + i * (height + 2 * padding)) + "px";
					c.style.left = (pOffsetLeft + j * (width + 2 * padding)) + "px";
					c.id = idStr;
					$("#matrix-viz-value-value" + cp_i).append(c);
				}
			}
		}

		let customVizLen = this.plotPairs[cp_i][3].length;
		if (customVizLen > 0) {
			let pEl = document.createElement("p");
			pEl.innerHTML = '<p id="matrix-viz-p-' + 1 + '-' + cp_i + '" class="viz-title-p">\
								<b>' + titles[1] + '</b>\
								<hr>\
							</p>';
			pEl.firstChild.style.top = (lastTop + scatterPlotMatrixW * (height + 2 * padding) + titleNum * titleHeight) + "px";
			document.getElementById(ids[1]).append(pEl.firstChild);
			++titleNum;
		}

		pOffsetTop = lastTop + scatterPlotMatrixW * (height + 2 * padding) + titleNum * titleHeight;
		for (let i = -1; ++i < customVizLen;) {
			let idStr = "matrix-viz" + cp_i + "-custom-" + i;
			if (document.getElementById(idStr) === null) {
				let c = dEl.cloneNode(false);
				c.style.top = (pOffsetTop + Math.floor(i / cols) * (height + 2 * padding)) + "px";
				c.style.left = (pOffsetLeft + (i % cols) * (width + 2 * padding)) + "px";
				c.id = idStr;
				$("#matrix-viz-custom-value-custom-value" + cp_i).append(c);
			}
		}
	}

	// Add divs for each this.plotPairs[cp_i] in a grid-form
	addRemoveDivs(cp_i) {
		var cols = 5,
			rows = Math.ceil(this.checkpointVizNumber[cp_i] / cols),
			width = 200,
			height = 200,
			padding = 40,
			dEl = document.createElement("div");

		dEl.className = "cellDiv";
		dEl.style.width = width + "px";
		dEl.style.height = height + "px";

		// Remove divs
		$("div[id^='viz" + cp_i + "-']").each((i, el) => { $(el).remove(); });

		var base = 0;
		var rowNum = 0;
		var lastTop = document.getElementById("viz-value-exec-step" + cp_i).offsetTop + "px";
		var ids = [
			"viz-value-exec-step" + cp_i,
			"viz-derived-value-exec-step" + cp_i,
			"viz-value-value" + cp_i,
			"viz-custom-value-custom-value" + cp_i
		];
		var titles = [
			"Variable - execution step plot(s)",
			"Derived variable - execution step plot(s)",
			"Variable - variable plot(s)",
			"Custom variable - custom variable plot(s)"
		];
		var pDiv = document.getElementById("viz" + cp_i);
		var titleHeight = 20;
		var titleNum = 0;
		var adRows = 0;
		for (let i = -1; ++i < 4;) {
			base = i > 0 ? (base + this.plotPairs[cp_i][i-1].length) : base;
			adRows = i > 0 ? adRows + Math.ceil(this.plotPairs[cp_i][i-1].length / cols) : adRows;

			// Remove the previously added title. This is necessary because the plot formation might have
			// been changed, so we might need to reposition the title <p>'s
			if (document.getElementById("viz-p-" + i + "-" + cp_i) !== null) {
				document.getElementById("viz-p-" + i + "-" + cp_i).remove();
			}
			if (this.plotPairs[cp_i][i].length > 0) {
				var pEl = document.createElement("p");
				pEl.innerHTML = '<p id="viz-p-' + i + '-' + cp_i + '" class="viz-title-p">\
									<b>' + titles[i] + '</b>\
									<hr>\
								</p>';
				pEl.firstChild.style.top = lastTop + "px";
				document.getElementById(ids[i]).append(pEl.firstChild);
				++titleNum;
			}
			
			var pOffsetTop = pDiv.offsetTop + titleNum * titleHeight,
				pOffsetLeft = pDiv.offsetLeft;
			for (let j = -1; ++j < this.plotPairs[cp_i][i].length;) {
				var idStr = "viz" + cp_i + "-" + (j + base);
				if (document.getElementById(idStr) === null) {
					var c = dEl.cloneNode(false);
					c.style.top = (pOffsetTop + (adRows + Math.floor(j / cols)) * (height + 2 * padding)) + "px";
					c.style.left = (pOffsetLeft + (j % cols) * (width + 2 * padding)) + "px";
					c.id = idStr;
					lastTop = (pOffsetTop + (adRows + Math.floor(j / cols)) * (height + 2 * padding) + height + 2 * padding /* the last row's height */);
					$("#" + ids[i]).append(c);
				}
			}

			if (i === 3) { rowNum = adRows;}
		}

		// Reposition custom vizzes if the # of rows in this.plotPairs[cp_i][0] ... [2] has changed
		/*
		var baseLen = this.plotPairs[cp_i][0].length + this.plotPairs[cp_i][1].length + this.plotPairs[cp_i][2].length;
		this.plotPairs[cp_i][3].forEach((pair, i) => {
			var div = document.getElementById("viz" + cp_i + "-" + (baseLen + i));
			div.style.top = (div.style.top + (rowNum - this.prevRowNum + 1) * (height + 2 * padding)) + "px";
		});

		this.prevRowNum = rowNum;
		*/
	}

	// Return the correct div index for left-aligned triangular matrix
	// The term pad appears b/c it's almost like padding the right of
	// each row to adjust for row-switches
	vizMatrixPad(cp_i, i) {
		let w = this.matrixPlotPairs[cp_i][0].length;
		let sum = w;
		for (let ii = w; --ii > 0;) {
			if (sum <= i && i < sum + ii) {
				return i + (w - ii ) * w - sum;
			} else {
				sum += ii;
			}
		}
		return i;
	}

	//////////////////////////////////////
	// Create the scatterplot matrix vis
	//////////////////////////////////////
	createVis(debugData, otherDebugData, cp_i, tc_i, derivedExprPairs) {
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
		var data = data2.concat(data1);

		// Visualization will not connect how variable names have been changed
		var varDataSet1 = debugData.localVarNames;
		var varDataSet2 = otherDebugData.localVarNames;
		// Combine sets
		var varData = Array.from(new Set(function*() { yield* varDataSet1; yield* varDataSet2; }()));

		var width = 200,
			height = 200,
			padding = 40;

		var domainByVarName = {};

		// NOTE: Using varData, compute how many plots there are & create individual divs for each of them
		//       Special values such as @execution step and @line no. are excluded at this stage to prevent
		//       them from getting plotted.
		this.computePlotNumbers(cp_i, varData, derivedExprPairs);
		if (this.onFlowView) { this.addRemoveDivs(cp_i); }
		else { this.addRemoveDivsMatrix(cp_i); }

		// After executing computePlotNumbers(), add derivedExprPairs' y-variable names
		// to varData to plot
		varData.push("@line no.");
		varData.push("@execution step");
		varData = varData.concat(derivedExprPairs.map((e) => e.y));
		varData = varData.concat(this.plotPairs[cp_i][3].map((e) => e.y));
		varData.forEach(function (name) {
			var tmpDomain = d3.extent(data, function(d) { return d[name]; });
			if (tmpDomain[0] === tmpDomain[1]) { // If there's only value in the domain, extend it
												 // by including its -1 and +1 values
				domainByVarName[name] = [tmpDomain[0] - 1, tmpDomain[1] + 1];
			} else {
				domainByVarName[name] = tmpDomain;
			}
		});
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
		    
		xAxis.innerTickSize(width);
		yAxis.innerTickSize(-height);
		var brush = d3.svg.brush()
				    .x(x)
				    .y(y)
				    .on("brushstart", brushStart)
				    .on("brush", (p) => { // Highlight the selected circles.
						var e = brush.extent();
						var brushedCircleLines1 = new Set();
						var brushedCircleLines2 = new Set();
						var select = this.onFlowView ? d3.selectAll("svg[id^='viz" + cp_i + "-']") : d3.selectAll("svg[id^='matrix-viz" + cp_i + "-']");
						select.selectAll("circle").classed("hidden", function(d) {
							// NOTE: e[0][0] = x0, e[0][1] = y0, e[1][0] = x1, e[1][1] = y1,
							// 		 where [x0, y0] is the top-left corner
							// 		 and [x1, y1] is the bottom-right corner
							if (e[0][0] > d[p.x] || d[p.x] > e[1][0]
							|| e[0][1] > d[p.y] || d[p.y] > e[1][1]) {
								// Hide the circles
								return true;
							}

							d["@current"] ? brushedCircleLines1.add(d["@line no."])
										  : brushedCircleLines2.add(d["@line no."]);
							return false;
						});

						this.removeMouseupGutterHighlights();
						this.highlightCodeLines(Array.from(brushedCircleLines1));
						this.highlightCodeLinesInDiffView(Array.from(brushedCircleLines2));
				    })
				    .on("brushend", (p) => { // If the brush is empty, select all circles.
				    	if (brush.empty()) {
							var select = this.onFlowView ? d3.selectAll("svg[id^='viz" + cp_i + "-']") : d3.selectAll("svg[id^='matrix-viz" + cp_i + "-']");
				    		select.selectAll(".hidden").classed("hidden", false);
				    		this.removeMouseupGutterHighlights();
				    		this.dehighlightPrevCodeLinesInDiffView();
				    	}
				    });
		let scatterPlotMatrixVizLen = this.checkpointScatterplotMatrixVizNumber[cp_i];
		let customVizLen = this.plotPairs[cp_i][3].length;
		let len = this.onFlowView ? this.checkpointVizNumber[cp_i] : scatterPlotMatrixVizLen + customVizLen;
		for (let i = -1; ++i < len;) {
			var xVar = "";
			var yVar = "";
			var select = null;
			let paddedI = -1;
			if (this.onFlowView) {
				xVar = this.vizIndexToPlotPair(cp_i, i).x;
				yVar = this.vizIndexToPlotPair(cp_i, i).y;
				
				d3.select("#viz" + cp_i + "-" + i + "-svg").remove(); // Remove the old SVG
				select = d3.select("#viz" + cp_i + "-" + i);
			} else {
				xVar = this.vizIndexToPlotPairMatrix(cp_i, i).x; // vizIndexToPlotPairMatrix() function works with any i
				yVar = this.vizIndexToPlotPairMatrix(cp_i, i).y;

				if (i < scatterPlotMatrixVizLen) {
					paddedI = this.vizMatrixPad(cp_i, i);
					d3.select("#matrix-viz" + cp_i + "-" + paddedI + "-svg").remove(); // Remove the old SVG, if there was one
					select = d3.select("#matrix-viz" + cp_i + "-" + paddedI);
				} else {
					d3.select("#matrix-viz" + cp_i + "-custom-" + (i - scatterPlotMatrixVizLen) + "-svg").remove();
					select = d3.select("#matrix-viz" + cp_i + "-custom-" + (i - scatterPlotMatrixVizLen));
				}
			}

			// Create the new SVG
			var svg = select.append("svg")
					    .attr("id", () => {
					    	if (this.onFlowView) {
					    		return "viz" + cp_i + "-" + i + "-svg";
					    	} else {
								if (i < scatterPlotMatrixVizLen) {
									return "matrix-viz" + cp_i + "-" + paddedI + "-svg";
								} else {
									return "matrix-viz" + cp_i + "-custom-" + (i - scatterPlotMatrixVizLen) + "-svg";
								}
					    		
					    	}
					    })
						.attr("width", width + 2 * padding)
						.attr("height", height + 2 * padding)
						.attr("transform", "translate(" + padding + "," + padding + ")");

			svg.selectAll(".x.axis")
				.data([xVar])
			.enter().append("g")
				.attr("class", "x axis")
				.attr("transform", function(d,i) { return "translate(" + padding + ",0)"; })
				.each(function(d) {
					x.domain(domainByVarName[d]);
					d3.select(this).call(xAxis);
					// X-axis label
					d3.select(this)
						.append("text")
						.attr("transform", "translate(" + (width / 2 - 50) + "," + (height + padding + 5) + ")")
						.attr("font-size", "18px")
						.text(d);
				});

			svg.selectAll(".y.axis")
				.data([yVar])
			.enter().append("g")
				.attr("class", "y axis")
				.attr("transform", function(d, i) { return "translate(" + padding + ",0)"; })
				.each(function(d) {
					y.domain(domainByVarName[d]);
					d3.select(this).call(yAxis);
					// Y-axis label
					d3.select(this)
						.append("text")
						.attr("transform", "translate(" + (5 - padding) + "," + height / 2 + ")rotate(-90)")
						.style("text-anchor", "middle")
						.attr("font-size", "18px")
						.text(d);
				});

			var cell = svg.selectAll(".cell")
						.data(this.exclusiveCross([xVar, yVar]))
					.enter().append("g")
						.attr("class", "cell")
						.attr("transform", function(d, i) { return "translate(" + padding + ",0)"; });

			cell.call(brush);
			cell.each(plot);

			cell.selectAll("circle")
			    .on("mouseover", function() {
			    	return tooltip.style("visibility", "visible");
			    })
		  		.on("mousemove", (d) => {
		  			this.removeMouseupGutterHighlights();
		  			d["@current"] ? this.highlightCodeLines([d["@line no."]])
		  						  : this.highlightCodeLinesInDiffView([d["@line no."]]);
		  						  /*
		  			//var svg = d3.select("#viz" + cp_i + "-" + this.plotPairToVizIndex)
		  			var coordinates = d3.mouse(svg.node()); // position relative to the svg element
		  			console.log(d);
		  			console.log(xVar, yVar);
		  			console.log(coordinates, tooltip.style("top"));
		  			console.log(document.elementFromPoint(coordinates[0], coordinates[1]));

		  			var tooltipHTML = "<p>\
		  								<strong>" + xVar + ": " + d[xVar] + "</strong>\
		  							   </p>\
		  							   <p>\
		  							    <strong>" + yVar + ": " + d[yVar] + "</strong>\
		  							   </p>";
		  			tooltip.html(tooltipHTML);

		  			return tooltip.style("top", coordinates[1] + "px")
		  						  .style("left", coordinates[0] + "px");
		  						  */
		  		})
		  		.on("mouseout", () => {
		  			this.removeMouseupGutterHighlights();
		  			this.dehighlightPrevCodeLinesInDiffView();
		  			return tooltip.style("visibility", "hidden");
		  		});

			var svgContainer = null;
			if (this.onFlowView) {
				svgContainer = d3.select("#viz" + cp_i + "-" + i);
			} else {
				if (i < scatterPlotMatrixVizLen) {
					svgContainer = d3.select("#matrix-viz" + cp_i + "-" + i);
				} else {
					svgContainer = d3.select("#matrix-viz" + cp_i + "-custom-" + (i - scatterPlotMatrixVizLen));
				}
			}
			var tooltip = svgContainer.append("div")
									  .style("position", "absolute")
									  .style("z-index", "1001")
									  .style("visibility", "hidden");
		}
		var brushCell;
		function brushStart(p) {
			// Clear the previously-active brush, if any.
			if (brushCell !== this) {
				d3.select(brushCell).call(brush.clear());
				x.domain(domainByVarName[p.x]);
				y.domain(domainByVarName[p.y]);
				brushCell = this;
			}
		}
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

			// Cross for other data
			cell.selectAll("path")
			    .data(data)
			  .enter().append("path")
			  .filter(function(d) { return (d[p.x] !== undefined) && (d[p.y] !== undefined) && !d["@current"]; })
			  	.attr("d", d3.svg.symbol()
			  		.size(function(d) { return 5 * 5; }) // size in square pixels
			  		.type(function(d) { return "diamond"; }))
			  	.attr("transform", function(d) { return "translate(" + x(d[p.x]) + "," + y(d[p.y]) +")"; })
			    .style("fill", function(d) { return d3.rgb(82,209,255,0.2); });

			// Dot for current data
			cell.selectAll("circle")
			    .data(data)
			  .enter().append("circle")
			  .filter(function(d) { return (d[p.x] !== undefined) && (d[p.y] !== undefined) && d["@current"]; })
			    .attr("cx", function(d) { return x(d[p.x]); })
			    .attr("cy", function(d) { return y(d[p.y]); })
			    .attr("r", 3)
			    .style("fill", function(d) { return d3.rgb(255,127,80,0.2); });
		}
	}

	dehighlightPrevCodeLinesInDiffView() {}

	highlightCodeLines(lineNumbers) {
		this.addMouseupGutterHighlights(lineNumbers.map((v, i) => v - 1));
	}

	highlightCodeLinesInDiffView(lineNumbers) {}

	displayDiffCodePanelContent(codeStr) {
		$("#python-tutor-viz-panel-switch").trigger("click"); // Show the code diff panel

		var pre = document.createElement("pre");
		var preS = "<pre id='diff-code-panel-pre'>"
				 	+ codeStr
				 + "</pre>";
		pre.innerHTML = preS;
		$("#diff-code-panel-content").html(pre.firstChild);

		// For line-numbered <pre> elements
	    var pre = document.getElementById("diff-code-panel-pre");
        pre.innerHTML = '<span class="line-number"></span>' + pre.innerHTML + '<span class="cl"></span>';
        var num = pre.innerHTML.split(/\n/).length;
        for (let i = -1; ++i < num;) {
            var line_num = pre.getElementsByTagName('span')[0];
            line_num.innerHTML += '<span>' + (i + 1) + '</span>';
        }
	}
	
	updateHistory(cp_i, tc_i, newData) {
		this.history[cp_i].push(newData);

		this.historySVGs[cp_i].selectAll("circle")
			.data(this.history[cp_i]).enter()
			.append("circle")
				.attr("r", 6)
				.attr("cx", (d) => { return this.history[cp_i].length * (6 + 14); })
				.attr("cy", (d) => { return 5; })
				.style("fill", (d) => {
					return d.result ? d3.rgb(51,255,51) : d3.rgb(255,51,51);
				})
				.on("mouseover", (d, i) => {
					this.historySVGs[cp_i].append("line")
										.attr("x1", (i + 1) * (6 + 14) - 6)
										.attr("y1", 22)
										.attr("x2", (i + 1) * (6 + 14) + 6)
										.attr("y2", 22)
										.attr("stroke-width", 3)
										.attr("stroke", "grey");
				})
				.on("mouseout", (d, i) => {
					this.historySVGs[cp_i].selectAll("line").remove();
				})
				.on("click", (d, i) => {
					if (this.currentHistSelection !== i) {
						this.currentHistSelection = i;
						// Remove existing circles
						this.historySVGs[cp_i].selectAll("circle.clicked").remove();
						this.historySVGs[cp_i].append("circle")
											.attr("class", "clicked")
											.attr("r", 10)
											.attr("cx", (i + 1) * (6 + 14))
											.attr("cy", 5)
											.attr("stroke-width", 2)
											.attr("stroke", "grey")
											.style("fill", "none");	
						//this.createVis(this.debugData, d, cp_i, 0);
						this.displayDiffCodePanelContent(diffString(d.code, this.debugData.code));
					} else {
						// Clicked the same history again -- remove it
						this.currentHistSelection = -1; // set it to an initial value to enable the same selection again
						this.historySVGs[cp_i].selectAll("circle.clicked").remove();
						this.createVis(this.debugData, {dataArray: [], localVarNames: []}, cp_i, 0);
						$("#diff-code-panel-switch").trigger("click"); // Hide the code diff panel
					}
				});

		// Add text number labels
		this.historySVGs[cp_i].selectAll("text")
			.filter(function(d) { return false; }) // TODO3/7: Seems like without this, everything's filtered... weird
			.data([0]).enter() // Otherwise the label appends the length of this.history[cp_i] times
			.append("text")
				.attr("x", (d) => { return this.history[cp_i].length * (6 + 14); })
				.attr("y", (d) => { return 5; })
				.text(String(parseInt(tc_i) + 1));
	}

	// Also, debouncing and auto code save + syntax error visualization
	startHistory(cp_i) {
		var n = 243,
		    duration = 750,
		    now = new Date(Date.now() - duration),
		    count = 0,
		    data = d3.range(n).map(function() { return 0; }),
		    allData = d3.range(n).map(function() { return 0; });

		var padding = 10,
			width = screen.width - 2 * padding,
			height = 60;

		var x = d3.time.scale()
		    .domain([now - (n - 2) * duration, now - duration])
		    .range([0, width]);

		var y = d3.scale.linear()
		    .range([height, 0]);

		var line = d3.svg.line()
		    .interpolate("basis")
		    .x(function(d, i) { return x(now - (n - 1 - i) * duration); })
		    .y(function(d, i) { return y(d); });

		var svg = this.historySVGs[cp_i];

		svg.append("defs").append("clipPath")
		    .attr("id", "clip")
		  .append("rect")
		    .attr("width", width)
		    .attr("height", height);

		var axis = svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(x.axis = d3.svg.axis().scale(x).orient("bottom"));

		var path = svg.append("g")
		    .attr("clip-path", "url(#clip)")
		  .append("path")
		    .datum(data)
		    .attr("class", "line");

		var transition = d3.select({}).transition()
		    .duration(750)
		    .ease("linear");

		(function tick() {
		  transition = transition.each(
		  	function() {
				// update the domains
				now = new Date();
				x.domain([now - (n - 2) * duration, now - duration]);
				y.domain([0, d3.max(data)]);
				// push the accumulated count onto the back, and reset the count
				data.push(Math.min(30, count));
				allData.push(Math.min(30, count));

				count = 0;
				// redraw the line
				svg.select(".line")
				    .attr("d", line)
				    .attr("transform", null);
				// slide the x-axis left
				axis.call(x.axis);
				// slide the line left
				path.transition()
				    .attr("transform", "translate(" + x(now - (n - 1) * duration) + ")");
				// pop the old data point off the front
				data.shift();
		  }).transition().each("start", tick);
		})();
	}

	showHistory(cp_i) {
		if (!this.historyStarted) {
			this.startHistory(cp_i);
			this.historyStarted = true;
		}

		if (this.prevShownHistoryIdx > -1) {
			this.historySVGDivs[this.prevShownHistoryIdx].attr("style", "display: none;");
		}
		this.historySVGDivs[cp_i].attr("style", "display: block;");
		this.prevShownHistoryIdx = cp_i;
	}

	handleVisualDebugRequestWithCustomVar(mode, checkpoint, testcase, vars) {
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
		this.debugData["code"] = this.editorObj.code;
		this.createCustomVis(checkpoint, vars);
	}

	handleVisualDebugRequest(mode, checkpoint, testcase, result, derivedExprPairs) {
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
		this.createVis(this.debugData, {dataArray: [], localVarNames: []}, checkpoint, testcase, derivedExprPairs);
		//this.createPythonTutorViz(checkpoint, testcase);

		//this.showHistory(checkpoint);
		this.debugData["result"] = result;
		this.debugData["code"] = this.editorObj.code;
		//this.updateHistory(checkpoint, testcase, this.debugData);
	}

	// Create the last step PythonTutor visualization
	createPythonTutorViz(cp_i, tc_i) {
		var len = this.debugData.dataArray.length;
		if (len === 0) { return; }

		// Remove div
		$("#PythonTutor-viz-div").html("");

		var id = "PythonTutor-viz-div-0";
		var divS = "<div id='" + id + "'></div>";
		var div = document.createElement("div");
		div.innerHTML = divS;
		$("#PythonTutor-viz-div").append(div.firstChild);
		var step = (this.debugData.dataArray[len-1])["@execution step"];
		addVisualizerToPage(
			{
				"code": this.editorObj.code,
				"trace": this.runResults[cp_i][tc_i][0]
			},
			id,
			{ startingInstruction: step, hideCode: true }
		);
	}

	sendRunRequestAndVisualizeCustomVar(URL, dataObj, mode, cp_idx, tc_idx, vars) {
		$.post({
			url: URL,
			data: JSON.stringify(dataObj),
			success: (data) => {
				$("#state" + cp_idx + "-" + tc_idx).html("<i>Done</i>"); // checkpoint status
				this.runStatus.html("<i>Done</i>");
				setTimeout(() => {
					$("#state" + cp_idx + "-" + tc_idx).fadeOut();
					this.runStatus.fadeOut();
				}, 2000);

				var json = JSON.parse(data);
				console.log(json);
				if (mode === RUN_ALL_TESTS_COMMAND) {
					this.runResults = json.results;
				} else if (mode === RUN_TEST_COMMAND) {
					this.runResults[cp_idx][tc_idx] = json.results[cp_idx][tc_idx];
				}
				// Visualization function
				this.handleVisualDebugRequestWithCustomVar(mode, cp_idx, tc_idx, vars);
			},
			error: (req, status, err) => {
				console.log(err);
			},
			dataType: 'text',
			contentType: 'application/json'
		});
	}

	// Derive expressions for REF type variables
	// Also store all numeric and derived variable names in this.varNames;
	deriveExprs(cp_i, tc_i, json) {
		let results = json.results[cp_i][tc_i][0];
		let heapVarsObj = {};
		let varNameSet = new Set();
		let plotPairs = [];
		let execution_step = "@execution step";

		if (!Array.isArray(results)) { return plotPairs; }

		results.forEach((res, i) => {
			let stackF = res["stack_to_render"];
			let heap = res["heap"];
			if (stackF) {
				stackF.forEach((f, j) => {
					let localsObj = f["encoded_locals"];
					if (localsObj) {
						Object.keys(localsObj).forEach((varName, k) => {
							if (Array.isArray(localsObj[varName])) {
								// Check if the local variable's a REF type
								if (localsObj[varName][0] === "REF") {
									let localVarID = localsObj[varName][1];
									// Get the type of the REF in heap
									let heapData = heap[localVarID];
									if (heapData && Array.isArray(heapData)) {
										let type = heapData[0];
										let numeric = false;
										if (heapData.length > 1) {
											// Non-empty list, tuple, set, dict
											if (heapData[1] && Array.isArray(heapData[1])) {
												if (heapData[1].length === 2 && heapData[1][0] === "REF") {
													// Multi-dimensional list
												} else {
													// dict
													numeric = heapData.slice(1).map(x => typeof x[1] === "number").reduce((pre, cur) => pre && cur);
												}
											} else {
												// tuple, list, set
												numeric = heapData.slice(1).map(x => typeof x === "number").reduce((pre,  cur) => pre && cur);
											}	
										}
										heapVarsObj[varName] = {type: type, numeric: numeric};
										varNameSet.add(varName); // Any heap variable name's added to the set
									}
								}
							} else {
								varNameSet.add(varName);
							}
						});
					}
				});
			}
		});

		Object.keys(heapVarsObj).forEach((varName, i) => {
			// Var names are distinctive since we overwrite3 the existing name's type with the more recent one's type
			// in the loop above, 
			let type = heapVarsObj[varName].type;
			let numeric = heapVarsObj[varName].numeric;
			let exprs = [];
			if (type === "LIST") {
				exprs.push("len(" + varName + ")");
				if (numeric) exprs.push("sum(" + varName + ")");
			} else if (type === "TUPLE") {
				exprs.push("len(" + varName + ")");
				if (numeric) exprs.push("sum(" + varName + ")");
			} else if (type === "SET") {
				exprs.push("len(" + varName + ")");
				if (numeric) exprs.push("sum(" + varName + ")");
			} else if (type === "DICT") {
				exprs.push("len(" + varName + ")");
				if (numeric) exprs.push("sum(" + varName + ".values())");
			} else if (type === "INSTANCE") {
			} else if (type === "ISNTANCE_PRINT") {
			} else if (type === "CLASS") {
			} else if (type === "FUNCTION") {
			} else if (type === "module") {
			} else if (type === "REF") {
			} else {
				// Other type names
			}

			for (let i = -1; ++i < exprs.length;) {
				plotPairs.push({x: execution_step, y: exprs[i]});
			}
		});

		this.varNames = Array.from(varNameSet);
		return plotPairs;
	}

	sendRunRequestAndVisualize(URL, dataObj, mode, cp_i, tc_i, existingCustomVars) {
		$.post({
			url: URL,
			data: JSON.stringify(dataObj),
			success: (data) => {
				var json = JSON.parse(data);
				this.derivedExprPairs = this.deriveExprs(cp_i, tc_i, json);
				dataObj.derivedExprs = this.derivedExprPairs.map((e) => e.y);
				$.post({
					url: URL,
					data: JSON.stringify(dataObj),
					success: (data) => {
						json = JSON.parse(data);
						console.log(json);
						$("#state" + cp_i + "-" + tc_i).html("<i>Done</i>");
						this.runStatus.html("<i>Done</i>");
						setTimeout(() => {
							$("#state" + cp_i + "-" + tc_i).fadeOut();
							this.runStatus.fadeOut();
						}, 2000);
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
									$('#result' + cp_idx + '-' + testcase_idx).html(result);
									var testcaseResImg = $('#status-img' + cp_idx + '-' + testcase_idx);
									// Numeric test result -- then it returned 1.0 or 1 shouldn't matter?
									if (!isNaN(Number.parseInt(testcase.want))) {
										if (correct = (Number.parseInt(testcase.want) === Number.parseInt(result))) {
											testcaseResImg.attr('src', '../images/success.png');
										} else {
											testcaseResImg.attr('src', '../images/error.png');
										}
									} else {
										if (correct = (testcase.want === result)) {
											testcaseResImg.attr('src', '../images/success.png');
										} else {
											testcaseResImg.attr('src', '../images/error.png');
										}
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

							// Update with the result value
							$('#result' + cp_idx + "-" + testcase_idx).html(result);

							// Update the status image
							var testcase = this.checkpoints[cp_idx].testCases[testcase_idx];										
							var testcaseResImg = $('#status-img' + cp_idx + "-" + testcase_idx);

							// Numeric test result -- then it returned 1.0 or 1 shouldn't matter?
							if (!isNaN(Number.parseInt(testcase.want))) {
								if (correct = (Number.parseInt(testcase.want) === Number.parseInt(result))) {
									testcaseResImg.attr('src', '../images/success.png');
								} else {
									testcaseResImg.attr('src', '../images/error.png');
								}
							} else {
								if (correct = (testcase.want === result)) {
									testcaseResImg.attr('src', '../images/success.png');
								} else {
									testcaseResImg.attr('src', '../images/error.png');
								}
							}
						}
						// Visualization function
						this.handleVisualDebugRequest(mode, cp_i, tc_i, correct, this.derivedExprPairs);
					},
					error: (req, status, err) => {
						console.log(err);
					},
					dataType: "text",
					contentType: "application/json"
				});
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
	// Note that the execution paths differ depending on 
	// whether or not the custom vars argument is empty
	// (one calls the visualization function for the default
	// viz and the other calls the visualization function
	// with custom vars)
	//////////////////////////////////////////////////////
	handleRunRequestWithCustomVars(mode=RUN_TEST_COMMAND, cp_i=-1, tc_i=-1, newCustomVars=[], existingCustomVars=[]) {
		var URL = LAB_URL + '/' + LAB_ID;
		var dataObj = {
			command: mode,
			code: this.editorObj.code,
			checkpoint: cp_i,
			testcase: tc_i,
			language: LAB_LANG,
			vars: newCustomVars.concat(existingCustomVars)
		};
		// Show the test case state span
		$("#state" + cp_i + "-" + tc_i).css("display", "inline");
		this.runStatus.css("display", "inline");

		if (mode === RUN_ALL_TESTS_COMMAND) {
			$("#state" + cp_i + "-" + tc_i).html("<i>Running ... </i>");
			this.runStatus.html("<i>Running ... </i>");
		} else if (mode === RUN_TEST_COMMAND) {
			$("#state" + cp_i + "-" + tc_i).html("<i>Running ... </i>");
			this.runStatus.html("<i>Running ... </i>");
		}

		if (newCustomVars.length === 0)
			this.sendRunRequestAndVisualize(URL, dataObj, mode, cp_i, tc_i, existingCustomVars);
		else
			this.sendRunRequestAndVisualizeCustomVar(URL, dataObj, mode, cp_i, tc_i, newCustomVars);
	}

	//////////////////////////////////////////////////////
	// Handle run requests. There are two modes
	// mode := [RUN_ALL_TESTS_COMMAND | RUN_TEST_COMMAND]
	//////////////////////////////////////////////////////
	handleRunRequest(mode=RUN_TEST_COMMAND, checkpoint=-1, testcase=-1) {
		if (checkpoint < 0) return; 
		this.handleRunRequestWithCustomVars(mode, checkpoint, testcase, [],
			this.plotPairs[checkpoint][3].map((e) => e.x).concat(this.plotPairs[checkpoint][3].map((e) => e.y)));
	}

	addSaveBtnHandler() {
		this.saveBtn.on("click", (e) => {
			var URL = LAB_URL + '/' + LAB_ID;
			var dataObj = {
				command: SAVE_COMMAND,
				userName: USER_NAME,
				checkpointStatus: {},
				code: this.editorObj.code,
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
					// Currently in no use, so I commented these two lines out
					// $("#checkpoint-status" + {needs a checkpoint number}).text(savedAt);
					// $("#checkpoint-status" + {needs a checkpoint number}).css("display", "inline");
					setTimeout(() => {
						// $("#checkpoint-status" + {needs a checkpoint number}).fadeOut();
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
		let redGutter = "redGutter";
		this.prevSyntaxErrorRanges.forEach((range, _) => {
			this.editor.session.removeGutterDecoration(range.start.row, redGutter);
		});
	}

	removeCommentGutterHighlights() {
		let commentIndicationStyle = 'greyGutter';
		this.prevCommentRows.forEach((row, _) => {
			this.editor.session.removeGutterDecoration(row, commentIndicationStyle);
		});
	}

	addModalHandlers() {
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
		let done = true;
		for (var ckpt of this.checkpoints) {
			done &= ckpt.done;
		}
		return done;
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
		var padding = 10,
			width = screen.width - 2 * padding,
			height = 90;

		this.checkpoints.forEach((cp, cp_i) => {
			this.history[cp_i] = [];
			this.historySVGDivs[cp_i] = $("#history-div" + cp_i);
			this.historySVGs[cp_i] = d3.select("#history-div" + cp_i).append("svg")
										.attr("width", width)
										.attr("height", height);
		});
	}

	initVizNumbers() {
		this.checkpoints.forEach((cp, cp_i) => {
			this.checkpointVizNumber[cp_i] = 0;
			this.checkpointScatterplotMatrixVizNumber[cp_i] = 0;
		});
	}

	prepareVizPairArray() {
		this.checkpoints.forEach((cp, cp_i) => {
			this.plotPairs[cp_i] = [];
			for (let i = -1; ++i < 4;) {
				this.plotPairs[cp_i][i] = [];
			}

			this.matrixPlotPairs[cp_i] = [];
			for (let i = -1; ++i < 2;) {
				this.matrixPlotPairs[cp_i][i] = [];
			}
		});
	}

	initializeVizPairArrayExceptCustomPairs(cp_i) {
		if (this.plotPairs[cp_i].length < 4) { return; }
		for (let i = -1; ++i < 3;) {
			this.checkpointVizNumber[cp_i] -= this.plotPairs[cp_i][i].length;
			this.plotPairs[cp_i][i] = [];
		}
	}

	addTestSpecifications() {
		this.checkpoints.forEach((cp, cp_i) => {
			var fNameAry = cp.name.split(".");
			if (fNameAry.length !== 2) { return; }
			var fName = fNameAry[1];

			if (cp.testCases === undefined) { return; }
			cp.testCases.forEach((tc, tc_i) => {
				var specAry = tc.source.split(fName);
				if (specAry.length !== 2) { return; }
				var argStr = specAry[1];
				var arg = argStr.trim().split(/\(|\)/).filter((e) => e !== "");
				if (arg.length !== 1) { return; } // ill-formed test source
				$("#input" + cp_i + "-" + tc_i).html(arg[0]);
				$("#output" + cp_i + "-" + tc_i).html(tc.want);
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

						this.addCustomVisBtnHandler();

						// Initialize test case specifications (i.e. input, output)
						this.addTestSpecifications();

						// Initializes the results array with appropriate dimensions
						this.initializeResultsArray();

						// Initializes the viz pair array
						this.initPlotPairs();

						// Initializes the number of vizzes for each checkpoint
						this.checkpoints.forEach((cp, cp_i) => {
							this.initVizNumbers(cp_i);
						});
						
						this.userData = data.userData;
						this.editor.setValue(data.userData.code, -1); // Set value without selecting the entire editor content
						// TODO: Why creating a new object everytime?
						//var testParser = new TestParser(this.userData.code);
						//var parsedObj = testParser.parse();
						//this.editorObj.code = parsedObj.code; // inject the last saved code w/o test cases
						
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
		this.contextMenuWithDebug = $("#context-menu-with-debug");
		this.contextMenuWithDebugHighlight = $("#context-menu-with-debug-highlight");
	}

	collectTooltip() {
		this.tooltip = $("#tooltip");
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
				return !((start <= (d["@line no."] - 1) && (d["@line no."] - 1) <= end));
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

	showPlots(plotPairs) {
		if (Array.isArray(plotPairs)) {
			let mainPlotPairs = plotPairs.slice(0, plotPairs.length - 1);
			let cp_i = this.menuClickID.checkpoint;
			let cnt = 0;
			for (let i = -1; ++i < mainPlotPairs.length;) {
				for (let j = -1; ++j < mainPlotPairs[i].length;) {
					if (plotPairs[i][j]) {
						if (this.onFlowView) {
							$("#viz" + cp_i + "-" + cnt).show();
						} else {
							$("#matrix-viz" + cp_i + "-" + this.vizMatrixPad(cp_i, cnt)).show();
						}
					}
					++cnt;
				}
			}

			let customPlotPairs = plotPairs.slice(plotPairs.length - 1)[0];
			for (let i = -1; ++i < customPlotPairs.length;) {
				if (customPlotPairs[i]) {
					if (this.onFlowView) {
						$("#viz" + cp_i + "-" + cnt).show();
					} else {
						$("#matrix-viz" + cp_i + "-custom-" + i).show();
					}
				}
				++cnt;
			}			
		}
	}

	hideAllPlots() {
		let cp_i = this.menuClickID.checkpoint;
		if (this.onFlowView) {
			$("div[id^='viz" + cp_i + "-" + "']").each((_, el) => {
				$(el).hide();
			});
		} else {
			$("div[id^='matrix-viz" + cp_i + "-" + "']").each((_, el) => {
				$(el).hide();
			});
		}
	}

	showAllPlots() {
		let cp_i = this.menuClickID.checkpoint;
		if (this.onFlowView) {
			$("div[id^='viz" + cp_i + "-" + "']").each((_, el) => {
				$(el).show();
			});			
		} else {
			$("div[id^='matrix-viz" + cp_i + "-" + "']").each((_, el) => {
				$(el).show();
			});
		}
	}

	addEditorMouseupListener() {
		// The semantics:
		//   Only when the mouseup event was followed after a dragging event
		//   (some text was selected) does the gutter highlight and the viz
		//   filtering get performed. A mouseup event without dragging (i.e.
		//   a simple click on the editor) or a mouseup dragging event that 
		//   selects the same lines of code releases the highlight and the
		//   filter
		$("#editor").mouseup((e) => {
			e.preventDefault();
			let cp_i = this.menuClickID.checkpoint;
			let tc_i = this.menuClickID.testcase;

			let line_idx = [this.editor.selection.getRange().start.row, this.editor.selection.getRange().end.row];
			let start = line_idx[0];
			let end = line_idx[1];

			let textSelected = this.editor.getSession().doc.getTextRange(this.editor.selection.getRange()) !== "";
			this.textSelected = textSelected;
			let isOneLine = start === end;
			let clickMadeInPrevRangeNext = this.convertToIndexArray(line_idx).every((v, i) => v === this.isMouseupHighlightedLineIndices[i]);

			let shouldFilter = textSelected && !this.isMouseupHighlighted;
			// !textSelected && isOneLine will hold in a normal situation with clicking on a line in the editor
			// this.isMouseupHighlighted && clickMadeInPrevRangeNext is necessary since there's a DOM event
			// mismatch within the editor it seems. When a mouse click happens in the range of a previously
			// selected range, it will still return the same range of text as selected, which isn't true.
			let shouldRelease = (!textSelected && isOneLine) || (this.isMouseupHighlighted && clickMadeInPrevRangeNext);

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

				// TODO3/9: Send a request to the server with the current selection's start and end position
				// as well as the entire code to parse, and return a list of variables included in that
				// area of code. Use these variables (+ other special variables such as @execution step, @line no.,
				// @return) to hide coordinates that do not include those variables and their derived ones.
				//   For each variable expression in plotPair, use the parser to retrieve variable names
				// and then if these variable names contain the ones in selection, leave the plot as-is.
				// Otherwise, hide it.

				// Filtering does not change. It still applies on top of variable parsing above.
				// And it's independent of whether or not the POST request above has finished.
				// Hence, it doesn't have to be in the success callback.
				let single_line_exec_steps = new Set(),
					multi_line_exec_steps = new Set();
				if (this.onFlowView) {
					d3.selectAll("[id^='viz" + cp_i + "']").select("svg")
						.selectAll("circle")
						.each(function(d) {
							if (start === end) { // single line selection
								if (d["@line no."] - 1 === end) { single_line_exec_steps.add(d["@execution step"]); }
							} else { // multi line selection
								if (start <= d["@line no."] - 1 && d["@line no."] - 1 <= end) { multi_line_exec_steps.add(d["@execution step"]); }
							}
						});
				} else {
					d3.selectAll("[id^='matrix-viz" + cp_i + "']").select("svg")
						.selectAll("circle")
						.each(function(d) {
							if (start === end) { // single line selection
								if (d["@line no."] - 1 === end) { single_line_exec_steps.add(d["@execution step"]); }
							} else { // multi line selection
								if (start <= d["@line no."] - 1 && d["@line no."] - 1 <= end) { multi_line_exec_steps.add(d["@execution step"]); }
							}
						});
				}
			
				let exec_steps_plus_one = (start === end) ? Array.from(single_line_exec_steps).map(x => x + 1)
														  : Array.from(multi_line_exec_steps).map(x => x + 1);
				if (this.onFlowView) {
					d3.selectAll("[id^='viz" + cp_i + "']").select("svg")
						.selectAll("circle").classed("hidden", function(d) {
							if (exec_steps_plus_one.includes(d["@execution step"])) {
								return false;
							} else {
								return true;
							}
						});
				} else {
					d3.selectAll("[id^='matrix-viz" + cp_i + "']").select("svg")
						.selectAll("circle").classed("hidden", function(d) {
							if (exec_steps_plus_one.includes(d["@execution step"])) {
								return false;
							} else {
								return true;
							}
						});
				}

				let dataObj = {
					command: FILTER_PLOT_COMMAND,
					code: this.editorObj.code,
					range: {
						start: {
							row: start,
							col: this.editor.selection.getRange().start.column,
						},
						end: {
							row: end,
							col: this.editor.selection.getRange().end.column
						}
					},
					plotPairs: this.plotPairs[cp_i],
					matrixPlotPairs: this.matrixPlotPairs[cp_i][0],
					onFlowView: this.onFlowView,
					varNames: this.varNames
				};

				$.post({
					url: LAB_URL + "/" + LAB_ID,
					data: JSON.stringify(dataObj),
					success: (data) => {
						this.hideAllPlots();
						this.showPlots(data.filteredPlotPairs);
					},
					error: (req, status, err) => {
						console.log(err);
					},
					dataType: "json",
					contentType: "application/json"
				});
				// Highlight the gutter in the editor
				this.addMouseupGutterHighlights(this.convertToIndexArray(line_idx));

				// Hide all the data points from the comparison (data from the history)
				d3.selectAll("[id^='viz" + cp_i + "']").select("svg")
					.selectAll("path").classed("hidden", true);

				// Add PythonTutor visualization only if runResults has been set
				// and if the selection is a single line.
				if (cp_i > -1 && tc_i > -1 && this.runResults[cp_i][tc_i][0] !== null
					&& start === end) {
					// Prevent any pre-existing visual cues (if any)
					this.toggleTooltipOff();
					this.toggleTooltipOn();
					this.positionMenu(e);

					this.tooltip.html(""); // Clean up the previous visualization

					exec_steps_plus_one.forEach((step, i) => {
						let id = "PythonTutor-viz-div-" + i;
						let div = document.createElement("div");
						div.id = id;
						this.tooltip.append(div);
						addVisualizerToPage(
							{
								"code": this.editorObj.code,
								"trace": this.runResults[cp_i][tc_i][0]
							},
							id,
							{ startingInstruction: step, hideCode: true }
						);
					});
					// Adjust the height of the tooltip to fit in the screen
					let hPadding = 20;
					if (this.tooltip.height() + this.tooltip.offset().top > $(window).height()) {
						this.tooltip.height($(window).height() - this.tooltip.offset().top - hPadding);
					}
				}
			} else if (shouldRelease) {
				this.mouseReleaseOnEditorHandler();
			}
		});

		$("#diff-code-panel").mouseup((e) => {
			// The semantics of selection in the diff panel maybe doesn't really make sense
			e.preventDefault();
			let code = "";
			if (window.getSelection) { code = window.getSelection().toString(); }
			else if (document.selection && document.selection.type !== "Control") {
				code = document.selection.createRange().text;
			}
			// ...
		});
	}

	addClickListener() {
		document.addEventListener("click", (e) => {
			//e.preventDefault();

			let parentTestcaseHTMLDivArray = $(e.target).parents("div[id^='testcase-list-item']");
			if (parentTestcaseHTMLDivArray && parentTestcaseHTMLDivArray.length !== 0) {
				let parentDiv = parentTestcaseHTMLDivArray[0];
				// Dehighlight the previous selection
				this.dehighlightBackdrop(document.getElementById(
					"testcase-list-item" + this.menuClickID.checkpoint + "-" + this.menuClickID.testcase
				));

				// Highlight the new selection
				this.highlightBackdrop(parentDiv);

				let nums = parentDiv.id.split("testcase-list-item")[1].split("-");
				let cp_idx = nums[0];
				let tc_idx = nums[1];

				this.menuClickID = {checkpoint: cp_idx, testcase: tc_idx};

				// Run this testcase
				this.handleRunRequest(RUN_TEST_COMMAND, cp_idx, tc_idx);

				// Show the test case state span
				$("#state" + cp_idx + "-" + tc_idx).css("display", "inline");
			}
		});
	}

	addContextListener() {
		/* IE >= 9 */
		document.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			// Prevent any pre-existing visual cues (if any)
			this.toggleTooltipOff();
			this.dehighlightBackdrop(this.prevTestcaseHTMLDiv);
			var parentTestcaseHTMLDivArray = $(e.target).parents('div[id^="testcase-html-div"]');
			if (parentTestcaseHTMLDivArray && parentTestcaseHTMLDivArray.length !== 0) {
				// Dehighlight the previous selection from a click
				// Choose the closest parent from the parent selection above
				var testcaseHTMLDiv = parentTestcaseHTMLDivArray[0];

				// Highlight the new selection
				this.highlightBackdrop(testcaseHTMLDiv);

				// Update the previous selection with the new selection
				this.prevTestcaseHTMLDiv = testcaseHTMLDiv;

				// Extract the clicked menu IDs (e.g. checkpoint and testcase ID)
				this.menuClickID = this.parseIDsFromDiv(testcaseHTMLDiv);
			} else {
				//this.toggletooltipHighlightOn();
			}
			this.positionMenu(e);
		});

		document.addEventListener("click", (e) => {
			var button = e.which || e.button;
			if (button === 1) { // left mouse click
				if (e.target.id === this.askQuestionMenuID || e.target.id === this.askQuestionMenuIDDebug) {
					//var codeBlock = this.editor.getSession().doc.getTextRange(this.editor.selection.getRange());
					//this.showQuestionModal(codeBlock);
				} else if (e.target.id === this.viewHintMenuID || e.target.id === this.viewHintMenuIDDebug) {
					// TODO: implement me ...
				} else if (e.target.id === this.debugMenuID) {
					//this.handleDebugRequest();
				} else if (e.target.id === this.runTestcaseID) {
					// this.handleRunRequest(RUN_TEST_COMMAND, this.menuClickID.checkpoint, this.menuClickID.testcase);
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
					// this.updateHistory(this.menuClickID.checkpoint, this.menuClickID.testcase, this.debugData);
				} else if (e.target.id === this.highlightOnSelectionMenuID) {
					//this.highlightSelectedLines(this.menuClickID.checkpoint, this.menuClickID.testcase);
				} else if (e.target.id === this.dehighlightOnSelectionMenuID) {
					//this.dehighlightSelectedLines(this.menuClickID.checkpoint, this.menuClickID.testcase);
				} else {
					if (!this.textSelected) {
						this.toggleTooltipOff();
					}
				}
			} else {
				this.toggleTooltipOff();
			}
			return true;
		});
	}

	addKeyUpListner() {
		// Remove the context menu on pressing the ESC key
		window.onkeyup = (e) => {
			if (e.keyCode === 27) {
				// Close the context menu
				this.toggleTooltipOff();

				// Close the question modal
				//this.hideQuestionModal();

				// Close the debug modal
				//this.hideDebugModal();

				// Remove the testcase div highlighting too, as the selection is withdrawn
				//this.dehighlightBackdrop(this.prevTestcaseHTMLDiv);
			}
		};
	}

	toggleTooltipOn() {
		if (!this.isTooltipVisible) {
			this.isTooltipVisible = true;
			this.tooltip.addClass(this.activeClassName);
		}
	}

	///////////////////////////////////////////////
	// Name piggy-backing; the context menu
	// has been changed to support highlighting of
	// data points rather than debug highlighting
	///////////////////////////////////////////////
	toggletooltipHighlightOn() {
		if (!this.isTooltipVisible) {
			this.isTooltipVisible = true;

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
			this.tooltipHighlight.addClass(this.activeClassName);
		}
	}

	toggleTooltipOff() {
		if (this.isTooltipVisible) {
			this.isTooltipVisible = false;
			this.tooltip.removeClass(this.activeClassName);
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
		var clickCoords = this.getPosition(e);

		//var menuW = this.tooltip.width() + 4;
		//var menuH = this.tooltip.height() + 4;
		var menuW = this.tooltip.width();
		var menuH = this.tooltip.height();

		var windowW = window.innerWidth;
		var windowH = window.innerHeight;

		var wBuf = 10;
		var hBuf = 20;

		var styleStr = '';
		var styleStrDebugHighlight = '';

		if ((clickCoords.x - wBuf) < menuW) { // it goes out the right edge of the window
			styleStr += "left: " + "0px;";
		} else {
			styleStr += "left: " + (clickCoords.x - wBuf - menuW) + "px;";
		}

		if ((windowH - clickCoords.y) < menuH) {
			styleStr += "top: " + (windowH - menuH) + "px;";
		} else {
			styleStr += "top: " + (clickCoords.y + hBuf) + "px;";
		}

		this.tooltip.attr("style", styleStr);
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

