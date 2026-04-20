'use client';
import { useEffect, useState, useCallback } from 'react';
import type { Prototype } from '@/lib/ai/generate-prototype';

interface Artifact {
  id: string;
  created_at: string;
  document: Prototype & { fullHtml: string; prompt: string };
}

interface HistoryPanelProps {
  projectId: string;
  onLoad: (result: { fullHtml: string; prototype: Prototype; artifactId: string }) => void;
}

export function HistoryPanel({ projectId, onLoad }: HistoryPanelProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/artifacts?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to load history');
      const { artifacts: data } = await res.json();
      setArtifacts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchArtifacts(); }, [fetchArtifacts]);

  function handleLoad(artifact: Artifact) {
    const { fullHtml, prompt: _prompt, ...prototype } = artifact.document;
    onLoad({ fullHtml, prototype: prototype as Prototype, artifactId: artifact.id });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">History</label>
        <button
          onClick={fetchArtifacts}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          title="Refresh"
        >
          ↺
        </button>
      </div>

      {loading && (
        <p className="text-xs text-slate-600">Loading…</p>
      )}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {!loading && !error && artifacts.length === 0 && (
        <p className="text-xs text-slate-600">No generations yet</p>
      )}

      <ul className="flex flex-col gap-1">
        {artifacts.map((artifact) => (
          <li key={artifact.id}>
            <button
              onClick={() => handleLoad(artifact)}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors group"
            >
              <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white">
                {artifact.document.title || 'Untitled'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {artifact.document.prompt}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {new Date(artifact.created_at).toLocaleString(undefined, {
                  month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
