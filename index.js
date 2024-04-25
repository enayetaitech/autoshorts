const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const { google } = require("googleapis");
require("dotenv").config();
fs = require("fs");
const cors = require('cors');
const ngrok = require('ngrok')

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization']
}));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.json());
app.use(bodyParser.json());

const upload = multer({ dest: "./uploads/" });

const PORT = process.env.PORT || 5000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000/oauth2callback";
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];


app.post("/test", (req, res) => {
  const testData = req.body;
  console.log(testData)

})

app.get("/connect_youtube", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log('redirect url', authUrl)
  res.redirect(`${ngrokInstance}/proxy${authUrl}`);
});

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oAuth2Client.getToken(code);
  console.log('token',tokens)
  oAuth2Client.setCredentials(tokens);
  res.send("YouTube account connected. You can now upload videos.");
});

// Web hook for sending data to the zapier
app.post("/webhook", upload.single("file"), (req, res) => {
  const videoDetails = req.file;
  // Send video details to Zapier
  console.log("route hit");
  console.log(videoDetails);
  const zapierUrl = "https://hooks.zapier.com/hooks/catch/18661439/372i6xc";
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(videoDetails),
  };
  fetch(zapierUrl, options)
    .then((response) => response.json())
    .then((data) => console.log("Zapier response:", data))
    .catch((error) => console.error("Error sending data to Zapier:", error));
  try {
    res.send("Video details sent to Zapier!");
  } catch (error) {
    console.error("Error sending response:", error);
    res.status(500).send("Error sending video details to Zapier");
  }
});

app.post("/upload_video", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No video file uploaded.");
  }

  const { title, description } = req.body;
  const videoFilePath = req.file.path;

  console.log(videoFilePath)
  console.log(title, description)

  try {
    const youtube = google.youtube({ version: "v3", auth: oAuth2Client });
    const response = await youtube.videos.insert({
      part: "snippet,contentDetails,status",
      requestBody: {
        snippet: {
          title: title,
          description: description,
          tags: ["Node.js", "API Upload"],
        },
        status: {
          privacyStatus: "public",
        },
      },
      media: {
        body: fs.createReadStream(videoFilePath),
      },
    });

    fs.unlinkSync(videoFilePath);
    console.log('youtube response', response)
    res.status(200).send("Video uploaded successfully!");
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).send("Failed to upload video");
  }
});

// (async function() {
//   const ngrokInstance = await ngrok.connect({ port: 5000, addr: 'http://localhost:5000' });
//   console.log(`Ngrok tunnel created: ${ngrokInstance}`);
// })();

app.listen(5000, () => {
  console.log("Webhook endpoint listening on port 5000!");
});


