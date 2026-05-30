import { LeadsList } from '@/components/leads-list';
import { supabaseAdmin } from '@/lib/supabase';
import type { Lead } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Lead[]>();

  if (error) {
    console.error('Supabase leads error:', error.message, error.code, error.hint);

    return (
      <main className="min-h-screen px-5 py-6">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-[var(--text-primary)]">
          Error loading leads: {error.message}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-6">
      <header className="mb-6">
        <h1 className="text-[32px] font-semibold leading-none tracking-[-0.04em]">
          Leads
        </h1>
      </header>
      <LeadsList leads={data ?? []} />
    </main>
  );
}
