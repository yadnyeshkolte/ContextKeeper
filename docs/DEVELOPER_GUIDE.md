# AI Agent System - Developer Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Using Individual Agents](#using-individual-agents)
6. [Using the AI Summarizer](#using-the-ai-summarizer)
7. [Using the Decision Engine](#using-the-decision-engine)
8. [Kestra Integration](#kestra-integration)
9. [Extending the System](#extending-the-system)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The AI Agent System is a comprehensive solution for collecting, summarizing, and analyzing data from multiple sources (GitHub, Slack, Notion) using Hugging Face AI models. The system provides:

- **Specialized Agents**: Dedicated agents for each platform
- **AI Summarization**: Powered by Hugging Face models (default: `facebook/bart-large-cnn`)
- **Decision Engine**: Intelligent recommendations based on aggregated data
- **Kestra Orchestration**: Automated daily briefings

## Architecture

```mermaid
graph TD
    A[GitHub Agent] -->|Collects & Summarizes| D[AI Summarizer]
    B[Slack Agent] -->|Collects & Summarizes| D
    C[Notion Agent] -->|Collects & Summarizes| D
    D -->|Aggregated Summary| E[Decision Engine]
    E -->|Recommendations| F[Final Report]
    G[Hugging Face API] -->|AI Models| A
    G -->|AI Models| B
    G -->|AI Models| C
    G -->|AI Models| D
```

### Component Hierarchy

```
backend/agents/
├── base_agent.py          # Abstract base class
├── github_agent.py        # GitHub specialization
├── slack_agent.py         # Slack specialization
├── notion_agent.py        # Notion specialization
├── ai_summarizer.py       # Unified summarizer
└── decision_engine.py     # Decision making
```

---

## Installation

### Prerequisites

- Python 3.9+
- Docker & Docker Compose (for Kestra)
- API tokens for GitHub, Slack, Notion, and Hugging Face

### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Required Packages

The system requires these additional packages (already in `requirements.txt`):

```
transformers
huggingface_hub
requests
```

---

## Configuration

### Environment Variables

Create or update `backend/.env`:

```bash
# GitHub Configuration
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO=owner/repository

# Slack Configuration
SLACK_TOKEN=xoxb-your-token-here
SLACK_CHANNELS=general,development,team

# Notion Configuration
NOTION_TOKEN=secret_your_token_here

# Hugging Face Configuration
HUGGINGFACE_API_KEY=hf_your_key_here
HUGGINGFACE_MODEL=facebook/bart-large-cnn  # Optional, this is default

# Agent Configuration (Optional)
AGENT_MAX_RETRIES=3
AGENT_RETRY_DELAY=2
DECISION_CONFIDENCE_THRESHOLD=0.6
```

### Kestra Configuration

Update `kestra/docker-compose.yml` environment section:

```yaml
environment:
  GITHUB_TOKEN: "your_github_token"
  GITHUB_REPO: "owner/repo"
  SLACK_TOKEN: "your_slack_token"
  SLACK_CHANNELS: "channel1,channel2"
  NOTION_TOKEN: "your_notion_token"
  HUGGINGFACE_API_KEY: "your_hf_key"
  HUGGINGFACE_MODEL: "facebook/bart-large-cnn"
```

---

## Using Individual Agents

### GitHub Agent

```bash
# Basic usage
python backend/agents/github_agent.py --repo owner/repo --hours 24

# With branch specification
python backend/agents/github_agent.py --repo owner/repo --branch develop --hours 48

# Test mode
python backend/agents/github_agent.py --test
```

**Output**: JSON with commits, PRs, issues, AI summary, and urgent items

### Slack Agent

```bash
# Basic usage
python backend/agents/slack_agent.py --hours 24

# With custom repo for storage
python backend/agents/slack_agent.py --repo owner/repo --hours 12

# Test mode
python backend/agents/slack_agent.py --test
```

**Output**: JSON with messages, AI summary, action items, and key discussions

### Notion Agent

```bash
# Basic usage
python backend/agents/notion_agent.py --hours 24

# Test mode
python backend/agents/notion_agent.py --test
```

**Output**: JSON with page updates, AI summary, and priority changes

---

## Using the AI Summarizer

The AI Summarizer aggregates data from all agents and generates a unified summary.

### Command Line Usage

```bash
# Basic usage
python backend/agents/ai_summarizer.py --hours 24

# With specific repo and branch
python backend/agents/ai_summarizer.py --repo owner/repo --branch main --hours 48

# Save to file
python backend/agents/ai_summarizer.py --hours 24 --output summary.json

# Test mode
python backend/agents/ai_summarizer.py --test-mode
```

### Python API Usage

```python
from agents.ai_summarizer import AISummarizer

# Initialize
summarizer = AISummarizer(repo_name="owner/repo", branch="main")

# Run pipeline
result = summarizer.run(hours=24)

# Access results
if result['success']:
    unified_summary = result['unified_summary']
    print(unified_summary['unified_summary']['summary'])
    
    # Access individual agent data
    github_data = result['agent_data']['github']
    slack_data = result['agent_data']['slack']
    notion_data = result['agent_data']['notion']
```

---

## Using the Decision Engine

The Decision Engine analyzes summarized data and provides recommendations.

### Command Line Usage

```bash
# Run decision engine on summarizer output
python backend/agents/decision_engine.py --input summary.json --output decisions.json

# With custom confidence threshold
python backend/agents/decision_engine.py --input summary.json --threshold 0.7
```

### Python API Usage

```python
from agents.decision_engine import DecisionEngine
from agents.ai_summarizer import AISummarizer

# Get summarizer results
summarizer = AISummarizer()
summarizer_result = summarizer.run(hours=24)

# Run decision engine
engine = DecisionEngine()
decisions = engine.make_decisions(summarizer_result)

# Access recommendations
if decisions['success']:
    for rec in decisions['high_confidence_recommendations']:
        print(f"{rec['title']} (Confidence: {rec['confidence']:.0%})")
        print(f"  {rec['description']}")
        for action in rec['action_items']:
            print(f"  - {action}")
```

---

## Kestra Integration

### Starting Kestra

```bash
cd kestra
docker-compose up -d
```

Access Kestra UI at `http://localhost:8080`

### Running the Flow

#### Via UI

1. Navigate to **Flows** → **contextkeeper** → **ai-summarizer**
2. Click **Execute**
3. Set `hours` input (default: 24)
4. Click **Execute**

#### Via CLI

```bash
# Execute flow
docker-compose exec kestra kestra flow trigger contextkeeper ai-summarizer

# With custom hours
docker-compose exec kestra kestra flow trigger contextkeeper ai-summarizer --hours 48
```

### Flow Schedule

The flow runs automatically every day at 9 AM (configured in `triggers` section).

To change the schedule, edit `kestra/flows/ai-summarizer.yaml`:

```yaml
triggers:
  - id: daily_schedule
    type: io.kestra.core.models.triggers.types.Schedule
    cron: "0 9 * * *"  # Change this cron expression
```

---

## Extending the System

### Creating a Custom Agent

1. **Create a new agent file** (e.g., `backend/agents/jira_agent.py`):

```python
from agents.base_agent import BaseAgent

class JiraAgent(BaseAgent):
    def __init__(self):
        super().__init__("jira")
        # Initialize Jira client
    
    def collect_data(self, hours=24, **kwargs):
        # Collect Jira issues
        return {"issues": [...]}
    
    def format_data_for_summary(self, data):
        # Format for AI summarization
        return "Jira Issues:\n..."
```

2. **Update `ai_summarizer.py`** to include your agent:

```python
from agents.jira_agent import JiraAgent

class AISummarizer:
    def __init__(self, ...):
        # ... existing code ...
        self.jira_agent = JiraAgent()
```

3. **Update Kestra flow** to include necessary environment variables

### Customizing Hugging Face Models

To use a different model, update the environment variable:

```bash
HUGGINGFACE_MODEL=google/flan-t5-large
```

**Recommended Models**:
- `facebook/bart-large-cnn` - Best for summarization (default)
- `google/flan-t5-large` - Better for instruction-following
- `philschmid/bart-large-cnn-samsum` - Optimized for conversations
- `facebook/mbart-large-50` - Multilingual support

---

## API Reference

### BaseAgent

```python
class BaseAgent(agent_name: str)
```

**Methods**:
- `collect_data(**kwargs) -> Dict[str, Any]` - Abstract method to collect data
- `format_data_for_summary(data) -> str` - Abstract method to format data
- `summarize_text(text, max_length=500, temperature=0.7) -> Dict` - Summarize text using HF
- `process(**kwargs) -> Dict` - Main pipeline: collect → format → summarize

### GitHubAgent

```python
class GitHubAgent(repo_name: str, branch: str = "main")
```

**Methods**:
- `collect_data(hours=24) -> Dict` - Collect GitHub activity
- `identify_urgent_items(data) -> List[Dict]` - Find urgent issues/PRs

### SlackAgent

```python
class SlackAgent(repo_name: str = None)
```

**Methods**:
- `collect_data(hours=24) -> Dict` - Collect Slack messages
- `extract_action_items(data) -> List[Dict]` - Extract action items
- `identify_key_discussions(data) -> List[Dict]` - Find important discussions

### NotionAgent

```python
class NotionAgent()
```

**Methods**:
- `collect_data(hours=24) -> Dict` - Collect Notion page updates
- `identify_priority_changes(data) -> List[Dict]` - Find priority changes
- `categorize_pages(data) -> Dict[str, List]` - Categorize pages by type

### AISummarizer

```python
class AISummarizer(repo_name: str, branch: str = "main")
```

**Methods**:
- `collect_all_data(hours=24) -> Dict` - Collect from all agents
- `generate_unified_summary(all_data) -> Dict` - Generate final summary
- `run(hours=24) -> Dict` - Complete pipeline

### DecisionEngine

```python
class DecisionEngine()
```

**Methods**:
- `analyze_urgency(agent_data) -> Dict` - Analyze urgency levels
- `identify_patterns(agent_data) -> Dict` - Find patterns and trends
- `generate_recommendations(agent_data, urgency, patterns) -> List[Dict]` - Generate recommendations
- `make_decisions(summarizer_result) -> Dict` - Complete decision pipeline

---

## Troubleshooting

### Common Issues

#### 1. "HUGGINGFACE_API_KEY not found"

**Solution**: Add your Hugging Face API key to `.env`:
```bash
HUGGINGFACE_API_KEY=hf_your_key_here
```

Get a free key at: https://huggingface.co/settings/tokens

#### 2. "Model loading" timeout

**Cause**: Hugging Face models need to load on first request (can take 20-30 seconds)

**Solution**: Wait for the model to load. Subsequent requests will be faster.

#### 3. Slack "channel not found"

**Cause**: Bot not invited to channel or incorrect channel name

**Solution**:
1. Invite bot to channel: `/invite @your_bot_name`
2. Verify channel name in `SLACK_CHANNELS` (without #)
3. Ensure bot has `channels:read` and `groups:read` scopes

#### 4. Kestra "Unable to find backend scripts"

**Cause**: Backend volume not mounted

**Solution**: Verify `docker-compose.yml` has:
```yaml
volumes:
  - ../backend:/app/backend
```

Then restart: `docker-compose down && docker-compose up -d`

#### 5. "Rate limit exceeded" from Hugging Face

**Cause**: Free tier rate limits

**Solutions**:
- Upgrade to Hugging Face Pro ($9/month)
- Use local model inference (requires more resources)
- Reduce frequency of requests

### Debug Mode

Enable verbose logging:

```bash
export DEBUG=1
python backend/agents/ai_summarizer.py --hours 24
```

### Viewing Kestra Logs

```bash
# View all logs
docker-compose logs -f kestra

# View specific execution
# (Check Kestra UI for execution ID)
docker-compose logs kestra | grep <execution_id>
```

---

## Best Practices

1. **API Token Security**: Never commit tokens to git. Use `.env` files and `.gitignore`
2. **Rate Limiting**: Respect API rate limits. Use reasonable `hours` values (24-48)
3. **Error Handling**: All agents have built-in retry logic. Check logs for persistent errors
4. **Model Selection**: Choose models based on your needs:
   - Summarization: `facebook/bart-large-cnn`
   - Instruction-following: `google/flan-t5-large`
   - Conversations: `philschmid/bart-large-cnn-samsum`
5. **Confidence Threshold**: Adjust `DECISION_CONFIDENCE_THRESHOLD` based on your risk tolerance (0.5-0.8 recommended)

---

## Support

For issues or questions:
1. Check this guide and troubleshooting section
2. Review Kestra logs for execution errors
3. Test individual agents before running full pipeline
4. Verify all API tokens are valid and have required permissions
