import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateCodeHandoff, type HandoffFramework } from '@/lib/export/code-handoff';
import { createClient } from '@/lib/supabase/server';
import { hasKeyForProvider, type Provider } from '@/lib/ai/providers';
import { decrypt } from '@/lib/encryption';

export const runtime = 'nodejs';
export const maxDuration = 60;

const FRAMEWORK_EXTENSIONS: Record<HandoffFramework, string> = {
  react: 'tsx',
  vue: 'vue',
  svelte: 'svelte',
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    html?: string;
    css?: string;
    js?: string;
    title?: string;
    framework?: HandoffFramework;
    provider?: Provider;
  };

  const { html = '', css = '', js = '', title = 'Component', framework = 'react', provider } = body;

  if (!html && !css) {
    return NextResponse.json({ error: 'html or css is required' }, { status: 400 });
  }

  const validFrameworks: HandoffFramework[] = ['react', 'vue', 'svelte'];
  if (!validFrameworks.includes(framework)) {
    return NextResponse.json({ error: 'framework must be react, vue, or svelte' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: keyRow } = await supabase
    .from('user_api_keys')
    .select('anthropic_key, openai_key, google_key')
    .eq('user_id', userId)
    .single();

  const safeDecrypt = (enc: string | null | undefined) => {
    if (!enc) return undefined;
    try { return decrypt(enc); } catch { return undefined; }
  };

  const userKeys = {
    anthropic: safeDecrypt(keyRow?.anthropic_key),
    openai:    safeDecrypt(keyRow?.openai_key),
    google:    safeDecrypt(keyRow?.google_key),
  };

  const effectiveProvider: Provider = provider ?? 'anthropic';
  if (!hasKeyForProvider(effectiveProvider, userKeys)) {
    return NextResponse.json(
      { error: `No API key for ${effectiveProvider}. Add one in Settings → API Keys.` },
      { status: 400 },
    );
  }

  try {
    const code = await generateCodeHandoff({ html, css, js, title, framework, provider: effectiveProvider, userKeys });
    const ext = FRAMEWORK_EXTENSIONS[framework];
    const slug = title.replace(/[^a-zA-Z0-9]/g, '').replace(/^[a-z]/, (c) => c.toUpperCase()) || 'Component';
    const filename = `${slug}.${ext}`;

    return new NextResponse(code, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Code generation failed';
    console.error('Code handoff error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
