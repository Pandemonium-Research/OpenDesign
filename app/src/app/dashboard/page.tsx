import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { UserButton } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DeleteProjectButton } from './DeleteProjectButton';

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #6366f1 100%)',
];

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  async function deleteProject(formData: FormData) {
    'use server';
    const projectId = formData.get('projectId') as string;
    const supabase = await createClient();
    await supabase.from('projects').delete().eq('id', projectId);
    revalidatePath('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0d0d12] text-slate-100">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-8 h-14 flex items-center justify-between bg-[#111118]">
        <Link href="/" className="flex items-center gap-1.5 no-underline">
          <span className="text-sm font-bold tracking-tight" style={{ color: 'inherit' }}>
            <span className="text-indigo-400">Open</span>
            <span className="text-slate-500">Design</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <NewProjectButton userId={userId} />
          <UserButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12">
        <div className="mb-10">
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">Your design prototypes</p>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <div key={project.id} className="relative group">
                <Link
                  href={`/app/${project.id}`}
                  className="block bg-[#111118] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-950/40"
                >
                  {/* Thumbnail */}
                  <div
                    className="w-full h-28 opacity-70 group-hover:opacity-90 transition-opacity"
                    style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity="0.5">
                        <path d="M16 4L19 12H27L21 17L23 25L16 20L9 25L11 17L5 12H13L16 4Z" fill="white" />
                      </svg>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <h2 className="font-medium text-slate-100 truncate pr-6 text-sm group-hover:text-white transition-colors">
                      {project.name}
                    </h2>
                    <p className="text-slate-600 text-xs mt-1">
                      {new Date(project.updated_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                </Link>
                <DeleteProjectButton
                  projectId={project.id}
                  projectName={project.name}
                  deleteAction={deleteProject}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111118] border border-white/[0.07] flex items-center justify-center mb-6">
              <span className="text-slate-600 text-2xl font-mono">◈</span>
            </div>
            <h3 className="text-white font-semibold mb-2">No projects yet</h3>
            <p className="text-slate-500 text-sm mb-6">Create your first prototype to get started.</p>
            <NewProjectButton userId={userId} />
          </div>
        )}
      </main>
    </div>
  );
}

function NewProjectButton({ userId }: { userId: string }) {
  async function createProject() {
    'use server';
    const supabase = await createClient();
    const { data } = await supabase
      .from('projects')
      .insert({ user_id: userId, name: 'Untitled Project' })
      .select('id')
      .single();
    if (data?.id) redirect(`/app/${data.id}`);
  }

  return (
    <form action={createProject}>
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
      >
        <span className="text-base leading-none mb-px">+</span>
        New project
      </button>
    </form>
  );
}
