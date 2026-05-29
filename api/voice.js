/* ============================================================
   /api/voice.js — ElevenLabs TTS proxy
   POST { text: string }
   Returns audio/mpeg stream
   Keys never reach the browser.
============================================================ */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length < 2) {
    return res.status(400).json({ error: 'Invalid text' });
  }

  const apiKey  = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    return res.status(500).json({ error: 'Voice service not configured' });
  }

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key':   apiKey,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg'
        },
        body: JSON.stringify({
          text: text.slice(0, 1000), // safety cap
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.4, similarity_boost: 0.85 }
        })
      }
    );

    if (!upstream.ok) {
      const err = await upstream.text();
      console.error('[voice] ElevenLabs error:', err);
      return res.status(upstream.status).json({ error: 'Voice service error' });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(buffer);

  } catch (e) {
    console.error('[voice] Unexpected error:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
