/* ============================================================
   /api/twilio/make-call.js — Outbound call proxy
   POST { to: string, message?: string }
   Initiates a Twilio call and reads a TwiML message.
   Keys never reach the browser.
============================================================ */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const from       = process.env.TWILIO_PHONE_NUMBER;
  const appUrl     = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.APP_URL || '';

  if (!accountSid || !authToken || !from) {
    return res.status(503).json({ error: 'Twilio not configured yet' });
  }

  const { to, message = 'Hello, this is Kai from AcaiOS.' } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Missing to number' });
  }

  if (!/^\+[1-9]\d{7,14}$/.test(to)) {
    return res.status(400).json({ error: 'Invalid phone number format. Use E.164 (+1XXXXXXXXXX)' });
  }

  // Inline TwiML — reads the message then hangs up
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${message.replace(/[<>&]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;' }[c]))}</Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`;

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({
      To:    to,
      From:  from,
      Twiml: twiml
    });

    const upstream = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
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
      console.error('[twilio/call] Error:', data);
      return res.status(upstream.status).json({ error: data.message || 'Twilio error' });
    }

    res.status(200).json({ sid: data.sid, status: data.status });

  } catch (e) {
    console.error('[twilio/call] Unexpected error:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
