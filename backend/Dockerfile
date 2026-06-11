# Stage 1: Build
FROM node:20-slim AS builder

# Install OpenSSL and other necessary build tools for Prisma
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src/

# Build the project
RUN npm run build

# Stage 2: Production
FROM node:20-slim

# Install OpenSSL for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy only production dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm install --omit=dev

# Copy generated Prisma client and built files from builder
# In Debian-based images, the engine name differs from musl (Alpine)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 5000

# Start the application using node directly
CMD ["node", "dist/index.js"]
