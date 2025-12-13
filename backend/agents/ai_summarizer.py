"""
AI Summarizer

Unified AI summarizer that aggregates data from all agents (GitHub, Slack, Notion)
and generates comprehensive daily briefings with actionable insights.
"""

import os
import sys
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agents.base_agent import BaseAgent
from agents.github_agent import GitHubAgent
from agents.slack_agent import SlackAgent
from agents.notion_agent import NotionAgent


class AISummarizer:
    """Unified AI summarizer for all agents"""
    
    def __init__(self, repo_name: str = None, branch: str = None):
        """
        Initialize AI Summarizer
        
        Args:
            repo_name: GitHub repository name
            branch: Git branch name
        """
        self.repo_name = repo_name or os.getenv("GITHUB_REPO")
        self.branch = branch or "main"
        
        # Initialize agents
        print("Initializing AI Summarizer with all agents...", file=sys.stderr)
        
        self.github_agent = None
        self.slack_agent = None
        self.notion_agent = None
        
        # Initialize GitHub agent if token available
        if os.getenv("GITHUB_TOKEN"):
            try:
                self.github_agent = GitHubAgent(repo_name=self.repo_name, branch=self.branch)
                print("✓ GitHub agent initialized", file=sys.stderr)
            except Exception as e:
                print(f"✗ GitHub agent initialization failed: {e}", file=sys.stderr)
        
        # Initialize Slack agent if token available
        if os.getenv("SLACK_TOKEN"):
            try:
                self.slack_agent = SlackAgent(repo_name=self.repo_name)
                print("✓ Slack agent initialized", file=sys.stderr)
            except Exception as e:
                print(f"✗ Slack agent initialization failed: {e}", file=sys.stderr)
        
        # Initialize Notion agent if token available
        if os.getenv("NOTION_TOKEN"):
            try:
                self.notion_agent = NotionAgent()
                print("✓ Notion agent initialized", file=sys.stderr)
            except Exception as e:
                print(f"✗ Notion agent initialization failed: {e}", file=sys.stderr)
    
    def collect_all_data(self, hours: int = 24) -> Dict[str, Any]:
        """
        Collect data from all available agents
        
        Args:
            hours: Number of hours to look back
            
        Returns:
            Dictionary with data from all agents
        """
        print(f"Collecting data from all agents (last {hours} hours)...", file=sys.stderr)
        
        results = {
            "github": None,
            "slack": None,
            "notion": None,
            "timestamp": datetime.now().isoformat(),
            "period_hours": hours
        }
        
        # Collect from GitHub
        if self.github_agent:
            try:
                print("Collecting GitHub data...", file=sys.stderr)
                github_result = self.github_agent.process(hours=hours)
                if github_result.get('success'):
                    # Add urgent items
                    github_result['urgent_items'] = self.github_agent.identify_urgent_items(github_result['raw_data'])
                results["github"] = github_result
                print(f"✓ GitHub data collected", file=sys.stderr)
            except Exception as e:
                print(f"✗ GitHub collection failed: {e}", file=sys.stderr)
                results["github"] = {"error": str(e), "success": False}
        
        # Collect from Slack
        if self.slack_agent:
            try:
                print("Collecting Slack data...", file=sys.stderr)
                slack_result = self.slack_agent.process(hours=hours)
                if slack_result.get('success'):
                    # Add action items and discussions
                    slack_result['action_items'] = self.slack_agent.extract_action_items(slack_result['raw_data'])
                    slack_result['key_discussions'] = self.slack_agent.identify_key_discussions(slack_result['raw_data'])
                results["slack"] = slack_result
                print(f"✓ Slack data collected", file=sys.stderr)
            except Exception as e:
                print(f"✗ Slack collection failed: {e}", file=sys.stderr)
                results["slack"] = {"error": str(e), "success": False}
        
        # Collect from Notion
        if self.notion_agent:
            try:
                print("Collecting Notion data...", file=sys.stderr)
                notion_result = self.notion_agent.process(hours=hours)
                if notion_result.get('success'):
                    # Add priority changes
                    notion_result['priority_changes'] = self.notion_agent.identify_priority_changes(notion_result['raw_data'])
                    notion_result['categorized_pages'] = self.notion_agent.categorize_pages(notion_result['raw_data'])
                results["notion"] = notion_result
                print(f"✓ Notion data collected", file=sys.stderr)
            except Exception as e:
                print(f"✗ Notion collection failed: {e}", file=sys.stderr)
                results["notion"] = {"error": str(e), "success": False}
        
        return results
    
    def aggregate_summaries(self, all_data: Dict[str, Any]) -> str:
        """
        Aggregate individual agent summaries into unified text
        
        Args:
            all_data: Data from all agents
            
        Returns:
            Aggregated text for final summarization
        """
        lines = []
        lines.append("=== DAILY PROJECT BRIEFING ===")
        lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        lines.append(f"Period: Last {all_data.get('period_hours', 24)} hours")
        lines.append("")
        
        # GitHub Summary
        github_data = all_data.get('github')
        if github_data and github_data.get('success'):
            lines.append("--- GITHUB ACTIVITY ---")
            ai_summary = github_data.get('ai_summary', {})
            if ai_summary.get('success'):
                lines.append(ai_summary.get('summary', 'No summary available'))
            else:
                lines.append(github_data.get('formatted_text', 'No data'))
            
            # Add urgent items
            urgent_items = github_data.get('urgent_items', [])
            if urgent_items:
                lines.append("")
                lines.append(f"⚠️ URGENT ITEMS ({len(urgent_items)}):")
                for item in urgent_items[:5]:
                    lines.append(f"  - {item['type'].upper()} #{item['number']}: {item['title']}")
                    lines.append(f"    Reason: {item['reason']}")
            lines.append("")
        
        # Slack Summary
        slack_data = all_data.get('slack')
        if slack_data and slack_data.get('success'):
            lines.append("--- SLACK DISCUSSIONS ---")
            ai_summary = slack_data.get('ai_summary', {})
            if ai_summary.get('success'):
                lines.append(ai_summary.get('summary', 'No summary available'))
            else:
                lines.append(slack_data.get('formatted_text', 'No data'))
            
            # Add action items
            action_items = slack_data.get('action_items', [])
            if action_items:
                lines.append("")
                lines.append(f"📋 ACTION ITEMS ({len(action_items)}):")
                for item in action_items[:5]:
                    lines.append(f"  - [{item['author']}] {item['text'][:100]}")
            
            # Add key discussions
            key_discussions = slack_data.get('key_discussions', [])
            if key_discussions:
                lines.append("")
                lines.append(f"💬 KEY DISCUSSIONS ({len(key_discussions)}):")
                for disc in key_discussions[:3]:
                    lines.append(f"  - #{disc['channel']}: {disc['topic'][:100]}")
                    lines.append(f"    {disc['reply_count']} replies from {len(disc['participants'])} participants")
            lines.append("")
        
        # Notion Summary
        notion_data = all_data.get('notion')
        if notion_data and notion_data.get('success'):
            lines.append("--- NOTION UPDATES ---")
            ai_summary = notion_data.get('ai_summary', {})
            if ai_summary.get('success'):
                lines.append(ai_summary.get('summary', 'No summary available'))
            else:
                lines.append(notion_data.get('formatted_text', 'No data'))
            
            # Add priority changes
            priority_changes = notion_data.get('priority_changes', [])
            if priority_changes:
                lines.append("")
                lines.append(f"🎯 PRIORITY CHANGES ({len(priority_changes)}):")
                for change in priority_changes:
                    lines.append(f"  - {change['title']}")
                    lines.append(f"    Reason: {change['reason']}")
            lines.append("")
        
        return "\n".join(lines)
    
    def generate_unified_summary(self, all_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate final unified summary using AI
        
        Args:
            all_data: Data from all agents
            
        Returns:
            Dictionary with unified summary and insights
        """
        print("Generating unified AI summary...", file=sys.stderr)
        
        # Aggregate all summaries
        aggregated_text = self.aggregate_summaries(all_data)
        
        # Generate final AI summary using an available agent
        # Use whichever agent is initialized (GitHub, Slack, or Notion)
        summarizer_agent = self.github_agent or self.slack_agent or self.notion_agent
        
        if summarizer_agent:
            prompt = f"""Summarize the following project updates into a concise daily briefing with clear action items and priorities:

{aggregated_text}

Focus on:
1. Most important developments
2. Urgent items requiring immediate attention
3. Key decisions or discussions
4. Recommended next steps"""
            
            final_summary = summarizer_agent.summarize_text(
                prompt,
                max_length=600,
                temperature=0.7
            )
        else:
            # No agents available, return aggregated text as fallback
            final_summary = {
                "summary": aggregated_text[:600],
                "error": "No agents available for AI summarization",
                "success": False,
                "fallback": True
            }
        
        return {
            "unified_summary": final_summary,
            "aggregated_text": aggregated_text,
            "individual_summaries": {
                "github": all_data.get('github', {}).get('ai_summary'),
                "slack": all_data.get('slack', {}).get('ai_summary'),
                "notion": all_data.get('notion', {}).get('ai_summary')
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def run(self, hours: int = 24) -> Dict[str, Any]:
        """
        Run complete AI summarization pipeline
        
        Args:
            hours: Number of hours to look back
            
        Returns:
            Complete results with all data and summaries
        """
        print(f"Starting AI Summarizer pipeline...", file=sys.stderr)
        
        try:
            # Step 1: Collect all data
            all_data = self.collect_all_data(hours=hours)
            
            # Step 2: Generate unified summary
            unified_summary = self.generate_unified_summary(all_data)
            
            # Step 3: Compile final result
            result = {
                "success": True,
                "unified_summary": unified_summary,
                "agent_data": all_data,
                "metadata": {
                    "repo": self.repo_name,
                    "branch": self.branch,
                    "period_hours": hours,
                    "timestamp": datetime.now().isoformat(),
                    "agents_active": {
                        "github": self.github_agent is not None,
                        "slack": self.slack_agent is not None,
                        "notion": self.notion_agent is not None
                    }
                }
            }
            
            print("✓ AI Summarizer pipeline completed successfully", file=sys.stderr)
            return result
            
        except Exception as e:
            print(f"✗ AI Summarizer pipeline failed: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }


if __name__ == "__main__":
    """CLI interface for AI Summarizer"""
    try:
        import argparse
        
        parser = argparse.ArgumentParser(description='AI Summarizer - Unified multi-agent summarization')
        parser.add_argument('--repo', type=str, help='Repository name (owner/repo)')
        parser.add_argument('--branch', type=str, default='main', help='Branch name')
        parser.add_argument('--hours', type=int, default=24, help='Hours to look back')
        parser.add_argument('--test-mode', action='store_true', help='Run in test mode')
        parser.add_argument('--output', type=str, help='Output file path (optional)')
        
        args = parser.parse_args()
        
        # Initialize summarizer
        summarizer = AISummarizer(repo_name=args.repo, branch=args.branch)
        
        # Run pipeline
        result = summarizer.run(hours=args.hours)
        
        # Output results
        output_json = json.dumps(result, indent=2)
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(output_json)
            print(f"Results written to {args.output}", file=sys.stderr)
        else:
            print(output_json)
        
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"error": str(e), "success": False}), file=sys.stderr)
        sys.exit(1)
