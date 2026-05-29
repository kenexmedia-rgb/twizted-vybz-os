// api/supabase.js — Supabase proxy for AcaiOS
// Vercel serverless function

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { table, action, data, filters, limit, order } = req.body;

  if (!table || !action) {
    return res.status(400).json({ error: 'Missing table or action' });
  }

  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    };

    // Build query params
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        params.append(key, `eq.${val}`);
      });
    }

    if (order) params.append('order', order);
    if (limit) params.append('limit', limit);

    const queryString = params.toString();
    if (queryString && action === 'select') url += `?${queryString}`;

    let fetchOptions = { headers };

    if (action === 'select') {
      fetchOptions.method = 'GET';
      headers['Range'] = '0-99';
    } else if (action === 'insert') {
      fetchOptions.method = 'POST';
      fetchOptions.body = JSON.stringify(data);
    } else if (action === 'update') {
      fetchOptions.method = 'PATCH';
      fetchOptions.body = JSON.stringify(data);
      if (queryString) url += `?${queryString}`;
    } else if (action === 'delete') {
      fetchOptions.method = 'DELETE';
      if (queryString) url += `?${queryString}`;
    } else {
      return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const response = await fetch(url, fetchOptions);
    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: result });
    }

    return res.status(200).json({ data: Array.isArray(result) ? result : [result] });

  } catch (err) {
    console.error('[Supabase proxy error]', err);
    return res.status(500).json({ error: err.message });
  }
}
