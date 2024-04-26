require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/auth/instagram', (req, res) => {
    const url = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
    res.redirect(url);
});

app.get('/auth/instagram/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.send('No code!');
    }

    try {
        const response = await axios.post('https://api.instagram.com/oauth/access_token', {
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
            code: code,
        });
        const accessToken = response.data.access_token;
        res.json({ accessToken });
    } catch (error) {
        console.error('Error getting access token:', error);
        res.status(500).send('Authentication failed');
    }
});


app.post('/auth/instagram/deauthorize', (req, res) => {
  // Handle deauthorization notification
  console.log('Received deauthorization notification:', req.body);
  res.sendStatus(200); // Respond with success status
});

app.delete('/auth/instagram/delete', (req, res) => {
  // Handle deauthorization notification
  console.log('Received delete notification:', req.body);
  res.sendStatus(200); // Respond with success status
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));