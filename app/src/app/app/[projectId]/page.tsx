import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditorClient } from './EditorClient';
import type { BrandContext } from '@/lib/ingestion/from-url';

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function EditorPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, brand_context')
    .eq('id', projectId)
    .single();

  if (error || !project) redirect('/');

  return (
    <EditorClient
      projectId={project.id}
      projectName={project.name}
      initialBrandContext={(project.brand_context ?? null) as BrandContext | null}
    />
  );
}
