import os
import sys
import json
from datetime import datetime
from typing import List, Dict, Any, Set
from dotenv import load_dotenv
import chromadb
from collections import defaultdict
import re

load_dotenv()

class KnowledgeGraphBuilder:
    """Builds a knowledge graph from ChromaDB context data"""
    
    def __init__(self, repo_name: str = None, branch: str = None):
        # Get repository name for ChromaDB path and sanitize it
        # ChromaDB collection names must match [a-zA-Z0-9._-] and cannot contain '/'
        raw_repo_name = repo_name or os.getenv("GITHUB_REPO", "default")
        self.repo_name = raw_repo_name.replace("/", "_")
        self.branch = branch or "main"
        self.branch_safe_name = self.branch.replace("/", "_").replace("^", "_").replace("~", "_")
        
        # Repository and branch-specific ChromaDB path
        chroma_path = f"./chroma_db_{self.repo_name}_{self.branch_safe_name}"
        print(f"Using ChromaDB path: {chroma_path}", file=sys.stderr)
        
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(f"context_{self.repo_name}_{self.branch_safe_name}")
        
        # Graph data structures
        self.nodes = {}
        self.links = []
        self.people = set()
        self.modules = set()
        self.decisions = set()
        
        # Author normalization mapping (lowercase -> original casing)
        self.author_map = {}
    
    def normalize_author(self, author: str) -> str:
        """Normalize author name to handle case variations and return consistent casing"""
        if not author or author == 'Unknown':
            return None
        
        author_lower = author.lower()
        
        # If we've seen this author before (case-insensitive), use the stored version
        if author_lower in self.author_map:
            return self.author_map[author_lower]
        
        # Otherwise, store this version
        self.author_map[author_lower] = author
        return author
    
    def extract_mentions(self, text: str) -> Set[str]:
        """Extract @mentions from text"""
        if not text:
            return set()
        return set(re.findall(r'@(\w+)', text))
    
    def extract_modules(self, text: str) -> Set[str]:
        """Extract module/technology names from text with improved accuracy"""
        if not text:
            return set()
        
        # Common technology keywords - expanded and more specific
        tech_keywords = [
            'redis', 'postgres', 'postgresql', 'mongodb', 'mysql', 'elasticsearch',
            'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'fastapi',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp',
            'graphql', 'rest', 'grpc', 'websocket',
            'jwt', 'oauth', 'auth0', 'firebase',
            'webpack', 'vite', 'babel', 'typescript', 'javascript', 'python',
            'chromadb', 'huggingface', 'gemini', 'slack', 'github', 'nextjs', 'tailwind'
        ]
        
        modules = set()
        text_lower = text.lower()
        
        # Only detect technology keywords if they appear as whole words
        for keyword in tech_keywords:
            # Use word boundary to avoid partial matches
            if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
                modules.add(keyword.capitalize())
        
        # Extract file extensions as modules - ONLY from actual code file paths
        # Look for patterns like: filename.ext, path/filename.ext, or "filename.ext"
        # Avoid matching URLs, version numbers, etc.
        file_patterns = re.findall(r'(?:^|[\s/\\"\'])([a-zA-Z0-9_-]+\.(py|js|ts|jsx|tsx|java|cpp|go|rs|rb))(?:[\s,;"\']|$)', text)
        
        # Only add if we found actual file references (not just extensions in prose)
        if file_patterns:
            for filename, ext in file_patterns:
                # Only add if this looks like a real file (has a reasonable name)
                if len(filename) > 3:  # Avoid single-letter filenames
                    ext_clean = ext.upper()
                    modules.add(f"{ext_clean} Module")
        
        return modules
    
    def extract_decisions(self, text: str, metadata: Dict) -> List[str]:
        """Extract decision keywords from text with improved accuracy"""
        if not text:
            return []
        
        # Enhanced decision keywords with context
        decision_keywords = [
            'decided', 'decision', 'chose', 'choose', 'selected', 'switch',
            'migrate', 'refactor', 'implement', 'add', 'remove', 'deprecate',
            'why', 'because', 'reason', 'rationale', 'approach', 'strategy'
        ]
        
        decisions = []
        text_lower = text.lower()
        
        # Check if text contains decision-related keywords
        has_decision_keyword = any(keyword in text_lower for keyword in decision_keywords)
        
        # Only create decision nodes for meaningful content
        # Filter out generic commit messages and short texts
        if has_decision_keyword and len(text) > 50:  # Minimum length for meaningful decision
            doc_type = metadata.get('type', 'unknown')
            
            # Create more descriptive decision labels
            if doc_type == 'pull_request':
                # Extract PR title or first line of body
                title = text.split('\n')[0][:100] if text else 'PR Decision'
                decisions.append(f"PR: {title}")
            elif doc_type == 'issue':
                title = text.split('\n')[0][:100] if text else 'Issue Decision'
                decisions.append(f"Issue: {title}")
            elif doc_type == 'commit':
                # Only include commits with meaningful messages
                if not any(skip in text_lower for skip in ['merge', 'update readme', 'fix typo', 'formatting']):
                    message = text.split('\n')[0][:100] if text else 'Commit Decision'
                    decisions.append(f"Commit: {message}")
            elif doc_type == 'slack_message':
                decisions.append(f"Discussion: {metadata.get('channel', 'Unknown')}")
        
        return decisions
    
    def build_graph(self) -> Dict[str, Any]:
        """Build knowledge graph from ChromaDB data"""
        print("Building knowledge graph...", file=sys.stderr)
        
        # Get all documents from ChromaDB
        try:
            results = self.collection.get(
                include=['documents', 'metadatas']
            )
            
            if not results or not results['documents']:
                print("No documents found in ChromaDB", file=sys.stderr)
                return {"nodes": [], "links": []}
            
            print(f"Processing {len(results['documents'])} documents...", file=sys.stderr)
            
            # Track relationships
            person_to_modules = defaultdict(set)
            person_to_decisions = defaultdict(set)
            module_to_decisions = defaultdict(set)
            
            # Process each document
            for i, (doc, metadata) in enumerate(zip(results['documents'], results['metadatas'])):
                raw_author = metadata.get('author', 'Unknown')
                
                # Normalize author name to handle case variations
                author = self.normalize_author(raw_author)
                
                # Add person node
                if author:
                    self.people.add(author)
                
                # Extract modules
                modules = self.extract_modules(doc)
                self.modules.update(modules)
                
                # Extract decisions
                decisions = self.extract_decisions(doc, metadata)
                self.decisions.update(decisions)
                
                # Build relationships
                if author:
                    for module in modules:
                        person_to_modules[author].add(module)
                    for decision in decisions:
                        person_to_decisions[author].add(decision)
                
                for module in modules:
                    for decision in decisions:
                        module_to_decisions[module].add(decision)
            
            # Create nodes
            node_id = 0
            
            # Add people nodes
            for person in self.people:
                self.nodes[f"person-{person}"] = {
                    "id": f"person-{person}",
                    "group": 1,
                    "label": f"@{person}",
                    "type": "person"
                }
            
            # Add module nodes
            for module in self.modules:
                self.nodes[f"module-{module}"] = {
                    "id": f"module-{module}",
                    "group": 2,
                    "label": module,
                    "type": "module"
                }
            
            # Add decision nodes (limit to top 20)
            for i, decision in enumerate(list(self.decisions)[:20]):
                decision_id = f"decision-{i}"
                self.nodes[decision_id] = {
                    "id": decision_id,
                    "group": 3,
                    "label": decision[:50] + "..." if len(decision) > 50 else decision,
                    "type": "decision",
                    "url": decision.split(": ")[1] if ": " in decision else ""
                }
            
            # Create links
            # Person -> Module
            for person, modules in person_to_modules.items():
                for module in modules:
                    self.links.append({
                        "source": f"person-{person}",
                        "target": f"module-{module}",
                        "value": 1,
                        "type": "contributed"
                    })
            
            # Person -> Decision
            for person, decisions in person_to_decisions.items():
                for i, decision in enumerate(list(decisions)[:20]):
                    decision_id = f"decision-{list(self.decisions).index(decision)}" if decision in list(self.decisions)[:20] else None
                    if decision_id:
                        self.links.append({
                            "source": f"person-{person}",
                            "target": decision_id,
                            "value": 2,
                            "type": "decided"
                        })
            
            # Module -> Decision
            for module, decisions in module_to_decisions.items():
                for decision in decisions:
                    decision_id = f"decision-{list(self.decisions).index(decision)}" if decision in list(self.decisions)[:20] else None
                    if decision_id:
                        self.links.append({
                            "source": f"module-{module}",
                            "target": decision_id,
                            "value": 1,
                            "type": "related"
                        })
            
            print(f"Graph built: {len(self.nodes)} nodes, {len(self.links)} links", file=sys.stderr)
            
            return {
                "nodes": list(self.nodes.values()),
                "links": self.links,
                "stats": {
                    "people": len(self.people),
                    "modules": len(self.modules),
                    "decisions": len(self.decisions)
                }
            }
        
        except Exception as e:
            print(f"Error building graph: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return {"nodes": [], "links": [], "error": str(e)}

if __name__ == "__main__":
    try:
        # Get repository name and branch from command line or environment
        repo_name = sys.argv[1] if len(sys.argv) > 1 else None
        branch = sys.argv[2] if len(sys.argv) > 2 else None
        
        builder = KnowledgeGraphBuilder(repo_name=repo_name, branch=branch)
        graph = builder.build_graph()
        print(json.dumps(graph))
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"error": str(e), "nodes": [], "links": []}))
        sys.exit(1)
