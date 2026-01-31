# To build and publish:
# docker build -f Dockerfile -t harbor.home.blyberg.net/homenet/download_agent -t harbor.home.blyberg.net/homenet/download_agent:1.0 --push .

#
# 🏡 Build
#

FROM node:22-alpine AS builder

RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  build-base \
  cairo-dev \
  pango-dev \
  jpeg-dev \
  giflib-dev \
  librsvg-dev

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json tsconfig.json tsconfig.build.json pnpm-lock.yaml .npmrc ./
COPY src/ src/

RUN pnpm install

RUN pnpm build
RUN pnpm prune --prod

#
# 🚀 Production
#

FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache \
  cairo \
  pango \
  jpeg \
  giflib \
  librsvg

ENV NODE_ENV=production

COPY fonts fonts
COPY --from=builder /app/dist dist
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json package.json

USER root

RUN mkdir -p /usr/share/fonts/truetype/custom
COPY fonts/* /usr/share/fonts/truetype/custom/
RUN chmod 644 /usr/share/fonts/truetype/custom/*

RUN fc-cache -f

USER 1000

CMD ["npm", "run", "start:prod"]
