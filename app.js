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
var Datastore = require('nedb');
var db = new Datastore({ filename: 'database', autoload: true });

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

// DB Initialization with a test lab doc
var intro_programming_doc = {
    labID: "intro_programming",
    labDoc: {
        checkpoints: [
            {
                desc: "Write a function hello() that prints \"Hello, world!\" to the console.",
                testCases: [
                    {
                        input: '',
                        inputType: 'null',
                        output: 'Hello, world!',
                        outputType: 'string'
                    }
                ],
                questions: [
                    {
                        questioner: "test",
                        question: 'How do you print text in Python?',
                        answers: [
                            {
                                answerer: "asdf",
                                answer: "You can use 'print'. So something like 'print \"print this string\"'"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    users: [
        {
            userName: "test",
            password: "test",
            role: "student",
            checkpointStatus: {},
            code: '',
            console: [],
            notificationPaneContent: {}
        },
        {
            userName: "asdf",
            password: "asdf",
            role: "student",
            checkpointStatus: {},
            code: '',
            console: [],
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
            if (name !== userName) {
                // notify everyone (ideally anyone who might be interested) but the questioner
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
