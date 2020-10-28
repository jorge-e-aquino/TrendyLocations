//Init
var Twit = require('twit')
var fs = require('fs'),
    path = require('path'),
    Twit = require('twit'),
    config = require(path.join(__dirname, 'config.js'));

var T = new Twit(config);

//Gets the list of directories inside 'images'

//To avoid Heroku $PORT error
var express = require('express');
var app = express();
app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

//To avoid Heroku's free version's DYNO to go to sleep after 30 min (and shut the app down))
var http = require("http");
setInterval(function() {
    console.log('Ping!');
    http.get("https://twitterbot--lmc2700.herokuapp.com/");
}, 1200000);


var main = function() {
    var stream = Twitter.stream("user");

    // when someone follows me
    stream.on("follow", followed);

    function followed(eventMsg) {
        console.log("follow event!");
        var name = eventMsg.source.name;
        var screenName = eventMsg.source.screen_name;
        tweetIt(name + " followed me! @" + screenName + ", thanks!");
    }
}

//MAIN, that will execute every day
setInterval(function() {main();}, 86400000);
//setInterval(function() {main();}, 60000);