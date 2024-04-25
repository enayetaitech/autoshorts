const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization']
}));

const upload = multer({ dest: './uploads/' });
const PORT = process.env.PORT || 5000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://autoshorts.onrender.com/oauth2callback';
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Define the scope for YouTube video uploads
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

app.get('/', (req, res) => {
  res.send('This is autoshorts')
})
// Route to start the OAuth flow
app.get('/connect_youtube', (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // 'offline' access type is used to obtain a refresh token
        scope: SCOPES, // Scopes define the level of access you need: in this case, to upload videos to YouTube
    });
    res.redirect(authUrl); // Redirect the user to the authentication URL
});

// OAuth2 callback route
app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    console.log('code', code)
    console.log('query', req.query)
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('tokens', tokens)
    oAuth2Client.setCredentials(tokens);
    res.redirect('/upload_video'); 
});

app.post('/upload_video', upload.single('video'), async (req, res) => {
  const { title, description } = req.body; // assume video is a file buffer or string
  const video = req.file;
  console.log('title', title)
  console.log('description', description)
  console.log('video', video)
   // Check if user has authenticated with YouTube
  if (!oAuth2Client.credentials) {
    // If not, redirect to /connect_youtube to start OAuth flow
    return res.redirect('/connect_youtube');
  }
  const youtube = google.youtube('v3');

  try {
      const uploadResponse = await youtube.videos.insert({
          part: 'snippet',
          requestBody: {
              snippet: {
                  title,
                  description,
              },
          },
          media: {
              body: video,
          },
      }, {
          auth: oAuth2Client,
      });

      console.log('upload res', uploadResponse)
      const videoId = uploadResponse.data.id;
      res.send(`Video uploaded successfully! Video ID: ${videoId}`);
  } catch (error) {
      console.error(error);
      res.status(500).send(`'Error uploading video' ${error}`);
  }
})


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 1084926580778-s30h9vo5hvq7f5bn26uuujp7e2s9b20v.apps.googleusercontent.com

// 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