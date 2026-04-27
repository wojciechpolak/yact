ARG build_node=24.15-slim
ARG run_node=24.15-alpine

FROM node:${build_node} AS yact-base

ENV NEXT_TELEMETRY_DISABLED=1

FROM yact-base AS yact-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM yact-base AS yact-builder
WORKDIR /app
COPY --from=yact-deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, only ship the traced standalone output on a small runtime base.
FROM node:${run_node} AS yact-runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S -u 1001 -G nodejs nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=yact-builder --chown=nextjs:nodejs /app/public ./public
COPY --from=yact-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=yact-builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080
HEALTHCHECK --interval=60m --timeout=3s --start-period=10s --retries=3 CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/"]

CMD ["node", "server.js"]
