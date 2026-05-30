import { NextResponse } from 'next/server';

export async function POST(request) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    return NextResponse.json({ error: 'Twilio not configured yet' }, { status: 503 });
  }

  const { to, body } = await request.json();

  if (!to || !body) {
    return NextResponse.json({ error: 'Missing to or body' }, { status: 400 });
  }

  if (!/^\+[1-9]\d{7,14}$/.test(to)) {
    return NextResponse.json(
      { error: 'Invalid phone number format. Use E.164 (+1XXXXXXXXXX)' },
      { status: 400 }
    );
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({ To: to, From: from, Body: body.slice(0, 1600) });

    const upstream = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
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
      console.error('[twilio/sms] Error:', data);
      return NextResponse.json(
        { error: data.message || 'Twilio error' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ sid: data.sid, status: data.status });
  } catch (e) {
    console.error('[twilio/sms] Unexpected error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
