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
  origin: 'http://localhost:5173', // Your client's origin
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'], // Explicitly allow Authorization header
  methods: ['GET', 'POST', 'OPTIONS']  // Ensure methods are explicitly allowed
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
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'  // or the duration you'd prefer
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,  // In development, it's okay to set secure to false because we're not using HTTPS
      expires: new Date(Date.now() + 3600000), // Cookie expiration to match token
      sameSite: 'none' // Can set to 'none' if issues arise with some browsers in development
    });
console.log('token', token)
    res.status(201).json({ message: 'User created successfully', token: token });
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});


// User login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('login', username, password);

  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(401).send('Login failed: User not found');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send('Login failed: Incorrect password');
    }

    const userId = user.id;  // Use user's MongoDB ID
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token, {
      httpOnly: false,
      secure: true,  // In development, it's okay to set secure to false because we're not using HTTPS
      expires: new Date(Date.now() + 3600000), // Cookie expiration to match token
      sameSite: 'none',
      path: '/'
       // Can set to 'none' if issues arise with some browsers in development
    });

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Error during login process');
  }
});

// User logout endpoint

app.get('/logout', (req, res) => {
  // Clear the authentication cookie
  res.cookie('token', '', {
    httpOnly: false,
      secure: true, 
    expires: new Date(0),  // Set expiration to a past date
// Note: in production, set to true to send the cookie over HTTPS only
    sameSite: 'none' // Note: in production, consider using 'strict' or 'lax'
  });

  res.send('Logged out successfully');
});


// Middleware to validate token and add user ID to the request
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).send('Your session is not valid');
      }
      req.userId = decoded.userId;
      next();
    });
  } else {
    res.status(401).send('No token provided');
  }
});

// getting client token
app.get('/auth', (req, res) => {
  console.log('auth route hit')
  if (!req.userId) {
    return res.status(403).send('User is not authenticated');
  }
  const state = jwt.sign({ userId: req.userId }, process.env.JWT_SECRET, {
    expiresIn: '10m'  // short expiry
  });
  console.log('state set', state)
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state  // Pass state parameter
  });
  console.log('url set', url)
  res.redirect(url);
});


// oauth callback route
app.get('/oauth2callback', async (req, res) => {
  try {
      const { userId } = jwt.verify(req.query.state, process.env.JWT_SECRET);
      console.log('inside callback', userId)
      const { tokens } = await oauth2Client.getToken(req.query.code);
      oauth2Client.setCredentials(tokens);
console.log('google token', token)
      const tokenDocument = new Token({
          userId: userId,  // Use userId extracted from state
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          scope: tokens.scope,
          tokenType: tokens.token_type,
          expiryDate: tokens.expiry_date
      });

      const savedToken = await tokenDocument.save();

      // Check if the document was saved successfully
      if (savedToken) {
          console.log('Token saved successfully:', savedToken);
          res.json({
              message: 'Authentication successful, tokens saved.',
              tokenDetails: {
                  accessToken: savedToken.accessToken,
                  refreshToken: savedToken.refreshToken,
                  expiryDate: new Date(savedToken.expiryDate).toLocaleString() // Displaying date in readable format
              }
          });
      } else {
          console.error('Failed to save the token.');
          res.status(500).send('Failed to save the token.');
      }
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
