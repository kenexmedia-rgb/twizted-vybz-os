'use client';

import { useState } from 'react';
import type { Lead, LeadStatus } from '@/lib/types';

type LeadsListProps = {
  leads: Lead[];
};

export function LeadsList({ leads }: LeadsListProps) {
  if (leads.length === 0) {
    return (
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
        <p className="text-lg font-medium tracking-[-0.02em]">No leads found.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </section>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  const createdAt = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(lead.created_at));

  return (
    <article className="rounded-[28px] border border-[rgba(255,255,255,0.075)] bg-[rgba(24,24,24,0.92)] px-6 pb-[19px] pt-[23px]">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-3">
            <StatusBadge status={lead.status} />
            <h2 className="truncate text-[23px] font-[750] leading-none tracking-[-0.035em]">
              {lead.name}
            </h2>
          </div>
          <p className="lead-notes-preview text-[25px] font-[370] leading-[1.08] tracking-[-0.035em] text-[rgba(255,255,255,0.9)]">
            {lead.notes}
          </p>
        </div>
        <button
          type="button"
          aria-label={expanded ? 'Collapse lead' : 'Expand lead'}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] transition"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <dl className="grid gap-3 text-sm text-[var(--text-secondary)]">
              <MetaItem label="Company" value={lead.company} />
              <MetaItem label="Source" value={lead.source} />
              <MetaItem label="Created" value={createdAt} />
            </dl>
            <p className="mt-5 text-base leading-6 text-[rgba(255,255,255,0.78)]">
              {lead.notes}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <a
                href={`tel:${lead.phone}`}
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-black"
              >
                Call
              </a>
              <button
                type="button"
                className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.06)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[var(--text-tertiary)]">{label}</dt>
      <dd className="min-w-0 truncate text-right">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const className = getBadgeClassName(status);

  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${className}`}>
      {status}
    </span>
  );
}

function getBadgeClassName(status: LeadStatus) {
  switch (status) {
    case 'hot':
      return 'bg-[var(--badge-hot-bg)] text-[var(--badge-hot)]';
    case 'new':
      return 'bg-[var(--badge-new-bg)] text-[var(--badge-new)]';
    case 'replied':
      return 'bg-[var(--badge-replied-bg)] text-[var(--badge-replied)]';
    case 'cold':
      return 'bg-[var(--badge-cold-bg)] text-[var(--badge-cold)]';
  }
}
