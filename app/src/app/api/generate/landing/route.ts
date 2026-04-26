import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateLandingPage, buildLandingHtml } from '@/lib/ai/generate-landing';
import { createClient } from '@/lib/supabase/server';
import { hasKeyForProvider, type Provider } from '@/lib/ai/providers';
import { decrypt } from '@/lib/encryption';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { prompt, projectId, provider, brandContext } = body as {
    prompt: string;
    projectId: string;
    provider?: Provider;
    brandContext?: string;
  };

  if (!prompt || !projectId) {
    return NextResponse.json({ error: 'prompt and projectId are required' }, { status: 400 });
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
    openai: safeDecrypt(keyRow?.openai_key),
    google: safeDecrypt(keyRow?.google_key),
  };

  const effectiveProvider: Provider = provider ?? 'anthropic';
  if (!hasKeyForProvider(effectiveProvider, userKeys)) {
    return NextResponse.json(
      { error: `No API key for ${effectiveProvider}. Add one in Settings → API Keys.` },
      { status: 400 },
    );
  }

  try {
    const landingPage = await generateLandingPage({ prompt, provider: effectiveProvider, brandContext, userKeys });
    const fullHtml = buildLandingHtml(landingPage);

    const { data, error } = await supabase
      .from('artifacts')
      .insert({
        project_id: projectId,
        type: 'landing',
        document: { ...landingPage, fullHtml, prompt },
      })
      .select('id')
      .single();

    if (error) console.error('Supabase insert error:', error);

    return NextResponse.json({ landingPage, fullHtml, artifactId: data?.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    console.error('Generate landing page error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
