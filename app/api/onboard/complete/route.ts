import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { ensureDiscoverySession } from '@/lib/discovery';
import { BudgetExceededError } from '@/lib/model';
import {
  extractFoundation,
  generateKaiPrompt
} from '@/lib/onboarding/pipeline';
import type {
  OwnerFoundationSeed,
  SalesproFoundationSeed
} from '@/lib/onboarding/types';
import {
  parseMessages,
  parseUserType
} from '@/lib/onboarding/validation';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const sessionId =
    typeof body?.session_id === 'string' ? body.session_id.trim() : '';
  const userType = parseUserType(body?.user_type);
  const messages = parseMessages(body?.messages);

  if (!sessionId || !userType || !messages) {
    return NextResponse.json(
      { error: 'session_id, user_type, and messages are required' },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, organization_id, company_id, email')
    .or(
      `id.eq.${auth.user.id},user_id.eq.${auth.user.id},email.eq.${auth.user.email}`
    )
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      {
        error: 'User profile not found',
        detail: profileError?.message ?? null
      },
      { status: 404 }
    );
  }

  const rows = messages.map((message, index) => ({
    user_id: profile.id,
    session_id: sessionId,
    role: message.role,
    content: message.content,
    organization_id: profile.organization_id,
    company_id: profile.company_id,
    onboarding_sequence: index
  }));
  const { error: transcriptError } = await supabaseAdmin
    .from('conversations')
    .upsert(rows, {
      onConflict: 'session_id,user_id,onboarding_sequence'
    });

  if (transcriptError) {
    return NextResponse.json(
      { error: `Unable to save transcript: ${transcriptError.message}` },
      { status: 500 }
    );
  }

  const { data: transcriptRows, error: readError } = await supabaseAdmin
    .from('conversations')
    .select('role, content')
    .eq('session_id', sessionId)
    .eq('user_id', profile.id)
    .order('onboarding_sequence');

  if (readError || !transcriptRows?.length) {
    return NextResponse.json(
      { error: `Unable to read transcript: ${readError?.message ?? 'empty'}` },
      { status: 500 }
    );
  }

  const modelContext = {
    user_id: profile.id,
    organization_id: profile.organization_id,
    company_id: profile.company_id
  };
  let extraction;

  try {
    extraction = await extractFoundation(
      userType,
      transcriptRows,
      modelContext
    );
  } catch (error) {
    if (error instanceof BudgetExceededError) {
      return NextResponse.json(
        { error: 'Monthly AI usage limit reached' },
        { status: 402 }
      );
    }

    throw error;
  }

  if (!extraction.seed) {
    const reviewPayload = {
      raw_output: extraction.rawOutput,
      needs_review: true
    };

    if (userType === 'owner') {
      await supabaseAdmin.from('foundations').upsert(
        {
          user_id: profile.id,
          organization_id: profile.organization_id,
          company_id: profile.company_id,
          raw_seed: reviewPayload
        },
        { onConflict: 'user_id' }
      );
    } else {
      await supabaseAdmin.from('salespro_foundations').upsert(
        {
          user_id: profile.id,
          raw_seed: reviewPayload
        },
        { onConflict: 'user_id' }
      );
    }

    return NextResponse.json(
      {
        error: 'Foundation extraction needs review',
        raw_output: extraction.rawOutput
      },
      { status: 422 }
    );
  }

  let kaiSystemPrompt;

  try {
    kaiSystemPrompt = await generateKaiPrompt(
      userType,
      extraction.seed,
      modelContext
    );
  } catch (error) {
    if (error instanceof BudgetExceededError) {
      return NextResponse.json(
        { error: 'Monthly AI usage limit reached' },
        { status: 402 }
      );
    }

    throw error;
  }

  if (userType === 'owner') {
    const seed = extraction.seed as OwnerFoundationSeed;
    const confidence =
      (seed.confidence.industry +
        seed.confidence.location +
        seed.confidence.differentiator) /
      3;

    const { error: foundationError } = await supabaseAdmin
      .from('foundations')
      .upsert(
        {
          user_id: profile.id,
          organization_id: profile.organization_id,
          company_id: profile.company_id,
          location: seed.location,
          contact_phone: seed.contact_phone,
          vibe: seed.vibe,
          differentiator: seed.differentiator,
          recommended_agents: seed.recommended_agents,
          confidence,
          raw_seed: seed
        },
        { onConflict: 'user_id' }
      );

    if (foundationError) {
      return NextResponse.json(
        { error: foundationError.message },
        { status: 500 }
      );
    }

    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        name: seed.owner_name ?? undefined,
        business_name: seed.business_name,
        industry: seed.industry,
        email: seed.contact_email ?? profile.email,
        user_type: 'owner',
        kai_system_prompt: kaiSystemPrompt
      })
      .eq('id', profile.id);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
  } else {
    const seed = extraction.seed as SalesproFoundationSeed;
    const { error: foundationError } = await supabaseAdmin
      .from('salespro_foundations')
      .upsert(
        {
          user_id: profile.id,
          employer: seed.employer,
          territory: seed.territory,
          lead_sources: seed.lead_sources,
          contact_phone: seed.contact_phone,
          contact_email: seed.contact_email,
          differentiator: seed.differentiator,
          competitors: seed.competitors,
          employer_context: seed.employer_context,
          raw_seed: seed
        },
        { onConflict: 'user_id' }
      );

    if (foundationError) {
      return NextResponse.json(
        { error: foundationError.message },
        { status: 500 }
      );
    }

    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        name: seed.owner_name ?? undefined,
        email: seed.contact_email ?? profile.email,
        user_type: 'salespro',
        employer: seed.employer,
        employer_context: seed.employer_context,
        kai_system_prompt: kaiSystemPrompt
      })
      .eq('id', profile.id);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    const { data: agents, error: agentError } = await supabaseAdmin.rpc(
      'provision_salespro_agents',
      { target_user_id: profile.id }
    );

    if (agentError || agents?.length !== 6) {
      return NextResponse.json(
        {
          error:
            agentError?.message ??
            `Expected 6 Sales Pro agents, provisioned ${agents?.length ?? 0}`
        },
        { status: 500 }
      );
    }
  }

  const discovery =
    userType === 'owner'
      ? await ensureDiscoverySession(profile.organization_id)
      : null;

  return NextResponse.json({
    user_type: userType,
    foundation_seed: extraction.seed,
    kai_system_prompt: kaiSystemPrompt,
    ...(userType === 'salespro'
      ? { website_generated: false, agents_provisioned: 6 }
      : {
          discovery: {
            session_id: discovery?.id,
            status: discovery?.status,
            endpoint: '/api/discovery',
            action: 'start',
            auto_start: true
          }
        })
  });
}
