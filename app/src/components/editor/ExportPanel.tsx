'use client';
import { useState } from 'react';
import type { Prototype } from '@/lib/ai/generate-prototype';
import type { Deck } from '@/lib/ai/generate-deck';
import type { HandoffFramework } from '@/lib/export/code-handoff';

interface ExportPanelProps {
  prototype: Prototype | null;
  fullHtml: string;
  artifactId?: string;
  deck?: Deck | null;
  landingPage?: Prototype | null;
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

export function ExportPanel({ prototype, fullHtml, artifactId, deck, landingPage }: ExportPanelProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [handoffFramework, setHandoffFramework] = useState<HandoffFramework | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const isDeck = !!deck;
  const formats = isDeck ? DECK_FORMATS : PROTOTYPE_FORMATS;
  const hasContent = isDeck ? !!deck : !!(prototype ?? landingPage);

  async function handleShare() {
    if (!artifactId || sharing) return;
    setSharing(true);
    try {
      const res = await fetch('/api/artifacts/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactId }),
      });
      if (!res.ok) throw new Error('Share failed');
      const { shareUrl: url } = await res.json();
      const fullUrl = `${window.location.origin}${url}`;
      setShareUrl(fullUrl);
      await navigator.clipboard.writeText(fullUrl).catch(() => {});
    } catch {
      setError('Could not generate share link');
    } finally {
      setSharing(false);
    }
  }

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
      const title = isDeck ? deck!.title : (prototype ?? landingPage)!.title;
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

  async function doCodeHandoff(framework: HandoffFramework) {
    if (!prototype || handoffFramework) return;
    setHandoffFramework(framework);
    setError(null);
    try {
      const res = await fetch('/api/export/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: prototype.html,
          css: prototype.css,
          js: prototype.js,
          title: prototype.title,
          framework,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Code generation failed');
      }
      const blob = await res.blob();
      const ext = framework === 'react' ? 'tsx' : framework === 'vue' ? 'vue' : 'svelte';
      const slug = prototype.title.replace(/\s+/g, '-').toLowerCase();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Code generation failed');
    } finally {
      setHandoffFramework(null);
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
      {/* Share link */}
      {artifactId && hasContent && (
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left disabled:opacity-40"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--bd-1)' }}
        >
          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--ac-15)' }}>
            {sharing
              ? <span className="animate-spin h-3 w-3 rounded-full" style={{ border: '1.5px solid var(--ac-15)', borderTopColor: 'var(--ac)' }} />
              : <LinkIcon />
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-none" style={{ color: 'var(--t1)' }}>
              {sharing ? 'Generating link…' : shareUrl ? 'Link copied!' : 'Share link'}
            </p>
            {shareUrl
              ? <p className="text-[10px] mt-1 leading-none truncate" style={{ color: 'var(--ac)' }}>{shareUrl}</p>
              : <p className="text-[10px] mt-1 leading-none" style={{ color: 'var(--t5)' }}>Public URL, no login required</p>
            }
          </div>
        </button>
      )}

      {/* Code handoff — prototype only */}
      {!isDeck && prototype && (
        <>
          <div className="pt-1 pb-0.5" style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t5)', fontWeight: 600 }}>
            Code handoff
          </div>
          {(['react', 'vue', 'svelte'] as HandoffFramework[]).map((fw) => {
            const isLoading = handoffFramework === fw;
            const ext = fw === 'react' ? '.tsx' : fw === 'vue' ? '.vue' : '.svelte';
            const colorVar = fw === 'react' ? 'var(--sky)' : fw === 'vue' ? 'var(--mint)' : 'var(--rose)';
            const bgVar = fw === 'react' ? 'var(--sky-15)' : fw === 'vue' ? 'var(--mint-15)' : 'var(--rose-15)';
            return (
              <button
                key={fw}
                onClick={() => doCodeHandoff(fw)}
                disabled={!!handoffFramework || !!exporting}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left group disabled:opacity-35 disabled:cursor-not-allowed"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--bd-1)' }}
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: bgVar }}>
                  {isLoading
                    ? <span className="animate-spin h-3 w-3 rounded-full" style={{ border: '1.5px solid var(--ac-15)', borderTopColor: 'var(--ac)' }} />
                    : <span className="text-[10px] font-bold font-mono" style={{ color: colorVar }}>{ext}</span>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-none capitalize" style={{ color: 'var(--t1)' }}>
                    {isLoading ? 'Generating…' : fw.charAt(0).toUpperCase() + fw.slice(1)}
                  </p>
                  <p className="text-[10px] mt-1 leading-none" style={{ color: 'var(--t5)' }}>
                    {fw === 'react' ? 'TypeScript component' : fw === 'vue' ? 'Composition API SFC' : 'Svelte 5 runes'}
                  </p>
                </div>
              </button>
            );
          })}
        </>
      )}

      {error && <p className="text-xs mt-1" style={{ color: 'var(--err)' }}>{error}</p>}
      {!hasContent && (
        <p className="text-[10px] text-center mt-1" style={{ color: 'var(--t5)' }}>Generate an artifact first</p>
      )}
    </div>
  );
}

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M5 6.5a2.5 2.5 0 0 0 3.536.036l1.5-1.5A2.5 2.5 0 0 0 6.5 1.5L5.75 2.25" stroke="var(--ac)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M7 5.5a2.5 2.5 0 0 0-3.536-.036l-1.5 1.5A2.5 2.5 0 0 0 5.5 10.5l.75-.75" stroke="var(--ac)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
