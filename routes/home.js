/**
 * Created on April 17, 2020
 * @author Kenny Wu
 */
var express = require("express");
var router = express.Router();
var spawn = require("child_process").spawn;


// test@g.c
// password: 123
// ID: 101679

// testpython@gmail.com
// password: 123
// ID: 101179

// kenny@pitt.edu 
// password: 123
// ID: 

router.get("/", function (req, res) {
    if (req.session.loggedIn != true) {
        res.redirect("./");
    } else {
        res.render("./home");
    }
});


router.get("/profile", function (req, res) {
    if (req.session.loggedIn == true) {
        const connection = req.app.locals.connection;
        connection.query("SELECT * FROM `student` WHERE `student_id` = ?;", [req.session.studentId], function (error, student) {
            connection.query("SELECT * FROM `level` WHERE `level_id` = ?;", [student[0].level_id], function (error, level) {
                connection.query("SELECT * FROM `term` WHERE `term_id` = ?;", [student[0].start_term], function (error, term) {
                    connection.query("SELECT * FROM `plan_of_study` WHERE `plan_id` = ?;", [student[0].plan_id], function (error, plan) {
                        connection.query("SELECT * FROM `degree` WHERE `degree_id` = ?;", [student[0].degree_id], function (error, degree) {
                            res.render("profile", {
                                "level": level,
                                "term": term,
                                "plan": plan,
                                "degree": degree,
                                "email": student[0].email,
                                "name": student[0].name,
                                "username": student[0].username,
                                "age": student[0].age,
                                "gender": student[0].gender,
                                "status": student[0].active
                            }, function (err, html) {
                                res.send(html);
                            });
                        });
                    });
                });
            });
        });
    }
});

router.get("/history", function (req, res) {
    if (req.session.loggedIn == true) {
        const connection = req.app.locals.connection;
        connection.query("SELECT * FROM `level`;", function (error, allLevelInfo) {
            connection.query("SELECT * FROM `term`;", function (error, allTermInfo) {
                connection.query("SELECT * FROM `course`;", function (error, allCourseInfo) {
                    connection.query("SELECT * FROM `grade`;", function (error, allGradeInfo) {
                        connection.query("SELECT * FROM `taken_course` WHERE `student_id` = ?;", [req.session.studentId], function (error, courses) {
                            if (courses === undefined || courses.length == 0) {
                                res.render("history", {
                                    allLevels: allLevelInfo,
                                    allTerms: allTermInfo,
                                    allCourses: allCourseInfo,
                                    allGrades: allGradeInfo
                                }, function (err, html) {
                                    res.send(html);
                                });
                            } else {
                                var courseIds = courses.map(function (course) { return course.course_id; });
                                var queryData = [courseIds];
                                connection.query("SELECT * FROM `course` WHERE `course_id` IN (?);", queryData, function (error, takenCourseInfo) {
                                    res.render("history", {
                                        takenCoursesWithGrade: courses,
                                        takenCourses: takenCourseInfo,
                                        allLevels: allLevelInfo,
                                        allTerms: allTermInfo,
                                        allCourses: allCourseInfo,
                                        allGrades: allGradeInfo
                                    }, function (err, html) {
                                        res.send(html);
                                    });
                                });
                            }
                        });
                    });
                });
            });
        });
    }
});

router.post("/addCourse", function (req, res) {
    if (req.session.loggedIn == true) {
        const connection = req.app.locals.connection;
        connection.query("INSERT INTO `taken_course` (`student_id`, `level_id`, `term_id`, `course_id`, `grade_code`) VALUES (?, ?, ?, ?, ?);", [req.session.studentId, req.body.levelId, req.body.termId, req.body.courseId, req.body.gradeId], function (error, result) {
            res.redirect("./home");
            // res.render("", {

            // }, function (err, html) {
            //     res.send(html);
            // });
        });
    }
});

router.post("/recommend", function (req, res) {
    if (req.session.loggedIn == true) {
        const connection = req.app.locals.connection;
        connection.query("SELECT `level_id` FROM `student` WHERE `student_id` = ?;", req.session.studentId, function (error, level) {
            var dataString;
            var python = spawn("python3", ["./scripts/recommender.py", req.session.studentId, level[0].level_id, process.env.HOST, process.env.PORT, process.env.USERNAME, process.env.PASSWORD]);
            python.stdout.on("data", function (data) {
                console.log("Pipe data from python script ...");
                dataString += data.toString();
            });
            python.on("exit", function (code) {
                console.log(`child process close all stdio with code ${code}`);
                var dataParsed = JSON.parse(dataString.slice(9));
                var courseIds = dataParsed.map(function (course) { return course.course_id; });
                var queryData = [courseIds];
                connection.query("SELECT * FROM `course` WHERE `course_id` IN (?);", queryData, function (error, courses) {
                    res.render("recommendation", {
                        pythonData: dataParsed,
                        recommendCoursesOrder: courseIds,
                        recommendCourses: courses,
                    }, function (err, html) {
                        res.send(html);
                    });
                });
            });
        });
    }
});

module.exports = router;