# Deployment Guide

## Docker Deployment (Recommended)

The easiest way to deploy ContextKeeper is using Docker Compose.

1. **Build Images**
   ```bash
   docker-compose build
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

## Manual Deployment

### Server Requirements
- Node.js 18+
- Python 3.9+
- MongoDB 5.0+
- 4GB+ RAM (for local LLM inference)

### Steps
1. Clone the repository.
2. Set up environment variables (see `.env.example`).
3. Install dependencies for backend and frontend.
4. Build the frontend (`npm run build`).
5. Serve the frontend static files via Nginx or the Node.js backend.
6. Use PM2 to run the backend process:
   ```bash
   pm2 start backend/src/server.js --name contextkeeper-api
   ```
