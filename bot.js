//Initializing the twitterbot
var Twit = require("twit");
var path = require("path"),
  config = require(path.join(__dirname, "config.js"));

var T = new Twit(config);

var fs = require("fs");
var english = fs.readFileSync("english.txt").toString().split("\n");
var names = fs
  .readFileSync("first-names.txt")
  .toString()
  .toLowerCase()
  .split("\n");

// What3Worlds API
const api = require("@what3words/api");
api.setOptions({ key: "DD79QZT3" });

// Google Maps Static API key = AIzaSyC9o8TlMLQOzdTjvW5vfsMiIAuJp9VZUsI

// Image download
var request = require("request");

var download = function (uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    console.log("content-type:", res.headers["content-type"]);
    console.log("content-length:", res.headers["content-length"]);

    request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
  });
};

// Main function to run
var main = function () {
  T.get("trends/place", { id: "23424977" }, function (err, data, responses) {
    let tweets = [];
    for (let i = 0; i < data.length; i++) {
      tweet = data[i];
      tweets[i] = tweet;
    }

    let array = Object.values(tweets);
    let _array = Object.values(array[0]);
    let __array = _array[0];

    let trendData = [];
    for (let i in __array) {
      trendData.push(Object.entries(__array[i]));
    }

    let trends = [];
    for (let i in trendData) {
      trends[i] = trendData[i][0][1];
    }

    words = [];
    for (let i in trends) {
      let split = trends[i].split(" ");
      for (let j in split) {
        word = split[j].toLowerCase();
        // words.push(word);
        if (english.includes(word) && !names.includes(word)) {
          words.push(word);
        }
      }
    }

    var subsetArray = (function () {
      return {
        getResult: getResult,
      };

      function getResult(array, n) {
        function isBigEnough(value) {
          return value.length === n;
        }

        var ps = [[]];
        for (var i = 0; i < array.length; i++) {
          for (var j = 0, len = ps.length; j < len; j++) {
            ps.push(ps[j].concat(array[i]));
          }
        }
        return ps.filter(isBigEnough);
      }
    })();

    subsets = subsetArray.getResult(words, 3);
    for (let i in subsets) {
      subsets[i] = subsets[i].join(".");
    }

    var r = Math.floor(Math.random() * subsets.length);
    console.log("Subsets length:", subsets.length);
    console.log("Random value:", r);

    api.autosuggest(subsets[r]).then(function(response) {
        fs.writeFile(
            "coord.txt",
            response.suggestions[0].words,
            function (err) {
                if (err) {
                    throw err;
                } else {
                    console.log("Written to coord.txt");
                }
            }
        );
    });

    try {
        const data = fs.readFileSync("coord.txt", "UTF-8");
        api.convertToCoordinates(data).then(function(response) {
            let pair = response.coordinates.lat.toString() + "," + response.coordinates.lng.toString();
            fs.writeFile(
                "coords.txt",
                pair,
                function (err) {
                    if (err) {
                        throw err;
                    }
                }   
            );
            let nearest = response.nearestPlace;
            fs.writeFile(
                "nearestPlace.txt",
                nearest,
                function (err) {
                    if (err) {
                        throw err;
                    }
                }   
            );
        });
    } catch (err) {
        console.error(err);
    }

    const coordinates = fs.readFileSync("coords.txt", "UTF-8");
    const what3words = fs.readFileSync("coord.txt", "UTF-8");
    const nearestPlace = fs.readFileSync("nearestPlace.txt", "UTF-8");
    // const _coordinates = fs.readFileSync("coordinates.txt", "UTF-8").split();
    // let _long = _coordinates[1];
    // let _lat = _coordinates[0];
    // console.log("_coords:", _coordinates);
    const zoom = 14;
    
    let link = "https://maps.googleapis.com/maps/api/staticmap?center=" + coordinates + "&zoom=" + zoom + "&size=1200x1200&maptype=satellite&key=AIzaSyC9o8TlMLQOzdTjvW5vfsMiIAuJp9VZUsI";
    console.log(link);

    download(link, "map.png", function () {
        console.log("Map.png for what3words", what3words, "downloaded, the coords were:", coordinates);
    });

    function upload(){
        console.log('Opening map.png image...');
        var image_path = "map.png";
        var b64content = fs.readFileSync(image_path, { encoding: 'base64' });
      
        console.log('Uploading an image...');
      
        T.post('media/upload', { media_data: b64content }, function (err, data) {
          if (err){
            console.log('ERROR:');
            console.log(err);
          }
          else{
            console.log('Image uploaded!');
            console.log('Now tweeting it...');
      
            T.post('statuses/update', { status: "Today's trending terms converted to a what3words address: " + what3words + ", near " + nearestPlace + "." ,
              media_ids: new Array(data.media_id_string),
            },
              function(err) {
                if (err){
                  console.log("Post error:", err);
                }
                else{
                  console.log('Posted an image!');
                }
              }
            );
          }
        });
      }
      setTimeout(upload, 4000);
  });
};

//MAIN, that will execute every day
main(); // implement Math.random to choose random subsets[i] index value
