import { SetPasswordForm } from './set-password-form';

export default function SetPasswordPage() {
  const url = process.env.SUPA_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey?.startsWith('eyJ')) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        Supabase authentication is not configured.
      </main>
    );
  }

  return <SetPasswordForm url={url} anonKey={anonKey} />;
}
