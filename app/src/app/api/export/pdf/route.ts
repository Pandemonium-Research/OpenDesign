import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { exportPdf } from '@/lib/export/pdf';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { html, css, js, title, artifactId } = await req.json() as {
    html: string; css: string; js: string; title: string; artifactId?: string;
  };

  const supabase = await createClient();
  let exportId: string | undefined;

  if (artifactId) {
    const { data } = await supabase
      .from('exports')
      .insert({ artifact_id: artifactId, format: 'pdf', status: 'processing' })
      .select('id').single();
    exportId = data?.id;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${css ?? ''}</style>
</head>
<body>
${html}
<script>${js ?? ''}</script>
</body>
</html>`;

  try {
    const pdf = await exportPdf(fullHtml);
    const slug = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    if (exportId) {
      await supabase.from('exports').update({ status: 'done' }).eq('id', exportId);
    }

    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}.pdf"`,
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
