# ContextKeeper Backend

The backend for ContextKeeper is a hybrid Node.js + Python system that provides REST API endpoints and AI-powered data processing capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Node.js Express Server                     │
│                   (src/server.js)                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │  REST API Endpoints (15+)                         │ │
│  │  • Query, Knowledge Graph, Sync, Status           │ │
│  │  • AI Agents, Branches, Config                    │ │
│  └───────────────────────────────────────────────────┘ │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │  child_process.spawn │                   │
│              └──────────┬──────────┘                    │
└─────────────────────────┼───────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐                 ┌────────▼────────┐
│ Python Scripts │                 │  Python Agents  │
│ (scripts/)     │                 │  (agents/)      │
├────────────────┤                 ├─────────────────┤
│ • github_      │                 │ • github_agent  │
│   collector    │                 │ • slack_agent   │
│ • slack_       │                 │ • notion_agent  │
│   collector    │                 │ • ai_summarizer │
│ • notion_      │                 │ • decision_     │
│   collector    │                 │   engine        │
│ • rag_engine   │                 │ • base_agent    │
│ • knowledge_   │                 └─────────────────┘
│   graph_builder│
└────────────────┘
        │
┌───────▼────────────────────────┐
│  External Services & DBs       │
├────────────────────────────────┤
│ • MongoDB (metadata)           │
│ • ChromaDB (vectors)           │
│ • Hugging Face API (AI)        │
│ • GitHub API                   │
│ • Slack API                    │
│ • Notion API                   │
└────────────────────────────────┘
```

## Technology Stack

- **Node.js**: Express.js web server
- **Python**: Data processing and AI agents
- **MongoDB**: Metadata and decision storage
- **ChromaDB**: Vector database for semantic search (per repository/branch)
- **Hugging Face**: AI models (Llama 3.2, Sentence Transformers)
- **APIs**: GitHub, Slack, Notion integrations

## Prerequisites

- Node.js v16+
- Python 3.9+
- MongoDB (local or Atlas)
- API keys (see Environment Variables section)

## Installation

### 1. Install Node.js Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Python Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

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

# Server Config
PORT=3000

# Python Command (auto-detected, override if needed)
# PYTHON_CMD=python3
```

### 4. Start the Server

```bash
npm start
```

Server runs on `http://localhost:3000`.

For development with auto-reload:
```bash
npm run dev
```

## Directory Structure

```
backend/
├── src/
│   └── server.js           # Express API server (990 lines)
├── scripts/                # Python data collection & processing
│   ├── github_collector.py       # GitHub data collection
│   ├── slack_collector.py        # Slack message collection
│   ├── notion_collector.py       # Notion data collection
│   ├── rag_engine.py             # RAG query processing
│   ├── knowledge_graph_builder.py # Knowledge graph generation
│   └── data_collectors.py        # Shared utilities
├── agents/                 # Python AI agents
│   ├── base_agent.py             # Base agent class
│   ├── github_agent.py           # GitHub activity analysis
│   ├── slack_agent.py            # Slack conversation analysis
│   ├── notion_agent.py           # Notion documentation analysis
│   ├── ai_summarizer.py          # Unified AI summarization
│   └── decision_engine.py        # AI decision recommendations
├── chroma/                 # ChromaDB storage (auto-created)
├── package.json            # Node.js dependencies
├── requirements.txt        # Python dependencies
└── .env                    # Environment variables (create from .env.example)
```

## Python Scripts

### Data Collection Scripts (`scripts/`)

#### `github_collector.py`
Collects data from GitHub repositories including commits, branches, and metadata.

**Features:**
- Multi-branch support
- Incremental sync (only new commits)
- ChromaDB storage per repository/branch
- Local cache for branches

**Usage:**
```bash
# Sync specific branch
python scripts/github_collector.py owner/repo main

# Sync all branches
python scripts/github_collector.py --sync-all-branches owner/repo

# Check database status
python scripts/github_collector.py --check-db owner/repo main

# List local branches
python scripts/github_collector.py --list-branches owner/repo --local-only

# Check for updates
python scripts/github_collector.py --check-updates owner/repo main
```

#### `slack_collector.py`
Collects messages and threads from Slack channels.

**Features:**
- Multi-channel support
- Thread collection
- User information extraction
- ChromaDB storage with metadata

**Usage:**
```bash
python scripts/slack_collector.py owner/repo main
```

#### `notion_collector.py`
Collects pages and content from Notion workspace.

**Usage:**
```bash
python scripts/notion_collector.py owner/repo main
```

#### `rag_engine.py`
Processes natural language queries using RAG (Retrieval-Augmented Generation).

**Features:**
- Semantic search via ChromaDB
- Hugging Face Llama model integration
- Context-aware answers with sources
- Related people and timeline extraction

**Usage:**
```bash
python scripts/rag_engine.py "Why did we choose MongoDB?" owner/repo main
```

**Output:**
```json
{
  "answer": "MongoDB was chosen for...",
  "sources": [...],
  "relatedPeople": [...],
  "timeline": [...]
}
```

#### `knowledge_graph_builder.py`
Builds knowledge graph from repository data.

**Features:**
- Entity extraction (commits, authors, files, technologies, decisions)
- Relationship mapping (authored, modified, uses, decided)
- Temporal relationships
- Confidence scoring

**Usage:**
```bash
python scripts/knowledge_graph_builder.py owner/repo main
```

**Output:**
```json
{
  "nodes": [
    {"id": "commit_abc", "type": "commit", "label": "...", ...},
    {"id": "author_john", "type": "author", "label": "John Doe"}
  ],
  "links": [
    {"source": "author_john", "target": "commit_abc", "type": "authored"}
  ]
}
```

## Python AI Agents (`agents/`)

### Base Agent (`base_agent.py`)
Abstract base class for all AI agents with common functionality:
- Hugging Face API integration
- Data collection interface
- Summary generation
- Error handling and retries

### GitHub Agent (`github_agent.py`)
Analyzes GitHub activity (commits, PRs, issues) for a time period.

**Usage:**
```bash
python agents/github_agent.py --repo owner/repo --branch main --hours 24
```

**Output:**
```json
{
  "summary": "Analysis of GitHub activity...",
  "commits": [...],
  "pull_requests": [...],
  "issues": [...],
  "insights": [...]
}
```

### Slack Agent (`slack_agent.py`)
Analyzes Slack conversations and extracts key discussions.

**Usage:**
```bash
python agents/slack_agent.py --repo owner/repo --hours 24
```

### Notion Agent (`notion_agent.py`)
Analyzes Notion documentation updates and changes.

**Usage:**
```bash
python agents/notion_agent.py --hours 24
```

### AI Summarizer (`ai_summarizer.py`)
Unified summarization across all data sources.

**Features:**
- Collects data from GitHub, Slack, and Notion agents
- Generates comprehensive summaries
- Identifies patterns and trends
- Provides actionable insights

**Usage:**
```bash
python agents/ai_summarizer.py --repo owner/repo --branch main --hours 24
```

### Decision Engine (`decision_engine.py`)
AI-powered decision recommendations based on team activity.

**Features:**
- Priority classification (Critical, High, Medium, Low)
- Automated decision suggestions
- Blocker identification
- Trend analysis

**Usage:**
```bash
python agents/decision_engine.py --repo owner/repo --branch main --hours 24
```

## API Endpoints

### Core Endpoints

#### `GET /api/config`
Returns default repository configuration.

**Response:**
```json
{
  "defaultRepository": "owner/repo",
  "defaultBranch": "main",
  "apiVersion": "1.0.0"
}
```

#### `POST /api/query`
Query the RAG engine with a natural language question.

**Request:**
```json
{
  "question": "Why did we choose React?",
  "repository": "owner/repo",
  "branch": "main"
}
```

**Response:**
```json
{
  "answer": "React was chosen because...",
  "sources": [...],
  "relatedPeople": [...],
  "timeline": [...]
}
```

#### `GET /api/knowledge-graph`
Get knowledge graph data for visualization.

**Query Parameters:**
- `repository` (optional): Repository name
- `branch` (optional): Branch name
- `noCache` (optional): Skip cache if "true"

**Response:**
```json
{
  "nodes": [...],
  "links": [...]
}
```

#### `GET /api/status`
Check system status (ChromaDB and MongoDB).

**Query Parameters:**
- `repository` (optional): Repository name
- `branch` (optional): Branch name

**Response:**
```json
{
  "chromadb": {
    "count": 150,
    "status": "ok",
    "repository": "owner/repo",
    "branch": "main"
  },
  "mongodb": "connected",
  "timestamp": "2025-12-14T10:00:00.000Z"
}
```

### Data Synchronization

#### `POST /api/sync-repo`
Sync all branches from a repository.

**Request:**
```json
{
  "repository": "owner/repo"
}
```

#### `POST /api/sync-data`
Sync specific branch data.

**Request:**
```json
{
  "repository": "owner/repo",
  "branch": "main"
}
```

#### `POST /api/collect/slack`
Collect Slack messages.

**Request:**
```json
{
  "repository": "owner/repo",
  "branch": "main"
}
```

### Branch Management

#### `GET /api/branches`
List available branches (cache-first).

**Query Parameters:**
- `repository` (optional): Repository name
- `noCache` (optional): Skip cache if "true"

**Response:**
```json
{
  "branches": ["main", "develop", "feature/auth"],
  "from_cache": true
}
```

#### `GET /api/check-updates`
Check for new commits or branches.

**Query Parameters:**
- `repository`: Repository name
- `branch`: Branch name

**Response:**
```json
{
  "update_available": true,
  "local_commit": "abc123",
  "remote_commit": "def456",
  "new_commits": 5
}
```

### AI Agents

#### `POST /api/agents/github`
Run GitHub analysis agent.

**Request:**
```json
{
  "repository": "owner/repo",
  "branch": "main",
  "hours": 24
}
```

**Response:**
```json
{
  "jobId": "job_1234567890_abc",
  "status": "queued"
}
```

#### `POST /api/agents/slack`
Run Slack analysis agent.

#### `POST /api/agents/notion`
Run Notion analysis agent.

#### `POST /api/agents/summarize`
Run unified AI summarizer.

#### `POST /api/agents/decide`
Run decision engine.

#### `GET /api/agents/job/:jobId`
Get agent job status and results.

**Response:**
```json
{
  "jobId": "job_1234567890_abc",
  "status": "completed",
  "progress": 100,
  "result": {...},
  "completedAt": "2025-12-14T10:05:00.000Z"
}
```

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `HUGGINGFACE_API_KEY` | Yes | Hugging Face API token | `hf_xxxxx` |
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token | `ghp_xxxxx` |
| `GITHUB_REPO` | Yes | Default repository | `owner/repo` |
| `SLACK_TOKEN` | No | Slack Bot Token | `xoxb-xxxxx` |
| `SLACK_CHANNELS` | No | Comma-separated channel names | `general,dev` |
| `NOTION_TOKEN` | No | Notion Integration Token | `secret_xxxxx` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/contextkeeper` |
| `PORT` | No | Server port (default: 3000) | `3000` |
| `PYTHON_CMD` | No | Python command (auto-detected) | `python3` |

## Development

### Running in Development Mode

```bash
npm run dev
```

Uses `nodemon` for automatic server restart on file changes.

### Testing Python Scripts

Activate virtual environment first:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

Then run scripts directly:
```bash
python scripts/rag_engine.py "test question" owner/repo main
```

### Debugging

**Node.js debugging:**
```bash
node --inspect src/server.js
```

**Python debugging:**
Add breakpoints with `import pdb; pdb.set_trace()` in Python scripts.

## Troubleshooting

### Python virtual environment issues
```bash
# Recreate virtual environment
rm -rf venv  # or rmdir /s venv on Windows
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### ChromaDB persistence issues
ChromaDB creates separate collections per repository/branch in the `chroma/` directory. If you encounter issues:
```bash
# Clear ChromaDB cache
rm -rf chroma/
# Re-sync data
curl -X POST http://localhost:3000/api/sync-data -H "Content-Type: application/json" -d '{"repository":"owner/repo","branch":"main"}'
```

### MongoDB connection issues
Ensure MongoDB is running:
```bash
# Check if MongoDB is running
mongosh  # Should connect successfully

# Start MongoDB (varies by OS)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

## Dependencies

### Node.js Dependencies
- `express` - Web server framework
- `cors` - CORS middleware
- `dotenv` - Environment variable management
- `mongoose` - MongoDB ODM
- `axios` - HTTP client

### Python Dependencies
- `chromadb` - Vector database
- `huggingface_hub` - Hugging Face API client
- `python-dotenv` - Environment variables
- `PyGithub` - GitHub API wrapper
- `sentence-transformers` - Embedding models
- `slack-sdk` - Slack API client
- `notion-client` - Notion API client
- `pymongo` - MongoDB driver
- `requests` - HTTP library
- `aiohttp` - Async HTTP client
- `transformers` - Hugging Face transformers

## Contributing

When adding new features:
1. Add API endpoints to `src/server.js`
2. Create Python scripts in `scripts/` for data processing
3. Create Python agents in `agents/` for AI analysis
4. Update this README with new endpoints and usage

## License

Apache 2.0 - See [LICENSE](../LICENSE) for details.