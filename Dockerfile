# EcoInsight Analytics image for Cloud Run.
# Node.js 24 (Krypton) is the supported LTS line. Node.js 20 is end of life.
# Do not set JWT_SECRET here. Cloud Run supplies it at runtime.

FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled React app (dist/) and bundled Node server (dist-server/).
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY scripts/start.mjs ./scripts/start.mjs

# Accounts are stored in server/data/users.json for the life of this instance.
# The directory is empty in the image so no local accounts are baked in.
RUN mkdir -p server/data && chown -R node:node /app

USER node

# Cloud Run sets PORT. server.ts listens on 0.0.0.0 and uses that value.
EXPOSE 8080

CMD ["npm", "start"]
