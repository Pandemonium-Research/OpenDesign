import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
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
      .insert({ artifact_id: artifactId, format: 'html', status: 'processing' })
      .select('id').single();
    exportId = data?.id;
  }

  try {
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
${html}
<script src="main.js"></script>
</body>
</html>`;

    const zip = new JSZip();
    zip.file('index.html', indexHtml);
    zip.file('style.css', css || '');
    zip.file('main.js', js || '');

    const buffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
    const slug = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    if (exportId) {
      await supabase.from('exports').update({ status: 'done' }).eq('id', exportId);
    }

    return new NextResponse(buffer as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${slug}.zip"`,
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
