import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface Params { params: Promise<{ token: string }> }

export default async function SharePage({ params }: Params) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id, type, document')
    .eq('share_token', token)
    .single();

  if (!artifact) notFound();

  const doc = artifact.document as Record<string, unknown>;
  const fullHtml = (doc.fullHtml as string | undefined) ?? '';
  const title = (doc.title as string | undefined) ?? 'Shared design';
  const type = artifact.type as string;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f11', color: '#f0f0f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Minimal header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 48, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontStyle: 'italic', fontWeight: 400, color: '#7c6ef2', letterSpacing: '-0.01em' }}>Open</span>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em', opacity: 0.9 }}>Design</span>
          <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', margin: '0 6px' }} />
          <span style={{ fontSize: 12, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{type}</span>
          <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', margin: '0 6px' }} />
          <span style={{ fontSize: 12, opacity: 0.7 }}>{title}</span>
        </div>
        <a
          href="/"
          style={{ fontSize: 11, padding: '5px 14px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', letterSpacing: '0.04em' }}
        >
          Try OpenDesign →
        </a>
      </header>

      {/* Full iframe preview */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {fullHtml ? (
          <iframe
            srcDoc={fullHtml}
            sandbox="allow-scripts"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title={title}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.4, fontSize: 14 }}>
            No preview available
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Params) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: artifact } = await supabase
    .from('artifacts')
    .select('document')
    .eq('share_token', token)
    .single();

  const title = artifact ? ((artifact.document as Record<string, unknown>).title as string | undefined) ?? 'Shared design' : 'Not found';
  return { title: `${title} — OpenDesign` };
}
