import { callModel, getModelText } from '@/lib/model';
import {
  EXTRACTION_SYSTEM_PROMPT,
  KAI_PROMPT_GENERATOR,
  SALESPRO_EXTRACTION_SYSTEM_PROMPT
} from '@/lib/onboarding/prompts';
import type {
  ConversationMessage,
  OwnerFoundationSeed,
  SalesproFoundationSeed,
  UserType
} from '@/lib/onboarding/types';

function transcriptText(messages: ConversationMessage[]) {
  return messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');
}

export async function extractFoundation(
  userType: UserType,
  messages: ConversationMessage[],
  context: {
    user_id: string;
    organization_id: string;
    company_id?: string | null;
  }
) {
  const transcript = transcriptText(messages);
  const template =
    userType === 'owner'
      ? EXTRACTION_SYSTEM_PROMPT
      : SALESPRO_EXTRACTION_SYSTEM_PROMPT;
  const system = template.replace('{{TRANSCRIPT}}', transcript);
  let rawOutput = '';

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await callModel({
      system,
      messages: [
        {
          role: 'user',
          content: 'Extract the foundation seed from the transcript.'
        }
      ],
      max_tokens: 1400,
      context: {
        ...context,
        endpoint_name: '/api/onboard/complete:extract'
      }
    });
    rawOutput = getModelText(response);

    try {
      return {
        seed: JSON.parse(rawOutput) as
          | OwnerFoundationSeed
          | SalesproFoundationSeed,
        rawOutput,
        needsReview: false
      };
    } catch {
      // Retry once as required; the final raw output is persisted for review.
    }
  }

  return { seed: null, rawOutput, needsReview: true };
}

export async function generateKaiPrompt(
  seed: OwnerFoundationSeed | SalesproFoundationSeed,
  context: {
    user_id: string;
    organization_id: string;
    company_id?: string | null;
  }
) {
  const response = await callModel({
    system: KAI_PROMPT_GENERATOR.replace(
      '{{FOUNDATION_SEED_JSON}}',
      JSON.stringify(seed)
    ),
    messages: [
      {
        role: 'user',
        content: 'Generate the client-specific Kai system prompt.'
      }
    ],
    max_tokens: 1800,
    context: {
      ...context,
      endpoint_name: '/api/onboard/complete:generate'
    }
  });

  return getModelText(response);
}
