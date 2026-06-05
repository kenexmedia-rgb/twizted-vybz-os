export type UserType = 'owner' | 'salespro';

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type KnownFields = {
  email?: string;
  name?: string;
};

export type OwnerFoundationSeed = {
  owner_name: string | null;
  business_name: string | null;
  industry: string | null;
  location: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  vibe: string | null;
  differentiator: string | null;
  recommended_agents: string[];
  confidence: {
    industry: number;
    location: number;
    differentiator: number;
  };
};

export type SalesproFoundationSeed = {
  owner_name: string | null;
  employer: string | null;
  territory: string[];
  lead_sources: string[];
  contact_email: string | null;
  differentiator: string | null;
  employer_context: Record<string, unknown>;
};
