import { callClaude } from '@/lib/anthropic';
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
  messages: ConversationMessage[]
) {
  const transcript = transcriptText(messages);
  const template =
    userType === 'owner'
      ? EXTRACTION_SYSTEM_PROMPT
      : SALESPRO_EXTRACTION_SYSTEM_PROMPT;
  const system = template.replace('{{TRANSCRIPT}}', transcript);
  let rawOutput = '';

  for (let attempt = 0; attempt < 2; attempt += 1) {
    rawOutput = await callClaude({
      system,
      messages: [
        {
          role: 'user',
          content: 'Extract the foundation seed from the transcript.'
        }
      ],
      maxTokens: 1400
    });

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
  seed: OwnerFoundationSeed | SalesproFoundationSeed
) {
  return callClaude({
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
    maxTokens: 1800
  });
}
