"""
Slack Agent

Specialized agent for collecting and summarizing Slack channel data.
Extends SlackCollector with AI summarization capabilities.
"""

import os
import sys
import json
from typing import Dict, Any, List
from datetime import datetime

# Add parent directory to path to import collectors
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agents.base_agent import BaseAgent
from scripts.slack_collector import SlackCollector


class SlackAgent(BaseAgent):
    """AI-powered Slack data collection and summarization agent"""
    
    def __init__(self, repo_name: str = None):
        """
        Initialize Slack agent
        
        Args:
            repo_name: Repository name for ChromaDB storage
        """
        super().__init__("slack")
        
        self.repo_name = repo_name or os.getenv("GITHUB_REPO", "default")
        
        # Initialize Slack collector
        self.collector = SlackCollector(repo_name=self.repo_name)
        
        print(f"Slack agent initialized for channels: {self.collector.slack_channels}", file=sys.stderr)
    
    def collect_data(self, hours: int = 24, **kwargs) -> Dict[str, Any]:
        """
        Collect recent Slack messages
        
        Args:
            hours: Number of hours to look back (default: 24)
            
        Returns:
            Dictionary with messages from all channels
        """
        return self.collector.collect_recent_activity(hours=hours)
    
    def format_data_for_summary(self, data: Dict[str, Any]) -> str:
        """
        Format Slack data into text for summarization
        
        Args:
            data: Raw Slack data
            
        Returns:
            Formatted text string
        """
        lines = []
        lines.append(f"Slack Activity Summary")
        lines.append(f"Period: Last {data.get('period_hours', 24)} hours")
        lines.append(f"Channels: {', '.join(data.get('channels', []))}")
        lines.append("")
        
        messages = data.get('messages', [])
        
        if not messages:
            lines.append("No recent messages found.")
            return "\n".join(lines)
        
        lines.append(f"=== MESSAGES ({len(messages)}) ===")
        lines.append("")
        
        # Group messages by channel
        messages_by_channel = {}
        for msg in messages:
            channel = msg.get('channel', 'unknown')
            if channel not in messages_by_channel:
                messages_by_channel[channel] = []
            messages_by_channel[channel].append(msg)
        
        # Format messages by channel
        for channel, channel_messages in messages_by_channel.items():
            lines.append(f"Channel: #{channel} ({len(channel_messages)} messages)")
            lines.append("-" * 50)
            
            for msg in channel_messages[:15]:  # Limit to 15 messages per channel
                author = msg.get('author', 'Unknown')
                text = msg.get('text', '')
                timestamp = msg.get('date', '')
                
                # Truncate long messages
                if len(text) > 200:
                    text = text[:200] + "..."
                
                lines.append(f"[{author}] {text}")
                
                # Include thread replies if present
                thread_replies = msg.get('thread_replies', [])
                if thread_replies:
                    lines.append(f"  └─ {len(thread_replies)} replies in thread")
                    for reply in thread_replies[:3]:  # Show first 3 replies
                        reply_text = reply.get('text', '')
                        if len(reply_text) > 150:
                            reply_text = reply_text[:150] + "..."
                        lines.append(f"     [{reply.get('author', 'Unknown')}] {reply_text}")
                
                lines.append("")
            
            if len(channel_messages) > 15:
                lines.append(f"... and {len(channel_messages) - 15} more messages")
            lines.append("")
        
        return "\n".join(lines)
    
    def extract_action_items(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract potential action items from Slack messages
        
        Args:
            data: Raw Slack data
            
        Returns:
            List of potential action items
        """
        action_items = []
        action_keywords = ['todo', 'action item', 'need to', 'should', 'must', 'deadline', 'urgent', 'asap']
        
        for msg in data.get('messages', []):
            text = msg.get('text', '').lower()
            
            # Check if message contains action keywords
            if any(keyword in text for keyword in action_keywords):
                action_items.append({
                    'channel': msg.get('channel'),
                    'author': msg.get('author'),
                    'text': msg.get('text'),
                    'timestamp': msg.get('date'),
                    'type': 'potential_action_item'
                })
            
            # Check thread replies too
            for reply in msg.get('thread_replies', []):
                reply_text = reply.get('text', '').lower()
                if any(keyword in reply_text for keyword in action_keywords):
                    action_items.append({
                        'channel': msg.get('channel'),
                        'author': reply.get('author'),
                        'text': reply.get('text'),
                        'timestamp': reply.get('timestamp'),
                        'type': 'potential_action_item',
                        'in_thread': True
                    })
        
        return action_items
    
    def identify_key_discussions(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Identify key discussions based on thread activity
        
        Args:
            data: Raw Slack data
            
        Returns:
            List of key discussions
        """
        key_discussions = []
        
        for msg in data.get('messages', []):
            thread_replies = msg.get('thread_replies', [])
            
            # Consider discussions with 3+ replies as "key"
            if len(thread_replies) >= 3:
                key_discussions.append({
                    'channel': msg.get('channel'),
                    'starter': msg.get('author'),
                    'topic': msg.get('text')[:200],  # First 200 chars as topic
                    'reply_count': len(thread_replies),
                    'participants': list(set([r.get('author') for r in thread_replies])),
                    'timestamp': msg.get('date')
                })
        
        # Sort by reply count (most active first)
        key_discussions.sort(key=lambda x: x['reply_count'], reverse=True)
        
        return key_discussions


if __name__ == "__main__":
    """CLI interface for Slack agent"""
    try:
        import argparse
        
        parser = argparse.ArgumentParser(description='Slack AI Agent')
        parser.add_argument('--repo', type=str, help='Repository name for storage')
        parser.add_argument('--hours', type=int, default=24, help='Hours to look back')
        parser.add_argument('--test', action='store_true', help='Run in test mode')
        
        args = parser.parse_args()
        
        # Initialize agent
        agent = SlackAgent(repo_name=args.repo)
        
        # Process data
        result = agent.process(hours=args.hours)
        
        # Add analysis
        if result.get('success'):
            result['action_items'] = agent.extract_action_items(result['raw_data'])
            result['key_discussions'] = agent.identify_key_discussions(result['raw_data'])
            result['action_items_count'] = len(result['action_items'])
            result['key_discussions_count'] = len(result['key_discussions'])
        
        # Output JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"error": str(e), "success": False}), file=sys.stderr)
        sys.exit(1)
