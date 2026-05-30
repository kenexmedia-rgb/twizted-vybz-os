export type LeadStatus = 'new' | 'hot' | 'replied' | 'cold';

export type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  notes: string;
  source: string;
  created_at: string;
};
