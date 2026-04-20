'use client';
import { useState } from 'react';
import type { BrandContext } from '@/lib/ingestion/from-url';

interface BrandTokenPanelProps {
  projectId: string;
  onIngested: (ctx: BrandContext) => void;
  initialBrandContext?: BrandContext | null;
}

export function BrandTokenPanel({ projectId, onIngested, initialBrandContext }: BrandTokenPanelProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandContext | null>(initialBrandContext ?? null);

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, projectId }),
      });

      if (!res.ok) {
        const { error: err } = await res.json();
        throw new Error(err || 'Ingestion failed');
      }

      const { brandContext } = await res.json();
      setBrand(brandContext);
      onIngested(brandContext);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ingestion failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Brand tokens</label>
      <form onSubmit={handleIngest} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!url.trim() || loading}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          {loading ? '…' : 'Extract'}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {brand && (
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs space-y-2">
          <div>
            <span className="text-slate-500">Colors: </span>
            <span className="flex flex-wrap gap-1 mt-1">
              {brand.colors.slice(0, 10).map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm border border-slate-700 inline-block" style={{ background: c }} />
                  <span className="text-slate-400">{c}</span>
                </span>
              ))}
            </span>
          </div>
          {brand.fontFamilies.length > 0 && (
            <div>
              <span className="text-slate-500">Fonts: </span>
              <span className="text-slate-300">{brand.fontFamilies.slice(0, 3).join(', ')}</span>
            </div>
          )}
          <p className="text-green-400">✓ Brand context ready — will be used in next generation</p>
        </div>
      )}
    </div>
  );
}
