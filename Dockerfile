FROM node:22.23.3-bookworm-slim AS build

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/dashboard/package.json apps/dashboard/package.json
RUN npm ci

COPY . .
RUN npm run build

FROM node:22.23.3-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
ENV NODE_ENV=production
COPY --from=build /workspace/package.json /workspace/package-lock.json ./
COPY --from=build /workspace/apps/dashboard/package.json apps/dashboard/package.json
RUN npm ci --omit=dev && useradd --create-home --uid 10001 loom
COPY --from=build /workspace/dist ./dist

USER loom
ENTRYPOINT ["node", "dist/cli.js"]
CMD ["doctor"]
