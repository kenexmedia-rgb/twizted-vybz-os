import { NextResponse } from 'next/server';

const NOTION_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const ALLOWED = [
  /^\/databases\/[a-f0-9-]+\/query$/,
  /^\/databases\/[a-f0-9-]+$/,
  /^\/pages\/[a-f0-9-]+$/,
  /^\/pages$/,
  /^\/blocks\/[a-f0-9-]+\/children$/,
  /^\/search$/
];

function isAllowed(endpoint) {
  return ALLOWED.some((pattern) => pattern.test(endpoint));
}

export async function POST(request) {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Notion not configured' }, { status: 500 });
  }

  const { endpoint, method = 'POST', body } = await request.json();

  if (!endpoint || !isAllowed(endpoint)) {
    return NextResponse.json({ error: 'Endpoint not permitted' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${NOTION_BASE}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[notion] API error:', data);
      return NextResponse.json(
        { error: data.message || 'Notion error' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    console.error('[notion] Unexpected error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
