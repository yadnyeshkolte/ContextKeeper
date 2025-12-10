# ContextKeeper - AI Memory Layer for Development Teams

ContextKeeper is a local-first AI agent that connects GitHub, Slack, and Documentation to provide contextual memory for your team. It answers "why" questions about code decisions.

## ✨ New Features

- **🔒 Robust Error Handling**: Automatic retries, rate limit handling, and graceful error recovery
- **💬 Slack Integration**: Collect team discussions and decisions from Slack channels
- **🕸️ Real Knowledge Graph**: Automatically discover relationships between people, modules, and decisions
- **🗂️ Multi-Repository Support**: Separate ChromaDB instances for each repository

## 🏗️ Architecture

- **Orchestration**: Kestra (Docker)
- **Backend API**: Node.js + Express
- **AI Engine**: Python (Hugging Face + ChromaDB)
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
   - Edit `.env` and add your credentials:
     - **HUGGINGFACE_API_KEY**: Your Hugging Face API key
     - **GITHUB_TOKEN**: Your GitHub Personal Access Token
     - **GITHUB_REPO**: Repository in format `owner/repo`
     - **SLACK_TOKEN**: Your Slack Bot Token (xoxb-...)
     - **SLACK_CHANNELS**: Comma-separated channel names
     - **MONGODB_URI**: MongoDB connection string

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

### 4. Collecting Data

#### Collect from GitHub
```bash
curl -X POST http://localhost:3000/api/collect/github
```

#### Collect from Slack
```bash
curl -X POST http://localhost:3000/api/collect/slack
```

#### For Specific Repository
```bash
curl -X POST http://localhost:3000/api/collect/github \
  -H "Content-Type: application/json" \
  -d '{"repository": "owner/repo"}'
```

### 5. Usage
- Go to the Frontend URL (`http://localhost:5173`)
- Type a question like *"Why did we choose Redis?"*
- The system will query ChromaDB and Hugging Face to provide a context-aware answer
- View the knowledge graph to see relationships between people, modules, and decisions

## 📡 API Endpoints

### Query
```bash
POST /api/query
Body: { "question": "Why did we choose Redis?", "repository": "owner/repo" }
```

### Collect GitHub Data
```bash
POST /api/collect/github
Body: { "repository": "owner/repo" }
```

### Collect Slack Data
```bash
POST /api/collect/slack
Body: { "repository": "owner/repo" }
```

### Knowledge Graph
```bash
GET /api/knowledge-graph?repository=owner/repo
```

### System Status
```bash
GET /api/status?repository=owner/repo
```

## 🛠️ Key Components

- **kestra/docker-compose.yml**: Orchestration setup
- **backend/src/server.js**: API handling requests with repository support
- **backend/scripts/rag_engine.py**: Core RAG logic with Hugging Face
- **backend/scripts/github_collector.py**: GitHub data collection with retry logic
- **backend/scripts/slack_collector.py**: Slack message collection
- **backend/scripts/knowledge_graph_builder.py**: Entity extraction and relationship building
- **frontend/src/**: React UI for querying and visualization

## 🔧 Repository-Specific ChromaDB

Each repository gets its own ChromaDB instance:
- Path: `./chroma_db_{repository_name}`
- Collection: `context_{repository_name}`

This prevents confusion between different projects and allows managing multiple codebases simultaneously.

## 📝 Notes

- The system uses Hugging Face's Llama-3.2-3B-Instruct model for answering questions
- Embeddings are generated using SentenceTransformer's 'all-MiniLM-L6-v2' model
- GitHub collector includes rate limit handling and automatic retries
- Slack collector fetches messages from the last 30 days by default
- Knowledge graph automatically discovers relationships between entities

