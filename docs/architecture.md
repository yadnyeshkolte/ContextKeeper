# System Architecture

## Overview

ContextKeeper is designed as a modular, local-first system that orchestrates AI agents to collect, process, and retrieve knowledge from various development sources.

## Components

### 1. Orchestration (Kestra)
- **Role**: Manages workflows for data collection, processing, and maintenance.
- **Tech**: Kestra running in Docker.
- **Key Flows**:
  - `github-collector`: Scheduled fetching of issues and PRs.
  - `slack-collector`: Ingestion of channel messages.
  - `rag-indexing`: Periodic updating of vector embeddings.

### 2. Backend API
- **Role**: Serves as the central entry point for the frontend and external integrations.
- **Tech**: Node.js, Express.
- **Responsibilities**:
  - API endpoint management.
  - Invoking Python scripts for RAG and Graph operations.
  - managing MongoDB connections.

### 3. AI Engine
- **Role**: Performs the heavy lifting of natural language processing.
- **Tech**: Python, Hugging Face Transformers, ChromaDB, LangChain (implied).
- **Key Modules**:
  - `rag_engine.py`: Retrieval Augmented Generation logic.
  - `knowledge_graph_builder.py`: Extracts entities and relationships.

### 4. Database Layer
- **MongoDB**: Stores raw data (issues, messages), user metadata, and system state.
- **ChromaDB**: (Vector Database) Stores embeddings of the text data for semantic search. A separate instance is created per repository to ensure isolation.

### 5. Frontend
- **Role**: User interface for querying the system and visualizing the knowledge graph.
- **Tech**: React, Vite, React Flow (for graphs).

## Data Flow

1. **Ingestion**: Kestra triggers collectors -> Data saved to MongoDB.
2. **Indexing**: Processors read from MongoDB -> Generate Embeddings -> Save to ChromaDB.
3. **Querying**: User asks question -> Backend calls `rag_engine.py` -> Query ChromaDB -> Generate Answer -> Return to UI.
