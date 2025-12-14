# ContextKeeper - AI Memory Layer for Development Teams

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)

ContextKeeper is an AI-powered knowledge management system that connects GitHub, Slack, and Notion to provide contextual memory for your development team. It answers "why" questions about code decisions by leveraging a Knowledge Graph and RAG (Retrieval-Augmented Generation).

## Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
  - [1. MongoDB Setup](#1-mongodb-setup)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. Kestra Setup (Optional)](#4-kestra-setup-optional)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- **🤖 AI-Powered Query Engine**: Ask natural language questions about your codebase and get context-aware answers using Hugging Face's Llama models
- **🕸️ Knowledge Graph Visualization**: Interactive 2D and 3D visualizations of relationships between people, modules, commits, and decisions
- **💬 Multi-Source Integration**: Collect data from GitHub (commits, PRs, issues), Slack (discussions), and Notion (documentation)
- **🔍 RAG (Retrieval-Augmented Generation)**: Semantic search powered by ChromaDB vector database and Sentence Transformers
- **📊 AI Agents Dashboard**: Automated data collection and analysis with GitHub, Slack, and Notion agents
- **🎯 Decision Engine**: AI-powered decision recommendations based on team activity and patterns
- **🔄 Real-time Sync**: Keep your knowledge base up-to-date with branch-specific data synchronization
- **🗂️ Multi-Repository Support**: Separate ChromaDB instances for each repository and branch

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┐ │
│  │  Query   │Knowledge │   AI     │  Branch  │   Sync    │ │
│  │Interface │  Graph   │ Agents   │ Selector │  Status   │ │
│  └──────────┴──────────┴──────────┴──────────┴───────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
┌────────────────────────▼────────────────────────────────────┐
│              Backend (Node.js + Express)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Server (server.js) - 15+ REST Endpoints         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Python Scripts (spawned via child_process)          │  │
│  │  • github_collector.py    • rag_engine.py            │  │
│  │  • slack_collector.py     • knowledge_graph_builder  │  │
│  │  • notion_collector.py                               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI Agents (Python)                                   │  │
│  │  • github_agent.py        • ai_summarizer.py         │  │
│  │  • slack_agent.py         • decision_engine.py       │  │
│  │  • notion_agent.py                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────┬─────────────────────┘
             │                         │
    ┌────────▼────────┐       ┌────────▼────────┐
    │    MongoDB      │       │    ChromaDB     │
    │  (Metadata &    │       │  (Vector Store) │
    │   Decisions)    │       │  Per Repo/Branch│
    └─────────────────┘       └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         Kestra (Optional Workflow Orchestration)            │
│  • Automated data collection scheduling                     │
│  • AI-powered summarization workflows                       │
│  • Multi-agent orchestration                                │
└─────────────────────────────────────────────────────────────┘
```

**Technology Stack:**
- **Frontend**: React 19, TypeScript, Vite, Bootstrap, React Force Graph (2D/3D)
- **Backend**: Node.js, Express.js, Python 3.9+
- **AI/ML**: Hugging Face API (Llama models), Sentence Transformers, ChromaDB
- **Databases**: MongoDB, ChromaDB (vector database)
- **Orchestration**: Kestra (Docker-based), PostgreSQL
- **Integrations**: GitHub API, Slack SDK, Notion API

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://www.python.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Docker & Docker Compose** (for Kestra, optional) - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/)

**API Keys Required:**
- **Hugging Face API Key** - [Get it here](https://huggingface.co/settings/tokens)
- **GitHub Personal Access Token** - [Create one](https://github.com/settings/tokens)
- **Slack Bot Token** (optional) - [Create Slack App](https://api.slack.com/apps)
- **Notion Integration Token** (optional) - [Create Integration](https://www.notion.so/my-integrations)

## 🚀 Installation

### 1. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Start MongoDB service (varies by OS)
# Windows (if installed as service):
net start MongoDB

# macOS (via Homebrew):
brew services start mongodb-community

# Linux (systemd):
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/contextkeeper`)

### 2. Backend Setup

Navigate to the backend directory and set up both Node.js and Python environments:

```bash
cd backend
```

#### Install Node.js Dependencies
```bash
npm install
```

#### Set Up Python Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Hugging Face API
HUGGINGFACE_API_KEY=hf_your_token_here

# GitHub Integration
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_REPO=owner/repo

# Slack Integration (optional)
SLACK_TOKEN=xoxb-your_slack_token_here
SLACK_CHANNELS=general,dev-team

# Notion Integration (optional)
NOTION_TOKEN=secret_your_notion_token_here

# Database
MONGODB_URI=mongodb://localhost:27017/contextkeeper
# Or for Atlas: mongodb+srv://user:pass@cluster.mongodb.net/contextkeeper

# Server Config
PORT=3000

# Python Command (optional, auto-detected)
# PYTHON_CMD=python3
```

#### Start the Backend Server
```bash
npm start
```

The server will start on `http://localhost:3000`.

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

#### Install Dependencies
```bash
npm install
```

#### Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000

# Default repository (fallback)
VITE_DEFAULT_REPOSITORY=owner/repo

# Default branch
VITE_DEFAULT_BRANCH=main
```

#### Start the Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 4. Kestra Setup (Optional)

Kestra provides workflow orchestration for automated data collection and AI analysis.

```bash
cd kestra
```

#### Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
KESTRA_URL=http://localhost:8080
HUGGINGFACE_API_KEY=hf_your_token_here
GITHUB_TOKEN=ghp_your_token_here
SLACK_TOKEN=xoxb-your_token_here
NOTION_TOKEN=secret_your_token_here
GITHUB_REPO=owner/repo
SLACK_CHANNELS=general,dev-team
```

#### Start Kestra with Docker Compose
```bash
docker-compose up -d
```

Kestra UI will be available at `http://localhost:8080`.

**Import Workflows:**
1. Open Kestra UI at `http://localhost:8080`
2. Navigate to **Flows** → **Create** → **Import YAML**
3. Import workflow files from the `kestra/flows/` directory

## ⚡ Quick Start

1. **Start all services:**
   - MongoDB (local or Atlas)
   - Backend server (`cd backend && npm start`)
   - Frontend dev server (`cd frontend && npm run dev`)
   - (Optional) Kestra (`cd kestra && docker-compose up -d`)

2. **Open the frontend** at `http://localhost:5173`

3. **Sync repository data:**
   - Click on the **Sync Status** tab
   - Click **"Sync All Branches"** to collect data from GitHub
   - Wait for synchronization to complete

4. **Ask a question:**
   - Go to the **Query** tab
   - Type a question like: *"Why did we choose React for the frontend?"*
   - View AI-generated answers with sources and context

5. **Explore the Knowledge Graph:**
   - Navigate to the **Knowledge Graph** tab
   - Toggle between 2D and 3D visualizations
   - Explore relationships between commits, files, authors, and technologies

6. **Run AI Agents:**
   - Go to the **AI Agents** tab
   - Run GitHub, Slack, or Notion agents to analyze recent activity
   - View AI-generated summaries and decision recommendations

## 📖 Usage

### Collecting Data

**Sync Entire Repository (All Branches):**
```bash
curl -X POST http://localhost:3000/api/sync-repo \
  -H "Content-Type: application/json" \
  -d '{"repository": "owner/repo"}'
```

**Sync Specific Branch:**
```bash
curl -X POST http://localhost:3000/api/sync-data \
  -H "Content-Type: application/json" \
  -d '{"repository": "owner/repo", "branch": "main"}'
```

**Collect Slack Data:**
```bash
curl -X POST http://localhost:3000/api/collect/slack \
  -H "Content-Type: application/json" \
  -d '{"repository": "owner/repo", "branch": "main"}'
```

### Querying the Knowledge Base

**Ask a Question:**
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Why did we implement authentication this way?",
    "repository": "owner/repo",
    "branch": "main"
  }'
```

**Get Knowledge Graph:**
```bash
curl "http://localhost:3000/api/knowledge-graph?repository=owner/repo&branch=main"
```

### Running AI Agents

**GitHub Agent (Analyze commits and PRs):**
```bash
curl -X POST http://localhost:3000/api/agents/github \
  -H "Content-Type: application/json" \
  -d '{
    "repository": "owner/repo",
    "branch": "main",
    "hours": 24
  }'
```

**AI Summarizer (Unified analysis):**
```bash
curl -X POST http://localhost:3000/api/agents/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "repository": "owner/repo",
    "branch": "main",
    "hours": 24
  }'
```

## 📡 API Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/config` | GET | Get default repository configuration |
| `/api/query` | POST | Query the RAG engine with a question |
| `/api/knowledge-graph` | GET | Get knowledge graph data |
| `/api/status` | GET | Check ChromaDB and MongoDB status |
| `/api/branches` | GET | List available branches (cached) |
| `/api/check-updates` | GET | Check for new commits/branches |

### Data Collection

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sync-repo` | POST | Sync all branches from repository |
| `/api/sync-data` | POST | Sync specific branch data |
| `/api/collect/slack` | POST | Collect Slack messages |

### AI Agents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/github` | POST | Run GitHub analysis agent |
| `/api/agents/slack` | POST | Run Slack analysis agent |
| `/api/agents/notion` | POST | Run Notion analysis agent |
| `/api/agents/summarize` | POST | Run unified AI summarizer |
| `/api/agents/decide` | POST | Run decision engine |
| `/api/agents/job/:jobId` | GET | Get agent job status |

### Request/Response Examples

**POST /api/query**
```json
{
  "question": "Why did we choose MongoDB?",
  "repository": "owner/repo",
  "branch": "main"
}
```

Response:
```json
{
  "answer": "MongoDB was chosen for its flexible schema...",
  "sources": [
    {
      "type": "commit",
      "sha": "abc123",
      "message": "Add MongoDB integration",
      "author": "developer@example.com"
    }
  ],
  "relatedPeople": ["developer@example.com"],
  "timeline": [...]
}
```

**GET /api/knowledge-graph?repository=owner/repo&branch=main**

Response:
```json
{
  "nodes": [
    {
      "id": "commit_abc123",
      "type": "commit",
      "label": "Add authentication",
      "metadata": {...}
    },
    {
      "id": "author_john",
      "type": "author",
      "label": "John Doe"
    }
  ],
  "links": [
    {
      "source": "author_john",
      "target": "commit_abc123",
      "type": "authored"
    }
  ]
}
```

For complete API documentation, see [docs/api.md](docs/api.md).

## 🔧 Troubleshooting

### Backend Issues

**Problem**: `MongoDB Connection Error`
- **Solution**: Ensure MongoDB is running (`mongod` process active) or check your Atlas connection string
- Verify `MONGODB_URI` in `.env` is correct

**Problem**: `Python Error: ModuleNotFoundError`
- **Solution**: Activate virtual environment and reinstall dependencies:
  ```bash
  cd backend
  venv\Scripts\activate  # Windows
  pip install -r requirements.txt
  ```

**Problem**: `Hugging Face API error: Unauthorized`
- **Solution**: Check your `HUGGINGFACE_API_KEY` in `.env` is valid
- Get a new token at https://huggingface.co/settings/tokens

**Problem**: `GitHub API rate limit exceeded`
- **Solution**: Add a `GITHUB_TOKEN` to `.env` for authenticated requests (5000 req/hour vs 60)

### Frontend Issues

**Problem**: `Failed to fetch` or CORS errors
- **Solution**: Ensure backend is running on `http://localhost:3000`
- Check `VITE_API_URL` in `frontend/.env` matches backend URL

**Problem**: Knowledge Graph not displaying
- **Solution**: Sync repository data first via **Sync Status** tab
- Check browser console for errors

### Kestra Issues

**Problem**: Kestra container won't start
- **Solution**: Check Docker is running and ports 8080/5432 are available
- View logs: `docker-compose logs kestra`

**Problem**: Workflow fails with "Python script not found"
- **Solution**: Ensure `volumes` in `docker-compose.yml` correctly mount `../backend` directory

### General Issues

**Problem**: ChromaDB collection is empty
- **Solution**: Run data sync first:
  ```bash
  curl -X POST http://localhost:3000/api/sync-data \
    -H "Content-Type: application/json" \
    -d '{"repository": "owner/repo", "branch": "main"}'
  ```

**Problem**: Slow query responses
- **Solution**: 
  - Reduce the time window for data collection
  - Use branch-specific queries instead of repository-wide
  - Check Hugging Face API rate limits

For more troubleshooting help, see [docs/troubleshooting.md](docs/troubleshooting.md).

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on:
- Code of conduct
- Development setup
- Submitting pull requests
- Coding standards

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Yadnyesh Kolte**
- GitHub: [@yadnyeshkolte](https://github.com/yadnyeshkolte)
- Email: yadnyeshkolte@gmail.com

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co/) for AI models and infrastructure
- [Kestra](https://kestra.io) for workflow orchestration
- [ChromaDB](https://www.trychroma.com/) for vector database
- The open source community for amazing tools and libraries

## 📚 Additional Documentation

- [Backend Documentation](backend/README.md) - Detailed backend architecture and API
- [Frontend Documentation](frontend/README.md) - React components and UI development
- [Kestra Workflows](kestra/README.md) - Workflow orchestration and automation
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Comprehensive development guide
- [Architecture Overview](docs/architecture.md) - System architecture details
- [API Reference](docs/api.md) - Complete API documentation

---

**Need Help?** Open an issue on [GitHub](https://github.com/yadnyeshkolte/ContextKeeper/issues) or check our [Support Guide](SUPPORT.md).
