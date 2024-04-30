require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');


app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173' // Only allow this origin to access your backend
}));

// oauth credential
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:3000/oauth2callback"
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload'
];

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));


// user schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Pre-save hook to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 8);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Token schema

const TokenSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  accessToken: String,
  refreshToken: String,
  scope: String,
  tokenType: String,
  expiryDate: Number
});

const Token = mongoose.model('Token', TokenSchema);


// user register endpoint
app.post('/register', async (req, res) => {
  try {
    
    const { username, password } = req.body;
    console.log('register', username, password)
    const userExists = await User.findOne({ username: username });
    if (userExists) {
      return res.status(409).send('Username already exists');
    }

    const user = new User({ username, password });
    // await user.save();
    res.status(201).send('User created successfully');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});


// User login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Authenticate user
  console.log('login', username, password)
  // const user = authenticateUser(username, password);
  if (user) {
    const userId = user.id;  // Assume user object has an id
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    res.json({ token });
  } else {
    res.status(401).send('Login failed');
  }
});

// Middleware to validate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN_HERE
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
};

// getting client token
app.get('/auth', (req, res) => {
  const state = jwt.sign({ userId: req.userId }, process.env.JWT_SECRET, {
      expiresIn: '10m'  // short expiry
  });
  const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state  // Pass state parameter
  });
  res.redirect(url);
});


// oauth callback route
app.get('/oauth2callback', async (req, res) => {
  try {
      const { userId } = jwt.verify(req.query.state, process.env.JWT_SECRET);
      const { tokens } = await oauth2Client.getToken(req.query.code);
      oauth2Client.setCredentials(tokens);

      const tokenDocument = new Token({
          userId: userId,  // Use userId extracted from state
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          scope: tokens.scope,
          tokenType: tokens.token_type,
          expiryDate: tokens.expiry_date
      });

      await tokenDocument.save();
      res.send('Authentication successful, you can now close this window.');
  } catch (err) {
      console.error('Error processing OAuth2 callback:', err);
      res.status(500).send('Authentication failed.');
  }
});



// video posting route
app.post('/upload-video', async (req, res) => {
  const videoFilePath = 'path/to/your/video.mp4'; // This will be the video file path
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const response = await youtube.videos.insert({
    part: 'snippet, status',
    requestBody: {
      snippet: {
        title: 'Test Video',
        description: 'Test video uploaded via YouTube API'
      },
      status: {
        privacyStatus: 'private'
      }
    },
    media: {
      body: fs.createReadStream(videoFilePath)
    }
  });
  res.send(`Video uploaded, ID: ${response.data.id}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
