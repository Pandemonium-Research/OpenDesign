'use client';
import { useState } from 'react';
import type { Provider } from '@/lib/ai/providers';
import type { Prototype } from '@/lib/ai/generate-prototype';

interface PromptPanelProps {
  projectId: string;
  provider: Provider;
  brandContext?: string;
  onGenerate: (result: { fullHtml: string; prototype: Prototype; artifactId?: string }) => void;
  /** When set, shows a "Refine" toggle to modify the existing prototype */
  currentPrototype?: Prototype | null;
}

export function PromptPanel({ projectId, provider, brandContext, onGenerate, currentPrototype }: PromptPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refineMode, setRefineMode] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { prompt, projectId, provider, brandContext };
      if (refineMode && currentPrototype) {
        body.existingPrototype = currentPrototype;
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const { error: err } = await res.json();
        throw new Error(err || 'Generation failed');
      }

      const { prototype, fullHtml, artifactId } = await res.json();
      onGenerate({ fullHtml, prototype, artifactId });
      setPrompt('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const isRefineAvailable = !!currentPrototype;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      {/* Refine toggle — only shown when a prototype exists */}
      {isRefineAvailable && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer select-none"
          style={{
            background: refineMode ? 'var(--ac-15)' : 'var(--bg-input)',
            border: `1px solid ${refineMode ? 'var(--ac-bd-25)' : 'var(--bd-1)'}`,
            transition: 'all 150ms',
          }}
          onClick={() => setRefineMode((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setRefineMode((v) => !v)}
        >
          <div
            className="w-3.5 h-3.5 rounded-sm flex items-center justify-center flex-shrink-0"
            style={{
              background: refineMode ? 'var(--ac)' : 'transparent',
              border: `1.5px solid ${refineMode ? 'var(--ac)' : 'var(--t4)'}`,
            }}
          >
            {refineMode && (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="text-[10.5px] font-medium leading-none" style={{ color: refineMode ? 'var(--ac)' : 'var(--t3)' }}>
            Refine current design
          </span>
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={
          refineMode
            ? 'Describe what to change…\ne.g. Make the button larger and add a hover glow effect'
            : 'Describe what to design…\ne.g. A hero section with animated gradient and CTA button'
        }
        rows={5}
        className="w-full rounded-lg px-3 py-2.5 text-xs resize-none focus:outline-none transition-all leading-relaxed"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--bd-1)',
          color: 'var(--t1)',
        }}
        disabled={loading}
      />
      {error && (
        <p
          className="text-xs rounded-lg px-3 py-2 leading-relaxed"
          style={{ color: 'var(--err)', background: 'var(--err-bg)', border: '1px solid var(--err-bd)' }}
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!prompt.trim() || loading}
        className="w-full py-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--ac)' }}
      >
        {loading ? (
          <>
            <span className="animate-spin h-3 w-3 rounded-full" style={{ border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
            {refineMode ? 'Refining…' : 'Generating…'}
          </>
        ) : (
          <>
            {refineMode ? <RefineIcon /> : <SparkleIcon />}
            {refineMode ? 'Refine' : 'Generate'}
          </>
        )}
      </button>
    </form>
  );
}

function SparkleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M5.5 1L6.5 4H9.5L7 5.8L8 8.5L5.5 6.8L3 8.5L4 5.8L1.5 4H4.5L5.5 1Z" fill="currentColor" />
    </svg>
  );
}

function RefineIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M2 9L5 2L8 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.2 6.5H6.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
