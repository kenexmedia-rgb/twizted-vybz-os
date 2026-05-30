import { LeadsList } from '@/components/leads-list';
import { supabase } from '@/lib/supabase';
import type { Lead } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const { data, error } = await supabase
    .from('leads')
    .select('id,name,company,email,phone,status,notes,source,created_at')
    .order('created_at', { ascending: false })
    .returns<Lead[]>();

  if (error) {
    throw new Error(error.message);
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
