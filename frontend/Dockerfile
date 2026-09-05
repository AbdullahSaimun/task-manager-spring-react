# Build stage. Needs Node >= 20.19/22.12 (Vite 8 / Vitest 4's declared
# engines — a real gotcha hit running this project's own test suite,
# CLAUDE.md section 16); node:22-alpine comfortably clears that.
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage: nginx serves the static build output and reverse-proxies
# /api to the backend container — see nginx.conf. This is exactly the same
# proxy-not-CORS shape as the Vite dev-server proxy (vite.config.ts,
# CLAUDE.md section 16), just served by nginx instead of Vite; the app code
# (api/client.ts's relative baseURL: '/api') doesn't need to know or care
# which one is in front of it.
FROM nginx:alpine
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
