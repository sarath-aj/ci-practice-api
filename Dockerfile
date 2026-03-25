# ─── Stage 1: deps ────────────────────────────────────────────────────────────
# Install only production dependencies.
# Using a separate stage keeps the final image lean — dev deps are never included.
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first — Docker layer cache means npm install
# only re-runs when package.json or package-lock.json changes.
COPY package*.json ./

RUN npm ci --omit=dev

# ─── Stage 2: final image ─────────────────────────────────────────────────────
FROM node:20-alpine

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production deps from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/
COPY package.json ./

# Switch to non-root user before starting
USER appuser

EXPOSE 3000

# Use node directly — not npm start — so the process receives signals properly
# (important for graceful shutdown in Kubernetes)
CMD ["node", "src/server.js"]
