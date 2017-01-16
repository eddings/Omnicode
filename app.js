var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphps = require('express-handlebars');
var hbs = require('./helpers/handlebars')(exphps);
var lessMiddleware = require('less-middleware');
var request = require('request');
var cors = require('cors');
var fs = require('fs');
var Datastore = require('nedb');
var db = new Datastore({ filename: 'data.db', autoload: true });
var logDB = new Datastore({ filename: 'log.db', autoload: true });

var app = express();

// CORS
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// LESS middleware
app.use(lessMiddleware(path.join(__dirname, 'public', 'stylesheets', 'less'), 
{
    preprocess: {
        // TODO: Backslash or forward slash?
        path: function(pathname, req) {
            return pathname.replace(/\\stylesheets\\css\\/, '\\');
        }
    },
    dest: path.join(__dirname, 'public'),
    force: true,
    debug: true
}));
app.use(express.static(path.join(__dirname, 'public')));

/*
fs.readFile('skeleton.py', 'utf8', (err, data) => {
    var skeletonCode = data;
    // DB Initialization with a test lab doc
    var labDesc = "Just when you had become an expert at string slicing, you discovered another sliceable data type:" +
    "lists. However, lists are different from strings in that they are mutable. Not only can we slice a " +
    "list, but we can also change its contents. The purpose of the lab is to introduce you to these new " +
    "features, and demonstrate just how powerful the list type can be.<br>" +
    "This lab will also give you some experience writing functions with for-loops. While lists will be " +
    "on the first exam, for-loops are on the second exam, after you have had more practice with them.<br>" +
    "<b>Lab Materials</b>. We have created several Python files for this lab. You can download all of the labs " +
    "from the Labs section of the course web page.<br>" +
    "<a href='http://www.cs.cornell.edu/courses/cs1110/2016fa/labs'>http://www.cs.cornell.edu/courses/cs1110/2016fa/labs</a><br>" +
    "<b>Getting Credit for the Lab</b>. Once again, you have a choice between getting credit through the " +
    "online system or your instructor. The online lab is available at the web page<br>" +
    "<a href='http://www.cs.cornell.edu/courses/cs1110/2016fa/labs/lab07/'>http://www.cs.cornell.edu/courses/cs1110/2016fa/labs/lab07/</a><br>" +
    "By now you should have a good idea of which version you are more comfortable with. This lab " +
    "involves quite a bit of coding, so you may have trouble finishing it during lab time. Fortunately, " +
    "<b>you have two weeks this time to finish the lab</b>.<br>" +
    "Your instructor will record that you did it. Remember, despite the demands of the online " +
    "system, labs are graded on effort, not correctness." + 
    "Below are several function specifications; implement them. The stubs for these " +
    "functions are in the editor. You will need to use for-loops to implement them. In addition, " +
    "we have already provided you with test cases. So all you need to do is implement " +
    "the functions." +
    "<br>In addition to using a for-loop, you may find the following list methods useful." +
    "<table><tr><th>Method</th><th>Result When Called</th></tr><tr><td>l.index(c)</td><td><b>Returns</b>: the first position of c in list l; error if not there</td></tr><tr><td>l.count(c)</td><td><b>Returns</b>: the number of times that c appears in the list l.</td></tr><tr><td>l.append(c)</td><td>Adds the value c to the end of the list. This method alters the list; it does not make a new list.</td></tr></table>" +
    "<br><p>Lists do not have a find() method like strings do. They only have index(). To check if an element " +
    "is in a list, use the in operator (e.g. x in thelist).";

    var ckpt1_title = "lesser_than(thelist, value)";
    var ckpt1_desc = 
    "<br><b>Function</b> lesser_than(thelist, value) " +
    "<b>should not alter</b> thelist. If you need to call a method that might alter the " +
    "contents of thelist, you should make a copy of it first.";

    var ckpt2_title = "uniques(thelist)";
    var ckpt2_desc =
    "<br><b>Function</b> uniques(thelist) " +
    "<b>should not alter</b> thelist. If you need to call a method that might " +
    "alter the contents of thelist, you should make a copy of it first.";

    var ckpt3_title = "clamp(thelist, min, max)";
    var ckpt3_desc = 
    "<br><b>Function</b> clamp(thelist,min,max), " +
    "unlike the previous two functions, does alter thelist. This function is a procedure " +
    "with no return value. You might want to look at test cases to see how we would test a " +
    "procedure like this.</p>";

    var intro_programming_doc = {
        labID: "intro_programming",
        labDoc: {
            labDesc: labDesc,
            checkpoints: [
                {
                    title: ckpt1_title,
                    desc: ckpt1_desc,
                    commandBlocks: [],
                    testCases: [],
                    quetsions: []
                },
                {
                    title: ckpt2_title,
                    desc: ckpt2_desc,
                    commandBlocks: [],
                    testCases: [],
                    questions: []
                },
                {
                    title: ckpt3_title,
                    desc: ckpt3_desc,
                    commandBlocks: [],
                    testCases: [],
                    questions: []
                }
            ]
        },
        users: [
            {
                userName: "test",
                password: "test",
                role: "student",
                checkpointStatus: {},
                code: skeletonCode,
                codeEdits: [],
                console: {
                    content: '',
                    history: [],
                },
                debugger: {
                    debugTraces: [],
                    handlePosition: 0,
                    highlightedStr: ''
                },
                notificationPaneContent: {}
            },
            {
                userName: "asdf",
                password: "asdf",
                role: "student",
                checkpointStatus: {},
                code: skeletonCode,
                codeEdits: [],
                console: {
                    content: '',
                    history: [],
                },
                debugger: {
                    debugTraces: [],
                    handlePosition: 0,
                    highlightedStr: ''
                },
                notificationPaneContent: {}
            }
        ],
        timelineQuestions: [
            {
                questioner: "test",
                question: 'How do you print text in Python?',
                answers: [
                    {
                        answerer: "asdf",
                        answer: "You can use 'print'. So something like 'print \"print this string\"'"
                    }
                ],
                checkpoint: {
                    desc: "Write a function hello() that prints \"Hello, world!\" to the console.",
                    testCases: [
                        {
                            input: '',
                            inputType: 'null',
                            output: 'Hello, world!',
                            outputType: 'string'
                        }
                    ],
                    checkpointIdx: 0
                }
            }
        ]
    };

    // Data store
    db.find({ labID: "intro_programming" }, (err, docs) => {
        if (docs.length === 0) {
            db.insert(intro_programming_doc);
        }
    });
});
*/

// When an author creates a lab, she has to input an ID of the lab.

// io exposed from bin/www
const io = require('socket.io')();
app.io = io;

const labURL = '/lab';
const questionBoardURL = '/question';
const authorURL = '/author';

var socGroups = {};

io.of(labURL).on('connection', (socket) => {
    var labID = socket.handshake.query.labID;
    var userName = socket.handshake.query.userName;
    if (!socGroups[labID]) {
        socGroups[labID] = {};
        if (userName !== '') { // Logged in
            if (!socGroups[labID][userName]) {
                socGroups[labID][userName] = { lab: socket, question: null, author: null };
            } else {
                socGroups[labID][userName].lab = socket;
            }
            console.log('User: "' + userName + '" joined in lab: "' + labID + '"');
        }
    } else {
        if (userName !== '') {
            if (!socGroups[labID][userName]) {
                socGroups[labID][userName] = { lab: socket, question: null, author: null };
            } else {
                socGroups[labID][userName].lab = socket;
            }
            console.log('User: "' + userName + '" joined in lab: "' + labID + '"');
        }
    }
});

io.of(questionBoardURL).on('connection', (socket) => {
    var labID = socket.handshake.query.labID;
    var userName = socket.handshake.query.userName;
    if (!socGroups[labID]) {
        socGroups[labID] = {};
        if (userName !== '') {
            if (!socGroups[labID][userName]) {
                socGroups[labID][userName] = { lab: null, question: socket, author: null };
            } else {
                socGroups[labID][userName].question = socket;
            }
            console.log('User: "' + userName + '" joined in question board for lab: "' + labID + '"');
        }
    } else {
        if (userName !== '') {
            if (!socGroups[labID][userName]) {
                socGroups[labID][userName] = { lab: null, question: socket, author: null };
            } else {
                socGroups[labID][userName].question = socket;
            }
            console.log('User: "' + userName + '" joined in question board for lab: "' + labID + '"');
        }
    }

    socket.on('question', (data) => {
        //   Should we send the message about the new question to everyone on their lab sockets? 
        // --> Probably the ones that need that information (proactive recommendation
        // based on AST analysis)
        //   Also, send a message to everyone in this lab to their question sockets' ends
        // so that the client javascript can live-update the question page
        for (var name in socGroups[labID]) {
            socGroups[labID][name].question.emit('question', data); // notify everyone on the question board
            if (data.targetUsers) {
                data.targetUsers.forEach((userName, idx) => {
                    if (name !== userName) {
                        socGroups[labID][userName].lab.emit('question', data);
                    }
                });
            } else {
                socGroups[labID][name].lab.emit('question', data);
            }
        }
    });

    socket.on('answer-posted', (data) => {
        // Notify the user who originally posted the question
        socGroups[labID][data.questioner].lab.emit('answer-posted', data);
        for (var name in socGroups[labID]) {
            // notify question board viewers so that their board can be updated
            socGroups[labID][name].question.emit('answer-posted', data);
        }
    });
});

io.of(authorURL).on('connection', (socket) => {
    console.log("User connected on /author");
    console.log(socGroups);
});

var entry = require('./routes/entry')(io, db);
app.use('/', entry);

var main = require('./routes/main')(io, db);
app.use('/lab', main);

var question = require('./routes/question')(io, db);
app.use('/question', question);

var author = require('./routes/author')(io, db);
app.use('/author', author);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
