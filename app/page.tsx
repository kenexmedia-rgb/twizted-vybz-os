import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-[-0.035em]">AcaiOS</h1>
        <Link
          href="/leads"
          className="mt-6 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
        >
          Leads
        </Link>
      </div>
    </main>
  );
}
