const ytdl = require("@distube/ytdl-core");
const express = require("express");

const app = express();

app.use(express.json()); // Enable JSON parsing for request bodies

app.get("/", (req, res) => {
    res.send("Hello, World!");
})

app.post("/yt", async (req, res) => {
    const {url} = req.body;
    const response = await ytdl.getBasicInfo(url)
    res.json({
        title: response.videoDetails.title,
        length: secondsToMins(response.videoDetails.lengthSeconds),
        description: response.videoDetails.description,
        thumbnail: response.videoDetails.thumbnails[response.videoDetails.thumbnails.length - 1].url,
        author: response.videoDetails.author.name,
        icon:response.videoDetails.author.thumbnails[response.videoDetails.author.thumbnails.length - 1].url,
        views: response.liveStreamingDetails?.viewCount || response.videoDetails.viewCount,
        keywords: response.videoDetails.keywords,
    })
})

const PORT = 3000

const secondsToMins = (seconds) => {
    return Math.floor(seconds / 60);
}

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
})
