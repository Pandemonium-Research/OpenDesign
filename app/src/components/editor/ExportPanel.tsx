'use client';
import { useState } from 'react';
import type { Prototype } from '@/lib/ai/generate-prototype';

interface ExportPanelProps {
  prototype: Prototype | null;
  fullHtml: string;
  artifactId?: string;
}

type ExportFormat = 'html' | 'pdf' | 'video';

export function ExportPanel({ prototype, fullHtml, artifactId }: ExportPanelProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doExport(format: ExportFormat) {
    if (!prototype || exporting) return;
    setExporting(format);
    setError(null);

    try {
      const res = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: prototype.html,
          css: prototype.css,
          js: prototype.js,
          title: prototype.title,
          artifactId,
          durationSeconds: 5,
          fps: 30,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Export failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = prototype.title.replace(/\s+/g, '-').toLowerCase();
      a.download = format === 'html' ? `${slug}.zip`
        : format === 'pdf' ? `${slug}.pdf`
        : 'prototype.mp4';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  }

  const disabled = !prototype;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Export</label>
      <div className="grid grid-cols-3 gap-2">
        <ExportButton label="HTML" icon="📦" format="html" exporting={exporting} disabled={disabled} onClick={doExport} />
        <ExportButton label="PDF" icon="📄" format="pdf" exporting={exporting} disabled={disabled} onClick={doExport} />
        <ExportButton label="MP4" icon="🎬" format="video" exporting={exporting} disabled={disabled} onClick={doExport} />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {disabled && <p className="text-xs text-slate-600">Generate a prototype first</p>}
    </div>
  );
}

function ExportButton({ label, icon, format, exporting, disabled, onClick }: {
  label: string; icon: string; format: ExportFormat;
  exporting: ExportFormat | null; disabled: boolean;
  onClick: (f: ExportFormat) => void;
}) {
  const isLoading = exporting === format;
  return (
    <button
      onClick={() => onClick(format)}
      disabled={disabled || !!exporting}
      className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 rounded-lg text-sm text-slate-200 transition-colors"
    >
      {isLoading
        ? <span className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-white rounded-full" />
        : <span>{icon}</span>
      }
      <span>{isLoading ? 'Exporting…' : label}</span>
    </button>
  );
}
