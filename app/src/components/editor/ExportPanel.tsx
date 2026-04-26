'use client';
import { useState } from 'react';
import type { Prototype } from '@/lib/ai/generate-prototype';
import type { Deck } from '@/lib/ai/generate-deck';

interface ExportPanelProps {
  prototype: Prototype | null;
  fullHtml: string;
  artifactId?: string;
  deck?: Deck | null;
}

type ExportFormat = 'html' | 'pdf' | 'video' | 'pptx';

const PROTOTYPE_FORMATS: { format: ExportFormat; label: string; ext: string; desc: string; colorVar: string; bgVar: string }[] = [
  { format: 'html',  label: 'HTML Bundle', ext: '.zip', desc: 'Static HTML/CSS/JS', colorVar: 'var(--sky)',  bgVar: 'var(--sky-15)' },
  { format: 'pdf',   label: 'PDF',         ext: '.pdf', desc: 'Selectable text',    colorVar: 'var(--rose)', bgVar: 'var(--rose-15)' },
  { format: 'video', label: 'MP4 Video',   ext: '.mp4', desc: 'Deterministic 60fps', colorVar: 'var(--amb)', bgVar: 'var(--amb-15)' },
];

const DECK_FORMATS: { format: ExportFormat; label: string; ext: string; desc: string; colorVar: string; bgVar: string }[] = [
  { format: 'pptx', label: 'PowerPoint',  ext: '.pptx', desc: 'Editable PPTX slides', colorVar: 'var(--amb)',  bgVar: 'var(--amb-15)' },
  { format: 'pdf',  label: 'PDF',         ext: '.pdf',  desc: 'Print-ready slides',   colorVar: 'var(--rose)', bgVar: 'var(--rose-15)' },
  { format: 'html', label: 'HTML Slides', ext: '.zip',  desc: 'Scroll-snap preview',  colorVar: 'var(--sky)',  bgVar: 'var(--sky-15)' },
];

export function ExportPanel({ prototype, fullHtml, artifactId, deck }: ExportPanelProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDeck = !!deck;
  const formats = isDeck ? DECK_FORMATS : PROTOTYPE_FORMATS;
  const hasContent = isDeck ? !!deck : !!prototype;

  async function doExport(format: ExportFormat) {
    if (!hasContent || exporting) return;
    setExporting(format);
    setError(null);

    try {
      let res: Response;

      if (format === 'pptx' && deck) {
        res = await fetch('/api/export/pptx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deck, artifactId }),
        });
      } else if (isDeck && prototype === null && format === 'pdf') {
        // Export deck as PDF via HTML
        res = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: fullHtml, css: '', js: '', title: deck!.title, artifactId }),
        });
      } else if (isDeck && format === 'html') {
        // Export deck HTML as zip
        res = await fetch('/api/export/html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: fullHtml, css: '', js: '', title: deck!.title, artifactId }),
        });
      } else if (prototype) {
        res = await fetch(`/api/export/${format}`, {
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
      } else {
        throw new Error('Nothing to export');
      }

      if (!res!.ok) {
        const err = await res!.json();
        throw new Error(err.error || 'Export failed');
      }

      const blob = await res!.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const title = isDeck ? deck!.title : prototype!.title;
      const slug = title.replace(/\s+/g, '-').toLowerCase();
      a.download = format === 'pptx' ? `${slug}.pptx`
        : format === 'pdf' ? `${slug}.pdf`
        : format === 'video' ? 'prototype.mp4'
        : `${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {formats.map(({ format, label, ext, desc, colorVar, bgVar }) => {
        const isLoading = exporting === format;
        return (
          <button
            key={format}
            onClick={() => doExport(format)}
            disabled={!hasContent || !!exporting}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left group disabled:opacity-35 disabled:cursor-not-allowed"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--bd-1)' }}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{ background: bgVar }}
            >
              {isLoading
                ? <span
                    className="animate-spin h-3 w-3 rounded-full"
                    style={{ border: '1.5px solid var(--ac-15)', borderTopColor: 'var(--ac)' }}
                  />
                : <span className="text-[10px] font-bold font-mono" style={{ color: colorVar }}>{ext}</span>
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium leading-none" style={{ color: 'var(--t1)' }}>
                {isLoading ? 'Exporting…' : label}
              </p>
              <p className="text-[10px] mt-1 leading-none" style={{ color: 'var(--t5)' }}>{desc}</p>
            </div>
          </button>
        );
      })}
      {error && <p className="text-xs mt-1" style={{ color: 'var(--err)' }}>{error}</p>}
      {!hasContent && (
        <p className="text-[10px] text-center mt-1" style={{ color: 'var(--t5)' }}>Generate an artifact first</p>
      )}
    </div>
  );
}
