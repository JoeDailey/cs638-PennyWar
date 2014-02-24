//Database Start//////////////////////////////////////////////////////////////////////////
var fs = require("fs");
////////CREATE DATABSE IF IT DOESN'T EXIST
var file = __dirname + "/db.sqlite3";
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
        db.run('CREATE TABLE "teams" ("team_id" integer PRIMARY KEY NOT NULL, "team_name" blob NOT NULL, "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP));');
        db.run('CREATE TABLE "donations" ("donation_id" integer PRIMARY KEY  NOT NULL, "team_id" integer NOT NULL, "user_name" blob NOT NULL, "amount" real NOT NULL, "created_at" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP));');
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
//swipe////////////////////////////////////////////////////////////////////////////////////
var stripe = require("stripe")(
  "sk_test_WsLn7ZuC8HaYcUPk4SAbMo53"
);
//email////////////////////////////////////////////////////////////////////////////////////
captifeye.set("views", __dirname+'/views');
//path/////////////////////////////////////////////////////////////////////////////////////
captifeye.use("/static", express.static(__dirname + '/static')); //static
//body parsing/////////////////////////////////////////////////////////////////////////////
captifeye.use(express.bodyParser({uploadDir:__dirname + '/static/img/temporary/uploads'}));
captifeye.set('view options', {
    layout: false
});
//start server
captifeye.listen(9001);
//Set Up End///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//Routing Start//////////////////////////////////////////////////////////////////////////
//--------------------------------------------------------------------/////-landing page
captifeye.get('/', function (req, res){
    db.all('SELECT * FROM teams;', function(err, teams){
        if(err) console.log(err);
        else{
            next(res, teams, 0, 0, 0);
        }
    });
});
function next(res, teams, max, grand, index){
    var total = 0;
    if(index < teams.length){
        if(teams[index].total == undefined)
                teams[index].total = 0;
        db.each('SELECT * FROM donations WHERE team_id="'+teams[index].team_id+'";', function(err, donation){
            if(teams[index].donations == undefined)
                teams[index].donations = new Array();
            teams[index].donations.push(donation);
            teams[index].total += donation.amount;
            grand += donation.amount;
        },function(err, count){
            if(teams[index].total > max)
                max = teams[index].total;
                next(res, teams, max, grand, index+1);
        });
    }else{
        console.log(teams);
        res.render('home', {
            name:"charity", 
            total:grand,
            teams:JSON.stringify(teams)
        });
    }
}
captifeye.get('/new', function (req, res){
    console.log(req.query);
    db.run('INSERT INTO teams (team_name) VALUES ("'+req.query.team_name+'");', function(err){
        if(err){
            console.log(err);
            res.render('error', {
                error_number:500,
                error_message:'sorry'
            });
        }else{
            res.redirect('/t/'+req.query.team_name);
        }
    });
});

captifeye.post('/t/:team/charge', function (req, res){
    var stripeToken = req.body.stripeToken;
console.log(req.body.price);
    var charge = stripe.charges.create({
      amount: parseInt(req.body.price), // amount in cents, again
      currency: "usd",
      card: stripeToken,
      description: "donation to team: "+req.body.team
    }, function(err, charge) {
      if (err) {
        console.log(err);
        res.redirect("/t/"+req.params.team);
      }else{
        db.get('SELECT * FROM teams WHERE team_name="'+req.params.team+'";', function(err, team){
            if(err || team == undefined){
                console.log(addErr);
                res.redirect("/t/"+req.params.team);
            }else{
                db.run('INSERT INTO donations (user_name, team_id, amount) VALUES ("'+req.body.stripeEmail+'", "'+team.team_id+'", '+req.body.price+');', function(addErr){
                    console.log(addErr);
                    res.redirect("/t/"+req.params.team);
                });
            }
        });
        }
    });
});

captifeye.get('/t/:team_name', function (req, res){
    console.log(req.params.team_name);
    db.get('SELECT * FROM teams WHERE team_name="'+req.params.team_name+'";', function(err, team){
        if(err || team == undefined){
            console.log(err);
            res.render('error',{
                error_number:404,
                error_message:"team not found"
            });
        }else{
            db.all('SELECT donations.*, teams.team_name AS team_name FROM donations LEFT JOIN teams ON teams.team_id=donations.team_id WHERE team_name="'+req.params.team_name+'" ORDER BY donations.created_at DESC;', function(donErr, donations){
                if(donErr){
                    res.render('error', {
                        error_number: 404,
                        error_message: "no donations found"
                    });
                }else{
                    console.log(donations);
                    var total = 0;
                    for (var i = donations.length - 1; i >= 0; i--) {
                        total += donations[i].amount;
                    };
                    res.render('team', {
                        "team":team,
                        "total":total,
                        "donations":donations
                    });
                }
            });
        }
    });
});
//Routing End/////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
//Misc Start///////////////////////////////////////////////////////////////////////////

// merge two objects
function merge(obj1, obj2){
    for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
    return obj1;
}
//Misc End//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
