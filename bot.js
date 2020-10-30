const { get } = require("http");
//Initializing the twitterbot
Twit = require("twit"); // Twit: Twitter API
path = require("path"); // path management
config = require(path.join(__dirname, "config.js"));
T = new Twit(config); // initializing Twit as variable T
fs = require("fs"); // File Solutions
request = require("request"); // Image download

english = fs.readFileSync("english.txt").toString().split("\n"); // list of 10,000 popular English words (no names)
api = require("@what3words/api"); // What3Words API initialization

api.setOptions({ key: "DD79QZT3" }); // Google Maps Static API key = AIzaSyC9o8TlMLQOzdTjvW5vfsMiIAuJp9VZUsI

// Twit GET trends and turn the data into usable data
var sort = () => {
    console.log("Sort() is starting...");
    T.get("trends/place", { id: "23424977" }, function (err, data, responses) {
        console.log("Searching and sorting top trending terms...");

        let array = Object.values(data),
            _array = Object.values(array[0]);
        __array = _array[0];

        let trendData = [];
        for (let i in __array) {
            trendData.push(Object.entries(__array[i]));
        }

        let trends = [];
        for (let i in trendData) {
            trends[i] = trendData[i][0][1];
        }

        var words = [];

        for (let i in trends) {
            let split = trends[i].split(" ");
            let temp = [];

            for (let j in split) {
                temp.push(split[j].toLowerCase());
                words = words.concat(temp);
            }
        }

        let propers = [];
        for (let i in words) {
            if (
                english.includes(words[i]) &&
                words[i].length > 3 &&
                propers.length < 10
            ) {
                propers.push(words[i]);
            } else if (propers.length >= 10) {
                break;
            } else {
                continue;
            }
        }
        console.log("words:", propers, ", length of propers:", propers.length);

        // Returns a list of all 3-subsets for propers (list of all appropriate words)
        function subsetArray() {

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

                // returns to subsetArray()
                return ps.filter(isBigEnough);
            }
        }

        subsets = subsetArray().getResult(propers, 3);

        for (let i in subsets) {
            subsets[i] = subsets[i].join(".");
        }

        var generate = function generateIt() {
            var random = subsets[Math.floor(Math.random() * subsets.length)];

            const what3word = async function (r) {
                return api.autosuggest(r);
            };

            what3word(random).then(function (response) {
                let w3w = response.suggestions[0].words;
                console.log("**\ngenerated location data, waiting to be analyzed...", response.suggestions[0]);
                fs.writeFile("data.txt", w3w, function (err) {
                    if (err) {
                        throw err;
                    } else {
                        console.log("Wrote", w3w, "to data.txt");
                    }
                });
            });

            var what3words = fs.readFileSync("data.txt", "UTF-8");
            console.log("when declaring what3words in generate():", what3words);
        }

        var convert = function convertIt() {
            api.convertToCoordinates(address).then((response) => {
                let pair =
                    response.coordinates.lat.toString() +
                    "," +
                    response.coordinates.lng.toString();
                console.log("pair:", pair);
                fs.writeFile("coordinates.txt", pair, function (err) {
                    if (err) {
                        throw err;
                    }
                });

                let nearest = response.nearestPlace.toString(); // look at
                fs.writeFile("nearestPlace.txt", nearest, function (err) {
                    console.log("Wrote to nearestPlace.txt:", nearest);
                    if (err) {
                        throw err;
                    }
                });
            });
        }

        generate();

        var address = fs.readFileSync("data.txt", "UTF-8");
        console.log("when declaring what3words in convert():", address);

        setTimeout(convert, 2000);

    });
};


var image = async function () {

    console.log("Image() is starting...");

    function metadata() {
        const coordinates = fs.readFileSync("coordinates.txt", "UTF-8");

        const zoom = 14;

        let link =
            "https://maps.googleapis.com/maps/api/staticmap?center=" +
            coordinates +
            "&zoom=" +
            zoom +
            "&size=1200x1200&maptype=satellite&key=AIzaSyC9o8TlMLQOzdTjvW5vfsMiIAuJp9VZUsI";

        console.log(link);

        return link;
    }

    const d = async function downloadIt() {
        let link = metadata();
        return link;
    };

    d().then((aLink) => {
        callback = function () {
            console.log("callback in download!");
        };
        function download(uri, filename) {
            request.head(uri, () => {
                console.log("download is running for link:", uri);
                request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
            });
        }
        download(aLink, "map.png");
    });
};

// Upload posts a tweet with the generated location metadata
var upload = function () {

    console.log("Upload() is starting...");

    const what3words = fs.readFileSync("data.txt", "UTF-8");
    const nearestPlace = fs.readFileSync("nearestPlace.txt", "UTF-8");

    console.log("Opening map.png image...");
    var image_path = "map.png";
    var b64content = fs.readFileSync(image_path, { encoding: "base64" });

    T.post("media/upload", { media_data: b64content }, function (err, data) {
        if (err) {
            console.log("ERROR:");
            console.log(err);
        } else {
            console.log("Image uploaded!");
            console.log("Now tweeting it...");

            T.post(
                "statuses/update",
                {
                    status:
                        "Today's trending terms converted to a what3words address: " +
                        what3words +
                        ", near " +
                        nearestPlace +
                        ".",
                    media_ids: new Array(data.media_id_string),
                },
                function (err) {
                    if (err) {
                        console.log("Post error:", err);
                    } else {
                        console.log("SUCCESS!");
                    }
                }
            );
        }
    });
    console.log("Uploading...");
};

main = function Main() {
    let runSort = () => {
        sort();
    };
    let runImage = () => {
        image();
    };
    let runUpload = () => {
        upload();
    };

    runSort();
    setTimeout(runImage, 5000);
    setTimeout(runUpload, 9000);
};

main();
