import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Request to backend to clear the cookie
      await axios.get('http://localhost:3000/logout', { withCredentials: true });
      // Redirect to login page or wherever appropriate
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
      // Optionally handle errors, e.g., show an error message
    }
  };

  const connectYouTube = async () => {
    try {
      const token = localStorage.getItem('token');  // Assuming you store the token in localStorage after login
      if (token) {
        const response = await axios.get('http://localhost:3000/auth', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        window.location.href = response.request.responseURL;  // This will redirect to Google's OAuth page
      } else {
        console.error('Token not found');
      }
    } catch (error) {
      console.error('Failed to connect to YouTube:', error);
    }
  };
  


  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <p>This is a protected page. You must be logged in to view it.</p>
      <button 
      className='bg-black text-white px-5 py-2 rounded-lg'
      onClick={handleLogout}>Logout</button>
     <button 
        className='bg-black text-white px-5 py-2 rounded-lg'
        onClick={connectYouTube}>Connect YouTube</button>
    </div>
  );
}

export default Home;
