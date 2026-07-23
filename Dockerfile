# ==========================================
# Stage 1: Build the application
# ==========================================
FROM node:26-slim AS builder
WORKDIR /app

# Copy package definition
COPY package.json ./

# Generate lockfile & install all dependencies (including devDependencies)
RUN npm install

# Copy application source code
COPY . .

# Build React frontend assets and compile Express server
RUN npm run build


# ==========================================
# Stage 2: Production Runtime Environment
# ==========================================
FROM node:26-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package definition and installed production dependencies from builder
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Prune devDependencies to keep the runner image lightweight
RUN npm prune --omit=dev

# Copy compiled assets from builder stage
COPY --from=builder /app/dist ./dist

# Create assets directory with proper permissions
RUN mkdir -p /app/assets

# Expose port 3000 (Express server)
EXPOSE 3000

# Run the backend production server
CMD ["npm", "start"]
