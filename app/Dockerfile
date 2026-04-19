FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Install Chromium for Playwright PDF export
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium fonts-liberation libatk-bridge2.0-0 libatk1.0-0 libcups2 \
  libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libxcomposite1 \
  libxdamage1 libxfixes3 libxkbcommon0 libxrandr2 xdg-utils \
  && rm -rf /var/lib/apt/lists/*
ENV CHROMIUM_PATH=/usr/bin/chromium
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
