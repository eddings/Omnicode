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
					this.labDoc.append(labDocHTML);
					this.labDescHTML = labDocHTML;
					checkpointHTMLs.forEach((cp, idx) => {
						this.checkpoints.push(cp);
						this.labDoc.append(cp.descHTML);
						this.labDoc.append(cp.testCaseHTML);
					});
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