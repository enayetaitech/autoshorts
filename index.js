const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  headers: ['Content-Type', 'Authorization'],
  credentials: true
};

const proxy = createProxyMiddleware({
  target: 'https://accounts.google.com/o/oauth2/auth',
  changeOrigin: true,
  pathRewrite: { '^/proxy': '' },
});


app.use('/proxy', proxy);

app.use('/proxy', cors(corsOptions));

app.use(session({
  secret: 'dfdkAskdjlOOUDF2987FKD9837@#$&#*',
  resave: false,
  saveUninitialized: false
}));

const upload = multer({ dest: './uploads/' });

// Initialize Passport.js
app.post('/proxy', cors(corsOptions), (req, res) => {
  const targetUrl = 'https://accounts.google.com/o/oauth2/auth';
  request(targetUrl, (error, response, body) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.send(body);
    }
  });
});

app.use(passport.initialize());
app.use(passport.session());

// Configure Passport.js
passport.use(new GoogleStrategy({
  clientID: '1084926580778-s30h9vo5hvq7f5bn26uuujp7e2s9b20v.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: '/webhook/google/callback',
  scope: ['email', 'profile']
}, (accessToken, refreshToken, profile, cb) => {
  // Store the user in your database or session
  return cb(null, profile);
}));

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});




// Web hook for sending data to the zapier
app.post('/webhook', upload.single('file'), passport.authenticate('google', {
  scope: ['email', 'profile'],
  credentials: 'include'
}), (req, res) => {
  const videoDetails = req.file;
  // Send video details to Zapier
  console.log('route hit')
  console.log(videoDetails)
  // const zapierUrl = 'https://hooks.zapier.com/hooks/catch/18661439/372i6xc';
  // const options = {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(videoDetails),
  // };
  // fetch(zapierUrl, options)
  //   .then((response) => response.json())
  //   .then((data) => console.log('Zapier response:', data))
  //   .catch((error) => console.error('Error sending data to Zapier:', error));
  //   try {
  //     res.send('Video details sent to Zapier!');
  //   } catch (error) {
  //     console.error('Error sending response:', error);
  //     res.status(500).send('Error sending video details to Zapier');
  //   }
  res.send('Authentication successful!');
});

app.get('/webhook/google/callback', passport.authenticate('google', {
  failureRedirect: '/webhook/failure'
}), (req, res) => {
  res.redirect('/webhook/success');
});

app.get('/webhook/success', (req, res) => {
  res.send('Authentication successful!');
});

app.get('/webhook/failure', (req, res) => {
  res.send('Authentication failed!');
});

app.listen(5000, () => {
  console.log('Webhook endpoint listening on port 5000!');
});


// 1084926580778-s30h9vo5hvq7f5bn26uuujp7e2s9b20v.apps.googleusercontent.com

// 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