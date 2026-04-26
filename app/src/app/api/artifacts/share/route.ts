import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { artifactId } = await req.json() as { artifactId: string };
  if (!artifactId) return NextResponse.json({ error: 'artifactId required' }, { status: 400 });

  const supabase = await createClient();

  // Verify the artifact belongs to this user's project
  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id, share_token, project_id, projects!inner(user_id)')
    .eq('id', artifactId)
    .single();

  if (!artifact) return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });

  // @ts-expect-error — Supabase join typing
  const ownerUserId = artifact.projects?.user_id as string | undefined;
  if (ownerUserId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Return existing token if already shared, otherwise generate one
  const shareToken = (artifact.share_token as string | null) ?? randomUUID();

  if (!artifact.share_token) {
    await supabase
      .from('artifacts')
      .update({ share_token: shareToken })
      .eq('id', artifactId);
  }

  return NextResponse.json({ shareToken, shareUrl: `/share/${shareToken}` });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { artifactId } = await req.json() as { artifactId: string };
  if (!artifactId) return NextResponse.json({ error: 'artifactId required' }, { status: 400 });

  const supabase = await createClient();

  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id, projects!inner(user_id)')
    .eq('id', artifactId)
    .single();

  if (!artifact) return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });

  // @ts-expect-error — Supabase join typing
  if ((artifact.projects?.user_id as string | undefined) !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await supabase.from('artifacts').update({ share_token: null }).eq('id', artifactId);
  return NextResponse.json({ ok: true });
}
