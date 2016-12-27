class QBController {
	constructor(serverURL = 'http://localhost:3000') {
		this.labID = $('#lab-id-link').text(); // Lab ID
		this.labLanguage = $('#lab-lang').text(); // Lab programming language
		this.userName = $('#user-name').text(); // Current user name

		this.labURL = serverURL + '/lab';
		this.questionURL = serverURL + '/question';

		this.answerCmd = "answer";
		this.loginCmd = "login";

		var queryStr = 'labID=' + this.labID + '&userName=' + this.userName;
		this.labSocket = io.connect(this.labURL, { query: queryStr });
		this.questionSocket = io.connect(this.questionURL, { query: queryStr });

		this.questionPs = [];
		this.questionBtns = [];
		this.detailDivs = [];
		this.answerInputs = [];
		this.answerBtns = [];
		this.checkpointIdxInputs = [];

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

		// Answer board for each question
		this.answerDivs = [];

		this.opened = [];

		this.numQuestions = 0;
		this.numAnswers = [];

		this.init();
	}

	init() {
		this.collectQuestionPs();
		this.collectQuestionBtns();
		this.collectDetailDivs();
		this.collectAnswerBtns();
		this.collectAnswerInputs();
		this.collectCheckpointIdxInputs();
		this.collectAnswerDivs();

		this.updateNumQuestions();
		this.updateNumAnswers();

		this.addQuestionPClickHandlers();
		this.addQuestionBtnClickHandlers();
		this.addAnswerBtnHandlers();
		this.addLiveUpdate();

		this.loginModalHandler();
		this.signupLinkClickHandler();
		this.loginLinkClickHandler();
	}

	update() {
		this.questionPs.push($('#p-question' + this.numQuestions));
		this.questionBtns.push($('#btn-question' + this.numQuestions));
		this.detailDivs.push($('#question-detail' + this.numQuestions));
		this.checkpointIdxInputs.push($('#checkpoint-idx-input' + this.numQuestions));
		this.answerInputs.push($('#answer-text' + this.numQuestions));
		this.answerDivs.push($('#div-answer' + this.numQuestions));
		this.answerBtns.push($('#answer-btn' + this.numQuestions));

		var lastIdx = this.questionPs.length - 1;

		this.questionPs[lastIdx].on('click', (e) => { // jQuery .on method is asynchronous?
			this.questionPClickHanlder(lastIdx);
		});

		this.questionBtns[lastIdx].on('click', (e) => {
			this.questionBtnClickHandler(this.questionBtns[lastIdx], lastIdx);
		});

		this.answerBtns[lastIdx].on('click', (e) => {
			this.answerBtnClickHandler(this.answerBtns[lastIdx], lastIdx);
		})

		this.updateNumQuestions();
		this.updateNumAnswers();
		// answer button handler
	}

	collectQuestionPs() {
		$("p[id^='p-question']").each((i, el) => {
			this.questionPs.push($(el));
		});
	}

	collectQuestionBtns() {
		$("button[id^='btn-question'").each((i, el) => {
			this.questionBtns.push($(el));
		});
	}

	collectDetailDivs() {
		$("div[id^='question-detail']").each((i, el) => {
			this.detailDivs.push($(el));
			this.opened[i] = false;
		});
	}

	collectAnswerBtns() {
		$("button[id^='answer-btn']").each((i, el) => {
			this.answerBtns.push($(el));
		});
	}

	collectAnswerInputs() {
		$("textarea[id^='answer-text']").each((i, el) => {
			this.answerInputs.push($(el));
		});
	}

	collectCheckpointIdxInputs() {
		$("input[id^='checkpoint-idx-input']").each((i, el) => {
			this.checkpointIdxInputs.push($(el));
		});
	}

	collectAnswerDivs() {
		$("div[id^='div-answer']").each((i, el) => {
			this.answerDivs.push($(el));
		});
	}

	updateNumQuestions() {
		this.numQuestions = this.questionPs.length;
	}

	updateNumAnswers() {
		// This is possible because we allow adding questions only.
		//   If deletion was possible, then the specific question's
		// answers should be gone -- we need indexing 
		for (var i = 0; i < this.numQuestions; ++i) {
			this.numAnswers[i] = $("p[id^='p-answer" + i + "']").length;
		}
	}

	questionPClickHanlder(idx) {
		if (!this.opened[idx]) {
			this.detailDivs[idx].css('display: block');
			this.detailDivs[idx].slideDown();
			this.opened[idx] = true;				
		} else {
			this.detailDivs[idx].slideUp();
			this.detailDivs[idx].css('display: none');
			this.opened[idx] = false;					
		}
	}

	addQuestionPClickHandlers() {
		this.questionPs.forEach((p, idx) => {
			p.on('click', (e) => { this.questionPClickHanlder(idx); });
		});
	}

	questionBtnClickHandler(btn, idx) {
		if (!this.opened[idx]) {
			this.detailDivs[idx].css('display: block');
			this.detailDivs[idx].slideDown();
			this.opened[idx] = true;
			btn.text('Close detail');
		} else {
			this.detailDivs[idx].slideUp();
			this.detailDivs[idx].css('display: none');
			this.opened[idx] = false;
			btn.text('Detail');				
		}
	}

	addQuestionBtnClickHandlers() {
		this.questionBtns.forEach((btn, idx) => {
			btn.on('click', (e) => { this.questionBtnClickHandler(btn, idx); });
		});
	}

	answerBtnClickHandler(btn, idx) {
		// IMPORTANT: You cannot use e.target.id here, since the newly added button's index is 
		// the highest number. I.e., 
		// 
		// button6
		// button0
		// button1
		// ...
		// button5
		//var questionIdx = (this.numQuestions-1)-idx;
		var questionIdx = this.numQuestions-1;
		if (this.answerInputs[idx].val() !== '') {
			var dataObj = {
				command: this.answerCmd,
				userName: this.userName,
				answer: this.answerInputs[idx].val(),
				checkpointIdx: this.checkpointIdxInputs[idx].val(),
				questionIdx: questionIdx
			};
			var URL = this.questionURL + '/' + this.labID;
			$.post({
				url: URL,
				data: JSON.stringify(dataObj),
				success: (answerObj, status) => {
					answerObj.questionIdx = questionIdx;
					if (status === 'success') {
						this.questionSocket.emit('answer-posted', answerObj);
					}
				},
				error: (req, status, err) => {
					console.log(err);
				},
				dataType: "json",
				contentType: 'application/json'
			});
		}
	}

	addAnswerBtnHandlers() {
		this.answerBtns.forEach((btn, idx) => {
			btn.on('click', (e) => { this.answerBtnClickHandler(btn, idx); });
		});
	}

	addLiveUpdate() {
		//   Needs clarity in the design of the question board first. 
		//   If sorting-by-checkpoint is desired, the live-update algorithm
		// will be more complicated.
		//   Otherwise, we can simply 'prepend' the newest question on top.
		this.questionSocket.on('question', (questionObj) => {
			var testCasesStr = '';
			questionObj.checkpoint.testCases.forEach((testCase, idx) => {
				testCasesStr += '<tr>';
				testCasesStr += '<td>' + idx + '</td>';
				testCasesStr += '<td>' + testCase.inputType + ': ' + testCase.input + '</td>';
				testCasesStr += '<td>' + testCasesStr.outputType + ': ' + testCase.output + '</td>';
				testCasesStr += '<td><img id="status-checkpoint-testcase"' + this.numQuestions + idx + '" src="../images/error.png"/></td>';
				testCasesStr += '</tr>';

			});
			$('#question-board').prepend('\
			<div id="question' + this.numQuestions + '" class="question-invisible">\
		        <p><img id="user-icon' + this.numQuestions + '" src="../images/user.png"/><u>' + questionObj.questioner + '</u> asked</p>\
		        <p id="p-question' + this.numQuestions + '"><img id="quotes-icon' + this.numQuestions + '" src="../images/quotes.png"/><b>' + questionObj.question + '</b></p>\
		        <button id="btn-question' + this.numQuestions + '" type="button" class="btn btn-secondary btn-sm">Detail</button>\
		        <hr>\
		        <div id="question-detail' + this.numQuestions + '" class="div-question-detail">\
		            <p><i>Checkpoint: ' + questionObj.checkpoint.desc + '</i></p>\
		            <input type="hidden" id="checkpoint-idx-input"' + this.numQuestions + 'value="' + questionObj.checkpoint.checkpointIdx + '">\
		            <p><i>Test cases</i></p>\
		            <table id="testCases' + this.numQuestions + '">\
		                <tr>\
		                    <th>#</th>\
		                    <th>Input</th>\
		                    <th>Output</th>\
		                    <th>State</th>\
		                </tr>' + testCasesStr + '\
		            </table>\
		            <div class="form-group">\
		                <label for="answer-text' + this.numQuestions + '">Answer</label>\
		                <textarea class="form-control" id="answer-text' + this.numQuestions + '" rows="6"></textarea>\
		            </div>\
		            <button type="submit" class="btn btn-primary btn-sm" id="answer-btn' + this.numQuestions + '">Answer</button>\
		            <hr>\
		        </div>\
		        <div id="div-answer' + this.numQuestions + '">\
		        </div>\
		    </div>');

		    $('#question' + this.numQuestions).fadeIn();
		    this.update();
		});

		this.questionSocket.on('answer-posted', (answerObj) => {
			console.log(answerObj);
			var questionIdx = answerObj.questionIdx;
			var answer = answerObj.answer;
			this.answerDivs[questionIdx].append('\
			<div id="answer' + questionIdx + this.numAnswers[questionIdx] + '" class="answer-invisible">\
                <p><img src="../images/user.png"/><u>' + this.userName + '</u> answered</p>\
                <p id="p-answer' + questionIdx + this.numAnswers[questionIdx] + '">' + answer + '</p>\
                <hr>\
            </div>');

            $('#answer' + questionIdx + this.numAnswers[questionIdx]).fadeIn();
            this.questionBtns[questionIdx].trigger('click');
            this.update();
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
								window.location.href = "/question/" + this.labID + "?user=" + userName + "&password=" + password;
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
								if (data.ok) {
									window.location.href = "/lab/intro_programming?user=" + userName + "&password=" + password;
								} else {
									this.loginModalSignupStatus.html(data.reason);
								}
							},
							error: (req, status, err) => {
								console.log(err);
							},
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
}

$(document).ready(function() {
	//var qbCtrl = new qbCtrl("https://labyrinth1.herokuapp.com");
	var qbCtrl = new QBController("http://localhost:3000");
});