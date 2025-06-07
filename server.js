const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const API_TOKEN = '4300a2d3-6623-4de6-a6f6-866d0036091d'; 

// Fix CORS
app.use(cors({
  origin: [
    'http://localhost:5500', 
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.get('/api/products', async (req, res) => {
  try {
    let allItems = [];
    let cursor = null;
    const limit = 100;
    let attempt = 1;

    while (true) {
      const url = new URL('https://rest.boxhero-app.com/v1/items');
      url.searchParams.append('limit', limit);
      if (cursor) url.searchParams.append('cursor', cursor);

      console.log(`➡️ Attempt ${attempt}: Fetching ${url.href}`);
      attempt++;

      const response = await fetch(url.href, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`BoxHero API responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (Array.isArray(data.items)) {
        allItems.push(...data.items);
      }
      // console.log(data);
      // console.log(data.attrs);
      

      if (!data.cursor) break;
      cursor = data.cursor;
    }

    console.log(`✅ Total items fetched: ${allItems.length}`);
    res.json({ items: allItems });
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});
