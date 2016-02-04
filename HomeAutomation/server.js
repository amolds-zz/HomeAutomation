/*-----------------------------------------------------------------------------------------------------------
 * Author:  Aaron Olds
 * Date:    Feb 2, 2016
 * 
 * Purpose: nodejs server api to set/get gpio configuration information for home automation.
 *----------------------------------------------------------------------------------------------------------- 
 */

var app = require('express')();
var http = require('http').Server(app);
var bodyParser = require("body-parser");
var moment = require('moment');
var jwt = require('jwt-simple');
var jwtauth = require('./jwtauth');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./homeauto.db3');
var bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


var port = 8123;

/*
var searchAll = function (next) {
    //var stmt = db.prepare("select * from Configuration");
    var results = '';
    db.all("select id, description, type, curr_val, min_val, max_val, range_of_vals, pin from configuration where enabled = 1", function (err, rows) {
        console.log(rows);
        //return rows;
        next(rows);
        //return;
    });
    //next('');
}
*/


var requireAuth = function (req, res, next) {
    if (!req.user) {
        res.end('Not authorized', 401);
    } else {
        next();
    }
}

app.get('/login', function (req, res) {
    var userName = req.param('username');
    var password = req.param('password');
    
    db.get("select id, password from user where username = ?", [userName], function (err, row) {
        if (err) {
            console.log(err);
            res.end('Not authorized, error', 401);
        } else {
            bcrypt.compare(password, row.password, function (err, res2) {
                if (err) {
                    console.log(err);
                    res.end('Not authorized, invalid', 401);
                } else {
                    console.log(res);
                    var id = row.id;
                    
                    var expires = moment().add('hours', 1).valueOf();
                    var token = jwt.encode({
                        iss: id,
                        exp: expires
                    }, '$$[SECRET]');
                    
                    res.json({
                        token: token,
                        expires: expires,
                        user: "{ id: " + id + " }"
                    });
                }
            });
        }
    });

    /*
    if (userName === '$$[USER]' && password === '$$[PASSWD]') {
        var id = 1;
        
        var expires = moment().add('hours', 1).valueOf();
        var token = jwt.encode({
            iss: id,
            exp: expires
        }, '$$[SECRET]');
        
        res.json({
            token: token,
            expires: expires,
            user: "{ id: " + id + " }"
        });
    } else {
        res.end('Not authorized', 401);
    }
    */
});

app.get('/logout', function (req, res) {
    res.send('Ok');    
});

app.get('/getconfigs', bodyParser(), jwtauth, requireAuth, function(req, res) {
    db.all("select id, description, type, curr_val, min_val, max_val, range_of_vals, pin from configuration where enabled = 1", function (err, rows) {
        if (err) {
            console.log(err);
            res.send('Error');
        } else {
            res.send(rows);
        }        
    });
});

app.get('/getconfig', bodyParser(), jwtauth, requireAuth, function(req, res) {
    db.all("select id, description, type, curr_val, min_val, max_val, range_of_vals, pin from configuration where enabled = 1 and id = " + req.param('id'), function (err, rows) {
        if (err) {
            console.log(err);
            res.send('Error');
        } else {
            res.send(rows);   
        }        
    });
});

app.get('/setconfig', bodyParser(), jwtauth, requireAuth, function (req, res) {
    var id = req.param('id');
    var val = req.param('new_val');
    db.run("update configuration set curr_val = ? where id = ? and enabled = 1", [val, id], function (err) {
        if (err) {
            console.log(err);
            res.send('Error');
        } else {
            db.all("select id, description, type, curr_val, min_val, max_val, range_of_vals, pin from configuration where enabled = 1 and id = " + id, function (err, rows) {
                if (err) {
                    console.log(err);
                    res.send('Error');
                } else {
                    res.send(rows);
                }        
            });
        }
    });

});

app.listen(port);
console.log('Server started on port ' + port);
