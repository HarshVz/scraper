const express = require("express");
const ytdl = require("@distube/ytdl-core");
const serverless = require("serverless-http");

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Root endpoint
app.get("/", (req, res) => {
    res.send("Hello, World!");
});

// YouTube Video Info endpoint
app.post("/yt", async (req, res) => {
    const { url } = req.body;
    try {
        const response = await ytdl.getBasicInfo(url);
        res.json({
            title: response.videoDetails.title,
            length: secondsToMins(response.videoDetails.lengthSeconds),
            description: response.videoDetails.description,
            thumbnail: response.videoDetails.thumbnails[response.videoDetails.thumbnails.length - 1].url,
            author: response.videoDetails.author.name,
            icon: response.videoDetails.author.thumbnails[response.videoDetails.author.thumbnails.length - 1].url,
            views: response.liveStreamingDetails?.viewCount || response.videoDetails.viewCount,
            keywords: response.videoDetails.keywords,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch video information" });
    }
});

// Helper function to convert seconds to minutes
const secondsToMins = (seconds) => {
    return Math.floor(seconds / 60);
};

// Export the serverless handler (required for Vercel)
module.exports = serverless(app);  // This is the correct export for serverless apps
