var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var handlebars = require('express-handlebars');
var lessMiddleware = require('less-middleware');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');
app.engine('.handlebars', handlebars());

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

// io exposed from bin/www
var io = require('socket.io')();
app.io = io;
console.log(io);
io.on("connection", function(socket) {
  console.log("A user connected");
  socket.on('question', function(msg) {
    socket.broadcast.emit('question', msg);
  });
});

var main = require('./routes/main')(io);
app.use('/', main);

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
