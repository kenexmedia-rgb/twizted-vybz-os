import { supabaseAdmin } from '@/lib/supabase';
import type { ConversationMessage } from '@/lib/onboarding/types';

export const DISCOVERY_COMPLETE_MARKER = '<!-- DISCOVERY_COMPLETE -->';

export type DiscoveryProfile = {
  id: string;
  organization_id: string;
  company_id: string | null;
  name: string | null;
  business_name: string | null;
  industry: string | null;
  email: string | null;
  user_type: 'owner' | 'salespro';
};

export type FoundationContext = {
  location: string | null;
  contact_phone: string | null;
  vibe: string | null;
  differentiator: string | null;
  recommended_agents: string[];
  confidence: number | null;
  raw_seed: Record<string, unknown>;
};

export type DiscoverySession = {
  id: string;
  org_id: string;
  conversation_history: ConversationMessage[];
  status: 'in_progress' | 'complete';
  created_at: string;
  updated_at: string;
};

export type OrganizationalTruths = {
  brand_foundation: string;
  business_truth: string;
  human_truth: string;
  brand_voice: string;
  core_services: string;
  faq: string;
  business_plan: string;
  website_copy: string;
  image_people_rules: string;
};

const TRUTH_SECTIONS: Array<{
  heading: string;
  key: keyof OrganizationalTruths;
}> = [
  { heading: 'Brand Foundation', key: 'brand_foundation' },
  { heading: 'Business Truth', key: 'business_truth' },
  { heading: 'Human Truth', key: 'human_truth' },
  { heading: 'Brand Voice & Tone', key: 'brand_voice' },
  { heading: 'Core Services', key: 'core_services' },
  { heading: 'FAQ', key: 'faq' },
  { heading: 'Business Plan', key: 'business_plan' },
  { heading: 'Website Copy', key: 'website_copy' },
  { heading: 'Image & People Rules', key: 'image_people_rules' }
];

export async function getDiscoveryProfile(authUserId: string) {
  const selection =
    'id, organization_id, company_id, name, business_name, industry, email, user_type';
  const byAuthId = await supabaseAdmin
    .from('users')
    .select(selection)
    .eq('user_id', authUserId)
    .maybeSingle();

  if (byAuthId.error) {
    throw new Error(`Unable to load user profile: ${byAuthId.error.message}`);
  }

  if (byAuthId.data) {
    return byAuthId.data as DiscoveryProfile;
  }

  const byProfileId = await supabaseAdmin
    .from('users')
    .select(selection)
    .eq('id', authUserId)
    .maybeSingle();

  if (byProfileId.error) {
    throw new Error(`Unable to load user profile: ${byProfileId.error.message}`);
  }

  return (byProfileId.data as DiscoveryProfile | null) ?? null;
}

export async function loadFoundation(profile: DiscoveryProfile) {
  const { data, error } = await supabaseAdmin
    .from('foundations')
    .select(
      'location, contact_phone, vibe, differentiator, recommended_agents, confidence, raw_seed'
    )
    .eq('organization_id', profile.organization_id)
    .eq('user_id', profile.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load foundation: ${error.message}`);
  }

  return (data as FoundationContext | null) ?? null;
}

export async function ensureDiscoverySession(orgId: string) {
  const existing = await loadDiscoverySession(orgId);

  if (existing) {
    return existing;
  }

  const { data, error } = await supabaseAdmin
    .from('discovery_sessions')
    .insert({
      org_id: orgId,
      conversation_history: [],
      status: 'in_progress'
    })
    .select(
      'id, org_id, conversation_history, status, created_at, updated_at'
    )
    .single();

  if (error) {
    if (error.code === '23505') {
      const concurrentSession = await loadDiscoverySession(orgId);

      if (concurrentSession) {
        return concurrentSession;
      }
    }

    throw new Error(`Unable to initialize discovery session: ${error.message}`);
  }

  return data as DiscoverySession;
}

export async function loadDiscoverySession(orgId: string) {
  const { data, error } = await supabaseAdmin
    .from('discovery_sessions')
    .select(
      'id, org_id, conversation_history, status, created_at, updated_at'
    )
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load discovery session: ${error.message}`);
  }

  return (data as DiscoverySession | null) ?? null;
}

export async function saveDiscoveryHistory(
  sessionId: string,
  conversationHistory: ConversationMessage[]
) {
  const { data, error } = await supabaseAdmin
    .from('discovery_sessions')
    .update({
      conversation_history: conversationHistory,
      status: 'in_progress'
    })
    .eq('id', sessionId)
    .select(
      'id, org_id, conversation_history, status, created_at, updated_at'
    )
    .single();

  if (error) {
    throw new Error(`Unable to save discovery session: ${error.message}`);
  }

  return data as DiscoverySession;
}

export function discoverySystemPrompt(
  profile: DiscoveryProfile,
  foundation: FoundationContext
) {
  const ownerName =
    profile.name ||
    (typeof foundation.raw_seed.owner_name === 'string'
      ? foundation.raw_seed.owner_name
      : 'the owner');
  const businessName =
    profile.business_name ||
    (typeof foundation.raw_seed.business_name === 'string'
      ? foundation.raw_seed.business_name
      : 'the business');
  const industry =
    profile.industry ||
    (typeof foundation.raw_seed.industry === 'string'
      ? foundation.raw_seed.industry
      : 'their industry');

  return `You are Kai, continuing an existing conversation with ${ownerName}, owner of ${businessName}, a ${industry} business.

This is a deep discovery conversation, but never announce a new phase, interview, intake, questionnaire, or process. Continue naturally from onboarding with warmth and specificity. You already know the foundation below. Never ask the owner to repeat it.

FOUNDATION CONTEXT
${JSON.stringify(
  {
    owner_name: ownerName,
    business_name: businessName,
    industry,
    location: foundation.location,
    contact_phone: foundation.contact_phone,
    email: profile.email,
    vibe: foundation.vibe,
    differentiator: foundation.differentiator,
    recommended_agents: foundation.recommended_agents,
    raw_seed: foundation.raw_seed
  },
  null,
  2
)}

HOW TO CONDUCT THE CONVERSATION
- Talk like a perceptive business partner, not a form, script, consultant intake, or interviewer.
- Follow the owner's lead. Topic order is adaptive and free-form.
- Ask one focused question at a time, or occasionally two tightly related questions when that feels natural.
- Reflect useful specifics, make connections, and share concise observations so the owner feels understood rather than interrogated.
- Do not show a checklist, coverage score, internal notes, or the names of the nine documents during the conversation.
- Handle tangents naturally and use them when they reveal useful truth.
- Never fabricate. When something material is ambiguous, draw it out conversationally.

INTERNAL COMPLETENESS STANDARD
Quietly gather enough concrete depth to write all nine outputs:
1. Brand Foundation: identity, purpose, positioning, promise, values, differentiation, and strategic character.
2. Business Truth: how the company really creates value, wins, delivers, makes money, and faces constraints.
3. Human Truth: the customers' lived situation, motivations, fears, objections, desired transformation, and decision dynamics.
4. Brand Voice & Tone: personality, language, cadence, tonal range, vocabulary, boundaries, and examples grounded in this owner.
5. Core Services: complete service architecture, outcomes, delivery, fit, boundaries, and distinctions.
6. FAQ: the real questions and honest, useful answers prospects and customers need.
7. Business Plan: direction, market, model, priorities, growth approach, operations, risks, and measures of progress.
8. Website Copy: a coherent full-site narrative with page/section-ready prose and calls to action.
9. Image & People Rules: visual principles, people representation, settings, composition, styling, authenticity, and exclusions.

Do not close merely because each area was mentioned. Close only when there is enough specific evidence to write substantial, internally consistent documents without generic filler. When coverage is complete, close the conversation naturally in the owner's language and tell them you are going to turn what you learned into the business's working truths. Append the exact marker ${DISCOVERY_COMPLETE_MARKER} as the final characters of that response. Never mention or explain the marker.`;
}

export function truthGenerationPrompt(
  profile: DiscoveryProfile,
  foundation: FoundationContext
) {
  return `You are Kai. Convert the completed discovery conversation into the nine definitive organizational truth documents for ${profile.business_name ?? 'this business'}.

Write all nine documents in full, polished prose. These are operational source documents, not summaries, outlines, notes, placeholders, or generic brand advice. Ground every claim in the foundation and conversation. Preserve the owner's actual convictions, language, constraints, and customer understanding. Resolve information across the full thread into a coherent whole, but never invent unsupported facts.

Each document must stand on its own and be detailed enough for people and AI agents to use as an authoritative reference. Use paragraphs and useful subheadings. Do not reduce a document to bullet points. The FAQ may use question-and-answer headings, but every answer must be developed prose. Website Copy must contain publication-ready copy, not instructions for future copywriting.

Output exactly these level-two Markdown headings, in this order, with no preamble or closing text:

## Brand Foundation
## Business Truth
## Human Truth
## Brand Voice & Tone
## Core Services
## FAQ
## Business Plan
## Website Copy
## Image & People Rules

FOUNDATION
${JSON.stringify(foundation, null, 2)}`;
}

export function parseOrganizationalTruths(output: string) {
  const truths = {} as OrganizationalTruths;

  for (let index = 0; index < TRUTH_SECTIONS.length; index += 1) {
    const section = TRUTH_SECTIONS[index];
    const startMarker = `## ${section.heading}`;
    const start = output.indexOf(startMarker);

    if (start === -1) {
      throw new Error(`Generated truths are missing "${section.heading}"`);
    }

    const contentStart = start + startMarker.length;
    const next = TRUTH_SECTIONS[index + 1];
    const end = next ? output.indexOf(`## ${next.heading}`, contentStart) : output.length;
    const content = output.slice(contentStart, end === -1 ? output.length : end).trim();

    if (content.length < 120) {
      throw new Error(`Generated "${section.heading}" is incomplete`);
    }

    truths[section.key] = content;
  }

  return truths;
}

export async function saveOrganizationalTruths(
  orgId: string,
  sessionId: string,
  truths: OrganizationalTruths
) {
  const { error: truthError } = await supabaseAdmin.from('org_truths').upsert(
    {
      org_id: orgId,
      ...truths,
      status: 'complete'
    },
    { onConflict: 'org_id' }
  );

  if (truthError) {
    throw new Error(`Unable to save organizational truths: ${truthError.message}`);
  }

  const { error: sessionError } = await supabaseAdmin
    .from('discovery_sessions')
    .update({ status: 'complete' })
    .eq('id', sessionId);

  if (sessionError) {
    throw new Error(`Unable to complete discovery session: ${sessionError.message}`);
  }
}

export async function logDiscoveryError(
  profile: DiscoveryProfile,
  error: unknown
) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Discovery truth generation failed', {
    organization_id: profile.organization_id,
    user_id: profile.id,
    error: message
  });

  await supabaseAdmin
    .from('agent_logs')
    .insert({
      user_id: profile.id,
      organization_id: profile.organization_id,
      company_id: profile.company_id,
      agent_name: 'kai_discovery',
      action: 'truth_generation',
      result: 'error',
      event_type: 'discovery_error',
      endpoint_name: `/api/discovery: ${message.slice(0, 160)}`
    })
    .then(({ error: logError }) => {
      if (logError) {
        console.error('Unable to persist discovery error log', logError.message);
      }
    });
}
