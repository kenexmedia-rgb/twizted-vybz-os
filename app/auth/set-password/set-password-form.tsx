'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type SetPasswordFormProps = {
  url: string;
  anonKey: string;
};

export function SetPasswordForm({ url, anonKey }: SetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Choose a password to finish your invite.');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setMessage('This invite link is invalid or has expired.');
      return;
    }

    const client = createClient(url, anonKey);
    client.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      .then(({ error }) => {
        if (error) {
          setMessage(error.message);
          return;
        }

        setReady(true);
      });
  }, [anonKey, url]);

  async function submit(event: FormEvent) {
    event.preventDefault();

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const client = createClient(url, anonKey);
    const { error: sessionError } = await client.auth.setSession({
      access_token: hash.get('access_token') ?? '',
      refresh_token: hash.get('refresh_token') ?? ''
    });

    if (sessionError) {
      setMessage(sessionError.message);
      return;
    }

    const { error } = await client.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      return;
    }

    const { error: membershipError } = await client.rpc(
      'accept_company_invite'
    );
    setMessage(
      membershipError
        ? membershipError.message
        : 'Password set. Your company access is active and you can now log in.'
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8"
      >
        <h1 className="text-3xl font-semibold">Set your password</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">{message}</p>
        <input
          type="password"
          minLength={8}
          required
          disabled={!ready}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-6 w-full rounded-xl border border-[var(--border)] bg-black/20 px-4 py-3"
          placeholder="At least 8 characters"
        />
        <button
          type="submit"
          disabled={!ready}
          className="mt-4 w-full rounded-full bg-white px-5 py-3 font-semibold text-black disabled:opacity-50"
        >
          Set password
        </button>
      </form>
    </main>
  );
}
