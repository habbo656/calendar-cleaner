# Self-hosting image: build the static SPA, serve it with nginx.
# Mount your own config.json to /usr/share/nginx/html/config.json (see docs/self-hosting.md).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
