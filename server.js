const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config(); // Load .env at the very top


const app = express();
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.BOXHERO_API_TOKEN; 

// Fix CORS
app.use(cors({
  origin: [
    'http://localhost:5500', 
    'http://127.0.0.1:5500',
    'https://mysteryrooms.vercel.app'
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

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 2; // seconds
        console.warn(`⚠️ Rate limited. Retrying after ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue; // Retry the same request
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`BoxHero API responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (Array.isArray(data.items)) {
        allItems.push(...data.items);
      }

      if (!data.cursor) break;
      cursor = data.cursor;

      // Throttle requests to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec delay
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
