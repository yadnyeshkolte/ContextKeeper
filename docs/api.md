# API Documentation

Base URL: `http://localhost:3000/api`

## Endpoints

### Query System

**POST** `/query`

Submit a natural language question to the context engine.

**Body:**
```json
{
  "question": "Why did we switch to TypeScript?",
  "repository": "owner/repo"
}
```

**Response:**
```json
{
  "answer": "We switched to TypeScript in PR #123 to improve type safety...",
  "sources": [...]
}
```

### Data Collection

**POST** `/collect/github`

Trigger on-demand GitHub data collection.

**Body:**
```json
{
  "repository": "owner/repo"
}
```

**POST** `/collect/slack`

Trigger on-demand Slack data collection.

### Knowledge Graph

**GET** `/knowledge-graph`

Retrieve the nodes and edges for the knowledge graph visualization.

**Query Params:**
- `repository`: The repository identifier.

### System Status

**GET** `/status`

Check the health and status of the system components.
