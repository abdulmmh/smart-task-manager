# Multi-stage build for Node.js Express Backend
FROM node:20-alpine AS runner

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code and database migrations
COPY . .

# Expose API port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "src/server.js"]
