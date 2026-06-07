import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SETUP_TOKEN =
  '2a39a1eaddf5d513a9c7265b4b9eb750176ae642f6acfc7074d00ccffd6fb78e';

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function twilioRequest(path: string, body?: URLSearchParams) {
  const accountSid = requireEnv('TWILIO_ACCOUNT_SID');
  const authToken = requireEnv('TWILIO_AUTH_TOKEN');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}${path}`,
    {
      method: body ? 'POST' : 'GET',
      headers: {
        authorization: `Basic ${Buffer.from(
          `${accountSid}:${authToken}`
        ).toString('base64')}`,
        ...(body
          ? { 'content-type': 'application/x-www-form-urlencoded' }
          : {})
      },
      body,
      cache: 'no-store'
    }
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.message ?? `Twilio API failed with ${response.status}`
    );
  }

  return payload;
}

function authorize(request: NextRequest) {
  return request.headers.get('x-voice-setup-token') === SETUP_TOKEN;
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expectedPhone = requireEnv('TWILIO_PHONE');
    const payload = await twilioRequest('/IncomingPhoneNumbers.json');
    const numbers = (
      payload?.incoming_phone_numbers as Array<{
        sid: string;
        phone_number: string;
        voice_url: string;
      }>
    ).map((number) => ({
      sid: number.sid,
      phoneNumber: number.phone_number,
      voiceUrl: number.voice_url,
      expected: number.phone_number === expectedPhone
    }));

    return NextResponse.json({ expectedPhone, numbers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup lookup failed' },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const incomingPhoneSid =
      typeof body?.incomingPhoneSid === 'string'
        ? body.incomingPhoneSid.trim()
        : '';
    const voiceUrl =
      typeof body?.voiceUrl === 'string' ? body.voiceUrl.trim() : '';

    if (!incomingPhoneSid || !voiceUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'incomingPhoneSid and HTTPS voiceUrl are required' },
        { status: 400 }
      );
    }

    const payload = await twilioRequest(
      `/IncomingPhoneNumbers/${encodeURIComponent(incomingPhoneSid)}.json`,
      new URLSearchParams({
        VoiceUrl: voiceUrl,
        VoiceMethod: 'POST'
      })
    );

    return NextResponse.json({
      sid: payload.sid,
      phoneNumber: payload.phone_number,
      voiceUrl: payload.voice_url
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup update failed' },
      { status: 502 }
    );
  }
}
