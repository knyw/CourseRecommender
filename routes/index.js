/**
 * Created on March 20, 2020
 * @author Kenny Wu, Aishwarya 
 */
var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;

router.get("/", function (req, res) {
    if (req.session.loggedIn == true) {
        res.redirect("./home");
    } else {
        res.render("./login");
    }
});

router.get("/register", function (req, res) {
    const connection = req.app.locals.connection;
    connection.query("SELECT * FROM `level`;", function (error, levels) {
        connection.query("SELECT * FROM `term`;", function (error, terms) {
            connection.query("SELECT * FROM `plan_of_study`;", function (error, plans) {
                connection.query("SELECT * FROM `degree`;", function (error, degrees) {
                    res.render("register", {
                        "levels": levels,
                        "terms": terms,
                        "plans": plans,
                        "degrees": degrees
                    });
                });
            });
        });
    });
});

router.post("/auth", function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    const connection = req.app.locals.connection;
    if (email && password) {
        connection.query("SELECT `student_id`, `password` FROM `student` WHERE `email` = ?;", [email], function (error, result) {
            if (result === undefined || result.length == 0) {
                res.send("Email does not exist!");
                res.end();
            } else {
                bcrypt.compare(password, result[0].password, function (err, resultBcrypt) {
                    if (resultBcrypt) {
                        req.session.loggedIn = true;
                        req.session.studentId = result[0].student_id;
                        res.redirect("./");
                    } else {
                        console.log(err);
                        res.send("Incorrect Email and/or Password!");
                        res.end();
                    }
                });
            }
        });
    } else {
        res.send("Please enter Username and Password!");
        res.end();
    }
});

router.post("/create", function (req, res) {
    var status = "";
    const connection = req.app.locals.connection;
    if (req.body.status == "1") {
        status = "Y";
    } else {
        status = "N";
    }
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (err) throw err;
        connection.query("INSERT INTO `student` (`student_id`, `level_id`, `start_term`, `plan_id`, `degree_id`, `email`, `name`, `username`, `password`, `age`, `gender`, `active`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", [req.body.level, req.body.term, req.body.plan, req.body.degree, req.body.email, req.body.name, req.body.username, hash, req.body.age, req.body.gender, status], function (error, result) {
            if (error) throw error;
            req.session.loggedIn = true;
            req.session.studentId = result.insertId;
            res.redirect("./");
        });
    });
});

router.get("/signout", function (req, res) {
    req.session.destroy();
    res.redirect("./");
});

module.exports = router;
