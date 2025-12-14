# ContextKeeper: AI-Powered Data Collection & Analysis Platform

[![Kestra](https://img.shields.io/badge/Powered%20by-Kestra-orange)](https://kestra.io)

An intelligent workflow automation system that collects data from multiple sources (Slack, GitHub, Notion) and leverages AI to provide comprehensive analysis, insights, and actionable recommendations.

## 🌟 Overview

ContextKeeper is a unified data intelligence platform that automatically:
- **Collects** data from your team's communication and development tools
- **Analyzes** patterns, trends, and anomalies using advanced AI models
- **Decides** on priorities and recommended actions based on data-driven insights
- **Reports** comprehensive summaries with executive-level clarity

## 🎯 Key Features

### Multi-Source Data Collection
- **Slack Integration**: Captures team conversations, discussions, and collaboration
- **GitHub Integration**: Tracks commits, issues, pull requests, and urgent items
- **Notion Integration**: Monitors documentation and knowledge base updates

### Intelligent AI Analysis
- Powered by Meta's Llama 3.1 70B model via HuggingFace
- Automated decision-making with priority classification (Critical, High, Medium, Low)
- Pattern recognition across multiple data sources
- Context-aware recommendations

### Actionable Insights
- Executive summaries for quick decision-making
- Urgent item detection with automatic prioritization
- Development blocker identification
- Team activity trend analysis

## 🚀 Quick Start

### Prerequisites

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

### Example Execution

```yaml
inputs:
  slack_token: "xoxb-your-slack-token"
  huggingface_token: "hf_your-token"
  github_repo: "yourusername/your-repo"
  slack_channels: "engineering,product"
  hours: 48
  user_query: "What are the critical blockers and how should we prioritize this week?"
```

## 📁 Workflow Files

The `flows/` directory contains multiple workflow YAML files for different use cases:

### Main Workflows

#### `unified-contextkeeper-flow.yml` & `unified-contextkeeper-flow-v2.yml`
Complete end-to-end workflow that:
- Collects data from GitHub, Slack, and Notion in parallel
- Prepares unified context for AI analysis
- Runs AI agent for decision-making
- Generates structured reports with priority classification

**Use this for**: Comprehensive daily/weekly team activity analysis

#### `agentic-ai-summarizer.yaml`
Advanced AI-powered summarization with autonomous decision-making:
- Native Kestra HTTP plugin for Hugging Face API
- AI-driven urgency classification
- Conditional autonomous actions based on confidence
- Integrated data collection and analysis

**Use this for**: Automated intelligent summarization with decision logic

#### `ai-summarizer.yaml`
Basic AI summarization workflow:
- Collects data from configured sources
- Generates AI summaries using Hugging Face
- Simpler than agentic version

**Use this for**: Simple summarization without decision logic

### Agent Workflows

#### `agent-orchestrator.yaml`
Coordinates multiple AI agents:
- Orchestrates GitHub, Slack, and Notion agents
- Aggregates results from multiple sources
- Provides unified analysis

**Use this for**: Running multiple agents in coordination

### Data Collection Workflows

#### `github-collector.yaml`
Standalone GitHub data collection:
- Fetches commits, PRs, issues
- Stores in ChromaDB
- Can be scheduled independently

**Use this for**: Regular GitHub data sync

#### `slack-collector.yaml`
Standalone Slack data collection:
- Collects channel messages and threads
- Stores in ChromaDB

**Use this for**: Regular Slack data sync

#### `knowledge-graph.yaml`
Knowledge graph generation workflow:
- Builds graph from collected data
- Generates nodes and relationships

**Use this for**: Updating knowledge graph visualization

### Utility Workflows

#### `auto-responder.yaml`
Automated response workflow:
- Monitors for specific triggers
- Generates automated responses
- Can be used for notifications

**Use this for**: Automated team notifications

## 🚀 Deployment

### Using Docker Compose (Recommended)

1. **Navigate to kestra directory:**
```bash
cd kestra
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start Kestra:**
```bash
docker-compose up -d
```

4. **Access Kestra UI:**
Open `http://localhost:8080` in your browser

5. **Import workflows:**
- Click **Flows** → **Create** → **Import YAML**
- Select workflow files from `flows/` directory
- Import one or more workflows

### Using Docker Run (Windows)

For Windows users without Docker Compose:

```bash
docker run --pull=always --rm -it -p 8080:8080 --user=root ^
    -e HUGGINGFACE_API_KEY=hf_your_token_here ^
    -e GITHUB_TOKEN=ghp_your_token_here ^
    -e SLACK_TOKEN=xoxb_your_token_here ^
    -e NOTION_TOKEN=secret_your_token_here ^
    -v "/var/run/docker.sock:/var/run/docker.sock" ^
    -v "C:/Temp:/tmp" ^
    kestra/kestra:latest server local
```

### Scheduling Workflows

To run workflows automatically:

1. Open workflow in Kestra UI
2. Click **Edit**
3. Add trigger section:

```yaml
triggers:
  - id: daily_analysis
    type: io.kestra.plugin.core.trigger.Schedule
    cron: "0 9 * * *"  # 9 AM daily
    disabled: false
```

4. Save workflow

### Example Execution

```

## 🔧 How It Works

### Architecture

```
┌─────────────────────────────────────────────┐
│         Parallel Data Collection            │
├──────────────┬──────────────┬───────────────┤
│    Slack     │    GitHub    │    Notion     │
│  Messages    │  Commits     │    Pages      │
│  Threads     │  Issues      │  Updates      │
│  Users       │  PRs         │               │
└──────┬───────┴──────┬───────┴───────┬───────┘
       │              │               │
       └──────────────┴───────────────┘
                      │
              ┌───────▼────────┐
              │  AI Context    │
              │  Preparation   │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │   AI Agent     │
              │  Analysis &    │
              │  Decision      │
              │  Making        │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │  Structured    │
              │  Report        │
              │  Generation    │
              └────────────────┘
```

### Workflow Stages

1. **Parallel Data Collection**: Simultaneously fetches data from all configured sources
2. **Context Preparation**: Aggregates and structures data into AI-readable format
3. **AI Analysis**: Processes context through AI model for insights and decisions
4. **Decision Processing**: Generates structured reports and actionable outputs

### AI Decision Framework

The AI agent evaluates data using this priority classification:

- **CRITICAL**: Security issues, system-down scenarios, critical bugs
- **HIGH**: Development blockers, unanswered urgent questions, stale PRs
- **MEDIUM**: Regular issues, ongoing development tasks
- **LOW**: Documentation, informational updates

## 📊 Output Examples

### AI Agent Report Structure

```
===============================================================================
AI AGENT ANALYSIS & DECISION REPORT
===============================================================================

1. Executive Summary
   [High-level overview of findings]

2. Key Findings
   • Finding 1
   • Finding 2
   • Finding 3

3. Urgent Items & Decisions
   CRITICAL: [Immediate actions needed]
   HIGH: [Important items requiring attention]

4. Recommendations
   → Actionable step 1
   → Actionable step 2

5. Automated Decisions
   [Actions that should be taken automatically]
```

## 🔐 Security Best Practices

1. **Store tokens securely** using Kestra's secret management
2. **Use minimal scopes** for Slack bot tokens
3. **Rotate API tokens** regularly
4. **Review data access** permissions periodically

### Slack Bot Token Scopes

Required scopes for your Slack bot:
```
channels:history
channels:join
channels:read
```

## 🎨 Customization

### Custom Analysis Queries

Tailor the AI analysis to your needs:

```yaml
user_query: "Focus on security vulnerabilities and provide remediation steps"
```

```yaml
user_query: "Analyze team velocity and identify productivity bottlenecks"
```

```yaml
user_query: "What documentation gaps exist based on Slack questions?"
```

### Scheduling

Enable automatic daily analysis:

```yaml
triggers:
  - id: daily_analysis
    type: io.kestra.plugin.core.trigger.Schedule
    cron: "0 9 * * *"  # Run at 9 AM daily
    disabled: false     # Enable the trigger
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Use Cases

- **Daily Standup Preparation**: Automated summaries of team activity
- **Sprint Planning**: Analysis of completed work and blockers
- **Incident Response**: Quick identification of critical issues
- **Team Health Monitoring**: Track communication patterns and collaboration
- **Technical Debt Management**: Identify stale PRs and unresolved issues

## 🐛 Troubleshooting

### Common Issues

**Issue**: Slack messages not being collected
- **Solution**: Ensure bot is invited to channels and has correct scopes

**Issue**: GitHub rate limit errors
- **Solution**: Add `github_token` for authenticated requests (5000 req/hour vs 60)

**Issue**: AI response is incomplete
- **Solution**: Reduce `hours` parameter or simplify `user_query`

## 🙏 Acknowledgments

- Built with [Kestra](https://kestra.io) workflow orchestration platform
- Powered by Meta's [Llama 3.1](https://huggingface.co/meta-llama) via HuggingFace
- Inspired by the need for intelligent data aggregation in modern development teams

## 📧 Support

For questions and support:
- Open an issue on GitHub
- Check [Kestra Documentation](https://kestra.io/docs)
- Join [Kestra Community](https://kestra.io/slack)

---














