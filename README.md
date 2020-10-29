**Trendy Locations**

Trendy Locations (@trendylocations) is a twitterbot that gathers Twitter's top 50 trending terms in the US using the Twitter API and finds a three-word combination of those terms which form a known what3words (what3words.com) address on Earth.

**How it works**

Using the coordinates gathered from the what3words API, Google's Static Maps API inputs those values as parameters of its Static API link and returns a .png image of satellite photography at those coordinates. This photo is saved so that it can be later uploaded as media using Twitter API's POST method. The tweet message includes relevant data gathered from the what3words API at runtime, such as the address and the nearest recognizable region, town, or city.

**Author**

Trendy Locations was created by me, Jorge Aquino, for my LMC 2700 class. Some initial rudimetary twitterbot logic was inspired by AndrewKeymolen's EverydayManga repository, the logic was specifically regarding Twitter API media attachment and collection. StackOverflow was used extensively and some lines of code are provided from user responses on the site. The logic of the bot's location gathering was entirely my work, though.

Inspiration for the bot was found on @sillygwailo's ThoughtStreams.io blog post titled "Twitter bot ideas." (https://thoughtstreams.io/sillygwailo/twitter-bot-ideas/).
