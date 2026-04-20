import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { html, css, js, durationSeconds = 5, fps = 30, artifactId } = await req.json() as {
    html: string; css: string; js: string;
    durationSeconds?: number; fps?: number;
    artifactId?: string;
  };

  const supabase = await createClient();
  let exportId: string | undefined;

  if (artifactId) {
    const { data } = await supabase
      .from('exports')
      .insert({ artifact_id: artifactId, format: 'mp4', status: 'processing' })
      .select('id').single();
    exportId = data?.id;
  }

  const rendererUrl = process.env.VIDEO_RENDERER_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${rendererUrl}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, css, js, durationSeconds, fps }),
      signal: AbortSignal.timeout(280_000),
    });

    if (!response.ok) {
      const error = await response.text();
      if (exportId) {
        await supabase.from('exports').update({ status: 'error', error_message: error }).eq('id', exportId);
      }
      return NextResponse.json({ error: `Renderer error: ${error}` }, { status: 502 });
    }

    const videoBuffer = await response.arrayBuffer();

    if (exportId) {
      await supabase.from('exports').update({ status: 'done' }).eq('id', exportId);
    }

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="prototype.mp4"',
      },
    });
  } catch (err: unknown) {
    if (exportId) {
      const message = err instanceof Error ? err.message : 'Export failed';
      await supabase.from('exports').update({ status: 'error', error_message: message }).eq('id', exportId);
    }
    throw err;
  }
}
