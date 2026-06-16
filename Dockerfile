# ── Stage 1: deps ────────────────────────────────────────────────────────────
# Use the official Puppeteer image as base — it ships with a compatible
# Chromium build and all required system libraries pre-installed.
# Pinned to Node 20 LTS for stability.
FROM node:20-slim AS deps

# Puppeteer needs these system packages to run Chromium headlessly.
# ca-certificates  → HTTPS connections from pages
# fonts-liberation → common Latin font family (prevents missing-glyph boxes)
# libnss3 etc      → Chromium's network security stack
# libatk-bridge    → accessibility bridge Chromium links against
# libgbm1          → GPU buffer manager (needed even in headless mode)
# libasound2       → ALSA audio (Chromium links it; harmless if no audio)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package files first so Docker can cache this layer.
# npm ci installs exact versions from package-lock.json — faster and
# deterministic vs npm install.
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-slim AS runtime

# Re-install system deps in the final stage (multi-stage means we start fresh).
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy node_modules from the deps stage — no npm install needed here.
COPY --from=deps /app/node_modules ./node_modules

# Copy application source.
COPY . .

# Tell Puppeteer to use the system Chromium that shipped with the base image
# instead of downloading its own copy during npm install.
# This keeps the image smaller and avoids version mismatch issues.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3000

# Railway (and most platforms) route external traffic to this port.
EXPOSE 3000

# Run as a non-root user — Chromium's sandbox requires this.
# node:20-slim ships a built-in "node" user (uid 1000).
USER node

CMD ["node", "index.js"]
