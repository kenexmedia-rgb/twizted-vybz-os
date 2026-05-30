import { NextResponse } from 'next/server';

export async function POST(request) {
  const { text } = await request.json();

  if (!text || typeof text !== 'string' || text.trim().length < 2) {
    return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    return NextResponse.json({ error: 'Voice service not configured' }, { status: 500 });
  }

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg'
        },
        body: JSON.stringify({
          text: text.slice(0, 1000),
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.4, similarity_boost: 0.85 }
        })
      }
    );

    if (!upstream.ok) {
      const err = await upstream.text();
      console.error('[voice] ElevenLabs error:', err);
      return NextResponse.json({ error: 'Voice service error' }, { status: upstream.status });
    }

    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    console.error('[voice] Unexpected error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
