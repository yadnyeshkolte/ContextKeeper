"""
Decision Engine

Makes intelligent decisions based on aggregated and summarized data from all agents.
Identifies patterns, suggests actions, and provides confidence scores for recommendations.
"""

import os
import sys
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from collections import Counter

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class DecisionEngine:
    """Decision engine for analyzing summarized data and making recommendations"""
    
    def __init__(self):
        """Initialize decision engine"""
        self.decision_threshold = float(os.getenv("DECISION_CONFIDENCE_THRESHOLD", "0.6"))
        print(f"Decision engine initialized (confidence threshold: {self.decision_threshold})", file=sys.stderr)
    
    def analyze_urgency(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze urgency across all data sources
        
        Args:
            agent_data: Data from all agents
            
        Returns:
            Urgency analysis with recommendations
        """
        urgent_items = []
        urgency_score = 0.0
        
        # Check GitHub urgent items
        github_data = agent_data.get('github', {})
        if github_data.get('success'):
            github_urgent = github_data.get('urgent_items', [])
            urgent_items.extend([{
                'source': 'github',
                'item': item,
                'priority': item.get('priority', 'medium')
            } for item in github_urgent])
            
            # Calculate urgency score based on count and priority
            high_priority = len([i for i in github_urgent if i.get('priority') == 'high'])
            urgency_score += min(high_priority * 0.2, 0.5)
        
        # Check Slack action items
        slack_data = agent_data.get('slack', {})
        if slack_data.get('success'):
            action_items = slack_data.get('action_items', [])
            urgent_items.extend([{
                'source': 'slack',
                'item': item,
                'priority': 'medium'
            } for item in action_items])
            
            urgency_score += min(len(action_items) * 0.1, 0.3)
        
        # Check Notion priority changes
        notion_data = agent_data.get('notion', {})
        if notion_data.get('success'):
            priority_changes = notion_data.get('priority_changes', [])
            urgent_items.extend([{
                'source': 'notion',
                'item': item,
                'priority': 'high'
            } for item in priority_changes])
            
            urgency_score += min(len(priority_changes) * 0.15, 0.2)
        
        # Normalize urgency score to 0-1
        urgency_score = min(urgency_score, 1.0)
        
        # Determine urgency level
        if urgency_score >= 0.7:
            urgency_level = "critical"
        elif urgency_score >= 0.4:
            urgency_level = "high"
        elif urgency_score >= 0.2:
            urgency_level = "medium"
        else:
            urgency_level = "low"
        
        return {
            "urgency_score": round(urgency_score, 2),
            "urgency_level": urgency_level,
            "urgent_items_count": len(urgent_items),
            "urgent_items": urgent_items[:10],  # Top 10
            "recommendation": self._get_urgency_recommendation(urgency_level, urgent_items)
        }
    
    def _get_urgency_recommendation(self, level: str, items: List[Dict]) -> str:
        """Generate recommendation based on urgency level"""
        if level == "critical":
            return "⚠️ IMMEDIATE ACTION REQUIRED: Multiple critical items need attention. Prioritize urgent GitHub issues and Slack action items."
        elif level == "high":
            return "⚡ HIGH PRIORITY: Several items require prompt attention. Review and address within 24 hours."
        elif level == "medium":
            return "📋 MODERATE ACTIVITY: Some items need attention. Plan to address in the next few days."
        else:
            return "✅ LOW URGENCY: No critical items. Continue with planned work."
    
    def identify_patterns(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Identify patterns and trends across data sources
        
        Args:
            agent_data: Data from all agents
            
        Returns:
            Identified patterns and trends
        """
        patterns = {
            "active_contributors": [],
            "hot_topics": [],
            "recurring_issues": [],
            "collaboration_patterns": []
        }
        
        # Analyze GitHub contributors
        github_data = agent_data.get('github', {})
        if github_data.get('success'):
            raw_data = github_data.get('raw_data', {})
            
            # Count commits by author
            commits = raw_data.get('commits', [])
            authors = [c.get('author') for c in commits if c.get('author')]
            author_counts = Counter(authors)
            
            patterns['active_contributors'] = [
                {'name': author, 'commits': count}
                for author, count in author_counts.most_common(5)
            ]
        
        # Analyze Slack discussions
        slack_data = agent_data.get('slack', {})
        if slack_data.get('success'):
            key_discussions = slack_data.get('key_discussions', [])
            
            # Extract topics from discussions
            topics = []
            for disc in key_discussions:
                topic = disc.get('topic', '')
                # Simple keyword extraction (could be enhanced with NLP)
                words = topic.lower().split()
                topics.extend([w for w in words if len(w) > 5])
            
            topic_counts = Counter(topics)
            patterns['hot_topics'] = [
                {'topic': topic, 'mentions': count}
                for topic, count in topic_counts.most_common(5)
            ]
            
            # Analyze collaboration
            all_participants = []
            for disc in key_discussions:
                all_participants.extend(disc.get('participants', []))
            
            participant_counts = Counter(all_participants)
            patterns['collaboration_patterns'] = [
                {'participant': name, 'discussions': count}
                for name, count in participant_counts.most_common(5)
            ]
        
        return patterns
    
    def generate_recommendations(self, agent_data: Dict[str, Any], urgency_analysis: Dict[str, Any], patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate actionable recommendations
        
        Args:
            agent_data: Data from all agents
            urgency_analysis: Urgency analysis results
            patterns: Identified patterns
            
        Returns:
            List of recommendations with confidence scores
        """
        recommendations = []
        
        # Recommendation 1: Address urgent items
        if urgency_analysis['urgency_score'] >= 0.4:
            recommendations.append({
                'title': 'Address Urgent Items',
                'description': urgency_analysis['recommendation'],
                'priority': urgency_analysis['urgency_level'],
                'confidence': min(urgency_analysis['urgency_score'] + 0.2, 1.0),
                'action_items': [
                    f"Review {item['source']} item: {item['item'].get('title', item['item'].get('text', 'Unknown')[:50])}"
                    for item in urgency_analysis['urgent_items'][:5]
                ]
            })
        
        # Recommendation 2: Engage with active contributors
        active_contributors = patterns.get('active_contributors', [])
        if active_contributors:
            top_contributor = active_contributors[0]
            recommendations.append({
                'title': 'Recognize Active Contributors',
                'description': f"{top_contributor['name']} has been highly active with {top_contributor['commits']} commits. Consider acknowledging their contributions.",
                'priority': 'low',
                'confidence': 0.7,
                'action_items': [
                    f"Thank {contrib['name']} for their {contrib['commits']} commits"
                    for contrib in active_contributors[:3]
                ]
            })
        
        # Recommendation 3: Follow up on key discussions
        slack_data = agent_data.get('slack', {})
        if slack_data and slack_data.get('success'):
            key_discussions = slack_data.get('key_discussions', [])
            if key_discussions:
                recommendations.append({
                    'title': 'Follow Up on Key Discussions',
                    'description': f"{len(key_discussions)} active discussions detected. Ensure decisions are documented.",
                    'priority': 'medium',
                    'confidence': 0.65,
                    'action_items': [
                        f"Document outcomes of #{disc['channel']} discussion"
                        for disc in key_discussions[:3]
                    ]
                })
        
        # Recommendation 4: Update roadmap if priorities changed
        notion_data = agent_data.get('notion', {})
        if notion_data and notion_data.get('success'):
            priority_changes = notion_data.get('priority_changes', [])
            if priority_changes:
                recommendations.append({
                    'title': 'Review Roadmap Changes',
                    'description': f"{len(priority_changes)} priority/roadmap pages were updated. Ensure team alignment.",
                    'priority': 'high',
                    'confidence': 0.75,
                    'action_items': [
                        f"Review changes to: {change['title']}"
                        for change in priority_changes[:3]
                    ]
                })
        
        # Sort by priority and confidence
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        recommendations.sort(key=lambda x: (priority_order.get(x['priority'], 4), -x['confidence']))
        
        return recommendations
    
    def make_decisions(self, summarizer_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main decision-making pipeline
        
        Args:
            summarizer_result: Results from AI Summarizer
            
        Returns:
            Complete decision analysis with recommendations
        """
        print("Running decision engine analysis...", file=sys.stderr)
        
        try:
            agent_data = summarizer_result.get('agent_data', {})
            
            # Step 1: Analyze urgency
            print("Analyzing urgency...", file=sys.stderr)
            urgency_analysis = self.analyze_urgency(agent_data)
            
            # Step 2: Identify patterns
            print("Identifying patterns...", file=sys.stderr)
            patterns = self.identify_patterns(agent_data)
            
            # Step 3: Generate recommendations
            print("Generating recommendations...", file=sys.stderr)
            recommendations = self.generate_recommendations(agent_data, urgency_analysis, patterns)
            
            # Filter by confidence threshold
            high_confidence_recommendations = [
                r for r in recommendations if r['confidence'] >= self.decision_threshold
            ]
            
            result = {
                "success": True,
                "urgency_analysis": urgency_analysis,
                "patterns": patterns,
                "recommendations": recommendations,
                "high_confidence_recommendations": high_confidence_recommendations,
                "metadata": {
                    "confidence_threshold": self.decision_threshold,
                    "total_recommendations": len(recommendations),
                    "high_confidence_count": len(high_confidence_recommendations),
                    "timestamp": datetime.now().isoformat()
                }
            }
            
            print(f"✓ Decision engine completed: {len(high_confidence_recommendations)} high-confidence recommendations", file=sys.stderr)
            return result
            
        except Exception as e:
            print(f"✗ Decision engine failed: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }


if __name__ == "__main__":
    """CLI interface for Decision Engine"""
    try:
        import argparse
        
        parser = argparse.ArgumentParser(description='Decision Engine - Intelligent decision making')
        parser.add_argument('--input', type=str, required=True, help='Path to AI Summarizer output JSON')
        parser.add_argument('--output', type=str, help='Output file path (optional)')
        parser.add_argument('--threshold', type=float, help='Confidence threshold (0.0-1.0)')
        
        args = parser.parse_args()
        
        # Load summarizer results
        with open(args.input, 'r') as f:
            summarizer_result = json.load(f)
        
        # Set threshold if provided
        if args.threshold:
            os.environ['DECISION_CONFIDENCE_THRESHOLD'] = str(args.threshold)
        
        # Initialize decision engine
        engine = DecisionEngine()
        
        # Run analysis
        result = engine.make_decisions(summarizer_result)
        
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
