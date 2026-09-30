# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Brio — production image
#   docker build -t brio:1.0.0 .
#   docker run -p 8080:8080 -e SESSION_SECRET=$(openssl rand -hex 32) brio:1.0.0
# ---------------------------------------------------------------------------
FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=8080 \
    DB_FILE=/app/data/db.json \
    SEED_ON_BOOT=true

WORKDIR /app

# Dependencies first so the layer caches across code edits.
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Application code
COPY . .

# Build the catalog at image-build time: it needs no secrets, so the build
# validates itself. The test account is NOT seeded here — a volume mounted at
# /app/data would shadow it — see docker/entrypoint.sh (runs at start).
RUN node scripts/build-catalog.js \
 && cp docker/entrypoint.sh /usr/local/bin/brio-entrypoint \
 && chmod +x /usr/local/bin/brio-entrypoint \
 && mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 8080
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/brio-entrypoint"]
