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
		this.labDescHTML = '';
		this.checkpoints = [];

		// Editor related
		this.editor = null;
		this.editorStatus = $('#editor-status');

		// Editor control related
		this.loadFileInput = $('#loadFileInput');
		this.saveBtn = $('#saveBtn');

		// Lab doc panel
		this.labDoc = $('#lab-doc');

		// Tabs
		this.tabs = $("#tabs");

		// Visible Testcase indices
		this.visibleTestcaseIdx = [];

		this.init();
	}

	init() {
		this.addModalHandlers();
		this.addBtnHandlers();
		this.initEditor();
	}

	getCode() {
		return this.editor.getSession().getValue();
	}

	setCode(value) {
		this.editor.setValue(value);
	}

	initTabs() {
		this.tabs.tabs();
	}

	initEditor() {
		this.editor = ace.edit("editor");
		this.editor.getSession().setMode('ace/mode/python');
		this.editor.setShowPrintMargin(false); // vertical line at char 80
		this.editor.$blockScrolling = Infinity; // remove scrolling warnings
	}

	addBtnHandlers() {
		this.addLoadBtnHandler();
		this.addSaveBtnHandler();
	}

	addTestcaseClickEvent() {
		$("a[id^='testcase-link']").each((i, el) => {
			$(el).on("click", (e) => {
				e.preventDefault();
				var nums = $(el).attr("id").split("testcase-link")[1].split("-");
				var cp_idx = nums[0];
				var tc_idx = nums[1];

				if (this.visibleTestcaseIdx.length === 2) {
					var hideID = "testcase-body" + this.visibleTestcaseIdx[0] + "-" + this.visibleTestcaseIdx[1];
					$("#" + hideID).attr("style", "display: none;");
				}

				var id = "testcase-body" + cp_idx + "-" + tc_idx;
				$("#" + id).attr("style", "display: block;");
				this.visibleTestcaseIdx[0] = cp_idx; this.visibleTestcaseIdx[1] = tc_idx;
			});
		});
	}

	createTabHTML(labDocHTML, checkpointHTMLs) {
		this.labDescHTML = labDocHTML; // For saving
		var html = '';
		html += '<ul>\
					<li><a href="#lab-tab">Lab Description</a></li>';
		
		checkpointHTMLs.forEach((cp, idx) => {
			this.checkpoints.push(cp); // for saving
			html += '<li><a href="#checkpoint' + idx + '">Checkpoint ' + (idx + 1) + '</a></li>';
		});

		html += '</ul>\
				 <div id="lab-tab">';
		html += 	labDocHTML;
		html += '</div>';

		checkpointHTMLs.forEach((cp, cp_idx) => {
			html += '<div id="checkpoint' + cp_idx + '">';
			html += 	cp.descHTML;
			cp.testCaseHTMLs.forEach((testCaseHTML, tc_idx) => {
				html += '<a href="#" id="testcase-link' + cp_idx + "-" + tc_idx + '">Testcase ' + (tc_idx + 1) + '</a>';
				html += ''
			});

			cp.testCaseHTMLs.forEach((testCaseHTML, tc_idx) => {
				html += '<div id="testcase-body' + cp_idx + "-" + tc_idx + '" style="display: none;">';
				html += 	'<p>Testcases</p>'
				html += 	testCaseHTML;
				html +=		'<div class="col-12" id="cross-vis-div' + cp_idx + "-" + tc_idx + '"></div>';
				html +=	'</div>';
			});

			html += '</div>';
		});

		return html;
	}

	sendLoadRequest(fileName, fileContent) {
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
				var docstringHTMLs = data.docstringHTMLs;
				if (docstringHTMLs.length > 0) {
					var labDocHTML = docstringHTMLs[0];
					var checkpointHTMLs = docstringHTMLs.slice(1);
					var html = this.createTabHTML(labDocHTML, checkpointHTMLs);
					$("#tabs").html(html);
					this.addTestcaseClickEvent();
					this.initTabs();
				}
				this.setCode(data.skeleton);
			},
			error: (req, status, err) => {
				console.log(err);
			},
			dataType: 'json',
			contentType: 'application/json'
		});
	}

	addLoadBtnHandler() {
		this.loadFileInput.on('change', (e) => {
			if (!e.target.files || !e.target.files[0]) {
				alert("Please select a file");
				return;
			}

			var file = e.target.files[0];
			var fr = new FileReader();
			fr.onload = (e) => {
				var fileContent = e.target.result;
				this.sendLoadRequest(file.name, fileContent);
			};

			fr.readAsText(file);
		});
	}

	addSaveBtnHandler() {
		this.saveBtn.on('click', (e) => {
			// Save the lab material and maybe announce (send a notification) to students
			var lab = {
				labDescHTML: this.labDescHTML,
				skeletonCode: this.getCode(),
				checkpoints: this.checkpoints,
			};

			var request = {
				labID: LAB_ID,
				userName: USER_NAME,
				command: SAVE_AND_PUBLISH_COMMAND,
				doc: lab
			};

			$.post({
				url: AUTHOR_URL,
				data: JSON.stringify(request),
				success: (data) => {
					if (data.ok) {
						this.editorStatus.text(data.reason);
						this.editorStatus.css('display', 'inline');
						setTimeout(() => {
							this.editorStatus.fadeOut();
						}, 2000);
					}
				},
				error: (req, status, err) => {
					console.log(err);
				},
				dataType: "json",
				contentType: 'application/json'
			});
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
							this.labID = labID; // We need this b/c we're not changing the URL yet
												// and the signup modal handler needs this information
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
				var pass1 = this.signupUserPass1Input.val();
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