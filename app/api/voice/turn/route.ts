import { NextRequest, NextResponse } from 'next/server';
import {
  conversationTwiml,
  generateVoiceReply,
  getCompany,
  isGoodbye,
  loadVoiceCall,
  parseTwilioForm,
  publicBaseUrl,
  twimlResponse,
  updateVoiceCall,
  validateTwilioSignature,
  type VoiceConversationEntry
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

    const callSid =
      form.get('CallSid')?.trim() ??
      request.nextUrl.searchParams.get('callSid')?.trim();
    const speech = form.get('SpeechResult')?.trim();

    if (!callSid) {
      return NextResponse.json(
        { error: 'CallSid is required' },
        { status: 400 }
      );
    }

    const voiceCall = await loadVoiceCall(callSid);

    if (!voiceCall) {
      return NextResponse.json(
        { error: 'Voice call was not found' },
        { status: 404 }
      );
    }

    const nextTurn = voiceCall.conversation.length;

    if (!speech) {
      const retry: VoiceConversationEntry = {
        role: 'assistant',
        text: 'I did not catch that. Could you please say it again?',
        turn: nextTurn,
        created_at: new Date().toISOString()
      };
      await updateVoiceCall(
        voiceCall,
        [...voiceCall.conversation, retry],
        'in_progress'
      );
      return twimlResponse(
        conversationTwiml({
          baseUrl: publicBaseUrl(request),
          callSid,
          turn: retry.turn
        })
      );
    }

    const callerEntry: VoiceConversationEntry = {
      role: 'user',
      text: speech,
      turn: nextTurn,
      created_at: new Date().toISOString()
    };
    const withCaller = [...voiceCall.conversation, callerEntry];

    if (isGoodbye(speech)) {
      const farewell: VoiceConversationEntry = {
        role: 'assistant',
        text: 'Thank you for calling. Goodbye.',
        turn: nextTurn + 1,
        created_at: new Date().toISOString()
      };
      await updateVoiceCall(
        voiceCall,
        [...withCaller, farewell],
        'completed'
      );
      return twimlResponse(
        conversationTwiml({
          baseUrl: publicBaseUrl(request),
          callSid,
          turn: farewell.turn,
          gather: false
        })
      );
    }

    const company = await getCompany(voiceCall.company_id);
    const replyText = await generateVoiceReply(
      { ...voiceCall, conversation: withCaller },
      company
    );
    const reply: VoiceConversationEntry = {
      role: 'assistant',
      text: replyText,
      turn: nextTurn + 1,
      created_at: new Date().toISOString()
    };
    await updateVoiceCall(
      voiceCall,
      [...withCaller, reply],
      'in_progress'
    );

    return twimlResponse(
      conversationTwiml({
        baseUrl: publicBaseUrl(request),
        callSid,
        turn: reply.turn
      })
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Voice turn processing failed'
      },
      { status: 500 }
    );
  }
}
