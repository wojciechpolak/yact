ARG node=22.12-slim

FROM node:${node} AS yact-base

FROM yact-base AS yact-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM yact-base AS yact-builder
WORKDIR /app
COPY --from=yact-deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM yact-base AS yact-runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=yact-builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=yact-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=yact-builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=60m --timeout=3s CMD curl -f http://localhost:8080/ || exit 1

CMD ["node", "server.js"]
