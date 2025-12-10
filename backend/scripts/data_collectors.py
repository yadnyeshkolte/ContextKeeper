import os
import requests
import chromadb
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class DataCollector:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_or_create_collection("context")
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.github_repo = os.getenv("GITHUB_REPO")

    def collect_github(self):
        """Mock Github Collection"""
        # In real usage: use requests to fetch commits/PRs from GitHub API
        mock_data = [
            "Commit: Added Redis caching for sessions",
            "PR #34: Switch to Redis from Postgres"
        ]
        
        # Store in Chroma
        self.collection.add(
            documents=mock_data,
            ids=[f"gh_{datetime.now().timestamp()}_{i}" for i in range(len(mock_data))],
            metadatas=[{"source": "github", "type": "commit"}] * len(mock_data)
        )
        print("GitHub data collected.")

    def collect_slack(self):
        """Mock Slack Collection"""
        mock_data = [
            "Slack: We need better session performance",
            "Slack: Lets use Redis"
        ]
        self.collection.add(
            documents=mock_data,
            ids=[f"sl_{datetime.now().timestamp()}_{i}" for i in range(len(mock_data))],
            metadatas=[{"source": "slack", "type": "message"}] * len(mock_data)
        )
        print("Slack data collected.")

if __name__ == "__main__":
    import sys
    collector = DataCollector()
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "github":
            collector.collect_github()
        elif cmd == "slack":
            collector.collect_slack()
