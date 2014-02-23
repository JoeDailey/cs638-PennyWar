//Database Start//////////////////////////////////////////////////////////////////////////
var fs = require("fs");
////////CREATE DATABSE IF IT DOESN'T EXIST
var file = __dirname + "/db.sqlite";
console.log(file);
var path = require('path');
var exists = fs.existsSync(file);
console.log(exists);
if (!exists) {
    console.log("Creating DB file.");
    fs.openSync(file, "w");
}
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);
if (!exists) {
    console.log("create new db");
    db.serialize(function () {
        db.run('CREATE TABLE "users" ("user_id" blob PRIMARY KEY  NOT NULL, "name" VARCHAR(50) NOT NULL, "email" VARCHAR(90), password blob NOT NULL, "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP));');
        db.run('CREATE TABLE "wars" ("war_id" blob PRIMARY KEY NOT NULL, "charity_foundation" VARCHAR(70) NOT NULL, "user_id" blob NOT NULL, "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP));');
        db.run('CREATE TABLE "team" ("team_id" blob PRIMARY KEY NOT NULL, "team_name" blob NOT NULL, "war_id" blob PRIMARY KEY  NOT NULL, "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP));');
        db.run('CREATE TABLE "donations" ("donation_id" integer PRIMARY KEY  NOT NULL, "war_id" blob NOT NULL, "team_id" blob NOT NULL, "user_id" blob NOT NULL, "amount" real NOT NULL, "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP));');
    });
}
/////////END CREATE DATABASE
//Database End/////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//Set Up Start///////////////////////////////////////////////////////////////////////////
//rendering///////////////////////////////////////////////////////////////////////////// 
var express = require('express');
var captifeye = express();
captifeye.set('view engine', 'ejs');
//uuid/////////////////////////////////////////////////////////////////////////////////////
var uuid = require('node-uuid');
//swipe////////////////////////////////////////////////////////////////////////////////////
var stripe = require("stripe")(
  "sk_test_WsLn7ZuC8HaYcUPk4SAbMo53"
);
//email////////////////////////////////////////////////////////////////////////////////////
captifeye.set("views", __dirname+'/views');
//path/////////////////////////////////////////////////////////////////////////////////////
captifeye.use("/static", express.static(__dirname + '/static')); //static
//cookies//////////////////////////////////////////////////////////////////////////////////
captifeye.use(express.cookieParser('adfasdfadsfdsfavsavbbnhah'));
captifeye.use(express.session({secret: 't8adsfaetgadscabhj4a'}));
//body parsing/////////////////////////////////////////////////////////////////////////////
captifeye.use(express.bodyParser({uploadDir:__dirname + '/static/img/temporary/uploads'}));
captifeye.set('view options', {
    layout: false
});
//setup password encryption
var bcrypt = require('bcrypt');
//encrypt password -> callback(err, hash)
var cryptPassword = function (password, callback) {
   bcrypt.genSalt(10, function (err, salt) {
    if (err) return callback(err);
      else {
        bcrypt.hash(password, salt, function (err, hash) {
            return callback(err, hash);
        });
      }
  });
};
//decript password -> callback(bool matches)
var comparePassword = function (password, userPassword, callback) {
   bcrypt.compare(password, userPassword, function (err, isPasswordMatch) {
      if (err) return callback(err);
      else return callback(null, isPasswordMatch);
   });
};
//start server
captifeye.listen(9001);
//Set Up End///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//Routing Start//////////////////////////////////////////////////////////////////////////
//--------------------------------------------------------------------/////-landing page
captifeye.get('/', function (req, res){
    res.render('home', {});
});
captifeye.get('/war/:war_id', function (req, res){
    res.render('home', {});
});
captifeye.get('/war/:war_id/:team_name', function (req, res){
    db.get('SELECT donations.*, users.* FROM donations INNER JOIN users ON donations.user_id=users.user_id WHERE donations.war_id="'+req.params.war_id+'" AND donations.team_name="'+req.params.team_name+'";', function(donErr, donations){
        if(err || donations==undefined){
            res.render('error', {
                errorNumber: 404,
                error_message: "no donations found"
            });
        }
        res.render('team', {
            "donations":donations
        });
    });
});
//Routing End/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
//Auth Start////////////////////////////////////////////////////////////////////////////
//---------------------------------------------/////-login
captifeye.post("/login", function(req, res){
    var email = req.body.email.toLowerCase();
    var password = req.body.password;
    console.log('email: '+email);
    console.log('password: '+password);
    if(email != undefined && password != undefined){
        db.get('SELECT users.email, users.password FROM users WHERE users.email="'+email+'";', function(err, user){
            if(user == undefined){
                res.send(404, {});
            }else{
                comparePassword(password, user.password, function (nul, match){
                    if(!match){
                        res.send(406, {});
                    }else{
                        res.cookie('email', ""+user.email, { signed: true });
                        res.send(200, {url:'/'});
                    }
                });
            }
        });
    }else{
        res.send(404, {});
    }
});

//---------------------------------------------/////-register
captifeye.post("/register", function (req, res){
    var name = req.body.name;
    var email = req.body.email.toLowerCase();;
    var password = req.body.password;
    if(name != undefined && email != undefined && password != undefined){
        cryptPassword(password, function (cryptErr, hash){
            if(cryptErr){
                res.send(500, {});
            }else{
                var id = uuid.v4();
                db.run('INSERT INTO users VALUES ("'+id+'", "'+name+'","'+email+'","'+hash+'");', function(err){
                    if(err){
                        console.log(err);
                        res.send(400, {});
                    }else{
                        res.cookie('email', ""+user.email, { signed: true });
                        res.send(200, {});
                    }
                });
            }
        });
    }else{
        console.log("name: " + name);
        console.log('email: ' + email);
        console.log('password: ' + password);
        res.send(400, {})
    }
});
//---------------------------------------------/////-logout
captifeye.get('/logout', function (req, res){
  res.clearCookie('email');
  res.redirect('/');
});
captifeye.get('*', function (req, res){
    res.render('error', {
        error_number:404,
        error_message:"Page not found"
    });
});
//Auth End///////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
//Misc Start///////////////////////////////////////////////////////////////////////////
//base cookie check and navigation building
var getUser = function (req, callback){
    if (req.signedCookies.email == undefined) {
        callback(user);
    } else {
        db.serialize(function (){
            db.get("SELECT * FROM users WHERE email='"+req.signedCookies.email+"';", function (err, user){
                if(err){
                    console.log(err);
                    user = {};
                }
                callback(user);
            });
        });
    }
}
// merge two objects
function merge(obj1, obj2){
    for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
    return obj1;
}
//Misc End//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
