import axios from 'axios'
import React from 'react'

const App = () => {
  const handleUpload = async () => {
    try {
      const res = await axios.post(`http://localhost:5000/proxy`)
      const data = await res.data;
      console.log('res', res)
      console.log('data', data)
    } catch (error) {
      console.log(error)
    }
    
  }
  
  return (
    <div>
      <button 
      className='btn bg-green-500 px-5 py-3 rounded-lg'
      onClick={handleUpload}>Upload</button>
    </div>
  )
}

export default App