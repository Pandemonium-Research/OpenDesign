import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { exportPdf } from '@/lib/export/pdf';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { html, css, js, title } = await req.json() as {
    html: string; css: string; js: string; title: string;
  };

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

  const pdf = await exportPdf(fullHtml);
  const slug = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${slug}.pdf"`,
    },
  });
}
