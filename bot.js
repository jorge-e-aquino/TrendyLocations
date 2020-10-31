const { get } = require("http");
//Initializing the twitterbot
Twit = require("twit"); // Twit: Twitter API
path = require("path"); // path management
config = require(path.join(__dirname, "config.js"));
T = new Twit(config); // initializing Twit as variable T
fs = require("fs"); // File Solutions
request = require("request"); // Image download

var english = fs.readFileSync("english.txt").toString().split("\n"); // list of 10,000 popular English words (no names)
var countries = fs.readFileSync("countries.txt").toString().split("\r\n");
for (let i in countries) {
    countries[i] = countries[i].toLowerCase();
}
console.log("countries:", countries);

var api = require("@what3words/api"); // What3Words API initialization

api.setOptions({ key: "DD79QZT3" }); // Google Maps Static API key = AIzaSyC9o8TlMLQOzdTjvW5vfsMiIAuJp9VZUsI

// Twit GET trends and turn the data into usable data
var sort = () => {
    console.log("Sort() is starting...");
    T.get("trends/place", { id: "23424977" }, function (err, data, responses) {
        // The data will return a list of 50 objects; somewhere deep in each object is a Twitter trend, each day has 50 distinct trends.
        // (trends can be and are often made up of more than one word, of nonalphabetical expressions, or proper nouns like a country name, keep this in mind for later)
        console.log("Searching and sorting top trending terms...");

        // Attempting to narrow down to the real data (the data returned from the API has several layers of abstraction which need to be unpacked).
        let array = Object.values(data),
            _array = Object.values(array[0]);
        __array = _array[0];

        // List of 50 trend metadata objects--somewhere within each of these metadata objects is an actual "trend," a string.
        let trendsMeta = [];
        for (let i in __array) {
            trendsMeta.push(Object.entries(__array[i]));
        }

        // List of all 50 of the "trends" packed within each trend metadata; example: "Pete Davidson movie" or "#dog" or "beach" can all be Twitter "trends."
        let trendList = [];
        for (let i in trendsMeta) {
            trendList[i] = trendsMeta[i][0][1];
        }

        // List of all expressions from the strings known as trends.
        // (recall that a "trend" may be made up of several expressions so I need to split all the expressions up and put them in a compiled list)
        let expressions = [];

        for (let i in trendList) {
            let split = trendList[i].split(" ");

            for (let j in split) {
                expressions.push(split[j].toLowerCase()); // concatenates each split (which are a list of strings) into the combined list of expressions.
                console.log("Split pushed to expressions:", split);
            }
        }

        console.log("Expressions:", expressions);

        // This is where I filter out all expressions which are nonalphabetical and are not common English words (which excludes names or other proper nouns).
        // How: I compare each expression to a list of acceptable terms (about 10,000 English words), if an expression is not on that list it gets thrown out.
        // I choose ten (10) acceptible words. This number is sort of arbitrary, if I choose too many the program will run out of memory so I picked 10 words.
        let words = [];
        for (let i in expressions) {
            if (english.includes(expressions[i]) && !(countries.includes(expressions[i])) && expressions[i].length > 2 && words.length < 10) {
                console.log("Expression is a word. Pushing to words array:", expressions[i]);
                words.push(expressions[i]);
            } else if (words.length >= 10) {
                console.log("words is long enough, ending for loop");
                break;
            }
        }

        // I am left with a list of 10 acceptible English words, there are no names, no numbers or symbols, and each item is not a phrase/fragment.
        console.log("words:", words, ", length of words:", words.length); // words.length == 10

        // subsetArray() returns a list containing all possible "3-subsets" (subsets of length 3), given my set of words, should return a list of 120 3-subsets.
        function subsetArray() {

            return {
                getResult: getResult,
            };

            function getResult(array, n) {
                function isBigEnough(value) {
                    return value.length === n;
                }

                let ps = [[]];
                for (let i = 0; i < array.length; i++) {
                    for (let j = 0, len = ps.length; j < len; j++) {
                        ps.push(ps[j].concat(array[i]));
                    }
                }

                // returns to subsetArray()
                return ps.filter(isBigEnough);
            }
        }

        // My list of all possible subsets, 120 in all, given a desired subset size of 3.
        // example of a "subsets" array, given 10 words: subsets = [["word1", "word1", "word1"]..., ["word7", "word2", "word5"], ..., ["word10", "word1", "word9"], ...]
        subsets = subsetArray().getResult(words, 3);
        console.log("subsets:", subsets);

        // The next step generates 120 what3word addresses given each subset in the array subsets
        // I replace each 3-subset in my array "subsets" with those words joined together into one combined string (Array.join() method generates a string).
        // To demonstrate: Given a list of 10 words, if word1 = apple, word2 = bear, word3 = mystery, ..., and word10 = "pool"
        //   then a subset comprised of word1, word2, and word10 in some order might look like this: [..., ["apple", "pool", "bear"], ...].
        //   Then: that subset above is converted to a string like so: [..., "apple.pool.bear", ...], for each 120 subsets, using the .join() method on the subset.

        for (let i in subsets) {
            subsets[i] = subsets[i].join(".");
        }
        console.log("subsets joined:", subsets);

        // Each of these strings is in the format of a what3words address, I only need to pick one at random and use it with the what3words API.
        // The chosen string will run through a suggestion function provided by their API, which suggests a "better" address near the one I chose, if there is one better.

        // Generates the final what3words address and the name of the nearest recognizable place/landmark (town, city, region, etc.) and writes them to txt files.
        var generate = async function generateIt() {
            let random = await subsets[Math.floor(Math.random() * subsets.length)];

            api.autosuggest(random).then(function (response) {
                console.log("**\nGenerating suggested location data, waiting to be analyzed...", response.suggestions[0]);

                // collect suggested address given the inputted one
                let w3w = response.suggestions[0].words;
                console.log("generated what3words address is are:", w3w);

                fs.writeFile("what3words.txt", w3w, function (err) {
                    if (err) {
                        throw err;
                    } else {
                        console.log("Wrote", w3w, "to what3words.txt");
                    }
                });

                // collect nearest place name
                let nearest = response.suggestions[0].nearestPlace;
                console.log("generated address' nearest place:", nearest);

                fs.writeFile("nearestPlace.txt", nearest, function (err) {
                    if (err) {
                        throw err;
                    } else {
                        console.log("Wrote to nearestPlace.txt:", nearest);
                    }
                });
            });


            setTimeout(() => {
                let what3words = fs.readFileSync("what3words.txt", "UTF-8");
                console.log("when declaring what3words in generate():", what3words);
            }, 1500);

        }

        generate().catch(() => {
            throw "!!!Generate error!";
        });

        // Given the address found within what3words.txt, a pair of coordinates using another API function is generated and written to its own txt file.
        convert = function convertIt(_address) {
            api.convertToCoordinates(_address).then((response) => {
                console.log("**\nConverting address into coordinates...");

                let pair =
                    response.coordinates.lat.toString() +
                    "," +
                    response.coordinates.lng.toString();

                console.log("generated coordinates are:", pair);

                fs.writeFile("coordinates.txt", pair, function (err) {
                    if (err) {
                        throw err;
                    } else {
                        console.log("Wrote to coordinates.txt:", pair);
                    }
                });
            });
        }

        setTimeout(() => {
            generate();
        }, 500);

        setTimeout(() => {
            var address = fs.readFileSync("what3words.txt", "UTF-8");
            console.log("when declaring what3words in convert():", address);
            convert(address);
        }, 3000);

    });
};


var image = async function () {

    console.log("Image() is starting...");

    function metadata() {
        const coordinates = fs.readFileSync("coordinates.txt", "UTF-8");

        const zoom = 14;

        // Google Maps Static API provides a link that returns a satellite image of a specific location on Earth, given the coordinates I insert within the URL text itself.
        let link =
            "https://maps.googleapis.com/maps/api/staticmap?center=" +
            coordinates +
            "&zoom=" +
            zoom +
            "&size=1200x1200&maptype=satellite&key=AIzaSyC9o8TlMLQOzdTjvW5vfsMiIAuJp9VZUsI";

        console.log(link);

        return link;
    }

    // I will download the image that I saved to "map.png".
    setTimeout(() => {
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
    }, 2000);
};

// Upload posts a tweet with the generated location metadata
var upload = function () {

    console.log("Upload() is starting...");

    const what3words = fs.readFileSync("what3words.txt", "UTF-8");
    const nearestPlace = fs.readFileSync("nearestPlace.txt", "UTF-8");

    if (nearestPlace == "") {
        nearestPlace = "nowhere in particular";
    }

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
