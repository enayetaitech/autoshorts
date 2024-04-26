// require('dotenv').config();
// const express = require('express');
// const axios = require('axios');

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.get('/auth/instagram', (req, res) => {
//     const url = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
//     res.redirect(url);
// });

// app.get('/auth/instagram/callback', async (req, res) => {
//     const code = req.query.code;
//     if (!code) {
//         return res.send('No code!');
//     }

//     try {
//         const response = await axios.post('https://api.instagram.com/oauth/access_token', {
//             client_id: process.env.INSTAGRAM_CLIENT_ID,
//             client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
//             grant_type: 'authorization_code',
//             redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
//             code: code,
//         });
//         const accessToken = response.data.access_token;
//         res.json({ accessToken });
//     } catch (error) {
//         console.error('Error getting access token:', error);
//         res.status(500).send('Authentication failed');
//     }
// });


// app.post('/auth/instagram/deauthorize', (req, res) => {
//   // Handle deauthorization notification
//   console.log('Received deauthorization notification:', req.body);
//   res.sendStatus(200); // Respond with success status
// });

// app.delete('/auth/instagram/delete', (req, res) => {
//   // Handle deauthorization notification
//   console.log('Received delete notification:', req.body);
//   res.sendStatus(200); // Respond with success status
// });

// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


const axios = require('axios');
const readline = require('readline');

const clientId = process.env.INSTAGRAM_CLIENT_ID;
const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
const redirectUri = 'http://localhost:5000/auth/instagram/callback';
const accessUrl = 'https://www.facebook.com/v13.0/dialog/oauth?response_type=token&display=popup&client_id=your_client_id&redirect_uri=your_redirect_uri&auth_type=rerequest&scope=user_location%2Cuser_photos%2Cuser_friends%2Cuser_gender%2Cpages_show_list%2Cinstagram_basic%2Cinstagram_manage_comments%2Cinstagram_manage_insights%2Cpages_read_engagement%2Cpublic_profile';
const graphUrl = 'https://graph.facebook.com/v15.0/';

async function getAccessTokenUrl() {
  const accessTokenUrl = `${accessUrl}&redirect_uri=${redirectUri}`;
  console.log('\nAccess code URL:', accessTokenUrl);
  try {
    const response = await axios.get(accessTokenUrl);
    const accessToken = response.data.access_token;
    getLongLivedAccessToken(accessToken);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function getLongLivedAccessToken(accessToken) {
  const url = `${graphUrl}oauth/access_token`;
  const params = {
    grant_type: 'fb_exchange_token',
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: accessToken
  };

  try {
    const response = await axios.get(url, { params });
    const longLivedAccessToken = response.data.access_token;
    console.log('\nLong-lived access token:', longLivedAccessToken);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getAccessTokenUrl();