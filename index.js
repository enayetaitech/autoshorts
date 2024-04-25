const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5000/oauth2callback';
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
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    res.send('YouTube account connected. You can now upload videos.');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 1084926580778-s30h9vo5hvq7f5bn26uuujp7e2s9b20v.apps.googleusercontent.com

// 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