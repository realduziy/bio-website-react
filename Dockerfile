# ==========================================
# Stage 1: Build the application
# ==========================================
FROM node:26-slim AS builder
WORKDIR /app

# Copy package.json and package-lock.json explicitly
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies like typescript/esbuild)
# strictly using the package-lock.json file
RUN npm ci

# Copy your codebase
COPY . .

# Build your React frontend assets and compile your Express server
RUN npm run build


# ==========================================
# Stage 2: Production Runtime Environment
# ==========================================
FROM node:26-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package configs to the runner stage
COPY package.json package-lock.json ./

# Install ONLY production dependencies to keep the image lightweight
RUN npm ci --only=production

# Copy the built/compiled assets from the builder stage
# (Change "dist" if your build script outputs to "build", "out", etc.)
COPY --from=builder /app/dist ./dist

# Explicitly create the assets directory so Docker doesn't mount 
# your volume with broken root-only permissions
RUN mkdir -p /app/assets

# Expose port 3000 (which matches your Express server config)
EXPOSE 3000

# Run the compiled backend production server
CMD ["npm", "start"]
