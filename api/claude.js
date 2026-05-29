/* ============================================================
   /api/claude.js — Anthropic Claude proxy for Kai
   POST { messages: [{role, content}], system?: string }
   Returns { reply: string }
   Key never reaches the browser.
============================================================ */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI not configured' });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const systemPrompt = system || `You are Kai, Tony Terry's personal AI assistant. You can talk about anything — business, life, ideas, random questions, whatever comes up. You know Tony runs three businesses: DKR Consulting Healthcare Solutions, Twizted Vybz Realty & Management, and Twizted Vybz Generations Capital. Be natural, be real, talk like a person. No markdown formatting — just plain conversational text.`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 500,
        system:     systemPrompt,
        messages:   messages.slice(-10) // last 10 messages for context
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[claude] API error:', data);
      return res.status(upstream.status).json({ error: data.error?.message || 'AI error' });
    }

    const reply = data.content?.[0]?.text || "I didn't catch that. Try again.";
    res.status(200).json({ reply });

  } catch (e) {
    console.error('[claude] Unexpected error:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
