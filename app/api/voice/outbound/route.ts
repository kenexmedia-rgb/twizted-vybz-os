import { NextRequest, NextResponse } from 'next/server';
import { getSessionScope, requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createOutboundTwilioCall,
  createVoiceCall,
  publicBaseUrl,
  voiceEndpointUrl
} from '@/lib/voice';

export const runtime = 'nodejs';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

function requiredText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);

  if (auth.response) {
    return auth.response;
  }

  const scope = await getSessionScope(auth.user.id);
  const body = await request.json().catch(() => null);
  const toNumber = requiredText(body?.toNumber);
  const organizationId = requiredText(body?.organizationId);
  const companyId = requiredText(body?.companyId);
  const openingMessage = requiredText(body?.openingMessage);

  if (
    !scope ||
    !toNumber ||
    !E164_PATTERN.test(toNumber) ||
    !organizationId ||
    !UUID_PATTERN.test(organizationId) ||
    !companyId ||
    !UUID_PATTERN.test(companyId)
  ) {
    return NextResponse.json(
      {
        error:
          'toNumber (E.164), organizationId, and companyId are required'
      },
      { status: scope ? 400 : 403 }
    );
  }

  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .select('id, organization_id, name, voice_id')
    .eq('id', companyId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  const hasAccess =
    scope.organization_id === organizationId &&
    (scope.can_switch_company || scope.company_id === companyId);

  if (companyError || !company || !hasAccess) {
    return NextResponse.json(
      { error: 'Organization or company access denied' },
      { status: 403 }
    );
  }

  try {
    const webhook = voiceEndpointUrl(
      publicBaseUrl(request),
      '/api/voice/inbound'
    );
    webhook.searchParams.set('direction', 'outbound');
    const { callSid, fromNumber } = await createOutboundTwilioCall({
      toNumber,
      webhookUrl: webhook.toString()
    });
    const voiceCall = await createVoiceCall({
      callSid,
      direction: 'outbound',
      fromNumber,
      toNumber,
      company,
      openingMessage:
        openingMessage ??
        `Hello, this is Kai calling from ${company.name}. Is now a good time to talk?`
    });

    return NextResponse.json({
      callSid,
      voiceCallId: voiceCall?.id ?? null
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Outbound call creation failed'
      },
      { status: 502 }
    );
  }
}
