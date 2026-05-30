export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Missing config' });
  const { table, action, filters = {}, order, limit } = req.body;
  if (!table || !action) return res.status(400).json({ error: 'Missing table or action' });
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => params.append(k, `eq.${v}`));
    if (order) params.append('order', order);
    if (limit) params.append('limit', String(limit));
    const url = `${SUPABASE_URL}/rest/v1/${table}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    const result = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: result });
    return res.status(200).json({ data: Array.isArray(result) ? result : [result] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
