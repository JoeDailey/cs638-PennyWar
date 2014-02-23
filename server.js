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
        db.run('CREATE TABLE "team" ("team_id" blob PRIMARY KEY NOT NULL, "team name" blob NOT NULL, "war_id" blob PRIMARY KEY  NOT NULL, "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP));');
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
//RoutingStart///////////////////////////////////////////////////////////////////////////
//--------------------------------------------------------------------/////-landing page
captifeye.get('/', function (req, res){
    res.render('home', {});
});
captifeye.get('*', function (req, res){
    res.render('error', {
        error_number:404,
        error_message:"Page not found"
    });
});
//base cookie check and navigation building
var getUser = function (req, res, unloggedRedirect, callback){
    if (req.signedCookies.email == undefined) {   
        res.redirect(unloggedRedirect);
    } else {
        db.serialize(function (){
            db.get("SELECT * FROM users WHERE email='"+req.signedCookies.email+"';", function (err, user){
                if(err || user==undefined) res.render("front_error", { errorNumber:"ERROR!", comment:'Cooke Error!'});
                else{
                     db.all('SELECT locations.*, images.image_url FROM locations INNER JOIN images ON locations.location_id=images.location_id WHERE user_id="'+user.user_id+'";', function (err, locations){
                        
                        if(err){ res.render("front_error", { errorNumber:"ERROR!", comment:'Database Error'}); console.log(err)}
                        else{
                            var posts= '';
                            var notificationAlertCount = "";
                            if(posts.length != 0)
                                notificationAlertCount = '<span class="badge">'+posts.length+'</span>';
                            var notificationsHTML = "";
                            for(var i = 0; i < posts.length; i++){
                                notificationsHTML+='<li><a href="'+posts[i].url+'"><span class="photo"><img src="'+posts[i].image+'" alt=""/></span><span class="subject"><span class="from">'+posts[i].name+'</span><span class="time">'+posts[i].time+'</span></span><span class="message">@'+posts[i].locaion+'For '+posts[i].deal+'</span></a></li>'
                            }
                            console.log(locations);
                            var data = {
                                "user":user,
                                "name":user.name, 
                                "notificationCount":posts.length,
                                "notificationAlertCount":notificationAlertCount,
                                "notificationsHTML":notificationsHTML,
                                "locations":locations
                            };
                            
                            callback(data);
                        }
                    });
                }
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
