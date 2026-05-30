import { NextResponse } from 'next/server';

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  const { messages, system } = await request.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
  }

  const systemPrompt = system || `You are Kai, Tony Terry's personal AI assistant. You can talk about anything - business, life, ideas, random questions, whatever comes up. You know Tony runs three businesses: DKR Consulting Healthcare Solutions, Twizted Vybz Realty & Management, and Twizted Vybz Generations Capital. Be natural, be real, talk like a person. No markdown formatting - just plain conversational text.`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.slice(-10)
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[claude] API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'AI error' },
        { status: upstream.status }
      );
    }

    const reply = data.content?.[0]?.text || "I didn't catch that. Try again.";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error('[claude] Unexpected error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
