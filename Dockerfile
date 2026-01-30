# To build and publish:
# docker build -f Dockerfile -t harbor.home.blyberg.net/homenet/download_agent -t harbor.home.blyberg.net/homenet/download_agent:1.0 --push .

#
# 🏡 Build
#

FROM node:22-alpine AS builder

# Install system libraries for canvas
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

# Copy Source
COPY package.json tsconfig.json tsconfig.build.json pnpm-lock.yaml .npmrc ./
COPY src/ src/

# Install dependencies
RUN pnpm install

# Generate the production build. The build script runs "nest build" to compile the application.
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

# Set to production environment
ENV NODE_ENV=production

# Copy only the necessary files
COPY --from=builder /app/dist dist
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json package.json

CMD ["npm", "run", "start:prod"]
