# Development Guide

## Environment Setup

Please follow the [Prerequisites](../README.md#prerequisites) and [Installation](../README.md#installation) sections in the main README to get your local environment running.

## Directory Structure

- `/backend`: Node.js API server and Python scripts.
- `/frontend`: React application.
- `/kestra`: Docker Compose for orchestration.
- `/scripts`: Utility scripts.
- `/docs`: Documentation.

## Running Tests

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## Adding New Collectors

To add a new data source (e.g., Notion):
1. Create a new collector script in `backend/scripts/`.
2. Define a data schema in MongoDB.
3. Create a Kestra flow in `kestra/` to schedule the collection.
4. Update `rag_engine.py` to include the new data source in context retrieval.

## Debugging

- **Backend Logs**: Check the terminal running `npm start`.
- **Kestra**: Check Kestra UI at `http://localhost:8080`.
- **Python**: Run python scripts manually to test logic: `python backend/scripts/rag_engine.py`.
