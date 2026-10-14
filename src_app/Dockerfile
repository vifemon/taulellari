# syntax=docker/dockerfile:1
# Build on the target architecture (linux/arm64 on the Raspberry Pi).
FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
# Fallback for native modules when a prebuilt binary is unavailable.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# The migration CLI runs outside Next.js' traced routes. Include its full
# runtime packages; pg's dependencies are traced by the application's DB client.
COPY --from=dependencies /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=dependencies /app/node_modules/pg ./node_modules/pg
COPY drizzle ./drizzle
COPY scripts/migrate-postgres.mjs ./scripts/migrate-postgres.mjs
COPY --chmod=755 scripts/entrypoint.sh ./scripts/entrypoint.sh
USER node
EXPOSE 3000
ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["node", "server.js"]
