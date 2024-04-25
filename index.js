const express = require('express');
const { google } = require('googleapis');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const readline = require('readline');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for handling file uploads
const upload = multer({ dest: './uploads/' });

// Initialize OAuth2 client
const oAuth2Client = new google.auth.OAuth2({
  clientId: '1084926580778-s30h9vo5hvq7f5bn26uuujp7e2s9b20v.apps.googleusercontent.com',
  clientSecret: '=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',
  redirectUri: `https://autoshorts.onrender.com/oauth2callback`
});

console.log('oAuth2cline', oAuth2Client)

// Define scopes required for YouTube API
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
];

// Generate authorization URL
app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('auth url', authUrl)
  res.redirect(authUrl);
});

// Handle OAuth2 callback
app.get('/oauthcallback', async (req, res) => {
  const code = req.query.code;
  console.log('code', code)
  const { tokens } = await oAuth2Client.getToken(code);
  console.log('token', tokens)
  oAuth2Client.setCredentials(tokens);
  console.log('credentials', oAuth2Client.credentials)
  res.redirect('/upload');
});

// Handle file upload and video upload
app.post('/upload', upload.single('video'), async (req, res) => {
  const { title, description } = req.body;
  const videoPath = req.file.path;
console.log('title and desc', title, description)
console.log('videopath',videoPath)
  // Upload video to YouTube
  const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });
  const fileSize = fs.statSync(videoPath).size;

  const uploadParams = {
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: title,
        description: description
      },
      status: {
        privacyStatus: 'private' // Change privacy status as needed
      }
    },
    media: {
      body: fs.createReadStream(videoPath)
    }
  };

  const res = await youtube.videos.insert(uploadParams, {
    onUploadProgress: evt => {
      const progress = (evt.bytesRead / fileSize) * 100;
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0, null);
      process.stdout.write(`${Math.round(progress)}% complete`);
    }
  });

  console.log('Video uploaded:', res.data);
  res.send('Video uploaded successfully!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// 1084926580778-s30h9vo5hvq7f5bn26uuujp7e2s9b20v.apps.googleusercontent.com

// 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