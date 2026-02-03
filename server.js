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
  const collectionId = '64b01211660e83444d2586c1';

  try {
    const response = await makeWebflowRequest('GET', `/v2/collections/${collectionId}/items`);

    const cleaned = response.items.map(item => {
      const f = item.fieldData;
      return {
        name: f.name,
        slug: f.slug,
        collectionId: collectionId,
        itemId: item.id,
        createdOn: item.createdOn,
        updatedOn: item.lastUpdated,
        publishedOn: item.lastPublished,
        type: f.type,
        display: f.display,
        company: f.company,
        category: f.category,
        options: f.options,
        description: f.description,
        suggest: f.suggest,
        linkto: f.linkto,
        co: f.co,
        expl: f.expl,
        comp: f.comp,
        acct: f.acct,
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

// 1) Add near the top (after SITE_ID env vars), alongside your other env reads:
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// optional: set this in .env, otherwise it will use your horses table id below
const AIRTABLE_HORSES_TABLE = process.env.AIRTABLE_HORSES_TABLE || 'tblliyUZ1ZS88Kfvl';

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Error: Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID.');
  process.exit(1);
}

// 2) Update CORS to allow your Webflow preview origin
app.use(cors({
  origin: [
    'https://www.sportdogfood.com',
    'https://tackready.webflow.io',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3) Add this helper (similar to makeWebflowRequest)
const makeAirtableRequest = async (method, path, params = null, data = null) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${path}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const config = { method, url, headers };
  if (params) config.params = params;
  if (data && !['GET', 'HEAD'].includes(method.toUpperCase())) config.data = data;

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) throw { status: error.response.status, data: error.response.data };
    throw { status: 500, data: { message: 'Internal Server Error' } };
  }
};

// 4) Minimal TEST route (GET) to confirm CORS + Airtable auth works
app.get('/airtable/ping', async (req, res) => {
  try {
    // fetch 1 record to prove Airtable access works
    const data = await makeAirtableRequest('GET', AIRTABLE_HORSES_TABLE, { pageSize: 1 });
    res.json({ success: true, message: 'Airtable OK', sample: data?.records?.[0] || null });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: 'Airtable failed', details: error.data });
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
