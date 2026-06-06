import { getModelText, callModel } from '@/lib/model';
import { supabaseAdmin } from '@/lib/supabase';
import type { DiscoveryProfile, OrganizationalTruths } from '@/lib/discovery';
import type { DeliveryTarget } from '@/lib/website/deliver';
import {
  ACAIOS_ANTIGRAVITY_PROMPT_STANDARD,
  TESLA_MODEL_Y_URL
} from '@/lib/website/standard';

export type WebsitePromptRow = {
  id: string;
  org_id: string;
  generated_copy: string | null;
  seo_schema: SeoSchema | null;
  assembled_prompt: string | null;
  delivery_target: DeliveryTarget;
  delivery_ref: string | null;
  status: 'pending' | 'generating' | 'validated' | 'delivered' | 'error';
  validation_notes: string | null;
};

export type GeneratedCopy = {
  business_name: string;
  industry: string;
  accent_color: string;
  font_pairing: { display: string; body: string; rationale: string };
  hero: {
    headline: string;
    support: string;
    primary_cta: string;
    secondary_cta?: string;
  };
  trust_bar: string[];
  sections: Array<{
    name: string;
    headline: string;
    body: string;
    cta?: string;
  }>;
  faq: Array<{ question: string; answer: string }>;
  contact: {
    headline: string;
    body: string;
    phone: string;
    email: string;
    address: string | null;
    show_map: boolean;
  };
  footer: { legal_line: string };
  disclaimers: string[];
  image_direction: string[];
  placeholders_to_confirm: Array<{
    placeholder: string;
    location: string;
    required_from_owner: string;
    safe_fallback: string;
  }>;
};

export type SeoSchema = {
  meta: { title: string; description: string };
  keyword_strategy: Array<{
    keyword: string;
    intent: string;
    target_section: string;
  }>;
  aeo_query_map: Array<{ query: string; answer: string }>;
  json_ld: {
    primary: Record<string, unknown>;
    faq_page: Record<string, unknown>;
    website: Record<string, unknown>;
  };
};

export type MapRule = {
  includeMap: boolean;
  reason: string;
};

const WEBSITE_PROMPT_SELECTION =
  'id, org_id, generated_copy, seo_schema, assembled_prompt, delivery_target, delivery_ref, status, validation_notes';

function stripCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function parseJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(stripCodeFence(value)) as T;
  } catch {
    throw new Error(`${label} was not valid JSON`);
  }
}

function truthPayload(truths: OrganizationalTruths) {
  return JSON.stringify(truths, null, 2);
}

function combinedTruths(truths: OrganizationalTruths) {
  return Object.values(truths).join('\n').toLowerCase();
}

export function normalizeIndustry(industry: string | null) {
  const value = industry?.toLowerCase().replace(/[^a-z0-9]+/g, '_') ?? '';

  if (
    value.includes('real_estate') ||
    value.includes('realtor') ||
    value.includes('realty')
  ) {
    return 'real_estate';
  }

  if (
    value.includes('finance') ||
    value.includes('financial') ||
    value.includes('capital') ||
    value.includes('investment') ||
    value.includes('wealth')
  ) {
    return 'finance';
  }

  if (
    value.includes('health') ||
    value.includes('medical') ||
    value.includes('clinic') ||
    value.includes('care')
  ) {
    return 'healthcare';
  }

  return value || 'unmapped';
}

export function deriveMapRule(truths: OrganizationalTruths): MapRule {
  const source = combinedTruths(truths);
  const hasAddress =
    /\b\d{1,6}\s+[a-z0-9.' -]+\s(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|highway|hwy|suite|ste)\b/i.test(
      source
    ) || /\b(customer-facing|physical|office|storefront|clinic)\s+address\b/i.test(source);
  const explicitShow =
    /\b(show|display|publish|include|list|use)\b.{0,45}\b(address|map|location)\b/i.test(
      source
    );
  const explicitHide =
    /\b(do not|don't|never|omit|hide|private|not public)\b.{0,45}\b(address|map|location)\b/i.test(
      source
    ) ||
    /\b(no storefront|service area only|works remotely|virtual business)\b/i.test(
      source
    );

  return {
    includeMap: hasAddress && explicitShow && !explicitHide,
    reason: !hasAddress
      ? 'No customer-facing street address is established in the truths.'
      : explicitHide
        ? 'The truths say not to publish the address or map.'
        : !explicitShow
          ? 'The truths do not explicitly authorize publishing the address.'
          : 'The truths establish an address and authorize showing it.'
  };
}

function assertGeneratedCopy(value: GeneratedCopy) {
  if (
    !value.hero?.headline ||
    !value.hero.support ||
    !value.contact?.phone ||
    !Array.isArray(value.sections) ||
    value.sections.length < 3 ||
    !Array.isArray(value.faq) ||
    value.faq.length < 8
  ) {
    throw new Error('Stage 1 copy JSON is incomplete');
  }

  return value;
}

function assertSeoSchema(value: SeoSchema) {
  const blocks = value.json_ld;

  if (
    !value.meta?.title ||
    !value.meta.description ||
    !Array.isArray(value.keyword_strategy) ||
    !Array.isArray(value.aeo_query_map) ||
    !blocks?.primary ||
    !blocks.faq_page ||
    !blocks.website
  ) {
    throw new Error('Stage 2 SEO/schema JSON is incomplete');
  }

  return value;
}

export async function loadWebsitePrompt(orgId: string) {
  const { data, error } = await supabaseAdmin
    .from('website_prompts')
    .select(WEBSITE_PROMPT_SELECTION)
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load website prompt: ${error.message}`);
  }

  return (data as WebsitePromptRow | null) ?? null;
}

export async function ensureWebsitePrompt(
  orgId: string,
  target?: DeliveryTarget
) {
  const existing = await loadWebsitePrompt(orgId);

  if (existing) {
    if (target && target !== existing.delivery_target) {
      return updateWebsitePrompt(orgId, { delivery_target: target });
    }

    return existing;
  }

  const { data, error } = await supabaseAdmin
    .from('website_prompts')
    .insert({
      org_id: orgId,
      delivery_target: target ?? 'drive',
      status: 'pending'
    })
    .select(WEBSITE_PROMPT_SELECTION)
    .single();

  if (error) {
    if (error.code === '23505') {
      const concurrent = await loadWebsitePrompt(orgId);

      if (concurrent) {
        return concurrent;
      }
    }

    throw new Error(`Unable to initialize website prompt: ${error.message}`);
  }

  return data as WebsitePromptRow;
}

export async function updateWebsitePrompt(
  orgId: string,
  values: Partial<WebsitePromptRow>
) {
  const { id: _id, org_id: _orgId, ...updates } = values;
  const { data, error } = await supabaseAdmin
    .from('website_prompts')
    .update(updates)
    .eq('org_id', orgId)
    .select(WEBSITE_PROMPT_SELECTION)
    .single();

  if (error) {
    throw new Error(`Unable to save website prompt: ${error.message}`);
  }

  return data as WebsitePromptRow;
}

export async function generateWebsiteCopy(
  profile: DiscoveryProfile,
  truths: OrganizationalTruths
) {
  const mapRule = deriveMapRule(truths);
  const response = await callModel({
    system: `You are Kai, AcaiOS's senior website strategist and conversion copywriter. Produce publication-ready copy for a premium single-page website from authoritative organizational truths. Return JSON only, with no Markdown fence or commentary. Never invent facts.

Use this exact JSON shape:
{"business_name":"","industry":"","accent_color":"#RRGGBB","font_pairing":{"display":"","body":"","rationale":""},"hero":{"headline":"","support":"","primary_cta":"","secondary_cta":""},"trust_bar":[""],"sections":[{"name":"","headline":"","body":"","cta":""}],"faq":[{"question":"","answer":""}],"contact":{"headline":"","body":"","phone":"","email":"","address":null,"show_map":false},"footer":{"legal_line":""},"disclaimers":[""],"image_direction":[""],"placeholders_to_confirm":[{"placeholder":"","location":"","required_from_owner":"","safe_fallback":""}]}

Requirements:
- Lead on website_copy, business_truth, human_truth, brand_voice, core_services, and faq, while reconciling all nine truths.
- Determine business-specific section names and order. A realtor, bakery, healthcare practice, and capital group must not receive the same generic architecture.
- Write the hero, every section, approximately 10 developed FAQs, a slim trust bar, contact, and footer.
- Select one restrained accent color based on documented owner taste and industry norms, plus a premium font pairing, within a fixed clean white minimal foundation.
- Contact must always include a form-ready message and a visible phone number. Use a clearly labeled placeholder when an essential contact fact is absent.
- show_map must be ${mapRule.includeMap}; ${mapRule.reason}
- Finance copy must include an appropriate visible legal disclaimer and no securities solicitation, guaranteed-return, or personalized investment-advice claims.
- Healthcare copy must include an appropriate informational/not-medical-advice disclaimer and no unsupported clinical-treatment, outcome, or VA-affiliation claims.
- Footer legal_line must be complete and appropriate for the business. "Powered by AcaiOS" is added during assembly.
- Image direction must obey the truth document's people, diversity, family-consistency, and industry exclusion rules. Note later replacement with real photography for food imagery when relevant.
- Unknown facts become safe placeholders and entries in placeholders_to_confirm.`,
    messages: [
      {
        role: 'user',
        content: `PROFILE\n${JSON.stringify(
          {
            business_name: profile.business_name,
            industry: profile.industry,
            email: profile.email
          },
          null,
          2
        )}\n\nORGANIZATIONAL TRUTHS\n${truthPayload(truths)}`
      }
    ],
    max_tokens: 12000,
    context: {
      user_id: profile.id,
      organization_id: profile.organization_id,
      company_id: profile.company_id,
      endpoint_name: '/api/website/generate:copy',
      autonomous: true
    }
  });
  const copy = assertGeneratedCopy(
    parseJson<GeneratedCopy>(getModelText(response), 'Stage 1 copy')
  );

  return JSON.stringify(copy, null, 2);
}

export async function generateSeoSchema(
  profile: DiscoveryProfile,
  truths: OrganizationalTruths,
  generatedCopy: string
) {
  const copy = assertGeneratedCopy(
    parseJson<GeneratedCopy>(generatedCopy, 'Persisted Stage 1 copy')
  );
  const industry = normalizeIndustry(profile.industry ?? copy.industry);
  const primaryType =
    industry === 'real_estate' ? 'RealEstateAgent' : 'LocalBusiness';
  const response = await callModel({
    system: `You are Kai, AcaiOS's technical SEO, AEO, and structured-data specialist. Return JSON only, with no Markdown fence or commentary. Never invent facts.

Use this exact JSON shape:
{"meta":{"title":"","description":""},"keyword_strategy":[{"keyword":"","intent":"","target_section":""}],"aeo_query_map":[{"query":"","answer":""}],"json_ld":{"primary":{},"faq_page":{},"website":{}}}

Requirements:
- Produce a strong meta title and meta description, an intentional keyword map, and an answer-engine query map grounded in the supplied copy and truths.
- json_ld.primary must be a complete schema.org ${primaryType} block.
- json_ld.faq_page must be a complete FAQPage built from every supplied FAQ.
- json_ld.website must be a complete WebSite block.
- Every block must include @context and @type and must be valid JSON.
- Do not omit, summarize, shorten, or replace schema with instructions.
- Omit unknown optional facts rather than inventing them. Safe placeholders may appear only when already present in the generated copy.`,
    messages: [
      {
        role: 'user',
        content: `PROFILE\n${JSON.stringify(
          {
            business_name: profile.business_name,
            industry: profile.industry,
            email: profile.email
          },
          null,
          2
        )}\n\nGENERATED WEBSITE COPY\n${generatedCopy}\n\nORGANIZATIONAL TRUTHS\n${truthPayload(
          truths
        )}`
      }
    ],
    max_tokens: 12000,
    context: {
      user_id: profile.id,
      organization_id: profile.organization_id,
      company_id: profile.company_id,
      endpoint_name: '/api/website/generate:seo',
      autonomous: true
    }
  });

  return assertSeoSchema(
    parseJson<SeoSchema>(getModelText(response), 'Stage 2 SEO/schema')
  );
}

export async function loadReferenceSites(industry: string | null) {
  const industryKey = normalizeIndustry(industry);
  const { data, error } = await supabaseAdmin
    .from('reference_site_map')
    .select('reference_sites')
    .eq('industry_key', industryKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load reference sites: ${error.message}`);
  }

  const mapped = Boolean(data);
  const sites = Array.from(
    new Set([TESLA_MODEL_Y_URL, ...((data?.reference_sites as string[]) ?? [])])
  );

  return { industryKey, sites, mapped };
}

function jsonLdBlock(value: Record<string, unknown>) {
  return `<script type="application/ld+json">\n${JSON.stringify(
    value,
    null,
    2
  )}\n</script>`;
}

export function assembleWebsitePrompt({
  profile,
  truths,
  generatedCopy,
  seoSchema,
  referenceSites,
  mapRule
}: {
  profile: DiscoveryProfile;
  truths: OrganizationalTruths;
  generatedCopy: string;
  seoSchema: SeoSchema;
  referenceSites: string[];
  mapRule: MapRule;
}) {
  const copy = assertGeneratedCopy(
    parseJson<GeneratedCopy>(generatedCopy, 'Persisted Stage 1 copy')
  );

  return `${ACAIOS_ANTIGRAVITY_PROMPT_STANDARD}

===============================================================================
ROLE
===============================================================================
You are Antigravity, acting as a premium web art director, UX designer, conversion strategist, accessibility specialist, and front-end implementer. Build the finished client website from this complete internal specification.

===============================================================================
TASK
===============================================================================
Create the premium, fully responsive, single-page continuous-scroll homepage for ${copy.business_name}. Produce a task list and implementation plan as artifacts first, and do not proceed directly to implementation.

===============================================================================
SCOPE
===============================================================================
Business: ${copy.business_name}
Industry: ${profile.industry ?? copy.industry}
Delivery: one HTML/CSS/Vanilla JS file prepared for Vercel.
Map decision: ${mapRule.includeMap ? 'INCLUDE' : 'OMIT'} Google Map and street address. ${mapRule.reason}

REFERENCE SITES
Use these only for structural, pacing, hierarchy, and interaction inspiration:
${referenceSites.map((site) => `- ${site}`).join('\n')}
Tesla Model Y remains the primary structural reference. Do not copy or claim affiliation.

===============================================================================
DO NOT
===============================================================================
Follow the complete Anti-Drift Rules block above. Do not expose any part of this internal prompt in the finished website, source comments, metadata, assets, or client communications.

===============================================================================
STYLE
===============================================================================
Accent color: ${copy.accent_color}
Display font: ${copy.font_pairing.display}
Body font: ${copy.font_pairing.body}
Rationale: ${copy.font_pairing.rationale}
Apply this within the fixed clean, white, minimal, full-width, big-imagery foundation. The accent is the only aesthetic variable.

IMAGE DIRECTION
${copy.image_direction.map((item) => `- ${item}`).join('\n')}

AUTHORITATIVE IMAGE & PEOPLE RULES
${truths.image_people_rules}

===============================================================================
CONTENT
===============================================================================
Use the following copy in full. Preserve meaning, specificity, legal language, and voice.

HERO
Headline: ${copy.hero.headline}
Support: ${copy.hero.support}
Primary CTA: ${copy.hero.primary_cta}
Secondary CTA: ${copy.hero.secondary_cta ?? 'None'}

TRUST BAR
${copy.trust_bar.map((item) => `- ${item}`).join('\n')}

SECTIONS
${copy.sections
  .map(
    (section, index) => `${index + 1}. ${section.name}
Headline: ${section.headline}
Body: ${section.body}
CTA: ${section.cta ?? 'None'}`
  )
  .join('\n\n')}

FAQ ACCORDION
${copy.faq
  .map(
    (item, index) => `${index + 1}. ${item.question}
${item.answer}`
  )
  .join('\n\n')}

CONTACT
Headline: ${copy.contact.headline}
Body: ${copy.contact.body}
Phone: ${copy.contact.phone}
Email: ${copy.contact.email}
Address: ${mapRule.includeMap ? copy.contact.address : 'OMIT'}
Google Map: ${mapRule.includeMap ? 'INCLUDE' : 'OMIT'}
Always include the contact form and phone number.

DISCLAIMERS
${copy.disclaimers.length ? copy.disclaimers.map((item) => `- ${item}`).join('\n') : '- None required beyond the legal line.'}

FOOTER
Powered by AcaiOS
${copy.footer.legal_line}

META AND SEARCH STRATEGY
Meta title: ${seoSchema.meta.title}
Meta description: ${seoSchema.meta.description}

Keyword map:
${seoSchema.keyword_strategy
  .map(
    (item) =>
      `- ${item.keyword} | intent: ${item.intent} | section: ${item.target_section}`
  )
  .join('\n')}

AEO query map:
${seoSchema.aeo_query_map
  .map((item) => `- ${item.query}\n  Answer: ${item.answer}`)
  .join('\n')}

JSON-LD BLOCK 1 — PRIMARY BUSINESS ENTITY
${jsonLdBlock(seoSchema.json_ld.primary)}

JSON-LD BLOCK 2 — FAQPAGE
${jsonLdBlock(seoSchema.json_ld.faq_page)}

JSON-LD BLOCK 3 — WEBSITE
${jsonLdBlock(seoSchema.json_ld.website)}

PLACEHOLDERS TO CONFIRM
| Placeholder | Location | Required From Owner | Current Safe Fallback |
| --- | --- | --- | --- |
${copy.placeholders_to_confirm
  .map(
    (item) =>
      `| ${item.placeholder} | ${item.location} | ${item.required_from_owner} | ${item.safe_fallback} |`
  )
  .join('\n') || '| None | N/A | N/A | N/A |'}

===============================================================================
RESPONSIVE RULES
===============================================================================
Start mobile-first and verify phone, tablet, laptop, and wide desktop layouts. Hero and visual breaks remain 100vh at every viewport and use object-fit: cover. Preserve edge-to-edge sections, readable line lengths, touch targets of at least 44px, no horizontal overflow, keyboard operation, visible focus, reduced motion, and stable layouts as content wraps.

===============================================================================
VERIFICATION
===============================================================================
Run every item in the complete Verification Checklist above. Report the result of each item, correct every failure, and only then present the implementation as complete. Do not omit, summarize, or shorten the checklist.`;
}

function validateJsonLdBlocks(prompt: string) {
  const matches = Array.from(
    prompt.matchAll(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g
    )
  );
  const failures: string[] = [];

  if (matches.length !== 3) {
    failures.push(`Expected 3 JSON-LD blocks; found ${matches.length}.`);
  }

  matches.forEach((match, index) => {
    try {
      JSON.parse(match[1]);
    } catch {
      failures.push(`JSON-LD block ${index + 1} is not valid JSON.`);
    }
  });

  return failures;
}

export function validateAssembledPrompt({
  prompt,
  truths,
  industry,
  referenceMapped,
  referenceSites
}: {
  prompt: string;
  truths: OrganizationalTruths;
  industry: string | null;
  referenceMapped: boolean;
  referenceSites: string[];
}) {
  const failures = validateJsonLdBlocks(prompt);
  const mapRule = deriveMapRule(truths);
  const normalizedIndustry = normalizeIndustry(industry);
  const checks: Array<[boolean, string]> = [
    [
      prompt.includes('ACAIOS INTERNAL ONLY'),
      'Missing ACAIOS INTERNAL ONLY header.'
    ],
    [
      /single-page/i.test(prompt) &&
        /full-width/i.test(prompt) &&
        /100vh/i.test(prompt) &&
        /visual breaks?/i.test(prompt),
      'Missing single-page, full-width, 100vh hero/visual-break language.'
    ],
    [
      prompt.includes('Powered by AcaiOS') && /legal line/i.test(prompt),
      'Missing Powered by AcaiOS or legal-line requirement.'
    ],
    [
      /CONTACT[\s\S]*form[\s\S]*phone/i.test(prompt),
      'Contact section does not require both form and phone.'
    ],
    [
      mapRule.includeMap
        ? /Google Map: INCLUDE/i.test(prompt)
        : /Google Map: OMIT/i.test(prompt),
      `Map behavior is inconsistent with the truths: ${mapRule.reason}`
    ],
    [
      prompt.includes('Tesla Model Y') && prompt.includes(TESLA_MODEL_Y_URL),
      'Missing Tesla Model Y reference.'
    ],
    [
      referenceMapped
        ? referenceSites
            .filter((site) => site !== TESLA_MODEL_Y_URL)
            .some((site) => prompt.includes(site))
        : referenceSites.length === 1 &&
          referenceSites[0] === TESLA_MODEL_Y_URL &&
          prompt.includes(TESLA_MODEL_Y_URL),
      referenceMapped
        ? 'Mapped industry reference site is missing.'
        : 'Unmapped industry did not fall back to Tesla-only references.'
    ],
    [
      prompt.includes('ANTI-DRIFT RULES') &&
        prompt.includes('VERIFICATION CHECKLIST'),
      'Missing Anti-Drift Rules or Verification Checklist.'
    ]
  ];

  for (const [passed, failure] of checks) {
    if (!passed) {
      failures.push(failure);
    }
  }

  if (normalizedIndustry === 'finance') {
    if (
      !/(not (?:an )?offer|not a solicitation|investment advice|risk of loss|past performance)/i.test(
        prompt
      )
    ) {
      failures.push('Finance disclaimer language is missing.');
    }

    if (
      /(guaranteed returns?|risk[- ]free investment|will outperform|assured profit)/i.test(
        prompt
      )
    ) {
      failures.push('Finance copy contains a prohibited securities claim.');
    }
  }

  if (normalizedIndustry === 'healthcare') {
    if (
      !/(not medical advice|informational purposes|consult (?:a|your) (?:physician|doctor|healthcare provider))/i.test(
        prompt
      )
    ) {
      failures.push('Healthcare disclaimer language is missing.');
    }

    if (
      /(guaranteed (?:cure|treatment|outcome)|cures? all|officially affiliated with (?:the )?va|va[- ]approved provider)/i.test(
        prompt
      )
    ) {
      failures.push(
        'Healthcare copy contains a prohibited treatment or VA-affiliation claim.'
      );
    }
  }

  const notes = [
    failures.length
      ? `VALIDATION FAILED (${failures.length})`
      : 'VALIDATION PASSED',
    ...failures.map((failure) => `- ${failure}`),
    ...(!referenceMapped
      ? [
          `- FLAG FOR DEE: industry "${normalizedIndustry}" is unmapped; Tesla Model Y is the only reference site.`
        ]
      : [])
  ].join('\n');

  return { valid: failures.length === 0, failures, notes };
}

export async function logWebsiteError(
  profile: DiscoveryProfile,
  stage: string,
  error: unknown
) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Website prompt generation failed', {
    organization_id: profile.organization_id,
    user_id: profile.id,
    stage,
    error: message
  });

  await supabaseAdmin
    .from('agent_logs')
    .insert({
      user_id: profile.id,
      organization_id: profile.organization_id,
      company_id: profile.company_id,
      agent_name: 'kai_website',
      action: stage,
      result: 'error',
      event_type: 'website_error',
      endpoint_name: `/api/website/generate:${stage}: ${message.slice(0, 120)}`
    })
    .then(({ error: logError }) => {
      if (logError) {
        console.error('Unable to persist website error log', logError.message);
      }
    });
}
