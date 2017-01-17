class AuthorController {
	constructor() {
		// Modal view related
		this.labIDInput = $('#lab-id-input');
		this.labIDModalStatus = $('#lab-id-modal-status');
		this.labIDGoBtn = $('#lab-id-go-btn');
		this.labIDModalDiv = $('#lab-id-modal-content');

		this.signupUserNameInput = $('#user-name-signup-input');
		this.signupUserPass1Input = $('#user-pass1-signup-input');
		this.signupUserPass2Input = $('#user-pass2-signup-input');
		this.signupBtn = $('#login-modal-signup-btn');
		this.signupStatus = $('#login-modal-signup-status');
		this.signupModalDiv = $('#signup-modal-content');
		this.labIDLink = $('#lab-id-link');

		// Status info
		this.labID = '';

		// Editor related
		this.editor = null;
		this.editorStatus = $('#editor-status');

		// Editor control related
		this.loadFileInput = $('#loadFileInput');

		// Console related
		this.console = $('#console');
		this.consoleObj = null;
		this.consoleClear = $('#console-clear');

		// Debugger related
		this.debuggerViewDiv = $('#debugger-view-div');
		this.debuggerRangeSlider = $('#debugger-range-slider');
		this.debuggerRangeSliderSpan = $('#debugger-range-slider-span');
		this.debugTraces = [];
		this.debugStr = '';

		// Lab doc panel
		this.labDoc = $('#lab-doc');

		this.init();
	}

	setStatus(labID) {
		this.labID = labID;
	}

	init() {
		this.addModalHandlers();
		this.addBtnHandlers();
		this.initEditor();
		//this.initConsole();
		//this.initDebugger();
	}

	get code() {
		return this.editor.getSession().getValue();
	}

	set code(value) {
		this.editor.setValue(value);
	}

	initEditor() {
		this.editor = ace.edit("editor");
		this.editor.getSession().setMode('ace/mode/python');
		this.editor.setShowPrintMargin(false); // vertical line at char 80
		this.editor.$blockScrolling = Infinity; // remove scrolling warnings
	}

	// TODO: dup from controller.js
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

	// TODO: dup from controller.js
	initConsole() {
		this.consoleObj = this.console.jqconsole('', '>>>');
		this.startConsole();
		this.consoleClear.on("click", (e) => {
			e.preventDefault();
			this.consoleObj.Reset();
			this.startConsole();
		});
	}

	// TODO: dup from controller.js
	createDebuggerSpanText(val, max) {
		return 'Execution step ' + val + ' out of ' + max;
	}

	// TODO: dup from controller.js
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

	addBtnHandlers() {
		this.addLoadBtnHandler();
	}

	addLoadBtnHandler() {
		function createTestcaseHTML(testcases, ckptNum) {
			if (!testcases || testcases.length === 0) {
				return;
			}

			var tableHTML =
			'<table>' +
				'<tr>' +
					'<th>#</th>' +
					'<th>Testcase</th>' +
					'<th>Expected</th>' +
					'<th>Status</th>' +
				'</tr>';
			testcases.forEach((ex, idx) => {
				tableHTML +=
				'<tr>' +
					'<td>' + idx + '</td>' +
					'<td>' + ex.source + '</td>' +
					'<td>' + ex.want + '</td>' +
					'<td><img id="case' + ckptNum + idx + '" src="../images/minus.png"/></td>' +
				'</tr>';
			});

			tableHTML +=
			'</table>'

			return tableHTML;
		}

		function sendViewRequest(fileName, fileContent) {
			var request = {
				labID: LAB_ID,
				command: LOAD_COMMAND,
				fileName: fileName,
				fileContent: fileContent,
				language: LAB_LANG
			};

			$.post({
				url: AUTHOR_URL,
				data: JSON.stringify(request),
				success: (data) => {
					var docstrings = JSON.parse(data.docstrings);
					if (docstrings.length > 0) {
						var doc = docstrings[0];
						var checkpoints = docstrings.slice(1);
						console.log('say what?');
						console.log(this);
						console.log(this.labDoc);
						this.labDoc.append(markdown.toHTML(doc.docstring));
						checkpoints.forEach((cp, idx) => {
							this.labDoc.append(markdown.toHTML(cp.docstring.split('------')[0]));
							this.labDoc.append(createTestcaseHTML(cp.examples, idx));
						});
					}
					this.code = data.skeleton;
				},
				error: (req, status, err) => {
					console.log(err);
				},
				dataType: "json",
				contentType: 'application/json'
			});
		}

		this.loadFileInput.on('change', (e) => {
			if (!e.target.files || !e.target.files[0]) {
				alert("Please select a file");
				return;
			}

			var file = e.target.files[0];
			var fr = new FileReader();
			fr.onload = (e) => {
				var fileContent = e.target.result;
				sendViewRequest(file.name, fileContent);
			};

			fr.readAsText(file);
		});
	}

	addModalHandlers() {
		this.addSignupModalHandler();
		this.addLabIDModalHandler();
	}

	addLabIDModalHandler() {
		// Checks whether the same lab ID already exists in the DB
		this.labIDGoBtn.on('click', (e) => {
			var labID = this.labIDInput.val();
			if (labID) {
				var request = {
					command: CREATE_LAB_ID_COMMAND,
					labID: labID
				};

				$.post({
					url: AUTHOR_URL,
					data: JSON.stringify(request),
					success: (data) => {
						if (data.ok) {
							this.labIDModalDiv.css('display', 'none');
							this.signupModalDiv.fadeIn();
							this.setStatus(labID);
						} else {
							this.labIDModalStatus.html(data.reason);
						}
					},
					error: (req, status, err) => {

					},
					dataType: "json",
					contentType: 'application/json'
				});
			} else {
				this.labIDModalStatus.html('Please enter a lab ID');
			}
		});
	}

	addSignupModalHandler() {
		this.signupBtn.on('click', (e) => {
			var userName = this.signupUserNameInput.val();
			if (userName) {
				var pass1 = this.signupUserPass2Input.val();
				if (pass1) {
					var pass2 = this.signupUserPass2Input.val();
					if (pass1 === pass2) {
						var request = {
							labID: this.labID,
							command: SIGNUP_COMMAND,
							userName: userName,
							password: pass1,
							role: 'author',
							checkpointStatus: {},
							code: '',
							codeEdits: [],
							console: {
								content: '',
								history: []
							},
							debugger: {
								debugTraces: [],
								handlePosition: 0,
								highlightedStr: ''
							},
							notificationPaneContent: {}
						};

						$.post({
							url: AUTHOR_URL,
							data: JSON.stringify(request),
							success: (data) => {
								if (data.ok) {
									window.location.href = AUTHOR_URL + "/" + this.labID + "?user=" + userName + "&password=" + pass1;
								} else {
									this.signupStatus.html(data.reason);
								}
							},
							error: (req, status, err) => {
								console.log(err);
							},
							dataType: 'json',
							contentType: 'application/json'
						});
					} else {
						this.signupStatus.html("Passwords do not match");
					}
				} else {
					this.signupStatus.html("Please enter a password");
				}
			} else {
				this.signupStatus.html("Please enter a user name");
			}
		});

		this.labIDLink.on('click', (e) => {
			e.preventDefault();
			if (this.signupModalDiv.css('display') === 'block') {
				this.signupModalDiv.css('display', 'none');
				this.labIDModalDiv.fadeIn();
			}
		});
	}

}

$(document).ready(function () {
	var authorCtrl = new AuthorController();
});