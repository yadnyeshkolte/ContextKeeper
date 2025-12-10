import os
import sys
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from dotenv import load_dotenv
import chromadb
from sentence_transformers import SentenceTransformer
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

load_dotenv()

class SlackCollector:
    """Collects context from Slack channels and stores in ChromaDB"""
    
    def __init__(self, repo_name: str = None):
        self.slack_token = os.getenv("SLACK_TOKEN")
        self.slack_channels = os.getenv("SLACK_CHANNELS", "").split(",")
        
        if not self.slack_token:
            raise ValueError("SLACK_TOKEN not found in environment variables")
        if not self.slack_channels or self.slack_channels == ['']:
            raise ValueError("SLACK_CHANNELS not found in environment variables")
        
        # Initialize Slack client
        self.client = WebClient(token=self.slack_token)
        
        # Get repository name for ChromaDB path and sanitize it
        # ChromaDB collection names must match [a-zA-Z0-9._-] and cannot contain '/'
        raw_repo_name = repo_name or os.getenv("GITHUB_REPO", "default")
        self.repo_name = raw_repo_name.replace("/", "_")
        
        # Initialize ChromaDB with repository-specific path
        chroma_path = f"./chroma_db_{self.repo_name}"
        print(f"Using ChromaDB path: {chroma_path}", file=sys.stderr)
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(f"context_{self.repo_name}")
        
        # Initialize embedding model
        print("Loading embedding model...", file=sys.stderr)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Embedding model loaded!", file=sys.stderr)
    
    def get_channel_id(self, channel_name: str) -> str:
        """Get channel ID from channel name"""
        try:
            # Remove # if present
            channel_name = channel_name.strip().lstrip('#')
            
            # List all channels
            result = self.client.conversations_list(types="public_channel,private_channel")
            
            for channel in result["channels"]:
                if channel["name"] == channel_name:
                    return channel["id"]
            
            print(f"Warning: Channel '{channel_name}' not found", file=sys.stderr)
            return None
        except SlackApiError as e:
            print(f"Error getting channel ID: {e.response['error']}", file=sys.stderr)
            return None
    
    def collect_channel_messages(self, channel_name: str, days_back: int = 30) -> List[Dict[str, Any]]:
        """Fetch messages from a Slack channel"""
        print(f"Fetching messages from #{channel_name}...", file=sys.stderr)
        messages_data = []
        
        try:
            channel_id = self.get_channel_id(channel_name)
            if not channel_id:
                return messages_data
            
            # Calculate oldest timestamp (30 days back by default)
            oldest = (datetime.now() - timedelta(days=days_back)).timestamp()
            
            # Fetch messages
            result = self.client.conversations_history(
                channel=channel_id,
                oldest=str(oldest),
                limit=1000
            )
            
            messages = result["messages"]
            
            # Get user info cache
            user_cache = {}
            
            for message in messages:
                # Skip bot messages and system messages
                if message.get("subtype") in ["bot_message", "channel_join", "channel_leave"]:
                    continue
                
                user_id = message.get("user", "Unknown")
                
                # Get user name
                if user_id not in user_cache:
                    try:
                        user_info = self.client.users_info(user=user_id)
                        user_cache[user_id] = user_info["user"]["real_name"] or user_info["user"]["name"]
                    except:
                        user_cache[user_id] = user_id
                
                user_name = user_cache[user_id]
                
                # Get thread replies if this is a parent message
                thread_replies = []
                if message.get("thread_ts") and message.get("reply_count", 0) > 0:
                    try:
                        thread_result = self.client.conversations_replies(
                            channel=channel_id,
                            ts=message["thread_ts"],
                            limit=100
                        )
                        
                        for reply in thread_result["messages"][1:]:  # Skip first message (parent)
                            reply_user_id = reply.get("user", "Unknown")
                            if reply_user_id not in user_cache:
                                try:
                                    user_info = self.client.users_info(user=reply_user_id)
                                    user_cache[reply_user_id] = user_info["user"]["real_name"] or user_info["user"]["name"]
                                except:
                                    user_cache[reply_user_id] = reply_user_id
                            
                            thread_replies.append({
                                "author": user_cache[reply_user_id],
                                "text": reply.get("text", ""),
                                "timestamp": reply.get("ts", "")
                            })
                    except SlackApiError as e:
                        print(f"Error fetching thread replies: {e}", file=sys.stderr)
                
                message_data = {
                    "type": "slack_message",
                    "channel": channel_name,
                    "text": message.get("text", ""),
                    "author": user_name,
                    "timestamp": message.get("ts", ""),
                    "date": datetime.fromtimestamp(float(message.get("ts", "0"))).isoformat(),
                    "thread_replies": thread_replies,
                    "reactions": message.get("reactions", [])
                }
                
                messages_data.append(message_data)
            
            print(f"Fetched {len(messages_data)} messages from #{channel_name}", file=sys.stderr)
        except SlackApiError as e:
            print(f"Error fetching messages from #{channel_name}: {e.response['error']}", file=sys.stderr)
        except Exception as e:
            print(f"Unexpected error fetching messages: {e}", file=sys.stderr)
        
        return messages_data
    
    def store_in_chromadb(self, data_items: List[Dict[str, Any]]):
        """Store collected Slack data in ChromaDB with embeddings"""
        if not data_items:
            print("No data to store", file=sys.stderr)
            return
        
        print(f"Storing {len(data_items)} Slack messages in ChromaDB...", file=sys.stderr)
        
        documents = []
        metadatas = []
        ids = []
        
        for item in data_items:
            # Create document text
            thread_text = ""
            if item.get("thread_replies"):
                thread_text = "\n".join([
                    f"{reply['author']}: {reply['text']}" 
                    for reply in item["thread_replies"]
                ])
            
            doc_text = f"Slack #{item['channel']} - {item['author']}: {item['text']}"
            if thread_text:
                doc_text += f"\nThread:\n{thread_text}"
            
            documents.append(doc_text)
            
            # Create unique ID
            doc_id = f"slack_{item['channel']}_{item['timestamp']}"
            ids.append(doc_id)
            
            # Store metadata
            metadata = {
                "type": "slack_message",
                "source": "slack",
                "channel": item["channel"],
                "author": item["author"],
                "date": item["date"],
                "url": f"https://slack.com/archives/{item['channel']}/p{item['timestamp'].replace('.', '')}"
            }
            metadatas.append(metadata)
        
        # Generate embeddings
        print("Generating embeddings...", file=sys.stderr)
        embeddings = self.embedding_model.encode(documents).tolist()
        
        # Store in ChromaDB
        try:
            self.collection.upsert(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            print(f"Successfully stored {len(documents)} Slack messages in ChromaDB", file=sys.stderr)
        except Exception as e:
            print(f"Error storing in ChromaDB: {e}", file=sys.stderr)
    
    def collect_all(self, days_back: int = 30):
        """Collect all data from Slack channels and store in ChromaDB"""
        print(f"Starting Slack data collection for channels: {', '.join(self.slack_channels)}...", file=sys.stderr)
        
        all_data = []
        
        for channel in self.slack_channels:
            channel = channel.strip()
            if channel:
                messages = self.collect_channel_messages(channel, days_back=days_back)
                all_data.extend(messages)
        
        # Store everything in ChromaDB
        self.store_in_chromadb(all_data)
        
        # Return summary
        summary = {
            "total_messages": len(all_data),
            "channels": self.slack_channels,
            "days_back": days_back,
            "timestamp": datetime.now().isoformat()
        }
        
        return summary

if __name__ == "__main__":
    try:
        # Get repository name from command line or environment
        repo_name = sys.argv[1] if len(sys.argv) > 1 else None
        
        collector = SlackCollector(repo_name=repo_name)
        summary = collector.collect_all(days_back=30)
        print(json.dumps(summary))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
