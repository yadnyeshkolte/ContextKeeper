"""
Notion Agent

Specialized agent for collecting and summarizing Notion workspace data.
Extends NotionCollector with AI summarization capabilities.
"""

import os
import sys
import json
from typing import Dict, Any, List
from datetime import datetime

# Add parent directory to path to import collectors
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agents.base_agent import BaseAgent
from scripts.notion_collector import NotionCollector


class NotionAgent(BaseAgent):
    """AI-powered Notion data collection and summarization agent"""
    
    def __init__(self):
        """Initialize Notion agent"""
        super().__init__("notion")
        
        # Initialize Notion collector
        self.collector = NotionCollector()
        
        print(f"Notion agent initialized", file=sys.stderr)
    
    def collect_data(self, hours: int = 24, **kwargs) -> Dict[str, Any]:
        """
        Collect recent Notion activity
        
        Args:
            hours: Number of hours to look back (default: 24)
            
        Returns:
            Dictionary with recent page updates
        """
        return self.collector.collect_recent_activity(hours=hours)
    
    def format_data_for_summary(self, data: Dict[str, Any]) -> str:
        """
        Format Notion data into text for summarization
        
        Args:
            data: Raw Notion data
            
        Returns:
            Formatted text string
        """
        lines = []
        lines.append(f"Notion Activity Summary")
        lines.append(f"Period: Last {data.get('period_hours', 24)} hours")
        lines.append("")
        
        pages = data.get('pages', [])
        
        if not pages:
            lines.append("No recent page updates found.")
            return "\n".join(lines)
        
        lines.append(f"=== UPDATED PAGES ({len(pages)}) ===")
        lines.append("")
        
        for page in pages:
            page_type = page.get('object', 'page')
            title = page.get('title', 'Untitled')
            url = page.get('url', '')
            last_edited = page.get('last_edited', 'Unknown')
            
            # Parse and format timestamp
            try:
                dt = datetime.fromisoformat(last_edited.replace('Z', '+00:00'))
                formatted_time = dt.strftime('%Y-%m-%d %H:%M')
            except:
                formatted_time = last_edited
            
            lines.append(f"📄 {title}")
            lines.append(f"   Type: {page_type} | Last edited: {formatted_time}")
            lines.append(f"   URL: {url}")
            lines.append("")
        
        return "\n".join(lines)
    
    def identify_priority_changes(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Identify potential priority or roadmap changes
        
        Args:
            data: Raw Notion data
            
        Returns:
            List of pages that might indicate priority changes
        """
        priority_indicators = []
        priority_keywords = ['roadmap', 'priority', 'sprint', 'milestone', 'deadline', 'q1', 'q2', 'q3', 'q4']
        
        for page in data.get('pages', []):
            title = page.get('title', '').lower()
            
            # Check if page title contains priority-related keywords
            if any(keyword in title for keyword in priority_keywords):
                priority_indicators.append({
                    'title': page.get('title'),
                    'url': page.get('url'),
                    'last_edited': page.get('last_edited'),
                    'reason': 'Contains priority/roadmap keywords',
                    'type': 'priority_change'
                })
        
        return priority_indicators
    
    def categorize_pages(self, data: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Categorize pages by type or topic
        
        Args:
            data: Raw Notion data
            
        Returns:
            Dictionary of categorized pages
        """
        categories = {
            'roadmap': [],
            'documentation': [],
            'meetings': [],
            'projects': [],
            'other': []
        }
        
        for page in data.get('pages', []):
            title = page.get('title', '').lower()
            
            # Simple keyword-based categorization
            if any(word in title for word in ['roadmap', 'plan', 'strategy']):
                categories['roadmap'].append(page)
            elif any(word in title for word in ['doc', 'guide', 'readme', 'wiki']):
                categories['documentation'].append(page)
            elif any(word in title for word in ['meeting', 'standup', 'sync', 'notes']):
                categories['meetings'].append(page)
            elif any(word in title for word in ['project', 'feature', 'epic']):
                categories['projects'].append(page)
            else:
                categories['other'].append(page)
        
        # Remove empty categories
        return {k: v for k, v in categories.items() if v}


if __name__ == "__main__":
    """CLI interface for Notion agent"""
    try:
        import argparse
        
        parser = argparse.ArgumentParser(description='Notion AI Agent')
        parser.add_argument('--hours', type=int, default=24, help='Hours to look back')
        parser.add_argument('--test', action='store_true', help='Run in test mode')
        
        args = parser.parse_args()
        
        # Initialize agent
        agent = NotionAgent()
        
        # Process data
        result = agent.process(hours=args.hours)
        
        # Add analysis
        if result.get('success'):
            result['priority_changes'] = agent.identify_priority_changes(result['raw_data'])
            result['categorized_pages'] = agent.categorize_pages(result['raw_data'])
            result['priority_changes_count'] = len(result['priority_changes'])
        
        # Output JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"error": str(e), "success": False}), file=sys.stderr)
        sys.exit(1)
