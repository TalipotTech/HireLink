# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

# Build-time config. Vite INLINES VITE_* vars into the bundle at BUILD time —
# they are NOT read at runtime. Railway must pass these as build args/variables
# so they are present when `npm run build` runs.
ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY . .
RUN npm run build

# Production stage — nginx serving the static dist/
FROM nginx:alpine
# nginx must listen on Railway's injected $PORT. The nginx image renders
# /etc/nginx/templates/*.template with envsubst at startup; default 80 for local.
ENV PORT=80
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
