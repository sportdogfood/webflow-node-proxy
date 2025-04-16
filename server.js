// server.js
require('dotenv').config(); // Load environment variables

const express = require('express');
const axios = require('axios'); // Import axios for HTTP requests
const cors = require('cors'); // Import CORS middleware
const app = express();

// Extract environment variables
const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;
const SITE_ID = process.env.SITE_ID;

// Validate essential environment variables
if (!WEBFLOW_API_KEY || !SITE_ID) {
  console.error('Error: Missing essential environment variables.');
  process.exit(1); // Exit the application if required variables are missing
}

// Middleware to enable CORS for specified origin
app.use(cors({
  origin: 'https://www.sportdogfood.com', // Replace with your actual domain
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to make authenticated requests to Webflow API
const makeWebflowRequest = async (method, endpoint, data = null) => {
  const url = `https://api.webflow.com${endpoint}`;
  const headers = {
    'accept': 'application/json',
    'authorization': `Bearer ${WEBFLOW_API_KEY}`,
    'content-type': 'application/json',
  };

  const config = {
    method,
    url,
    headers,
  };

  // Only include data for methods that support a body
  if (data && !['GET', 'HEAD'].includes(method.toUpperCase())) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with a status other than 2xx
      throw {
        status: error.response.status,
        data: error.response.data,
      };
    } else {
      // Other errors (network issues, etc.)
      throw {
        status: 500,
        data: { message: 'Internal Server Error' },
      };
    }
  }
};

// Route: Test Authentication (GET)
app.get('/test_auth', async (req, res) => {
  try {
    const data = await makeWebflowRequest('GET', `/v2/token/authorized_by`);
    res.json({ success: true, message: 'Authorization successful!', data });
  } catch (error) {
    console.error('Authorization Error:', error);
    res.status(error.status || 500).json({ success: false, message: 'Authorization failed.', details: error.data });
  }
});

// Route: Test Authentication (POST) - Optional
app.post('/test_auth', async (req, res) => {
  try {
    const data = await makeWebflowRequest('GET', `/v2/token/authorized_by`);
    res.json({ success: true, message: 'Authorization successful!', data });
  } catch (error) {
    console.error('Authorization Error:', error);
    res.status(error.status || 500).json({ success: false, message: 'Authorization failed.', details: error.data });
  }
});

app.get('/cms/collection/items', async (req, res) => {
  const collectionId = '647ddb9037101ce399b3310c';

  try {
    const response = await makeWebflowRequest('GET', `/v2/collections/${collectionId}/items`);

    // Extract and simplify the payload
    const cleaned = response.items.map(item => {
      const f = item.fieldData;
      return {
        id: item.id,
        name: f.name,
        display: f.display,
        type: f.type,
        company: f.company,
        category: f.category,
        description: f.description,
        keywords: f.keywords,
        link: f.linkto,
        options: f.options,
        opts_ids: f.opts,
        slug: f.slug,
        createdOn: item.createdOn,
        lastUpdated: item.lastUpdated
      };
    });

    res.json({ success: true, count: cleaned.length, items: cleaned });
  } catch (error) {
    console.error('CMS Fetch Error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to fetch CMS items.',
      details: error.data
    });
  }
});


// Other routes as previously defined...

// Route: Root
app.get('/', (req, res) => {
  res.send('App is running.');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
