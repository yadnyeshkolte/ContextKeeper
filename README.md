# ContextKeeper - AI Memory Layer for Development Teams

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)

ContextKeeper is a local-first AI agent that connects GitHub, Slack, and Documentation to provide contextual memory for your team. It answers "why" questions about code decisions by leveraging a Knowledge Graph and RAG (Retrieval-Augmented Generation).

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

## � Prerequisites

- Docker & Docker Compose
- Node.js (v16+)
- Python (v3.9+)
- MongoDB (Running locally or have an Atlas URI)

## 🚀 Installation

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

### 3. Frontend Setup
Launch the user interface.

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

## ⚡ Quick Start

1. Go to the Frontend URL (`http://localhost:5173`).
2. Type a question like *"Why did we choose Redis?"*.
3. The system will query ChromaDB and Hugging Face to provide a context-aware answer.
4. View the knowledge graph to see relationships between people, modules, and decisions.

## 📖 Usage

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

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

For support, please refer to [SUPPORT.md](SUPPORT.md) or open an issue in the issue tracker.

## 👤 Author

**Yadnyesh Kolte**
- GitHub: [@yadnyeshkolte](https://github.com/yadnyeshkolte)
- Email: yadnyeshkolte@gmail.com

## 🙏 Acknowledgments

- Hugging Face for the amazing models.
- The Open Source community for the tools and libraries used in this project.
