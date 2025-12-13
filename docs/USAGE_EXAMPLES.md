# AI Agent System - Usage Examples

## Quick Start Examples

### Example 1: Running Individual Agents

#### GitHub Agent

```bash
# Collect last 24 hours of GitHub activity
cd backend
python agents/github_agent.py --repo yadnyeshkolte/ContextKeeper --hours 24
```

**Sample Output**:
```json
{
  "agent": "github",
  "success": true,
  "raw_data": {
    "source": "github",
    "repo": "yadnyeshkolte/ContextKeeper",
    "commits": [...],
    "pull_requests": [...],
    "issues": [...]
  },
  "ai_summary": {
    "summary": "Recent activity shows 5 commits focused on AI agent implementation...",
    "model": "facebook/bart-large-cnn",
    "success": true
  },
  "urgent_items": [
    {
      "type": "issue",
      "number": 42,
      "title": "Critical bug in authentication",
      "priority": "high",
      "reason": "Contains urgent/critical label"
    }
  ]
}
```

#### Slack Agent

```bash
# Collect last 12 hours of Slack messages
python agents/slack_agent.py --hours 12
```

**Sample Output**:
```json
{
  "agent": "slack",
  "success": true,
  "raw_data": {
    "source": "slack",
    "messages": [...]
  },
  "ai_summary": {
    "summary": "Team discussed deployment strategy with 3 action items identified...",
    "success": true
  },
  "action_items": [
    {
      "channel": "general",
      "author": "john_doe",
      "text": "TODO: Update deployment docs by Friday",
      "type": "potential_action_item"
    }
  ],
  "key_discussions": [
    {
      "channel": "development",
      "topic": "Should we migrate to microservices?",
      "reply_count": 15,
      "participants": ["alice", "bob", "charlie"]
    }
  ]
}
```

#### Notion Agent

```bash
# Collect last 24 hours of Notion updates
python agents/notion_agent.py --hours 24
```

---

### Example 2: Running the AI Summarizer

```bash
# Run complete AI summarization pipeline
python agents/ai_summarizer.py --repo yadnyeshkolte/ContextKeeper --hours 24 --output daily_summary.json
```

**Sample Output** (`daily_summary.json`):
```json
{
  "success": true,
  "unified_summary": {
    "unified_summary": {
      "summary": "The team made significant progress on AI agent implementation with 8 commits. Key discussion in #development about microservices migration. Roadmap updated with Q1 priorities.",
      "model": "facebook/bart-large-cnn",
      "success": true
    },
    "aggregated_text": "=== DAILY PROJECT BRIEFING ===\n..."
  },
  "agent_data": {
    "github": {...},
    "slack": {...},
    "notion": {...}
  },
  "metadata": {
    "repo": "yadnyeshkolte/ContextKeeper",
    "branch": "main",
    "period_hours": 24,
    "agents_active": {
      "github": true,
      "slack": true,
      "notion": true
    }
  }
}
```

---

### Example 3: Running the Decision Engine

```bash
# Run decision engine on summarizer output
python agents/decision_engine.py --input daily_summary.json --output decisions.json
```

**Sample Output** (`decisions.json`):
```json
{
  "success": true,
  "urgency_analysis": {
    "urgency_score": 0.65,
    "urgency_level": "high",
    "urgent_items_count": 3,
    "recommendation": "⚡ HIGH PRIORITY: Several items require prompt attention. Review and address within 24 hours."
  },
  "patterns": {
    "active_contributors": [
      {"name": "alice", "commits": 5},
      {"name": "bob", "commits": 3}
    ],
    "hot_topics": [
      {"topic": "microservices", "mentions": 12},
      {"topic": "deployment", "mentions": 8}
    ]
  },
  "high_confidence_recommendations": [
    {
      "title": "Address Urgent Items",
      "description": "⚡ HIGH PRIORITY: Several items require prompt attention...",
      "priority": "high",
      "confidence": 0.85,
      "action_items": [
        "Review github item: Critical bug in authentication",
        "Review slack item: TODO: Update deployment docs by Friday"
      ]
    },
    {
      "title": "Follow Up on Key Discussions",
      "description": "3 active discussions detected. Ensure decisions are documented.",
      "priority": "medium",
      "confidence": 0.65,
      "action_items": [
        "Document outcomes of #development discussion",
        "Document outcomes of #general discussion"
      ]
    }
  ]
}
```

---

### Example 4: Complete Pipeline (Python Script)

Create `run_daily_briefing.py`:

```python
#!/usr/bin/env python3
"""
Daily Briefing Generator
Runs complete AI agent pipeline and generates a report
"""

import json
import sys
from datetime import datetime
from agents.ai_summarizer import AISummarizer
from agents.decision_engine import DecisionEngine

def main():
    print("=" * 80)
    print("DAILY BRIEFING GENERATOR")
    print("=" * 80)
    print()
    
    # Step 1: Run AI Summarizer
    print("Step 1: Collecting and summarizing data from all sources...")
    summarizer = AISummarizer(
        repo_name="yadnyeshkolte/ContextKeeper",
        branch="main"
    )
    
    summarizer_result = summarizer.run(hours=24)
    
    if not summarizer_result.get('success'):
        print(f"❌ Summarizer failed: {summarizer_result.get('error')}")
        sys.exit(1)
    
    print("✅ Data collected and summarized")
    print()
    
    # Step 2: Run Decision Engine
    print("Step 2: Analyzing data and generating recommendations...")
    engine = DecisionEngine()
    decisions = engine.make_decisions(summarizer_result)
    
    if not decisions.get('success'):
        print(f"❌ Decision engine failed: {decisions.get('error')}")
        sys.exit(1)
    
    print("✅ Analysis complete")
    print()
    
    # Step 3: Generate Human-Readable Report
    print("=" * 80)
    print("DAILY BRIEFING")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()
    
    # Executive Summary
    unified = summarizer_result['unified_summary']
    if unified.get('unified_summary', {}).get('success'):
        print("EXECUTIVE SUMMARY")
        print("-" * 80)
        print(unified['unified_summary']['summary'])
        print()
    
    # Urgency Analysis
    urgency = decisions['urgency_analysis']
    print("URGENCY ANALYSIS")
    print("-" * 80)
    print(f"Level: {urgency['urgency_level'].upper()}")
    print(f"Score: {urgency['urgency_score']}/1.0")
    print(f"Urgent Items: {urgency['urgent_items_count']}")
    print(f"\n{urgency['recommendation']}")
    print()
    
    # Recommendations
    high_conf = decisions['high_confidence_recommendations']
    if high_conf:
        print("RECOMMENDED ACTIONS (High Confidence)")
        print("-" * 80)
        for i, rec in enumerate(high_conf, 1):
            print(f"\n{i}. {rec['title']}")
            print(f"   Priority: {rec['priority'].upper()} | Confidence: {rec['confidence']:.0%}")
            print(f"   {rec['description']}")
            if rec.get('action_items'):
                print("   Action Items:")
                for action in rec['action_items'][:3]:
                    print(f"   • {action}")
        print()
    
    # Top Contributors
    patterns = decisions['patterns']
    if patterns.get('active_contributors'):
        print("TOP CONTRIBUTORS")
        print("-" * 80)
        for contrib in patterns['active_contributors'][:5]:
            print(f"  • {contrib['name']}: {contrib['commits']} commits")
        print()
    
    # Save detailed results
    with open('daily_briefing_full.json', 'w') as f:
        json.dump({
            'summarizer': summarizer_result,
            'decisions': decisions
        }, f, indent=2)
    
    print("=" * 80)
    print("Full results saved to: daily_briefing_full.json")
    print("=" * 80)

if __name__ == "__main__":
    main()
```

**Run it**:
```bash
python run_daily_briefing.py
```

---

### Example 5: Using Kestra

#### Execute via Kestra UI

1. Start Kestra:
   ```bash
   cd kestra
   docker-compose up -d
   ```

2. Open browser: `http://localhost:8080`

3. Navigate to: **Flows** → **contextkeeper** → **ai-summarizer**

4. Click **Execute** button

5. Set inputs:
   - `hours`: 24

6. Click **Execute**

7. View execution logs and results

#### Execute via Kestra CLI

```bash
# Trigger flow with default inputs
docker-compose exec kestra kestra flow trigger contextkeeper ai-summarizer

# Trigger with custom hours
docker-compose exec kestra kestra flow trigger contextkeeper ai-summarizer --hours 48
```

---

### Example 6: Customizing Hugging Face Models

#### Using a Different Model

Update `.env`:
```bash
HUGGINGFACE_MODEL=google/flan-t5-large
```

#### Comparing Models

Create `compare_models.py`:

```python
import os
from agents.base_agent import BaseAgent

models = [
    "facebook/bart-large-cnn",
    "google/flan-t5-large",
    "philschmid/bart-large-cnn-samsum"
]

sample_text = """
GitHub: 5 commits pushed to main branch. PR #42 merged.
Slack: Team discussed deployment strategy. Action item: update docs.
Notion: Q1 roadmap updated with new priorities.
"""

for model in models:
    os.environ['HUGGINGFACE_MODEL'] = model
    agent = BaseAgent("test")
    
    result = agent.summarize_text(sample_text, max_length=100)
    
    print(f"\nModel: {model}")
    print(f"Summary: {result.get('summary', 'Error')}")
    print("-" * 80)
```

---

### Example 7: Scheduling with Cron (Alternative to Kestra)

Create `cron_daily_briefing.sh`:

```bash
#!/bin/bash
# Daily briefing cron job

cd /path/to/ContextKeeper/backend

# Activate virtual environment (if using)
source venv/bin/activate

# Run AI summarizer
python agents/ai_summarizer.py \
  --repo yadnyeshkolte/ContextKeeper \
  --hours 24 \
  --output /tmp/daily_summary.json

# Run decision engine
python agents/decision_engine.py \
  --input /tmp/daily_summary.json \
  --output /tmp/decisions.json

# Send email (optional)
# python send_email.py --summary /tmp/daily_summary.json --decisions /tmp/decisions.json

echo "Daily briefing completed at $(date)"
```

**Add to crontab**:
```bash
# Run every day at 9 AM
0 9 * * * /path/to/cron_daily_briefing.sh >> /var/log/daily_briefing.log 2>&1
```

---

### Example 8: Integration with External Systems

#### Send Results to Slack

```python
from slack_sdk import WebClient
import json

# Load results
with open('daily_summary.json', 'r') as f:
    summary = json.load(f)

with open('decisions.json', 'r') as f:
    decisions = json.load(f)

# Send to Slack
client = WebClient(token=os.getenv('SLACK_TOKEN'))

message = f"""
*Daily Briefing* 📊

*Urgency Level*: {decisions['urgency_analysis']['urgency_level'].upper()}

*Top Recommendations*:
"""

for rec in decisions['high_confidence_recommendations'][:3]:
    message += f"\n• {rec['title']} (Confidence: {rec['confidence']:.0%})"

client.chat_postMessage(
    channel='#daily-briefings',
    text=message
)
```

#### Save to Database

```python
from pymongo import MongoClient
from datetime import datetime

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['contextkeeper']

# Save daily briefing
db.daily_briefings.insert_one({
    'date': datetime.now(),
    'summary': summary,
    'decisions': decisions,
    'urgency_level': decisions['urgency_analysis']['urgency_level']
})

print("Briefing saved to database")
```

---

## Testing Examples

### Test Individual Agent

```bash
# Test GitHub agent with mock data
python -c "
from agents.github_agent import GitHubAgent
agent = GitHubAgent(repo_name='yadnyeshkolte/ContextKeeper')
# Test summarization
test_text = 'Commit: Fixed bug in authentication. Author: alice'
result = agent.summarize_text(test_text)
print(result)
"
```

### Test AI Summarizer

```bash
# Run in test mode (uses minimal data)
python agents/ai_summarizer.py --test-mode --hours 1
```

### Test Decision Engine

```bash
# Create mock summarizer output
echo '{
  "success": true,
  "agent_data": {
    "github": {
      "success": true,
      "urgent_items": [
        {"type": "issue", "number": 1, "title": "Test", "priority": "high"}
      ]
    }
  }
}' > test_summary.json

# Run decision engine
python agents/decision_engine.py --input test_summary.json
```

---

## Advanced Examples

### Custom Agent with Jira Integration

```python
from agents.base_agent import BaseAgent
from jira import JIRA

class JiraAgent(BaseAgent):
    def __init__(self):
        super().__init__("jira")
        self.jira = JIRA(
            server=os.getenv('JIRA_SERVER'),
            basic_auth=(
                os.getenv('JIRA_EMAIL'),
                os.getenv('JIRA_API_TOKEN')
            )
        )
    
    def collect_data(self, hours=24, **kwargs):
        # Collect recent issues
        jql = f'updated >= -{hours}h ORDER BY updated DESC'
        issues = self.jira.search_issues(jql, maxResults=50)
        
        return {
            'source': 'jira',
            'issues': [
                {
                    'key': issue.key,
                    'summary': issue.fields.summary,
                    'status': issue.fields.status.name,
                    'assignee': issue.fields.assignee.displayName if issue.fields.assignee else 'Unassigned'
                }
                for issue in issues
            ]
        }
    
    def format_data_for_summary(self, data):
        lines = [f"Jira Issues ({len(data['issues'])}):\n"]
        for issue in data['issues'][:10]:
            lines.append(f"- [{issue['key']}] {issue['summary']} ({issue['status']})")
        return '\n'.join(lines)

# Use it
jira_agent = JiraAgent()
result = jira_agent.process(hours=24)
print(result['ai_summary']['summary'])
```

---

## Tips & Best Practices

1. **Start Small**: Test with `--hours 1` before running full 24-hour collections
2. **Monitor Costs**: Hugging Face free tier has limits. Monitor usage at https://huggingface.co/settings/billing
3. **Cache Results**: Save JSON outputs to avoid re-running expensive operations
4. **Incremental Updates**: Run hourly with small windows instead of daily with large windows
5. **Error Handling**: Always check `success` field in results before processing
6. **Rate Limits**: Respect API rate limits. Add delays between requests if needed

---

For more information, see the [Developer Guide](DEVELOPER_GUIDE.md).
