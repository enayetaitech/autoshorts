const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const upload = multer({ dest: './uploads/' });


// Web hook for sending data to the zapier
app.post('/webhook', upload.single('file'), (req, res) => {
  const videoDetails = req.file;
  // Send video details to Zapier
  console.log('route hit')
  console.log(videoDetails)
  const zapierUrl = 'https://hooks.zapier.com/hooks/catch/18661439/372i6xc';
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(videoDetails),
  };
  fetch(zapierUrl, options)
    .then((response) => response.json())
    .then((data) => console.log('Zapier response:', data))
    .catch((error) => console.error('Error sending data to Zapier:', error));
    try {
      res.send('Video details sent to Zapier!');
    } catch (error) {
      console.error('Error sending response:', error);
      res.status(500).send('Error sending video details to Zapier');
    }
});

app.listen(5000, () => {
  console.log('Webhook endpoint listening on port 5000!');
});


// 1084926580778-s30h9vo5hvq7f5bn26uuujp7e2s9b20v.apps.googleusercontent.com

// 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