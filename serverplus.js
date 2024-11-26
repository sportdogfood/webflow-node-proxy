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


// Route: Get Page Metadata
app.get('/webflow/pages/:page_id/meta', async (req, res) => {
  const { page_id } = req.params;

  if (!page_id) {
    return res.status(400).json({ error: 'page_id is required.' });
  }

  try {
    const data = await makeWebflowRequest('GET', `/pages/${page_id}`);
    res.json(data);
  } catch (error) {
    console.error('Get Page Meta Error:', error);
    res.status(error.status || 500).json({ error: 'Failed to fetch page metadata.', details: error.data });
  }
});

// Route: Update Page Metadata
app.put('/webflow/pages/:page_id/meta', async (req, res) => {
  const { page_id } = req.params;
  const { fieldData } = req.body;

  if (!page_id) {
    return res.status(400).json({ error: 'page_id is required.' });
  }

  if (!fieldData || typeof fieldData !== 'object') {
    return res.status(400).json({ error: 'Valid fieldData object is required.' });
  }

  try {
    const data = await makeWebflowRequest('PUT', `/pages/${page_id}`, { fieldData });
    res.json(data);
  } catch (error) {
    console.error('Update Page Meta Error:', error);
    res.status(error.status || 500).json({ error: 'Failed to update page metadata.', details: error.data });
  }
});

// Route: Get Page Content
app.get('/webflow/pages/:page_id/content', async (req, res) => {
  const { page_id } = req.params;

  if (!page_id) {
    return res.status(400).json({ error: 'page_id is required.' });
  }

  try {
    const data = await makeWebflowRequest('GET', `/pages/${page_id}/dom`);
    res.json(data);
  } catch (error) {
    console.error('Get Page Content Error:', error);
    res.status(error.status || 500).json({ error: 'Failed to fetch page content.', details: error.data });
  }
});

// Route: Update Page Content
app.post('/webflow/pages/:page_id/content', async (req, res) => {
  const { page_id } = req.params;
  const { body_id, script_id, script_version, fieldData } = req.body;

  if (!page_id) {
    return res.status(400).json({ error: 'page_id is required.' });
  }

  if (!fieldData || typeof fieldData !== 'object') {
    return res.status(400).json({ error: 'Valid fieldData object is required.' });
  }

  const data = {
    body_id,
    script_id,
    script_version,
    fieldData,
  };

  try {
    const response = await makeWebflowRequest('POST', `/pages/${page_id}/dom`, data);
    res.json(response);
  } catch (error) {
    console.error('Update Page Content Error:', error);
    res.status(error.status || 500).json({ error: 'Failed to update page content.', details: error.data });
  }
});

// Route: Get Live Collection Item
app.get('/webflow/collections/:collection_id/items/live', async (req, res) => {
  const { collection_id } = req.params;

  if (!collection_id) {
    return res.status(400).json({ error: 'collection_id is required.' });
  }

  try {
    const data = await makeWebflowRequest('GET', `/collections/${collection_id}/items/live`);
    res.json(data);
  } catch (error) {
    console.error('Get Live Collection Item Error:', error);
    res.status(error.status || 500).json({ error: 'Failed to fetch live collection item.', details: error.data });
  }
});

// Route: Update Live Collection Item
app.patch('/webflow/collections/:collection_id/items/live', async (req, res) => {
  const { collection_id } = req.params;
  const { fieldData } = req.body;

  if (!collection_id) {
    return res.status(400).json({ error: 'collection_id is required.' });
  }

  if (!fieldData || typeof fieldData !== 'object') {
    return res.status(400).json({ error: 'Valid fieldData object is required.' });
  }

  try {
    const data = await makeWebflowRequest('PATCH', `/collections/${collection_id}/items/live`, { fieldData });
    res.json(data);
  } catch (error) {
    console.error('Update Live Collection Item Error:', error);
    res.status(error.status || 500).json({ error: 'Failed to update live collection item.', details: error.data });
  }
});

// Route: Get Custom Code Pages
app.get('/webflow/pages/:page_id/custom_code', async (req, res) => {
  const { page_id } = req.params;

  if (!page_id) {
    return res.status(400).json({ error: 'page_id is required.' });
  }

  try {
    const data = await makeWebflowRequest('GET', `/pages/${page_id}/custom_code`);
    res.json(data);
  } catch (error) {
    console.error('Get Custom Code Pages Error:', error);
    res.status(error.status || 500).json({ error: 'Failed to fetch custom code for page.', details: error.data });
  }
});

// Route: Add/Update Custom Code Pages
app.put('/webflow/pages/:page_id/custom_code', async (req, res) => {
  const { page_id } = req.params;
  const { customCode } = req.body;

  if (!page_id) {
    return res.status(400).json({ error: 'page_id is required.' });
  }

  if (!customCode || typeof customCode !== 'object') {
    return res.status(400).json({ error: 'Valid customCode object is required.' });
  }

  try {
    const data = await makeWebflowRequest('PUT', `/pages/${page_id}/custom_code`, { customCode });
    res.json(data);
  } catch (error) {
    console.error('Add/Update Custom Code Pages Error:', error);
    res.status(error.status || 500).json({ error: 'Failed to add/update custom code for page.', details: error.data });
  }
});