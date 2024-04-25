const express = require('express');
const { google } = require('googleapis');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const cors = require('cors');

const app = express();
const upload = multer({ dest: './uploads/' });
app.use(cors({
  origin: 'http://localhost:5173',
}));
// Initialize the YouTube API library
const youtube = google.youtube('v3');

// Handle POST requests to upload video
app.post('/upload_video', upload.single('video'), async (req, res) => {
  try {
    // Extract video, title, and description from request
    const { title, description } = req.body;
    const video = req.file;

    console.log('title', title)
    console.log('description', description)
    console.log('video', video)
    // Authenticate user and obtain credentials
    const auth = await authenticate({
      keyfilePath: path.join(__dirname, 'oauth2.keys.json'),
      scopes: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
      ],
    });
    google.options({ auth });

    console.log('auth', auth)
    // Upload video to YouTube
    const fileSize = fs.statSync(video.path).size;
    const uploadResponse = await youtube.videos.insert({
      part: 'id,snippet,status',
      notifySubscribers: false,
      requestBody: {
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus: 'private',
        },
      },
      media: {
        body: fs.createReadStream(video.path),
      },
      onUploadProgress: evt => {
        const progress = (evt.bytesRead / fileSize) * 100;
        console.log(`${Math.round(progress)}% uploaded`);
      },
    });

    console.log('upload res', uploadResponse)
    // Send response with video ID
    res.status(200).json({ videoId: uploadResponse.data.id });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Error uploading video' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// 1084926580778-s30h9vo5hvq7f5bn26uuujp7e2s9b20v.apps.googleusercontent.com

// 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