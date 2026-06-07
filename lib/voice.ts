import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';
import { callModel, getModelText } from '@/lib/model';
import type { ConversationMessage } from '@/lib/onboarding/types';
import { supabaseAdmin } from '@/lib/supabase';

export const TIFFANY_VOICE_ID = '6aDn1KB0hjpdcocrUkmq';

export type VoiceConversationEntry = {
  role: 'user' | 'assistant';
  text: string;
  turn: number;
  created_at: string;
};

export type VoiceCallRow = {
  id: string;
  call_sid: string;
  direction: 'inbound' | 'outbound';
  from_number: string | null;
  to_number: string | null;
  organization_id: string;
  company_id: string;
  conversation: VoiceConversationEntry[];
  status: 'in_progress' | 'completed' | 'failed';
};

type VoiceCompany = {
  id: string;
  organization_id: string;
  name: string;
  voice_id: string | null;
};

type PromptContext = {
  system: string;
  userId: string | null;
};

function requireRuntimeEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function absoluteRequestUrl(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProtocol = request.headers.get('x-forwarded-proto');

  if (!forwardedHost) {
    return request.url;
  }

  const url = new URL(request.url);
  url.host = forwardedHost;
  url.protocol = `${forwardedProtocol ?? 'https'}:`;
  return url.toString();
}

export function validateTwilioSignature(
  request: NextRequest,
  params: URLSearchParams
) {
  const signature = request.headers.get('x-twilio-signature');

  if (!signature) {
    return false;
  }

  const authToken = requireRuntimeEnv('TWILIO_AUTH_TOKEN');
  const sorted = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const payload =
    absoluteRequestUrl(request) +
    sorted.map(([key, value]) => `${key}${value}`).join('');
  const expected = createHmac('sha1', authToken)
    .update(payload)
    .digest('base64');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function parseTwilioForm(request: NextRequest) {
  return new URLSearchParams(await request.text());
}

export function publicBaseUrl(request: NextRequest) {
  const configured =
    process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;
  const baseUrl = configured
    ? configured.startsWith('http')
      ? configured
      : `https://${configured}`
    : new URL(absoluteRequestUrl(request)).origin;
  const url = new URL(baseUrl);
  const previewShare = request.nextUrl.searchParams.get('_vercel_share');

  if (previewShare) {
    url.searchParams.set('_vercel_share', previewShare);
  }

  return url.toString();
}

export function voiceEndpointUrl(baseUrl: string, pathname: string) {
  const base = new URL(baseUrl);
  const url = new URL(pathname, base.origin);
  const previewShare = base.searchParams.get('_vercel_share');

  if (previewShare) {
    url.searchParams.set('_vercel_share', previewShare);
  }

  return url;
}

function ttsUrl(baseUrl: string, callSid: string, turn: number) {
  const url = voiceEndpointUrl(baseUrl, '/api/voice/tts');
  url.searchParams.set('callSid', callSid);
  url.searchParams.set('turn', String(turn));
  return url.toString();
}

function turnUrl(baseUrl: string, callSid: string) {
  const url = voiceEndpointUrl(baseUrl, '/api/voice/turn');
  url.searchParams.set('callSid', callSid);
  return url.toString();
}

export function conversationTwiml({
  baseUrl,
  callSid,
  turn,
  gather = true
}: {
  baseUrl: string;
  callSid: string;
  turn: number;
  gather?: boolean;
}) {
  const play = `<Play>${xmlEscape(ttsUrl(baseUrl, callSid, turn))}</Play>`;
  const next = gather
    ? `<Gather input="speech" action="${xmlEscape(
        turnUrl(baseUrl, callSid)
      )}" method="POST" speechTimeout="auto">${play}</Gather><Redirect method="POST">${xmlEscape(
        turnUrl(baseUrl, callSid)
      )}</Redirect>`
    : `${play}<Hangup/>`;

  return `<?xml version="1.0" encoding="UTF-8"?><Response>${next}</Response>`;
}

export function twimlResponse(xml: string, status = 200) {
  return new Response(xml, {
    status,
    headers: { 'content-type': 'text/xml; charset=utf-8' }
  });
}

export async function resolveCompany(toNumber: string | null) {
  if (toNumber) {
    const { data: matched, error } = await supabaseAdmin
      .from('companies')
      .select('id, organization_id, name, voice_id')
      .eq('phone_number', toNumber)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to resolve voice company: ${error.message}`);
    }

    if (matched) {
      return matched as VoiceCompany;
    }
  }

  const { data: primaryOrganization, error: organizationError } =
    await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', 'twizted-vybz')
      .maybeSingle();

  if (organizationError || !primaryOrganization) {
    throw new Error(
      `Unable to resolve default organization: ${
        organizationError?.message ?? 'twizted-vybz was not found'
      }`
    );
  }

  const { data: fallback, error: fallbackError } = await supabaseAdmin
    .from('companies')
    .select('id, organization_id, name, voice_id')
    .eq('organization_id', primaryOrganization.id)
    .order('created_at')
    .limit(1)
    .maybeSingle();

  if (fallbackError || !fallback) {
    throw new Error(
      `Unable to resolve default voice company: ${
        fallbackError?.message ?? 'No company was found'
      }`
    );
  }

  console.warn('voice_company_fallback', {
    toNumber,
    companyId: fallback.id,
    organizationId: fallback.organization_id
  });
  return fallback as VoiceCompany;
}

export async function loadVoiceCall(callSid: string) {
  const { data, error } = await supabaseAdmin
    .from('voice_calls')
    .select(
      'id, call_sid, direction, from_number, to_number, organization_id, company_id, conversation, status'
    )
    .eq('call_sid', callSid)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load voice call: ${error.message}`);
  }

  return data as VoiceCallRow | null;
}

export async function createVoiceCall({
  callSid,
  direction,
  fromNumber,
  toNumber,
  company,
  openingMessage
}: {
  callSid: string;
  direction: 'inbound' | 'outbound';
  fromNumber: string | null;
  toNumber: string | null;
  company: VoiceCompany;
  openingMessage: string;
}) {
  const conversation: VoiceConversationEntry[] = [
    {
      role: 'assistant',
      text: openingMessage,
      turn: 0,
      created_at: new Date().toISOString()
    }
  ];
  const { data, error } = await supabaseAdmin
    .from('voice_calls')
    .upsert(
      {
        call_sid: callSid,
        direction,
        from_number: fromNumber,
        to_number: toNumber,
        organization_id: company.organization_id,
        company_id: company.id,
        conversation,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'call_sid', ignoreDuplicates: true }
    )
    .select(
      'id, call_sid, direction, from_number, to_number, organization_id, company_id, conversation, status'
    )
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to create voice call: ${error.message}`);
  }

  return (data as VoiceCallRow | null) ?? (await loadVoiceCall(callSid));
}

export async function getCompany(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('id, organization_id, name, voice_id')
    .eq('id', companyId)
    .single();

  if (error || !data) {
    throw new Error(
      `Unable to load voice company: ${error?.message ?? 'Company not found'}`
    );
  }

  return data as VoiceCompany;
}

async function resolvePromptContext(company: VoiceCompany) {
  const { data: companyUser } = await supabaseAdmin
    .from('users')
    .select('id, kai_system_prompt')
    .eq('organization_id', company.organization_id)
    .eq('company_id', company.id)
    .not('kai_system_prompt', 'is', null)
    .limit(1)
    .maybeSingle();

  if (companyUser?.kai_system_prompt) {
    return {
      system: companyUser.kai_system_prompt,
      userId: companyUser.id
    } satisfies PromptContext;
  }

  const { data: membership } = await supabaseAdmin
    .from('company_users')
    .select('user_id')
    .eq('organization_id', company.organization_id)
    .eq('company_id', company.id)
    .order('created_at')
    .limit(1)
    .maybeSingle();
  const { data: owner } = membership?.user_id
    ? await supabaseAdmin
        .from('users')
        .select('id, kai_system_prompt')
        .eq('id', membership.user_id)
        .maybeSingle()
    : { data: null };

  return {
    system:
      owner?.kai_system_prompt ??
      `You are Kai, the phone assistant for ${company.name}. Be warm, concise, truthful, and helpful. Ask one question at a time. Never claim to be human. If asked, explain that you are Kai, the company's AI assistant.`,
    userId: owner?.id ?? null
  } satisfies PromptContext;
}

export async function generateVoiceReply(
  voiceCall: VoiceCallRow,
  company: VoiceCompany
) {
  const prompt = await resolvePromptContext(company);
  const messages: ConversationMessage[] = voiceCall.conversation.map(
    (entry) => ({
      role: entry.role,
      content: entry.text
    })
  );
  const response = await callModel({
    system: prompt.system,
    messages,
    max_tokens: 300,
    context: {
      user_id: prompt.userId,
      organization_id: voiceCall.organization_id,
      company_id: voiceCall.company_id,
      endpoint_name: '/api/voice/turn'
    }
  });

  return getModelText(response);
}

export async function updateVoiceCall(
  voiceCall: VoiceCallRow,
  conversation: VoiceConversationEntry[],
  status: VoiceCallRow['status']
) {
  const { data, error } = await supabaseAdmin
    .from('voice_calls')
    .update({
      conversation,
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', voiceCall.id)
    .select(
      'id, call_sid, direction, from_number, to_number, organization_id, company_id, conversation, status'
    )
    .single();

  if (error) {
    throw new Error(`Unable to update voice call: ${error.message}`);
  }

  return data as VoiceCallRow;
}

export function isGoodbye(text: string) {
  return /\b(goodbye|bye|hang up|that(?:'s| is) all|no thanks|thank you,? bye)\b/i.test(
    text
  );
}

export async function synthesizeSpeech(text: string, voiceId: string | null) {
  const apiKey = requireRuntimeEnv('ELEVENLABS_API_KEY');
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      voiceId ?? TIFFANY_VOICE_ID
    )}/stream`,
    {
      method: 'POST',
      headers: {
        accept: 'audio/mpeg',
        'content-type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      }),
      cache: 'no-store'
    }
  );

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `ElevenLabs TTS failed with ${response.status}${
        detail ? `: ${detail.slice(0, 200)}` : ''
      }`
    );
  }

  return response;
}

async function twilioRequest(path: string, body?: URLSearchParams) {
  const accountSid = requireRuntimeEnv('TWILIO_ACCOUNT_SID');
  const authToken = requireRuntimeEnv('TWILIO_AUTH_TOKEN');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
      accountSid
    )}${path}`,
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
  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    sid?: string;
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ?? `Twilio API failed with ${response.status}`
    );
  }

  return payload;
}

export async function createOutboundTwilioCall({
  toNumber,
  webhookUrl
}: {
  toNumber: string;
  webhookUrl: string;
}) {
  const fromNumber = requireRuntimeEnv('TWILIO_PHONE');
  const body = new URLSearchParams({
    To: toNumber,
    From: fromNumber,
    Url: webhookUrl,
    Method: 'POST'
  });
  const payload = await twilioRequest('/Calls.json', body);

  if (!payload?.sid) {
    throw new Error('Twilio did not return a Call SID');
  }

  return { callSid: payload.sid, fromNumber };
}
