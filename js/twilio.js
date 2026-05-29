/* ============================================================
   twilio.js — Calls & SMS
   All requests go through /api/twilio/ serverless proxies.
   Keys live in Vercel env vars — never in the browser.
============================================================ */

async function placeTwilioCall(toNumber, leadName, message) {
  try {
    const res = await fetch('/api/twilio/make-call', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ to: toNumber, message })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Call failed');
    addChatMsg('acai', `📞 Calling <strong>${leadName}</strong>… <span style="font-size:12px;color:var(--text-tertiary);">Call ID: ${data.sid}</span>`);
  } catch(e) {
    addChatMsg('acai', `📞 Couldn't reach <strong>${leadName}</strong> — ${e.message}`);
  }
}

async function sendTwilioSMS(toNumber, leadName, body) {
  try {
    const res = await fetch('/api/twilio/send-sms', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ to: toNumber, body })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'SMS failed');
    addChatMsg('acai', `💬 SMS sent to <strong>${leadName}</strong>.`);
  } catch(e) {
    addChatMsg('acai', `💬 Couldn't send SMS to <strong>${leadName}</strong> — ${e.message}`);
  }
}
