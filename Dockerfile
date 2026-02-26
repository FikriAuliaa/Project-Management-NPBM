# ==========================================
# STAGE 1: Build Frontend (React / Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build Backend (Node.js / Express)
# ==========================================
FROM node:20-alpine AS backend-builder
# [BARU] Install OpenSSL agar Prisma bisa berjalan di Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma ./prisma/
RUN npm install
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# ==========================================
# STAGE 3: Production Server (Hasil Akhir)
# ==========================================
FROM node:20-alpine AS production
# [BARU] Install OpenSSL untuk environment produksi
RUN apk add --no-cache openssl

WORKDIR /app/server

ENV NODE_ENV=production

COPY server/package*.json ./
COPY server/prisma ./prisma/
RUN npm install --only=production
RUN npx prisma generate

COPY --from=backend-builder /app/server/dist ./dist
COPY --from=frontend-builder /app/client/dist /app/client/dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]