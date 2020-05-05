/**
 * Created on March 20, 2020
 * @author Aishwarya, Kenny Wu
 */
const dotenv = require('dotenv');
var createError = require("http-errors");
var express = require("express");
var session = require("express-session");
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var indexRouter = require("./routes/index");
var homeRouter = require("./routes/home");
var mysql = require("mysql");
dotenv.config();

var app = express();
const port = 10010;

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.use(session({
	secret: "secret",
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


app.use("/", indexRouter);
app.use("/home", homeRouter);


/* SQL Database Connection*/

var connection = mysql.createConnection({
  host: process.env.HOST,
  port: process.env.PORT,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database : "courseRecommender",
  connectionLimit : 10,               // this is the max number of connections before your pool starts waiting for a release
  multipleStatements : true  
});


connection.connect(function (err) {
  if (err) throw "Connection to SQL failed";
  
  console.log("Connected to SQL");
  app.locals.connection = connection;
});

/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
*/


app.listen(port, () => console.log(`Example app listening on port ${port}!`))

module.exports = app;
