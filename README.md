# OpenDesign

Open-source, model-agnostic design tool that generates HTML/CSS/JS prototypes from a prompt, ingests a website's design tokens, and exports to HTML, PDF, and MP4.

**The wedge:** no product today combines OSS + model-agnostic + real video export from arbitrary HTML/CSS/JS animations. Claude Design ships all of those *except* open-source, model choice, and actual video file export.

---

## Features

- **Prompt to prototype** — describe a UI, get a live iframe preview in seconds
- **Design token ingestion** — paste any URL, extract colors and fonts as W3C DTCG tokens, apply them to every subsequent generation
- **Multi-provider** — switch between Claude Sonnet, GPT-4o, and Gemini Flash without changing your prompt
- **HTML export** — download a self-contained ZIP (index.html + style.css + main.js)
- **PDF export** — server-side Playwright render, text is selectable (not rasterized)
- **MP4 export** — deterministic frame-by-frame capture via Puppeteer + `HeadlessExperimental.beginFrame` + virtual-clock injection + FFmpeg; CSS animations play at the correct speed
- **Self-hostable** — single `docker-compose up` starts everything

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  app/  (Next.js 16, App Router)                     │
│  ├── /api/generate      — LLM prototype generation  │
│  ├── /api/ingest        — URL → DTCG token extract  │
│  ├── /api/export/html   — ZIP download              │
│  ├── /api/export/pdf    — Playwright PDF            │
│  └── /api/export/video  — proxies to renderer       │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  renderer/  (Express on :3001)                      │
│  Puppeteer + virtual clock + FFmpeg → MP4           │
└─────────────────────────────────────────────────────┘
```

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| Database / Storage | Supabase (Postgres + RLS) |
| LLM | Vercel AI SDK — Anthropic, OpenAI, Google |
| Design tokens | @projectwallace/css-design-tokens (W3C DTCG) |
| PDF export | Playwright (server-side, Node runtime) |
| Video export | Puppeteer + HeadlessExperimental.beginFrame + FFmpeg |
| Styling | Tailwind CSS 4 |

---

## Getting started

### Prerequisites

- Node.js 22 (see `.nvmrc`)
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker + Docker Compose (for the video renderer and self-hosting)

### Local development

```bash
# 1. Clone and enter the app directory
git clone https://github.com/Pandemonium-Research/OpenDesign
cd OpenDesign/app

# 2. Install dependencies
pnpm install

# 3. Copy and fill in environment variables
cp .env.example .env.local
# edit .env.local with your Clerk, Supabase, and LLM API keys

# 4. Apply the Supabase migrations
supabase db push   # or paste supabase/migrations/001_init.sql in the SQL editor

# 5. Start the video renderer (needed for MP4 export)
cd ..
docker compose up renderer -d

# 6. Start the Next.js dev server
cd app
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Self-hosting with Docker Compose

```bash
cp app/.env.example app/.env.local
# fill in app/.env.local

docker compose up --build
```

- App: [http://localhost:3000](http://localhost:3000)
- Renderer: [http://localhost:3001](http://localhost:3001)

---

## Environment variables

See [app/.env.example](app/.env.example) for the full list. Required variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key (optional) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key (optional) |
| `OPENDESIGN_PROVIDER` | Default provider: `anthropic` \| `openai` \| `gemini` |
| `VIDEO_RENDERER_URL` | URL of the renderer service (default: `http://renderer:3001`) |

---

## Video export — how it works

The renderer service launches Chrome with `--enable-begin-frame-control` and `--deterministic-mode`, injects a virtual-clock bundle that patches `Date`, `performance.now`, `requestAnimationFrame`, `setTimeout`, and `setInterval`, waits for `document.fonts.ready`, then steps through each frame by advancing the clock and calling `HeadlessExperimental.beginFrame` to capture a deterministic PNG. Frames are piped to FFmpeg and encoded as H.264 MP4.

This means CSS keyframe animations, `requestAnimationFrame` loops, and `setTimeout`-driven state all advance at exactly the right speed regardless of server load.

---

## Roadmap

**Phase 1 (current) — MVP**
- [x] Prompt to prototype (HTML/CSS/JS)
- [x] Design token ingestion from URL
- [x] Multi-provider (Claude, GPT-4o, Gemini)
- [x] HTML, PDF, and MP4 export
- [x] Self-hostable via Docker Compose

**Phase 2 — Multi-artifact and collaboration**
- [ ] Deck / slide artifact type + editable PPTX export
- [ ] Real-time collaboration (Yjs + Hocuspocus)
- [ ] GitHub repo design-token ingestion
- [ ] Multi-artifact orchestration (prototype + deck + landing page from one prompt)

**Phase 3 — Polish and frontier**
- [ ] Figma file ingestion
- [ ] Animation timeline UI
- [ ] Code handoff via Builder Mitosis
- [ ] WebCodecs fast-path for canvas-native exports

---

## License

MIT — Copyright (c) 2026 Pandemonium Research. See [LICENSE](LICENSE) for details.
