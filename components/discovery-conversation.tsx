'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import type { ConversationMessage } from '@/lib/onboarding/types';

type DiscoveryState = {
  session: {
    conversation_history: ConversationMessage[];
    status: 'in_progress' | 'complete';
  } | null;
  truths: Record<string, string> | null;
  should_resume: boolean;
  should_start: boolean;
};

type StreamEvent = {
  event: string;
  data: {
    text?: string;
    phase?: string;
    error?: string;
    status?: string;
    truths?: Record<string, string>;
    retry_action?: 'resume' | 'retry_generation';
  };
};

function getAccessToken() {
  const direct =
    window.localStorage.getItem('acaios_access_token') ??
    window.localStorage.getItem('access_token');

  if (direct) {
    return direct;
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) {
      continue;
    }

    try {
      const stored = JSON.parse(window.localStorage.getItem(key) ?? '{}') as {
        access_token?: string;
      };

      if (stored.access_token) {
        return stored.access_token;
      }
    } catch {
      // Ignore unrelated or malformed local storage values.
    }
  }

  return null;
}

function parseEventBlock(block: string): StreamEvent | null {
  let event = 'message';
  const data: string[] = [];

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data.push(line.slice(5).trim());
    }
  }

  if (!data.length) {
    return null;
  }

  return { event, data: JSON.parse(data.join('\n')) };
}

export function DiscoveryConversation() {
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<'loading' | 'conversation' | 'generating_truths' | 'complete'>('loading');
  const [truthDraft, setTruthDraft] = useState('');
  const [truths, setTruths] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState('');
  const [retryAction, setRetryAction] = useState<
    'resume' | 'retry_generation'
  >('resume');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const accessToken = getAccessToken();
    setToken(accessToken);

    if (!accessToken) {
      setError('Your session is unavailable. Sign in again to continue.');
      setPhase('conversation');
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, truthDraft]);

  async function runDiscovery(
    action: 'start' | 'resume' | 'message' | 'retry_generation',
    content?: string,
    accessToken = token
  ) {
    if (!accessToken) {
      setError('Your session is unavailable. Sign in again to continue.');
      return;
    }

    setBusy(true);
    setError('');

    if (action === 'message' && content) {
      setMessages((current) => [...current, { role: 'user', content }]);
    }

    const response = await fetch('/api/discovery', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ action, content })
    });

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? 'Unable to continue discovery.');
      setBusy(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantStarted = false;

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n');
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const streamEvent = parseEventBlock(block);

        if (!streamEvent) {
          continue;
        }

        if (streamEvent.event === 'phase') {
          const nextPhase = streamEvent.data.phase;

          if (nextPhase === 'conversation' || nextPhase === 'generating_truths') {
            setPhase(nextPhase);
          }
        } else if (streamEvent.event === 'delta' && streamEvent.data.text) {
          if (!assistantStarted) {
            assistantStarted = true;
            setMessages((current) => [
              ...current,
              { role: 'assistant', content: streamEvent.data.text ?? '' }
            ]);
          } else {
            setMessages((current) => {
              const next = [...current];
              const last = next[next.length - 1];

              if (last?.role === 'assistant') {
                next[next.length - 1] = {
                  ...last,
                  content: last.content + (streamEvent.data.text ?? '')
                };
              }

              return next;
            });
          }
        } else if (
          streamEvent.event === 'truth_delta' &&
          streamEvent.data.text
        ) {
          setTruthDraft((current) => current + streamEvent.data.text);
        } else if (streamEvent.event === 'complete') {
          setTruths(streamEvent.data.truths ?? null);
          setPhase('complete');
        } else if (streamEvent.event === 'error') {
          setError(streamEvent.data.error ?? 'Discovery failed.');
          setRetryAction(streamEvent.data.retry_action ?? 'resume');
        }
      }

      if (done) {
        break;
      }
    }

    setBusy(false);
  }

  useEffect(() => {
    if (!token || startedRef.current) {
      return;
    }

    startedRef.current = true;

    fetch('/api/discovery', {
      headers: { authorization: `Bearer ${token}` }
    })
      .then(async (response) => {
        const payload = (await response.json()) as DiscoveryState & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? 'Unable to load discovery.');
        }

        setMessages(payload.session?.conversation_history ?? []);
        setTruths(payload.truths);

        if (payload.session?.status === 'complete' || payload.truths?.status === 'complete') {
          setPhase('complete');
          return;
        }

        setPhase('conversation');

        if (payload.should_resume) {
          await runDiscovery('resume', undefined, token);
        } else if (payload.should_start) {
          await runDiscovery('start', undefined, token);
        }
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error ? loadError.message : 'Unable to load discovery.'
        );
        setPhase('conversation');
      });
  // runDiscovery intentionally uses the token passed by this initialization effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();

    if (!content || busy) {
      return;
    }

    setInput('');
    await runDiscovery('message', content);
  }

  const retry = () => {
    if (retryAction === 'retry_generation') {
      setTruthDraft('');
    }

    void runDiscovery(retryAction);
  };

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-black/80 px-5 py-4 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
          Kai
        </p>
        <h1 className="mt-1 text-lg font-semibold">
          {phase === 'generating_truths'
            ? 'Writing your organizational truths'
            : phase === 'complete'
              ? 'Your organizational truths'
              : 'Building the business from the inside out'}
        </h1>
      </header>

      <section className="flex-1 space-y-5 px-5 py-6">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === 'user'
                ? 'ml-10 rounded-3xl rounded-br-lg bg-white px-4 py-3 text-sm leading-6 text-black'
                : 'mr-4 text-[15px] leading-7 text-white/90'
            }
          >
            {message.content}
          </div>
        ))}

        {truthDraft && phase !== 'complete' ? (
          <article className="whitespace-pre-wrap rounded-[28px] border border-violet-400/20 bg-violet-400/5 p-5 text-sm leading-7 text-white/90">
            {truthDraft}
          </article>
        ) : null}

        {phase === 'complete' && truths ? (
          <div className="space-y-5">
            {Object.entries(truths)
              .filter(([key, value]) => key !== 'status' && key !== 'updated_at' && typeof value === 'string')
              .map(([key, value]) => (
                <article
                  key={key}
                  className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <h2 className="text-lg font-semibold capitalize">
                    {key.replaceAll('_', ' ')}
                  </h2>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">
                    {value}
                  </div>
                </article>
              ))}
          </div>
        ) : null}

        {busy ? (
          <p className="text-xs text-[var(--text-secondary)]">
            {phase === 'generating_truths' ? 'Writing live...' : 'Kai is thinking...'}
          </p>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
            <p>{error}</p>
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={retry}
                className="mt-3 font-semibold underline underline-offset-4"
              >
                {retryAction === 'retry_generation'
                  ? 'Retry truth generation'
                  : 'Continue where we left off'}
              </button>
            ) : null}
          </div>
        ) : null}
        <div ref={bottomRef} />
      </section>

      {phase === 'conversation' ? (
        <form
          onSubmit={submit}
          className="sticky bottom-0 border-t border-[var(--border)] bg-black/85 p-4 backdrop-blur-xl"
        >
          <div className="flex items-end gap-2 rounded-[24px] border border-white/10 bg-white/5 p-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              disabled={busy}
              placeholder="Tell Kai what matters..."
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-black disabled:opacity-30"
            >
              Send
            </button>
          </div>
        </form>
      ) : null}
    </main>
  );
}
