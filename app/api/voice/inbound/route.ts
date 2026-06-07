import { NextRequest, NextResponse } from 'next/server';
import {
  conversationTwiml,
  createVoiceCall,
  loadVoiceCall,
  parseTwilioForm,
  publicBaseUrl,
  resolveCompany,
  twimlResponse,
  validateTwilioSignature
} from '@/lib/voice';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const form = await parseTwilioForm(request);

    if (!validateTwilioSignature(request, form)) {
      return NextResponse.json(
        { error: 'Invalid Twilio signature' },
        { status: 403 }
      );
    }

    const callSid = form.get('CallSid')?.trim();
    const fromNumber = form.get('From')?.trim() || null;
    const toNumber = form.get('To')?.trim() || null;

    if (!callSid) {
      return NextResponse.json(
        { error: 'CallSid is required' },
        { status: 400 }
      );
    }

    const existing = await loadVoiceCall(callSid);
    const direction =
      request.nextUrl.searchParams.get('direction') === 'outbound'
        ? 'outbound'
        : 'inbound';
    const company = existing
      ? null
      : await resolveCompany(direction === 'inbound' ? toNumber : fromNumber);
    const voiceCall =
      existing ??
      (await createVoiceCall({
        callSid,
        direction,
        fromNumber,
        toNumber,
        company: company!,
        openingMessage:
          direction === 'outbound'
            ? `Hello, this is Kai calling from ${company!.name}. How can I help you today?`
            : `Thank you for calling ${company!.name}. This is Kai. How can I help you today?`
      }));

    if (!voiceCall) {
      throw new Error('Unable to initialize voice call');
    }

    return twimlResponse(
      conversationTwiml({
        baseUrl: publicBaseUrl(request),
        callSid,
        turn: 0
      })
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to initialize voice call'
      },
      { status: 500 }
    );
  }
}
