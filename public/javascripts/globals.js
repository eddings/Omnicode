// Constants
const QUESTION_COMMAND 			= "question";
const LOGIN_COMMAND 			= "login";
const SIGNUP_COMMAND 			= "signup";
const RUN_COMMAND 				= "run";
const DEBUG_COMMAND				= "debug";
const SAVE_COMMAND 				= "save";
const GET_USER_COMMAND 			= "getUser";
const ANSWER_COMMAND			= "answer";
const CODE_EDIT_SAVE_COMMAND	= "codeEditSave";
const SEARCH_LAB_IDS_COMMAND	= "searchLabIDs";

const SERVER_URL 				= "http://localhost:3000";
const LAB_URL 					= SERVER_URL + "/lab";
const QUESTION_URL 				= SERVER_URL + "/question";

var LAB_ID = $('#lab-id-link').text(); // Lab ID
var LAB_LANG = $('#lab-lang').text(); // Lab programming language
var USER_NAME = $('#user-name').text(); // Current user name
var PASSWORD = $('#user-password').val(); // Current user password

var QUERY_STR = 'labID=' + LAB_ID + '&userName=' + USER_NAME;
var LAB_SOCKET = io.connect(LAB_URL, { query: QUERY_STR });
var QUESTION_SOCKET = io.connect(QUESTION_URL, { query: QUERY_STR });
