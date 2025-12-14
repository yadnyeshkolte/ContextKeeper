# ContextKeeper - AI Memory Layer for Development Teams

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)

ContextKeeper is a local-first AI agent that connects GitHub, Slack, and Documentation to provide contextual memory for your team. It answers "why" questions about code decisions by leveraging a Knowledge Graph and RAG (Retrieval-Augmented Generation).

> **📚 New to ContextKeeper?** Check out the [complete documentation](docs/README.md) for detailed guides, or jump to [Usage Examples](docs/USAGE_EXAMPLES.md) to see it in action.

## Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [API Reference](#-api-endpoints)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

## ✨ Features

- **🔒 Robust Error Handling**: Automatic retries, rate limit handling, and graceful error recovery.
- **💬 Slack Integration**: Collect team discussions and decisions from Slack channels.
- **🕸️ Real Knowledge Graph**: Automatically discover relationships between people, modules, and decisions.
- **🗂️ Multi-Repository Support**: Separate ChromaDB instances for each repository (Path: `./chroma_db_{repository_name}`).
- **🤖 Context-Aware Answers**: Uses Hugging Face's Llama-3.2-3B-Instruct model and SentenceTransformer embeddings.

## 🏗️ Architecture

- **Orchestration**: Kestra (Docker)
- **Backend API**: Node.js + Express
- **AI Engine**: Python (Hugging Face + ChromaDB)
- **Frontend**: React + Vite
- **Database**: MongoDB (Local or Atlas) & ChromaDB (Vector)

> **📖 For detailed architecture information**, see the [Developer Guide](docs/DEVELOPER_GUIDE.md) and [Architecture Overview](docs/architecture.md).

## � Prerequisites

- Docker & Docker Compose
- Node.js (v16+)
- Python (v3.9+)
- MongoDB (Running locally or have an Atlas URI)

## 🚀 Installation

> **💡 Need help?** See the [Troubleshooting Guide](docs/troubleshooting.md) if you encounter any issues during installation.

### 1. Backend Setup
Configure and start the API server and AI engine.

> **📘 For detailed backend documentation**, including all API endpoints and Python scripts, see [Backend README](backend/README.md).

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
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
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

### 2. Frontend Setup
Launch the user interface.

> **📘 For detailed frontend documentation**, including component architecture and development workflow, see [Frontend README](frontend/README.md).

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Development Server:
   ```bash
   npm run dev
   ```
   Access the UI at `http://localhost:5173`.

1. Go to the Frontend URL (`http://localhost:5173`).
2. Type a question like *"Why did we choose Redis?"*.
3. The system will query ChromaDB and Hugging Face to provide a context-aware answer.
4. View the knowledge graph to see relationships between people, modules, and decisions.


### 3. Infrastructure Setup (Kestra)

> **📘 For detailed Kestra workflow documentation**, see [Kestra README](kestra/README.md) and [Kestra Developer Guide](docs/kestra-developer-guide.md).

- [Kestra](https://kestra.io) instance (version 0.15.0+)
- API tokens for:
  - Slack (Bot Token with appropriate scopes)
  - HuggingFace (for AI model access)
  - GitHub (optional, but recommended for higher rate limits)
  - Notion (optional)

### Installation

1. **Clone or download** this workflow YAML file

2. **Import into Kestra**:
   ```bash   
   # via Kestra UI
   # Navigate to Flows → Create → Import YAML
   ```

```txt
# my testing kestra server with docker

docker-compose --env-file .env up -d

#for windows - local kestra server with docker

docker run --pull=always --rm -it -p 8080:8080 --user=root ^
    -e HUGGINGFACE_API_KEY=hf_your_token_here ^
    -v "/var/run/docker.sock:/var/run/docker.sock" ^
    -v "C:/Temp:/tmp" kestra/kestra:latest server local
```

3. **Configure your tokens** in the execution inputs

### Configuration

#### Required Inputs

| Input | Description | Example |
|-------|-------------|---------|
| `slack_token` | Slack Bot Token | `xoxb-your-token` |
| `huggingface_token` | HuggingFace API Token | `hf_xxxxx` |
| `github_repo` | Repository to monitor | `owner/repo` |
| `slack_channels` | Channels to monitor | `general,dev-team` |

#### Optional Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `github_token` | GitHub PAT (increases rate limits) | None |
| `notion_token` | Notion Integration Token | None |
| `hours` | Time period for data collection | 24 |
| `user_query` | Custom analysis query | Auto-generated |


## 📖 Usage

> **📚 For comprehensive usage examples and tutorials**, see [Usage Examples](docs/USAGE_EXAMPLES.md).

### Collecting Data

**Collect from GitHub:**
```bash
curl -X POST http://localhost:3000/api/collect/github
```

**Collect from Slack:**
```bash
curl -X POST http://localhost:3000/api/collect/slack
```

**For Specific Repository:**
```bash
curl -X POST http://localhost:3000/api/collect/github \
  -H "Content-Type: application/json" \
  -d '{"repository": "owner/repo"}'
```

## 📡 API Endpoints

> **📖 For complete API documentation**, including all endpoints, request/response formats, and examples, see [API Reference](docs/api.md) and [Backend README](backend/README.md#api-endpoints).

### Query
```bash
POST /api/query
Body: { "question": "Why did we choose Redis?", "repository": "owner/repo" }
```

### Knowledge Graph
```bash
GET /api/knowledge-graph?repository=owner/repo
```

### System Status
```bash
GET /api/status?repository=owner/repo
```

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started, our code of conduct, and the process for submitting pull requests.

> **🛠️ Developer Resources:**
> - [Developer Guide](docs/DEVELOPER_GUIDE.md) - Comprehensive development guide
> - [Development Setup](docs/development.md) - Development environment setup
> - [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

For support, please refer to [SUPPORT.md](SUPPORT.md) or open an issue in the issue tracker.

> **🆘 Need Help?**
> - [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions
> - [Documentation Index](docs/README.md) - Complete documentation
> - [Usage Examples](docs/USAGE_EXAMPLES.md) - Practical examples

## 👤 Author

**Yadnyesh Kolte**
- GitHub: [@yadnyeshkolte](https://github.com/yadnyeshkolte)
- Email: yadnyeshkolte@gmail.com

## 🙏 Acknowledgments

- Hugging Face for the amazing models.
- The Open Source community for the tools and libraries used in this project.
