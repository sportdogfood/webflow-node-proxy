// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Import CORS middleware
require('dotenv').config(); // Load environment variables
const app = express();

// Use CORS middleware with specific origin
app.use(cors({
  origin: 'https://www.sportdogfood.com', // Replace this with the domain you want to allow
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webflow API key from environment variables
const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;

// Webflow API endpoint on Heroku
app.post('/webflow', async (req, res) => {
  const { fieldData } = req.body;

  const headers = {
    'accept': 'application/json',
    'authorization': `Bearer ${WEBFLOW_API_KEY}`,
    'content-type': 'application/json'
  };

  const body = {
    isArchived: false,
    isDraft: false,
    fieldData: {
      name: fieldData.name
      // Add other fields as needed
    }
  };

  try {
    const response = await fetch('https://api.webflow.com/v2/collections/6494e10f7a143f705f4db1d2/items', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Webflow API Error:', errorData);
      return res.status(response.status).json({ error: 'Error sending data to Webflow API', details: errorData });
    }

    const data = await response.json();
    console.log('Webflow API Response:', data);
    res.json(data);
  } catch (error) {
    console.error('Error sending data to Webflow API:', error);
    res.status(500).json({ error: 'Error sending data to Webflow API' });
  }
});

// Updated test_auth route to verify Webflow API key
app.post('/test_auth', async (req, res) => {
  try {
    // Fetch sites to verify API key
    const response = await fetch('https://api.webflow.com/sites', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${WEBFLOW_API_KEY}`,
        'content-type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      res.json({ success: true, message: 'Authorization successful!', data: data });
    } else {
      const errorData = await response.json();
      res.status(response.status).json({ success: false, message: 'Authorization failed.', details: errorData });
    }
  } catch (error) {
    console.error('Error during authentication test:', error);
    res.status(500).json({ success: false, message: 'Error during authentication test.', details: error.message });
  }
});



// Root route
app.get('/', (req, res) => {
  res.send('App is running.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
