# 1. Étape des dépendances
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Factice, uniquement pour permettre à "prisma generate" (postinstall) de charger sa config
# au moment du build ; la vraie valeur est fournie à l'exécution du conteneur.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm install

# 2. Étape de compilation
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV SESSION_SECRET="build-time-placeholder-not-used-at-runtime"
RUN npm run build

# 3. Étape de production
FROM node:20-alpine AS runner
RUN apk add --no-cache tzdata openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Europe/Paris

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Serveur Next.js standalone (léger)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# CLI Prisma (+ toutes ses dépendances transitives) pour appliquer "prisma migrate deploy"
# au démarrage du conteneur : le build "standalone" ci-dessus ne trace que les imports
# réellement utilisés par le code applicatif (@prisma/client), pas le CLI ni ses dépendances.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs prisma ./prisma
COPY --chown=nextjs:nodejs prisma.config.ts ./prisma.config.ts
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
