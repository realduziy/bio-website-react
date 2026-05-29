# Stage 1: Build the React Application
FROM node:24-slim AS build
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install packages with npm install (handles missing lockfiles gracefully)
RUN npm install

# Copy full application source code
COPY . .

# Build the app flatout to the dist directory
RUN npm run build

# Stage 2: Serve using NGINX with SPA Routing Fallback support
FROM nginx:alpine

# Copy our secure Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
