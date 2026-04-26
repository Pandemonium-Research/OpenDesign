# OpenDesign

Open-source, model-agnostic design tool that generates HTML/CSS/JS prototypes, presentation decks, and landing pages from a prompt, ingests design tokens from websites, GitHub repos, and Figma files, and exports to HTML, PDF, MP4, editable PPTX, and framework components (React/Vue/Svelte).

**The wedge:** no product today combines OSS + model-agnostic + real video export + editable PPTX from arbitrary HTML/CSS/JS. Claude Design ships all of those *except* open-source, model choice, actual video file export, and editable PowerPoint.

---

## Features

- **Prompt to prototype** — describe a UI, get a live iframe preview in seconds
- **Prompt to deck** — describe a presentation, get scroll-snap slides with speaker notes
- **Prompt to landing page** — describe a product, get a hero/features/CTA layout
- **Refine existing designs** — check "Refine current design" in the prompt panel to make targeted modifications without regenerating from scratch
- **Design token ingestion** — extract colors and fonts from any site URL, GitHub repo, or Figma file as W3C DTCG tokens, applied to every subsequent generation
- **Multi-provider** — switch between Claude Sonnet, GPT-4o, and Gemini Flash without changing your prompt; bring your own API keys per user
- **Multi-artifact orchestration** — generate a prototype, deck, and landing page together in one shot
- **Share links** — publish any artifact as a public read-only URL, no login required
- **HTML export** — download a self-contained ZIP (index.html + style.css + main.js)
- **PDF export** — server-side Playwright render, text is selectable (not rasterized)
- **MP4 export** — deterministic frame-by-frame capture via Puppeteer + `HeadlessExperimental.beginFrame` + virtual-clock injection + FFmpeg; CSS animations play at the correct speed
- **PPTX export** — editable PowerPoint slides with real XML text boxes, speaker notes, and brand colors (not rasterized images)
- **Code handoff** — export any prototype as a self-contained React (`.tsx`), Vue (`.vue`), or Svelte (`.svelte`) component via LLM conversion
- **Self-hostable** — single `docker-compose up` starts everything

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  app/  (Next.js 16, App Router)                             │
│  ├── /api/generate            — prototype generation        │
│  ├── /api/generate/deck       — deck generation             │
│  ├── /api/generate/landing    — landing page generation     │
│  ├── /api/generate/all        — multi-artifact in one shot  │
│  ├── /api/ingest              — site URL → DTCG tokens      │
│  ├── /api/ingest/github       — GitHub repo → DTCG tokens   │
│  ├── /api/ingest/figma        — Figma file → DTCG tokens    │
│  ├── /api/export/html         — ZIP download                │
│  ├── /api/export/pdf          — Playwright PDF              │
│  ├── /api/export/pptx         — editable PowerPoint         │
│  ├── /api/export/video        — proxies to renderer         │
│  ├── /api/export/code         — React / Vue / Svelte        │
│  └── /api/artifacts/share     — public share links          │
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
| URL ingestion | Playwright page capture → Wallace token extraction |
| GitHub ingestion | GitHub REST API (no cloning needed) |
| Figma ingestion | Figma REST API `/v1/files/:key` (personal access token) |
| PDF export | Playwright (server-side, Node runtime) |
| PPTX export | pptxgenjs (editable XML shapes, not images) |
| Video export | Puppeteer + HeadlessExperimental.beginFrame + FFmpeg |
| Code handoff | LLM-based conversion → React TSX / Vue SFC / Svelte 5 |
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
3. Run all migrations in order — paste each file into the SQL Editor, or:
   ```bash
   supabase db push
   ```
   Migrations live in `app/supabase/migrations/` and must be applied in order:
   - `001_init.sql` — base schema (projects, artifacts, exports)
   - `002_phase2.sql` — share tokens, user API keys, PPTX format
   - `003_phase3.sql` — Figma key, code handoff export formats

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
| `FIGMA_TOKEN` | *(none)* | Server-level Figma personal access token — users can also add their own in Settings → API Keys |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama API base |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model name |

---

## API reference

All API routes require a valid Clerk session cookie (except webhooks, which use signature verification).

### Generation

| Method | Route | Body | Returns |
|---|---|---|---|
| `POST` | `/api/generate` | `{ prompt, projectId, provider?, brandContext?, existingPrototype? }` | `{ prototype, fullHtml, artifactId }` |
| `POST` | `/api/generate/deck` | `{ prompt, projectId, provider?, brandContext? }` | `{ deck, fullHtml, artifactId }` |
| `POST` | `/api/generate/landing` | `{ prompt, projectId, provider?, brandContext? }` | `{ landingPage, fullHtml, artifactId }` |
| `POST` | `/api/generate/all` | `{ prompt, projectId, provider?, brandContext? }` | `{ prototype, deck, artifactIds }` |

Pass `existingPrototype` to `/api/generate` to refine rather than regenerate — the LLM applies only the requested change while preserving layout, colors, and animations.

### Ingestion

| Method | Route | Body | Returns |
|---|---|---|---|
| `POST` | `/api/ingest` | `{ url, projectId }` | `{ brandContext }` — site URL → DTCG tokens |
| `POST` | `/api/ingest/github` | `{ url, projectId }` | `{ brandContext }` — GitHub repo URL → DTCG tokens |
| `POST` | `/api/ingest/figma` | `{ url, projectId, figmaToken? }` | `{ brandContext }` — Figma file URL → colors + fonts |

GitHub ingestion automatically finds `globals.css`, `variables.css`, `tailwind.config.*`, and token JSON files in the repo. No cloning — uses the GitHub REST API.

Figma ingestion fetches the file document tree (depth 4) and extracts solid fill colors and typography styles. Uses the stored per-user token from Settings, with an optional inline `figmaToken` override.

### Export

| Method | Route | Body | Returns |
|---|---|---|---|
| `POST` | `/api/export/html` | `{ html, css, js, title, artifactId? }` | `application/zip` |
| `POST` | `/api/export/pdf` | `{ html, css, js, title, artifactId? }` | `application/pdf` |
| `POST` | `/api/export/video` | `{ html, css, js, durationSeconds?, fps?, artifactId? }` | `video/mp4` |
| `POST` | `/api/export/pptx` | `{ deck, artifactId? }` | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| `POST` | `/api/export/code` | `{ html, css, js, title, framework, provider? }` | `text/plain` — component source file |

`framework` must be `react` (`.tsx`), `vue` (`.vue`), or `svelte` (`.svelte`).

### Projects, artifacts, and sharing

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/artifacts?projectId=<id>` | Last 20 artifacts for a project |
| `POST` | `/api/artifacts/share` | Generate a public share token for an artifact (`{ artifactId }`) |
| `PATCH` | `/api/projects/[projectId]` | Rename a project (`{ name }`) |
| `DELETE` | `/api/projects/[projectId]` | Delete a project and all its artifacts |
| `GET` | `/api/settings/keys` | Get user's API key status (whether set, not the values) |
| `POST` | `/api/settings/keys` | Save or clear user's encrypted API keys (`anthropic`, `openai`, `google`, `figma`) |

---

## Supabase schema

Four tables across three migrations:

```sql
-- 001_init.sql
projects      (id, user_id, name, brand_context jsonb, created_at, updated_at)
artifacts     (id, project_id, type, document jsonb, share_token uuid unique, created_at)
exports       (id, artifact_id, format, status, error_message, created_at)

-- 002_phase2.sql + 003_phase3.sql
user_api_keys (user_id, anthropic_key, openai_key, google_key, figma_key, updated_at)
```

`brand_context` stores the full `BrandContext` object (sourceUrl, colors[], fontFamilies[], fontSizes[], rawCss, dtcgTokens). `artifacts.type` is `'prototype'`, `'deck'`, or `'landing'`. All API keys are AES-256-GCM encrypted before storage. `share_token` being non-null makes an artifact publicly readable at `/share/[token]`.

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
- [x] Design token ingestion from site URL
- [x] Multi-provider (Claude, GPT-4o, Gemini, Ollama)
- [x] Per-user encrypted API keys (Settings → API Keys)
- [x] HTML, PDF, and MP4 export
- [x] Self-hostable via Docker Compose

**Phase 2 — Multi-artifact ✅ (partial)**
- [x] Deck / slide artifact type + editable PPTX export
- [x] Landing page artifact type
- [x] GitHub repo design-token ingestion
- [x] Multi-artifact orchestration — generate prototype + deck + landing page from one prompt
- [x] Public share links — artifact viewable at `/share/[token]` with no login
- [ ] Real-time collaboration (Yjs + Hocuspocus) — needs a separate WebSocket host

**Phase 3 — Polish and frontier (in progress)**
- [x] Figma file ingestion — REST API, extracts fills and typography; token stored in Settings
- [x] Code handoff — export any prototype as a React `.tsx`, Vue `.vue`, or Svelte `.svelte` component
- [x] Refinement UX — "Refine current design" mode in the prompt panel for targeted edits
- [ ] Storybook ingestion via `@storybook/csf-tools`
- [ ] Animation timeline UI + multi-scene video export
- [ ] WebCodecs fast-path for canvas-native exports
- [ ] Audio and `<video>` sync in the render pipeline
- [ ] Web capture browser extension (scrapes a live site into a DTCG bundle)

**Phase 4 **
- [ ] Voice-driven interaction
- [ ] 3D / shader authoring + GPU render VM
- [ ] Chunked distributed rendering for long videos
- [ ] Plugin system
- [ ] Template marketplace
- [ ] Enterprise self-host + SSO

---

## License

MIT — Copyright (c) 2026 Pandemonium Research. See [LICENSE](LICENSE) for details.
