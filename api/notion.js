/* ============================================================
   /api/notion.js — Notion API proxy
   POST { endpoint: string, method?: string, body?: object }
   Proxies requests to Notion API — key never reaches browser.
   Example: POST /api/notion
   { endpoint: '/databases/DATABASE_ID/query', body: { filter: {...} } }
============================================================ */

const NOTION_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// Whitelist of allowed Notion endpoints (security — prevent arbitrary calls)
const ALLOWED = [
  /^\/databases\/[a-f0-9-]+\/query$/,
  /^\/databases\/[a-f0-9-]+$/,
  /^\/pages\/[a-f0-9-]+$/,
  /^\/pages$/,
  /^\/blocks\/[a-f0-9-]+\/children$/,
  /^\/search$/,
];

function isAllowed(endpoint) {
  return ALLOWED.some(pattern => pattern.test(endpoint));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Notion not configured' });
  }

  const { endpoint, method = 'POST', body } = req.body;

  if (!endpoint || !isAllowed(endpoint)) {
    return res.status(400).json({ error: 'Endpoint not permitted' });
  }

  try {
    const upstream = await fetch(`${NOTION_BASE}${endpoint}`, {
      method,
      headers: {
        'Authorization':  `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type':   'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[notion] API error:', data);
      return res.status(upstream.status).json({ error: data.message || 'Notion error' });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);

  } catch (e) {
    console.error('[notion] Unexpected error:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
