# Node.js Express backend image
FROM node:20-alpine AS runner

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code and database migrations
COPY --chown=node:node . .

# Expose API port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Run as the unprivileged user that ships with the official Node image
USER node

# Start server
CMD ["node", "src/server.js"]
