import { NextResponse } from 'next/server';

function escapeTwiml(value) {
  return value.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

export async function POST(request) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    return NextResponse.json({ error: 'Twilio not configured yet' }, { status: 503 });
  }

  const { to, message = 'Hello, this is Kai from AcaiOS.' } = await request.json();

  if (!to) {
    return NextResponse.json({ error: 'Missing to number' }, { status: 400 });
  }

  if (!/^\+[1-9]\d{7,14}$/.test(to)) {
    return NextResponse.json(
      { error: 'Invalid phone number format. Use E.164 (+1XXXXXXXXXX)' },
      { status: 400 }
    );
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeTwiml(message)}</Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`;

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({
      To: to,
      From: from,
      Twiml: twiml
    });

    const upstream = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      }
    );

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[twilio/call] Error:', data);
      return NextResponse.json(
        { error: data.message || 'Twilio error' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ sid: data.sid, status: data.status });
  } catch (e) {
    console.error('[twilio/call] Unexpected error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
