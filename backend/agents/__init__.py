"""
AI Agent System for ContextKeeper

This package contains specialized agents for collecting and summarizing data
from GitHub, Slack, and Notion using Hugging Face models.
"""

from .base_agent import BaseAgent
from .github_agent import GitHubAgent
from .slack_agent import SlackAgent
from .notion_agent import NotionAgent
from .ai_summarizer import AISummarizer
from .decision_engine import DecisionEngine

__all__ = [
    'BaseAgent',
    'GitHubAgent',
    'SlackAgent',
    'NotionAgent',
    'AISummarizer',
    'DecisionEngine'
]
