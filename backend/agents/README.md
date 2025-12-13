# AI Agent System

A comprehensive AI-powered system for collecting, summarizing, and analyzing data from GitHub, Slack, and Notion using Hugging Face models.

## Features

- **🤖 Specialized Agents**: Dedicated agents for GitHub, Slack, and Notion
- **🧠 AI Summarization**: Powered by Hugging Face models (BART, T5, etc.)
- **📊 Decision Engine**: Intelligent recommendations with confidence scores
- **⚙️ Kestra Orchestration**: Automated daily briefings
- **🔄 Retry Logic**: Built-in error handling and exponential backoff
- **📈 Pattern Recognition**: Identifies trends and active contributors

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create `backend/.env`:

```bash
# API Tokens
GITHUB_TOKEN=ghp_your_token
GITHUB_REPO=owner/repository
SLACK_TOKEN=xoxb_your_token
SLACK_CHANNELS=general,development
NOTION_TOKEN=secret_your_token
HUGGINGFACE_API_KEY=hf_your_key

# Optional Configuration
HUGGINGFACE_MODEL=facebook/bart-large-cnn
AGENT_MAX_RETRIES=3
DECISION_CONFIDENCE_THRESHOLD=0.6
```

### 3. Run AI Summarizer

```bash
# Collect and summarize last 24 hours
python agents/ai_summarizer.py --hours 24

# Save to file
python agents/ai_summarizer.py --hours 24 --output summary.json
```

### 4. Run Decision Engine

```bash
python agents/decision_engine.py --input summary.json --output decisions.json
```

### 5. Start Kestra (Optional)

```bash
cd kestra
docker-compose up -d
```

Access UI at `http://localhost:8080`

## Architecture

```
┌─────────────────┐
│  GitHub Agent   │──┐
└─────────────────┘  │
                     │
┌─────────────────┐  │    ┌──────────────────┐
│  Slack Agent    │──┼───▶│  AI Summarizer   │
└─────────────────┘  │    └──────────────────┘
                     │             │
┌─────────────────┐  │             ▼
│  Notion Agent   │──┘    ┌──────────────────┐
└─────────────────┘       │ Decision Engine  │
                          └──────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Final Report    │
                          └──────────────────┘
```

## Components

### Base Agent (`base_agent.py`)
- Abstract base class for all agents
- Hugging Face API integration
- Retry logic and error handling
- Common summarization methods

### GitHub Agent (`github_agent.py`)
- Collects commits, PRs, and issues
- Identifies urgent items
- Detects stale PRs
- AI-powered summarization

### Slack Agent (`slack_agent.py`)
- Collects channel messages and threads
- Extracts action items
- Identifies key discussions
- Analyzes collaboration patterns

### Notion Agent (`notion_agent.py`)
- Collects page updates
- Tracks priority changes
- Categorizes pages by type
- Detects roadmap modifications

### AI Summarizer (`ai_summarizer.py`)
- Aggregates data from all agents
- Generates unified summaries
- Coordinates multi-agent pipeline
- Produces comprehensive briefings

### Decision Engine (`decision_engine.py`)
- Analyzes urgency levels
- Identifies patterns and trends
- Generates recommendations
- Provides confidence scores

## Usage Examples

### Individual Agents

```bash
# GitHub
python agents/github_agent.py --repo owner/repo --hours 24

# Slack
python agents/slack_agent.py --hours 12

# Notion
python agents/notion_agent.py --hours 24
```

### Complete Pipeline

```python
from agents.ai_summarizer import AISummarizer
from agents.decision_engine import DecisionEngine

# Run summarizer
summarizer = AISummarizer(repo_name="owner/repo")
result = summarizer.run(hours=24)

# Run decision engine
engine = DecisionEngine()
decisions = engine.make_decisions(result)

# Access recommendations
for rec in decisions['high_confidence_recommendations']:
    print(f"{rec['title']}: {rec['description']}")
```

### Kestra Flow

```bash
# Execute via CLI
docker-compose exec kestra kestra flow trigger contextkeeper ai-summarizer --hours 24

# Or use the UI at http://localhost:8080
```

## Configuration

### Hugging Face Models

Supported models:
- `facebook/bart-large-cnn` (default) - Best for summarization
- `google/flan-t5-large` - Better for instruction-following
- `philschmid/bart-large-cnn-samsum` - Optimized for conversations
- `facebook/mbart-large-50` - Multilingual support

Change model via environment variable:
```bash
HUGGINGFACE_MODEL=google/flan-t5-large
```

### Decision Confidence Threshold

Adjust recommendation confidence threshold (0.0-1.0):
```bash
DECISION_CONFIDENCE_THRESHOLD=0.7  # Higher = more conservative
```

## API Reference

See [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for complete API documentation.

## Documentation

- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Complete reference guide
- **[Usage Examples](docs/USAGE_EXAMPLES.md)** - Practical examples and recipes

## Kestra Integration

The system includes a complete Kestra flow (`kestra/flows/ai-summarizer.yaml`) that:

1. Runs AI Summarizer (collects from all agents)
2. Runs Decision Engine (analyzes and recommends)
3. Generates Final Report (human-readable briefing)
4. Logs Summary (displays in Kestra UI)

**Schedule**: Daily at 9 AM (configurable)

## Troubleshooting

### Common Issues

**"HUGGINGFACE_API_KEY not found"**
- Add your API key to `.env`
- Get free key at: https://huggingface.co/settings/tokens

**"Model loading" timeout**
- Wait 20-30 seconds for model to load on first request
- Subsequent requests will be faster

**Slack "channel not found"**
- Invite bot to channel: `/invite @your_bot`
- Verify channel name (without #)
- Check bot has required scopes

**Kestra "backend scripts not found"**
- Verify `docker-compose.yml` has volume mount: `../backend:/app/backend`
- Restart: `docker-compose down && docker-compose up -d`

See [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md#troubleshooting) for more.

## Requirements

- Python 3.9+
- Docker & Docker Compose (for Kestra)
- API tokens: GitHub, Slack, Notion, Hugging Face

## License

See [LICENSE](../LICENSE) file.

## Support

For issues or questions:
1. Check [Developer Guide](docs/DEVELOPER_GUIDE.md)
2. Review [Usage Examples](docs/USAGE_EXAMPLES.md)
3. Check Kestra logs: `docker-compose logs -f kestra`
4. Test individual agents before running full pipeline
