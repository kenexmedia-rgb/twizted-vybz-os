import { NextRequest, NextResponse } from 'next/server';
import {
  getCompany,
  loadVoiceCall,
  synthesizeSpeech
} from '@/lib/voice';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const callSid = request.nextUrl.searchParams.get('callSid')?.trim();
    const turnValue = request.nextUrl.searchParams.get('turn')?.trim();
    const turn = turnValue ? Number.parseInt(turnValue, 10) : Number.NaN;

    if (!callSid || !Number.isInteger(turn) || turn < 0) {
      return NextResponse.json(
        { error: 'callSid and a non-negative turn are required' },
        { status: 400 }
      );
    }

    const voiceCall = await loadVoiceCall(callSid);
    const entry = voiceCall?.conversation.find(
      (candidate) =>
        candidate.turn === turn && candidate.role === 'assistant'
    );

    if (!voiceCall || !entry) {
      return NextResponse.json(
        { error: 'Voice reply was not found' },
        { status: 404 }
      );
    }

    const company = await getCompany(voiceCall.company_id);
    const upstream = await synthesizeSpeech(entry.text, company.voice_id);

    return new Response(upstream.body, {
      headers: {
        'content-type': 'audio/mpeg',
        'cache-control': 'private, max-age=300'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Speech synthesis failed'
      },
      { status: 502 }
    );
  }
}
