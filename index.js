const axios = require('axios');

const clientId = '2098079117239772'; // Your Client ID
const redirectUri = '(link unavailable)'; // Your Redirect URI
const scope = 'user_profile'; // Scope for user profile information

// Step 1: Redirect the user to the Instagram authorization page
const authorizationUrl = `(link unavailable)?
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  response_type=code&
  scope=${scope}`;

console.log(`Please visit: ${authorizationUrl}`);

// Step 2: Handle the authorization code callback
const code = 'THE_AUTHORIZATION_CODE_FROM_INSTAGRAM'; // Replace with the code from the callback
const tokenUrl = '(link unavailable)';

axios.post(tokenUrl, {
  client_id: clientId,
  client_secret: 'YOUR_CLIENT_SECRET', // Your Client Secret
  grant_type: 'authorization_code',
  redirect_uri: redirectUri,
  code: code
})
.then(response => {
  const accessToken = response.data.access_token;
  console.log(`Access Token: ${accessToken}`);

  // Use the access token to retrieve the user's profile information
  const profileUrl = '(link unavailable)';
  axios.get(profileUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
})
.catch(error => {
  console.error(error);
});