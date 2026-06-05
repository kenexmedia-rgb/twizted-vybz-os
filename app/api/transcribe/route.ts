import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ text: null });
  }

  try {
    const incoming = await request.formData();
    const audio = incoming.get('audio');

    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ text: null });
    }

    const formData = new FormData();
    formData.set(
      'file',
      new File([await audio.arrayBuffer()], audio.name || 'recording.webm', {
        type: audio.type || 'audio/webm'
      })
    );
    formData.set('model_id', 'scribe_v2');

    const response = await fetch(
      'https://api.elevenlabs.io/v1/speech-to-text',
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData,
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      return NextResponse.json({ text: null });
    }

    const payload = (await response.json()) as { text?: string };
    return NextResponse.json({ text: payload.text?.trim() || null });
  } catch {
    return NextResponse.json({ text: null });
  }
}
