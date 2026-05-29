/* ============================================================
   /api/twilio/send-sms.js — Outbound SMS proxy
   POST { to: string, body: string }
   Keys never reach the browser.
============================================================ */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const from       = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    return res.status(503).json({ error: 'Twilio not configured yet' });
  }

  const { to, body } = req.body;

  if (!to || !body) {
    return res.status(400).json({ error: 'Missing to or body' });
  }

  // Basic phone number validation
  if (!/^\+[1-9]\d{7,14}$/.test(to)) {
    return res.status(400).json({ error: 'Invalid phone number format. Use E.164 (+1XXXXXXXXXX)' });
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({ To: to, From: from, Body: body.slice(0, 1600) });

    const upstream = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type':  'application/x-www-form-urlencoded'
        },
        body: params.toString()
      }
    );

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[twilio/sms] Error:', data);
      return res.status(upstream.status).json({ error: data.message || 'Twilio error' });
    }

    res.status(200).json({ sid: data.sid, status: data.status });

  } catch (e) {
    console.error('[twilio/sms] Unexpected error:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
