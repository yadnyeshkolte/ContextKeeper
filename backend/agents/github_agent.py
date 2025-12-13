"""
GitHub Agent

Specialized agent for collecting and summarizing GitHub repository data.
Extends GitHubCollector with AI summarization capabilities.
"""

import os
import sys
import json
from typing import Dict, Any, List
from datetime import datetime, timedelta

# Add parent directory to path to import collectors
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agents.base_agent import BaseAgent
from scripts.github_collector import GitHubCollector


class GitHubAgent(BaseAgent):
    """AI-powered GitHub data collection and summarization agent"""
    
    def __init__(self, repo_name: str = None, branch: str = None):
        """
        Initialize GitHub agent
        
        Args:
            repo_name: GitHub repository name (owner/repo)
            branch: Branch name (default: main)
        """
        super().__init__("github")
        
        self.repo_name = repo_name or os.getenv("GITHUB_REPO")
        self.branch = branch or "main"
        
        # Initialize GitHub collector
        self.collector = GitHubCollector(repo_name=self.repo_name, branch=self.branch)
        
        print(f"GitHub agent initialized for {self.repo_name} (branch: {self.branch})", file=sys.stderr)
    
    def collect_data(self, hours: int = 24, **kwargs) -> Dict[str, Any]:
        """
        Collect recent GitHub activity
        
        Args:
            hours: Number of hours to look back (default: 24)
            
        Returns:
            Dictionary with commits, PRs, and issues
        """
        return self.collector.collect_recent_activity(hours=hours)
    
    def format_data_for_summary(self, data: Dict[str, Any]) -> str:
        """
        Format GitHub data into text for summarization
        
        Args:
            data: Raw GitHub data
            
        Returns:
            Formatted text string
        """
        lines = []
        lines.append(f"GitHub Activity Summary for {data.get('repo', 'Unknown Repository')}")
        lines.append(f"Period: Last {data.get('period_hours', 24)} hours")
        lines.append("")
        
        # Format commits
        commits = data.get('commits', [])
        if commits:
            lines.append(f"=== COMMITS ({len(commits)}) ===")
            for commit in commits[:10]:  # Limit to 10 most recent
                lines.append(f"- [{commit.get('author', 'Unknown')}] {commit.get('message', 'No message')}")
            if len(commits) > 10:
                lines.append(f"... and {len(commits) - 10} more commits")
            lines.append("")
        
        # Format pull requests
        prs = data.get('pull_requests', [])
        if prs:
            lines.append(f"=== PULL REQUESTS ({len(prs)}) ===")
            for pr in prs[:10]:
                state_emoji = "✅" if pr.get('state') == 'closed' else "🔄"
                lines.append(f"{state_emoji} PR #{pr.get('number', '?')}: {pr.get('title', 'No title')}")
                lines.append(f"   Author: {pr.get('author', 'Unknown')} | Updated: {pr.get('updated_at', 'Unknown')}")
            if len(prs) > 10:
                lines.append(f"... and {len(prs) - 10} more PRs")
            lines.append("")
        
        # Format issues
        issues = data.get('issues', [])
        if issues:
            lines.append(f"=== ISSUES ({len(issues)}) ===")
            for issue in issues[:10]:
                state_emoji = "✅" if issue.get('state') == 'closed' else "🔴"
                lines.append(f"{state_emoji} Issue #{issue.get('number', '?')}: {issue.get('title', 'No title')}")
                lines.append(f"   Author: {issue.get('author', 'Unknown')} | Updated: {issue.get('updated_at', 'Unknown')}")
            if len(issues) > 10:
                lines.append(f"... and {len(issues) - 10} more issues")
            lines.append("")
        
        if not commits and not prs and not issues:
            lines.append("No recent activity found.")
        
        return "\n".join(lines)
    
    def identify_urgent_items(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Identify urgent items requiring attention
        
        Args:
            data: Raw GitHub data
            
        Returns:
            List of urgent items with metadata
        """
        urgent_items = []
        
        # Check for open issues with specific labels
        urgent_labels = ['critical', 'urgent', 'bug', 'security']
        for issue in data.get('issues', []):
            if issue.get('state') == 'open':
                issue_labels = [label.lower() for label in issue.get('labels', [])]
                if any(label in issue_labels for label in urgent_labels):
                    urgent_items.append({
                        'type': 'issue',
                        'number': issue.get('number'),
                        'title': issue.get('title'),
                        'url': issue.get('url'),
                        'reason': 'Contains urgent/critical label',
                        'priority': 'high'
                    })
        
        # Check for stale PRs (open for more than 7 days)
        for pr in data.get('pull_requests', []):
            if pr.get('state') == 'open':
                try:
                    updated_at = datetime.fromisoformat(pr.get('updated_at', '').replace('Z', '+00:00'))
                    days_old = (datetime.now(updated_at.tzinfo) - updated_at).days
                    if days_old > 7:
                        urgent_items.append({
                            'type': 'pull_request',
                            'number': pr.get('number'),
                            'title': pr.get('title'),
                            'url': pr.get('url'),
                            'reason': f'Stale PR (open for {days_old} days)',
                            'priority': 'medium'
                        })
                except:
                    pass
        
        return urgent_items


if __name__ == "__main__":
    """CLI interface for GitHub agent"""
    try:
        import argparse
        
        parser = argparse.ArgumentParser(description='GitHub AI Agent')
        parser.add_argument('--repo', type=str, help='Repository name (owner/repo)')
        parser.add_argument('--branch', type=str, default='main', help='Branch name')
        parser.add_argument('--hours', type=int, default=24, help='Hours to look back')
        parser.add_argument('--test', action='store_true', help='Run in test mode')
        
        args = parser.parse_args()
        
        # Initialize agent
        agent = GitHubAgent(repo_name=args.repo, branch=args.branch)
        
        # Process data
        result = agent.process(hours=args.hours)
        
        # Add urgent items analysis
        if result.get('success'):
            urgent = agent.identify_urgent_items(result['raw_data'])
            result['urgent_items'] = urgent
            result['urgent_count'] = len(urgent)
        
        # Output JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"error": str(e), "success": False}), file=sys.stderr)
        sys.exit(1)
