import type {
  ConversationMessage,
  KnownFields,
  UserType
} from '@/lib/onboarding/types';

export function parseUserType(value: unknown): UserType | null {
  return value === 'owner' || value === 'salespro' ? value : null;
}

export function parseMessages(value: unknown): ConversationMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    return null;
  }

  const messages = value.map((message) => {
    if (
      !message ||
      (message.role !== 'user' && message.role !== 'assistant') ||
      typeof message.content !== 'string' ||
      !message.content.trim() ||
      message.content.length > 20000
    ) {
      return null;
    }

    return {
      role: message.role,
      content: message.content.trim()
    } as ConversationMessage;
  });

  return messages.some((message) => message === null)
    ? null
    : (messages as ConversationMessage[]);
}

export function parseKnownFields(value: unknown): KnownFields {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const fields = value as Record<string, unknown>;

  return {
    email: typeof fields.email === 'string' ? fields.email.trim() : undefined,
    name: typeof fields.name === 'string' ? fields.name.trim() : undefined
  };
}
