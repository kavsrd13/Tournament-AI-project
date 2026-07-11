# Stage 1: Build the frontend React app
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the backend Express server
FROM node:20-alpine
WORKDIR /app/backend

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source code
COPY backend/ ./

# Copy the centralized data folder (needed by dataLoader)
COPY data/ /app/data/

# Copy the built frontend static files to the backend public folder
COPY --from=frontend-builder /app/frontend/dist /app/backend/public

# Cloud Run injects the PORT environment variable (default 8080)
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/server.js"]
