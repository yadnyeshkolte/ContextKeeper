# ContextKeeper - AI Memory Layer for Development Teams

ContextKeeper is a local-first AI agent that connects GitHub, Slack, and Documentation to provide contextual memory for your team. It answers "why" questions about code decisions.

## 🏗️ Architecture

- **Orchestration**: Kestra (Docker)
- **Backend API**: Node.js + Express
- **AI Engine**: Python (Gemini API + ChromaDB)
- **Frontend**: React + Vite
- **Database**: MongoDB (Local or Atlas) & ChromaDB (Vector)

## 🚀 Getting Started

Follow these steps to run the application locally.

### Prerequisites
- Docker & Docker Compose
- Node.js (v16+)
- Python (v3.9+)
- MongoDB (Running locally or have an Atlas URI)

### 1. Infrastructure Setup (Kestra)
Start the orchestration layer.

```bash
cd kestra
docker-compose up -d
```
Kestra UI will be available at `http://localhost:8080`.

### 2. Backend Setup
Configure and start the API server and AI engine.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Environment Configuration:
   - Copy `.env.example` to `.env`: `cp .env.example .env`
   - Edit `.env` and add your **GEMINI_API_KEY**, **GITHUB_TOKEN**, etc.

5. Start the Server:
   ```bash
   npm start
   ```
   Server runs on `http://localhost:3000`.

### 3. Frontend Setup
Launch the user interface.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not done):
   ```bash
   npm install
   ```

3. Start Development Server:
   ```bash
   npm run dev
   ```
   Access the UI at `http://localhost:5173`.

### 4. Running Workflows
To start collecting data:
1. Open Kestra UI (`http://localhost:8080`).
2. Navigate to **Flows** and execute `github-collector` or `slack-collector`.
3. Monitor the execution logs.

### 5. Usage
- Go to the Frontend URL.
- Type a question like *"Why did we choose Redis?"*.
- The system will query ChromaDB and Gemini to provide a context-aware answer.

## 🛠️ Components Created
- **kestra/docker-compose.yml**: Orchestration setup.
- **backend/src/server.js**: API handling requests and spawning Python RAG process.
- **backend/scripts/rag_engine.py**: Core logic connecting to Gemini and ChromaDB.
- **frontend/src/**: React UI for querying and visualization.
