import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-[#0d0d12] text-slate-100 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 h-14 border-b border-white/[0.06] bg-[#111118]">
        <span className="text-sm font-bold tracking-tight">
          <span className="text-indigo-400">Open</span>
          <span className="text-slate-500">Design</span>
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg font-semibold transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center text-center px-6 pt-24 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-indigo-400 text-xs font-medium mb-8">
          Open source · MIT license
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.1]">
          Design at the
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"> speed of thought</span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
          Generate HTML/CSS/JS prototypes from a prompt, ingest design tokens from any website,
          and export to HTML, PDF, or MP4 — with any AI model you choose.
        </p>
        <div className="mt-10 flex items-center gap-3">
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors text-sm"
          >
            Start designing free
          </Link>
          <a
            href="https://github.com/Pandemonium-Research/OpenDesign"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-white/[0.1] hover:border-white/[0.2] text-slate-300 hover:text-white rounded-xl font-semibold transition-all text-sm"
          >
            View source
          </a>
        </div>

        {/* Model logos row */}
        <div className="mt-12 flex items-center gap-5 text-slate-600 text-xs">
          <span>Works with</span>
          {['Claude', 'GPT-4o', 'Gemini', 'Ollama'].map((m) => (
            <span key={m} className="text-slate-500 font-medium">{m}</span>
          ))}
        </div>

        {/* App mockup */}
        <div className="mt-16 w-full max-w-4xl">
          <AppMockup />
        </div>
      </section>

      {/* Three pillars */}
      <section className="border-t border-white/[0.06] px-8 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-white mb-3">
            The wedge no one has shipped
          </h2>
          <p className="text-center text-slate-500 text-sm mb-14 max-w-xl mx-auto">
            Every OSS contender covers at most two of these. OpenDesign ships all three.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                label: 'Open source',
                desc: 'Self-host with Docker Compose. Fork it, audit it, own it. No vendor lock-in, no usage caps.',
                icon: '⬡',
                accent: 'border-indigo-500/20 bg-indigo-500/[0.04]',
                iconColor: 'text-indigo-400',
              },
              {
                label: 'Model-agnostic',
                desc: 'Claude Sonnet, GPT-4o, Gemini Flash, or run Llama locally with Ollama. Switch mid-session.',
                icon: '◈',
                accent: 'border-violet-500/20 bg-violet-500/[0.04]',
                iconColor: 'text-violet-400',
              },
              {
                label: 'Real video export',
                desc: 'The only tool that exports HTML/CSS animations as actual MP4s — deterministic frame capture, no screen recording.',
                icon: '▷',
                accent: 'border-emerald-500/20 bg-emerald-500/[0.04]',
                iconColor: 'text-emerald-400',
              },
            ].map((p) => (
              <div
                key={p.label}
                className={`border ${p.accent} rounded-2xl p-7 bg-[#111118]`}
              >
                <div className={`text-2xl mb-4 font-mono ${p.iconColor}`}>{p.icon}</div>
                <h3 className="text-white font-semibold mb-2">{p.label}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/[0.06] px-8 py-24 bg-[#111118]/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-white mb-14">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Describe', desc: 'Write a prompt. OpenDesign generates a complete HTML/CSS/JS prototype in seconds.' },
              { step: '02', title: 'Customize', desc: 'Paste any website URL to extract its design tokens — colors, fonts, spacing — and apply them to every generation.' },
              { step: '03', title: 'Export', desc: 'Download a static HTML bundle, a selectable PDF, or a real MP4 video of your animated prototype.' },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-3 left-full w-full h-px bg-gradient-to-r from-white/[0.08] to-transparent -translate-x-4" />
                )}
                <div className="text-xs font-mono text-indigo-500 mb-3 font-bold">{s.step}</div>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] px-8 py-24 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to start?</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          Free to use. Self-hostable. Your API keys, your models, your data.
        </p>
        <Link
          href="/sign-up"
          className="inline-block px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors text-sm"
        >
          Get started free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-8 py-6 flex items-center justify-between text-xs text-slate-600 bg-[#111118]/60">
        <span>© 2026 Pandemonium Research</span>
        <div className="flex gap-4">
          <Link href="/sign-in" className="hover:text-slate-400 transition-colors">Sign in</Link>
          <a
            href="https://github.com/Pandemonium-Research/OpenDesign"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function AppMockup() {
  return (
    <div className="rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-indigo-950/60 bg-[#111118] text-left">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 h-9 bg-[#0d0d12] border-b border-white/[0.06]">
        <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <div className="flex-1 mx-4 bg-white/[0.04] rounded-md h-4 border border-white/[0.06]" />
      </div>
      {/* App top bar */}
      <div className="flex items-center gap-3 px-4 h-10 bg-[#111118] border-b border-white/[0.06]">
        <span className="text-xs font-medium text-slate-400">← Projects</span>
        <div className="w-px h-4 bg-white/[0.08]" />
        <span className="text-xs font-medium text-slate-300">Product Launch Prototype</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-5 w-20 rounded bg-white/[0.05] border border-white/[0.07]" />
          <span className="text-xs font-bold">
            <span className="text-indigo-400">Open</span>
            <span className="text-slate-500">Design</span>
          </span>
        </div>
      </div>
      {/* Three-column layout */}
      <div className="flex h-52">
        {/* Left */}
        <div className="w-40 border-r border-white/[0.06] p-3 flex flex-col gap-2">
          <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest mb-1">Artifacts</p>
          {[
            { label: 'Hero Section', g: 'from-indigo-600 to-violet-600' },
            { label: 'Product Grid', g: 'from-sky-600 to-indigo-600' },
            { label: 'Landing Page', g: 'from-emerald-600 to-sky-600' },
          ].map(({ label, g }) => (
            <div key={label} className="rounded-md overflow-hidden border border-white/[0.06]">
              <div className={`h-6 bg-gradient-to-r ${g} opacity-60`} />
              <div className="px-2 py-1">
                <p className="text-[9px] text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Center canvas */}
        <div className="flex-1 bg-[#09090e] flex flex-col">
          <div className="flex items-center h-8 px-3 border-b border-white/[0.06] gap-2">
            <span className="text-[9px] font-medium text-indigo-300 bg-indigo-500/15 rounded px-2 py-0.5">Prototype</span>
          </div>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative w-28 h-36 rounded-xl bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-500/20 flex flex-col items-center justify-center gap-2 shadow-lg">
              <div className="w-16 h-1.5 rounded-full bg-white/20" />
              <div className="w-10 h-1 rounded-full bg-white/10" />
              <div className="mt-1 w-12 h-4 rounded-md bg-indigo-500/50 border border-indigo-500/30" />
            </div>
          </div>
        </div>
        {/* Right panel */}
        <div className="w-56 border-l border-white/[0.06] p-3 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-indigo-500/15 flex items-center justify-center text-[8px] text-indigo-400">✦</span>
            <span className="text-[9px] font-semibold text-slate-300">AI Generation</span>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-2 h-16">
            <p className="text-[8px] text-slate-600 leading-relaxed">A product launch hero with animated gradient background and CTA button…</p>
          </div>
          <div className="h-5 rounded-md bg-indigo-600/70 flex items-center justify-center">
            <span className="text-[8px] text-white font-semibold">Generate</span>
          </div>
          <div className="mt-auto flex flex-col gap-1.5">
            {['.zip', '.pdf', '.mp4'].map((ext) => (
              <div key={ext} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[8px] font-mono text-sky-400 w-5">{ext}</span>
                <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
