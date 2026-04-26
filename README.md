# OpenDesign

Open-source, model-agnostic design tool that generates HTML/CSS/JS prototypes and presentation decks from a prompt, ingests a website or GitHub repo's design tokens, and exports to HTML, PDF, MP4, and editable PPTX.

**The wedge:** no product today combines OSS + model-agnostic + real video export + editable PPTX from arbitrary HTML/CSS/JS. Claude Design ships all of those *except* open-source, model choice, actual video file export, and editable PowerPoint.

---

## Features

- **Prompt to prototype** — describe a UI, get a live iframe preview in seconds
- **Prompt to deck** — describe a presentation, get scroll-snap slides with speaker notes
- **Design token ingestion** — paste any site URL *or* GitHub repo URL, extract colors and fonts as W3C DTCG tokens, apply them to every subsequent generation
- **Multi-provider** — switch between Claude Sonnet, GPT-4o, and Gemini Flash without changing your prompt; bring your own API keys per user
- **HTML export** — download a self-contained ZIP (index.html + style.css + main.js)
- **PDF export** — server-side Playwright render, text is selectable (not rasterized)
- **MP4 export** — deterministic frame-by-frame capture via Puppeteer + `HeadlessExperimental.beginFrame` + virtual-clock injection + FFmpeg; CSS animations play at the correct speed
- **PPTX export** — editable PowerPoint slides with real XML text boxes, speaker notes, and brand colors (not rasterized images)
- **Self-hostable** — single `docker-compose up` starts everything

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  app/  (Next.js 16, App Router)                             │
│  ├── /api/generate            — prototype generation        │
│  ├── /api/generate/deck       — deck generation             │
│  ├── /api/ingest              — site URL → DTCG tokens      │
│  ├── /api/ingest/github       — GitHub repo → DTCG tokens   │
│  ├── /api/export/html         — ZIP download                │
│  ├── /api/export/pdf          — Playwright PDF              │
│  ├── /api/export/pptx         — editable PowerPoint         │
│  └── /api/export/video        — proxies to renderer         │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  renderer/  (Express on :3001)                              │
│  Puppeteer + virtual clock + FFmpeg → MP4                   │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| Database / Storage | Supabase (Postgres + service-role client) |
| LLM | Vercel AI SDK v6 — Anthropic, OpenAI, Google, Ollama |
| Design tokens | @projectwallace/css-design-tokens (W3C DTCG) |
| GitHub ingestion | GitHub REST API (no cloning needed) |
| PDF export | Playwright (server-side, Node runtime) |
| PPTX export | pptxgenjs (editable XML shapes, not images) |
| Video export | Puppeteer + HeadlessExperimental.beginFrame + FFmpeg |
| Styling | Tailwind CSS 4 + custom watercolor design system |

---

## Getting started

### Prerequisites

- Node.js 22 (see `.nvmrc`)
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker + Docker Compose (for the video renderer and self-hosting)

### 1. Clone and install

```bash
git clone https://github.com/Pandemonium-Research/OpenDesign
cd OpenDesign/app
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
# edit .env.local — see the full table below
```

### 3. Set up Clerk

1. Create an app at [clerk.com](https://clerk.com)
2. Copy **Publishable Key** and **Secret Key** into `.env.local`
3. In Clerk dashboard → **Webhooks** → Add endpoint:
   - URL: `https://your-domain/api/webhooks/clerk` (use [ngrok](https://ngrok.com) for local dev: `ngrok http 3000`)
   - Events: `user.deleted`
4. Copy the **Signing Secret** (`whsec_...`) into `CLERK_WEBHOOK_SECRET`

### 4. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy **Project URL**, **Anon Key**, and **Service Role Key** into `.env.local`
3. Run the migration — paste `supabase/migrations/001_init.sql` into the SQL Editor, or:
   ```bash
   supabase db push
   ```

### 5. Add API keys

At minimum, one LLM provider key is required:

| Provider | Where to get it |
|---|---|
| Anthropic (recommended) | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| OpenAI | [platform.openai.com](https://platform.openai.com) → API Keys |
| Google Gemini | [aistudio.google.com](https://aistudio.google.com) → API key |

Keys go in `.env.local` as `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`. Users can also add their own keys per-account in **Settings → API Keys** — user keys take priority over server env vars.

### 6. Start the app

```bash
# Start the video renderer (needed for MP4 export only)
cd ..
docker compose up renderer -d

# Start Next.js
cd app
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Full reference — copy from [app/.env.example](app/.env.example).

### Required

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_test_...`) |
| `CLERK_SECRET_KEY` | Clerk secret key (`sk_test_...`) |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret (`whsec_...`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — **never expose client-side** |

### LLM providers (at least one required)

| Variable | Provider |
|---|---|
| `ANTHROPIC_API_KEY` | Claude (default provider) |
| `OPENAI_API_KEY` | GPT-4o |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini 2.0 Flash |

### Optional

| Variable | Default | Description |
|---|---|---|
| `OPENDESIGN_PROVIDER` | `anthropic` | Default provider when user has no preference |
| `VIDEO_RENDERER_URL` | `http://renderer:3001` | URL of the video renderer service |
| `CHROMIUM_PATH` | system | Path to Chromium binary for PDF export |
| `GITHUB_TOKEN` | *(none)* | GitHub personal access token — raises rate limit from 60 → 5,000 req/hr for repo ingestion |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama API base |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model name |

---

## API reference

All API routes require a valid Clerk session cookie (except webhooks, which use signature verification).

### Generation

| Method | Route | Body | Returns |
|---|---|---|---|
| `POST` | `/api/generate` | `{ prompt, projectId, provider?, brandContext? }` | `{ prototype, fullHtml, artifactId }` |
| `POST` | `/api/generate/deck` | `{ prompt, projectId, provider?, brandContext? }` | `{ deck, fullHtml, artifactId }` |

### Ingestion

| Method | Route | Body | Returns |
|---|---|---|---|
| `POST` | `/api/ingest` | `{ url, projectId }` | `{ brandContext }` — site URL → DTCG tokens |
| `POST` | `/api/ingest/github` | `{ url, projectId }` | `{ brandContext }` — GitHub repo URL → DTCG tokens |

GitHub ingestion automatically finds `globals.css`, `variables.css`, `tailwind.config.*`, and token JSON files in the repo. No cloning — uses the GitHub REST API.

### Export

| Method | Route | Body | Returns |
|---|---|---|---|
| `POST` | `/api/export/html` | `{ html, css, js, title, artifactId? }` | `application/zip` |
| `POST` | `/api/export/pdf` | `{ html, css, js, title, artifactId? }` | `application/pdf` |
| `POST` | `/api/export/video` | `{ html, css, js, durationSeconds?, fps?, artifactId? }` | `video/mp4` |
| `POST` | `/api/export/pptx` | `{ deck, artifactId? }` | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |

### Projects and artifacts

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/artifacts?projectId=<id>` | Last 20 artifacts for a project |
| `PATCH` | `/api/projects/[projectId]` | Rename a project (`{ name }`) |
| `DELETE` | `/api/projects/[projectId]` | Delete a project and all its artifacts |
| `GET` | `/api/settings/keys` | Get user's API key status (whether set, not the values) |
| `POST` | `/api/settings/keys` | Save or clear user's encrypted API keys |

---

## Supabase schema

Three tables — apply via `supabase/migrations/001_init.sql`:

```sql
projects   (id, user_id, name, brand_context jsonb, created_at, updated_at)
artifacts  (id, project_id, type, document jsonb, created_at)
exports    (id, artifact_id, format, status, error_message, created_at)
```

`brand_context` stores the full `BrandContext` object (sourceUrl, colors[], fontFamilies[], fontSizes[], rawCss, dtcgTokens). `artifacts.type` is `'prototype'` or `'deck'`.

---

## Video export — how it works

The renderer service launches Chrome with `--enable-begin-frame-control` and `--deterministic-mode`, injects a virtual-clock bundle that patches `Date`, `performance.now`, `requestAnimationFrame`, `setTimeout`, and `setInterval`, waits for `document.fonts.ready`, then steps through each frame by advancing the clock and calling `HeadlessExperimental.beginFrame` to capture a deterministic PNG. Frames are piped to FFmpeg and encoded as H.264 MP4.

CSS keyframe animations, `requestAnimationFrame` loops, and `setTimeout`-driven state all advance at exactly the correct speed regardless of server load.

---

## Self-hosting with Docker Compose

```bash
cp app/.env.example app/.env.local
# fill in app/.env.local

docker compose up --build
```

- App: [http://localhost:3000](http://localhost:3000)
- Renderer: [http://localhost:3001](http://localhost:3001)

---

## Roadmap

**Phase 1 — MVP ✅**
- [x] Prompt to prototype (HTML/CSS/JS)
- [x] Design token ingestion from URL
- [x] Multi-provider (Claude, GPT-4o, Gemini, Ollama)
- [x] Per-user encrypted API keys
- [x] HTML, PDF, and MP4 export
- [x] Self-hostable via Docker Compose

**Phase 2 — Multi-artifact ✅ (partial)**
- [x] Deck / slide artifact type + editable PPTX export
- [x] GitHub repo design-token ingestion
- [x] Multi-artifact orchestration (prototype | deck)
- [ ] Real-time collaboration (Yjs + Hocuspocus)
- [ ] Comments, share links, org-scoped permissions

**Phase 3 — Polish and frontier**
- [ ] Figma file ingestion (REST + plugin fallback)
- [ ] Storybook ingestion via csf-tools
- [ ] Animation timeline UI + multi-scene video export
- [ ] Code handoff via Builder Mitosis (React/Vue/Svelte)
- [ ] WebCodecs fast-path for canvas-native exports
- [ ] Landing-page artifact type

---

## License

MIT — Copyright (c) 2026 Pandemonium Research. See [LICENSE](LICENSE) for details.
