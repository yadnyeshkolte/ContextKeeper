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
    """Builds a knowledge graph from ChromaDB context data with enhanced commit and file tracking"""
    
    def __init__(self, repo_name: str = None, branch: str = None):
        # Get repository name for ChromaDB path and sanitize it
        # ChromaDB collection names must match [a-zA-Z0-9._-] and cannot contain '/'
        raw_repo_name = repo_name or os.getenv("GITHUB_REPO", "default")
        self.repo_name = raw_repo_name.replace("/", "_")
        self.raw_repo_name = raw_repo_name  # Keep original for display
        self.branch = branch or "main"
        self.branch_safe_name = self.branch.replace("/", "_").replace("^", "_").replace("~", "_")
        
        # Repository and branch-specific ChromaDB path
        base_chroma_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../chroma")
        chroma_dir_name = f"chroma_db_{self.repo_name}_{self.branch_safe_name}"
        chroma_path = os.path.join(base_chroma_path, chroma_dir_name)
        
        print(f"Building knowledge graph for {raw_repo_name} (branch: {self.branch})", file=sys.stderr)
        print(f"Using ChromaDB path: {chroma_path}", file=sys.stderr)
        
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(f"context_{self.repo_name}_{self.branch_safe_name}")
        
        # Graph data structures
        self.nodes = {}
        self.links = []
        self.people = set()
        self.modules = set()
        self.decisions = set()
        self.commits = []  # List of commit data
        self.files = {}  # Dict of file path -> file data
        
        # Author normalization mapping (lowercase -> original casing)
        self.author_map = {}
        
        # Statistics
        self.stats = {
            'people': 0,
            'modules': 0,
            'decisions': 0,
            'commits': 0,
            'files': 0
        }
    
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
        """Extract module/technology names from text with improved context-aware detection"""
        if not text:
            return set()
        
        # Expanded technology keywords with variations and context
        tech_keywords = {
            # Databases
            'redis': ['redis', 'redis-server', 'redis-cli'],
            'postgres': ['postgres', 'postgresql', 'psql', 'pg'],
            'mongodb': ['mongodb', 'mongo', 'mongoose'],
            'mysql': ['mysql', 'mariadb'],
            'elasticsearch': ['elasticsearch', 'elastic', 'es'],
            'chromadb': ['chromadb', 'chroma'],
            
            # Frontend frameworks
            'react': ['react', 'reactjs', 'react.js'],
            'vue': ['vue', 'vuejs', 'vue.js'],
            'angular': ['angular', 'angularjs'],
            'nextjs': ['nextjs', 'next.js', 'next'],
            
            # Backend frameworks
            'node': ['node', 'nodejs', 'node.js'],
            'express': ['express', 'expressjs', 'express.js'],
            'django': ['django'],
            'flask': ['flask'],
            'fastapi': ['fastapi', 'fast-api'],
            
            # Cloud & Infrastructure
            'docker': ['docker', 'dockerfile', 'docker-compose'],
            'kubernetes': ['kubernetes', 'k8s', 'kubectl'],
            'aws': ['aws', 'amazon-web-services'],
            'azure': ['azure', 'microsoft-azure'],
            'gcp': ['gcp', 'google-cloud', 'google-cloud-platform'],
            
            # APIs & Protocols
            'graphql': ['graphql', 'gql'],
            'rest': ['rest', 'restful', 'rest-api'],
            'grpc': ['grpc'],
            'websocket': ['websocket', 'ws'],
            
            # Auth & Security
            'jwt': ['jwt', 'json-web-token'],
            'oauth': ['oauth', 'oauth2'],
            'auth0': ['auth0'],
            'firebase': ['firebase'],
            
            # Build tools
            'webpack': ['webpack'],
            'vite': ['vite', 'vitejs'],
            'babel': ['babel', 'babeljs'],
            
            # Languages
            'typescript': ['typescript', 'ts'],
            'javascript': ['javascript', 'js'],
            'python': ['python', 'py'],
            
            # AI & ML
            'huggingface': ['huggingface', 'hugging-face', 'hf'],
            'gemini': ['gemini', 'google-gemini'],
            
            # Collaboration
            'slack': ['slack'],
            'github': ['github', 'gh'],
            'notion': ['notion'],
            
            # CSS frameworks
            'tailwind': ['tailwind', 'tailwindcss'],
            'bootstrap': ['bootstrap'],
            
            # Workflow
            'kestra': ['kestra']
        }
        
        modules = set()
        text_lower = text.lower()
        
        # Context-aware detection
        for canonical_name, variations in tech_keywords.items():
            for variation in variations:
                # Use word boundary to avoid partial matches
                pattern = r'\b' + re.escape(variation) + r'\b'
                if re.search(pattern, text_lower):
                    # Check context to avoid false positives
                    # Skip if it's in a URL path or file extension only
                    if not self._is_false_positive_context(text_lower, variation):
                        modules.add(canonical_name.capitalize())
                        break  # Found this tech, move to next
        
        # Also detect from file extensions
        file_extensions = {
            '.py': 'Python',
            '.js': 'Javascript',
            '.ts': 'Typescript',
            '.jsx': 'React',
            '.tsx': 'React',
            '.vue': 'Vue',
            '.go': 'Go',
            '.java': 'Java',
            '.rb': 'Ruby',
            '.php': 'Php',
            '.rs': 'Rust'
        }
        
        for ext, tech in file_extensions.items():
            if ext in text_lower:
                modules.add(tech)
        
        return modules
    
    def _is_false_positive_context(self, text: str, keyword: str) -> bool:
        """Check if keyword appears in a context that suggests false positive"""
        # Find all occurrences
        pattern = r'\b' + re.escape(keyword) + r'\b'
        matches = list(re.finditer(pattern, text))
        
        if not matches:
            return False
        
        # Check context around each match
        for match in matches:
            start = max(0, match.start() - 20)
            end = min(len(text), match.end() + 20)
            context = text[start:end]
            
            # Valid contexts (not false positives)
            valid_indicators = [
                'using', 'with', 'implement', 'add', 'update', 'fix',
                'install', 'upgrade', 'migrate', 'integrate', 'configure',
                'setup', 'deploy', 'build', 'run', 'start', 'stop'
            ]
            
            # If we find valid context, it's not a false positive
            if any(indicator in context for indicator in valid_indicators):
                return False
        
        # If only found in URLs or paths without context, might be false positive
        if all('/' in text[max(0, m.start()-10):min(len(text), m.end()+10)] for m in matches):
            return True
        
        return False
    
    def extract_files_from_text(self, text: str) -> Set[str]:
        """Extract file paths from text"""
        if not text:
            return set()
        
        files = set()
        
        # Match common file path patterns
        # Pattern 1: path/to/file.ext
        file_patterns = re.findall(r'(?:^|[\s"\'])((?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)(?:[\s,;"\']|$)', text)
        files.update(file_patterns)
        
        return files
    
    def extract_decisions(self, text: str, metadata: Dict) -> List[str]:
        """Extract decision keywords from text with improved semantic analysis"""
        if not text:
            return []
        
        # Enhanced decision keywords with semantic categories
        decision_indicators = {
            'decision': ['decided', 'decision', 'conclude', 'conclusion'],
            'choice': ['chose', 'choose', 'selected', 'select', 'pick', 'opt'],
            'change': ['switch', 'migrate', 'refactor', 'redesign', 'rewrite'],
            'strategy': ['approach', 'strategy', 'plan', 'methodology'],
            'architecture': ['architecture', 'design', 'pattern', 'structure']
        }
        
        decisions = []
        text_lower = text.lower()
        
        # Calculate decision score
        decision_score = 0
        matched_categories = set()
        
        for category, keywords in decision_indicators.items():
            if any(keyword in text_lower for keyword in keywords):
                decision_score += 1
                matched_categories.add(category)
        
        # Only create decision nodes for high-quality content
        # Must have: sufficient length, decision keywords, and be from PR/Issue
        doc_type = metadata.get('type', 'unknown')
        min_length = 150  # Increased from 100
        
        # Require at least 2 decision indicators for better quality
        if decision_score >= 2 and len(text) > min_length:
            # Only for PRs and Issues (not commits)
            if doc_type == 'pull_request':
                # Extract PR title or first meaningful line
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                title = lines[0][:80] if lines else 'PR Decision'
                
                # Add category context
                category_str = ', '.join(matched_categories)
                decisions.append(f"PR: {title} [{category_str}]")
                
            elif doc_type == 'issue':
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                title = lines[0][:80] if lines else 'Issue Decision'
                
                category_str = ', '.join(matched_categories)
                decisions.append(f"Issue: {title} [{category_str}]")
        
        return decisions
    
    def calculate_relationship_weight(self, source: str, target: str, interaction_count: int, relationship_type: str) -> float:
        """Calculate weighted relationship strength based on interactions"""
        base_weight = 1.0
        
        # Weight multipliers by relationship type
        type_weights = {
            'authored': 2.0,      # Strong connection
            'contributed': 1.5,   # Medium-strong
            'modified': 1.5,      # Medium-strong
            'uses': 1.2,          # Medium
            'decided': 1.8,       # Strong
            'related': 1.0        # Base
        }
        
        type_multiplier = type_weights.get(relationship_type, 1.0)
        
        # Frequency multiplier (logarithmic to avoid extreme values)
        import math
        frequency_multiplier = 1.0 + math.log(1 + interaction_count)
        
        return base_weight * type_multiplier * frequency_multiplier
    
    def compute_node_importance(self, node_id: str, connections: int, node_type: str) -> float:
        """Compute importance score for a node based on connections and type"""
        import math
        
        # Base importance by type
        type_importance = {
            'person': 1.5,    # People are important
            'file': 1.3,      # Files are central
            'commit': 1.0,    # Commits are numerous
            'module': 1.4,    # Technologies are important
            'decision': 1.2   # Decisions are valuable
        }
        
        base_score = type_importance.get(node_type, 1.0)
        
        # Connection-based score (using logarithmic scale)
        connection_score = 1.0 + math.log(1 + connections)
        
        return base_score * connection_score
    
    
    def build_graph(self) -> Dict[str, Any]:
        """Build knowledge graph from ChromaDB data with commits and files"""
        print("Building enhanced knowledge graph...", file=sys.stderr)
        
        # Get all documents from ChromaDB
        try:
            results = self.collection.get(
                include=['documents', 'metadatas']
            )
            
            if not results or not results['documents']:
                print("No documents found in ChromaDB", file=sys.stderr)
                return {
                    "nodes": [], 
                    "links": [], 
                    "branch": self.branch,
                    "repository": self.raw_repo_name
                }
            
            print(f"Processing {len(results['documents'])} documents...", file=sys.stderr)
            
            # Track relationships
            person_to_modules = defaultdict(set)
            person_to_decisions = defaultdict(set)
            person_to_commits = defaultdict(list)
            person_to_files = defaultdict(set)
            module_to_decisions = defaultdict(set)
            commit_to_files = defaultdict(set)
            file_contributors = defaultdict(set)
            
            # Process each document
            for i, (doc, metadata) in enumerate(zip(results['documents'], results['metadatas'])):
                raw_author = metadata.get('author', 'Unknown')
                doc_type = metadata.get('type', 'unknown')
                
                # Normalize author name to handle case variations
                author = self.normalize_author(raw_author)
                
                # Add person node
                if author:
                    self.people.add(author)
                
                # Extract modules
                modules = self.extract_modules(doc)
                self.modules.update(modules)
                
                # Extract decisions (only from PRs and Issues now)
                decisions = self.extract_decisions(doc, metadata)
                self.decisions.update(decisions)
                
                # Process commits specially
                if doc_type == 'commit':
                    # Extract commit info from document and metadata
                    commit_sha = metadata.get('url', '').split('/')[-1] if metadata.get('url') else f"commit_{i}"
                    commit_message = doc.split('\n')[0].replace('Commit: ', '') if doc else 'Unknown commit'
                    commit_date = metadata.get('date', '')
                    commit_url = metadata.get('url', '')
                    
                    # Extract files from commit document
                    # The document format is: "Commit: {message}\nAuthor: {author}\nFiles: {files}"
                    files_in_commit = set()
                    if 'Files: ' in doc:
                        files_line = doc.split('Files: ')[-1]
                        files_in_commit = set([f.strip() for f in files_line.split(',') if f.strip()])
                    
                    # Also try to extract files from text
                    files_in_commit.update(self.extract_files_from_text(doc))
                    
                    commit_data = {
                        'sha': commit_sha[:7] if len(commit_sha) > 7 else commit_sha,  # Short SHA
                        'full_sha': commit_sha,
                        'message': commit_message[:100],  # Truncate long messages
                        'author': author,
                        'date': commit_date,
                        'url': commit_url,
                        'files': list(files_in_commit)
                    }
                    self.commits.append(commit_data)
                    
                    # Track relationships
                    if author:
                        person_to_commits[author].append(commit_data)
                    
                    # Track files
                    for file_path in files_in_commit:
                        if file_path and len(file_path) > 0:
                            commit_to_files[commit_sha].add(file_path)
                            if author:
                                file_contributors[file_path].add(author)
                            
                            # Add file to files dict
                            if file_path not in self.files:
                                self.files[file_path] = {
                                    'path': file_path,
                                    'contributors': set(),
                                    'commits': []
                                }
                            self.files[file_path]['contributors'].add(author)
                            self.files[file_path]['commits'].append(commit_sha)
                
                # Build relationships for all doc types
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
            
            # Add people nodes with enhanced info
            for person in self.people:
                commit_count = len(person_to_commits.get(person, []))
                file_count = len(person_to_files.get(person, set()))
                
                self.nodes[f"person-{person}"] = {
                    "id": f"person-{person}",
                    "group": 1,
                    "label": f"@{person}",
                    "type": "person",
                    "commits": commit_count,
                    "files": file_count
                }
            
            # Add module nodes
            for module in self.modules:
                self.nodes[f"module-{module}"] = {
                    "id": f"module-{module}",
                    "group": 2,
                    "label": module,
                    "type": "module"
                }
            
            # Add decision nodes (limit to top 15 to avoid clutter)
            for i, decision in enumerate(list(self.decisions)[:15]):
                decision_id = f"decision-{i}"
                self.nodes[decision_id] = {
                    "id": decision_id,
                    "group": 3,
                    "label": decision[:60] + "..." if len(decision) > 60 else decision,
                    "type": "decision",
                    "full_text": decision
                }
            
            # Add commit nodes (limit to most recent 30 commits)
            for i, commit in enumerate(self.commits[:30]):
                commit_id = f"commit-{commit['sha']}"
                self.nodes[commit_id] = {
                    "id": commit_id,
                    "group": 4,
                    "label": f"{commit['sha']}: {commit['message'][:40]}",
                    "type": "commit",
                    "sha": commit['sha'],
                    "full_sha": commit['full_sha'],
                    "message": commit['message'],
                    "date": commit['date'],
                    "url": commit['url'],
                    "files_count": len(commit['files'])
                }
            
            # Add file nodes (limit to top 25 most-changed files)
            sorted_files = sorted(
                self.files.items(), 
                key=lambda x: len(x[1]['commits']), 
                reverse=True
            )[:25]
            
            for file_path, file_data in sorted_files:
                # Create a safe ID from file path
                file_id = f"file-{hash(file_path) % 100000}"
                filename = file_path.split('/')[-1] if '/' in file_path else file_path
                extension = filename.split('.')[-1] if '.' in filename else ''
                
                self.nodes[file_id] = {
                    "id": file_id,
                    "group": 5,
                    "label": filename,
                    "type": "file",
                    "path": file_path,
                    "extension": extension,
                    "contributors": len(file_data['contributors']),
                    "commits": len(file_data['commits'])
                }
            
            # Create links with weighted relationships
            # Person -> Module
            for person, modules in person_to_modules.items():
                for module in modules:
                    weight = self.calculate_relationship_weight(
                        f"person-{person}", 
                        f"module-{module}", 
                        1,  # Base interaction count
                        'uses'
                    )
                    self.links.append({
                        "source": f"person-{person}",
                        "target": f"module-{module}",
                        "value": weight,
                        "type": "uses"
                    })
            
            # Person -> Decision
            for person, decisions in person_to_decisions.items():
                for decision in list(decisions)[:15]:
                    decision_idx = list(self.decisions).index(decision) if decision in list(self.decisions)[:15] else None
                    if decision_idx is not None:
                        decision_id = f"decision-{decision_idx}"
                        weight = self.calculate_relationship_weight(
                            f"person-{person}",
                            decision_id,
                            1,
                            'decided'
                        )
                        self.links.append({
                            "source": f"person-{person}",
                            "target": decision_id,
                            "value": weight,
                            "type": "decided"
                        })
            
            # Module -> Decision
            for module, decisions in module_to_decisions.items():
                for decision in decisions:
                    decision_idx = list(self.decisions).index(decision) if decision in list(self.decisions)[:15] else None
                    if decision_idx is not None:
                        decision_id = f"decision-{decision_idx}"
                        weight = self.calculate_relationship_weight(
                            f"module-{module}",
                            decision_id,
                            1,
                            'related'
                        )
                        self.links.append({
                            "source": f"module-{module}",
                            "target": decision_id,
                            "value": weight,
                            "type": "related"
                        })
            
            # Person -> Commit (show recent commits)
            for person, commits in person_to_commits.items():
                for commit in commits[:30]:  # Limit to 30 most recent
                    commit_id = f"commit-{commit['sha']}"
                    if commit_id in self.nodes:
                        weight = self.calculate_relationship_weight(
                            f"person-{person}",
                            commit_id,
                            len(commits),  # Total commit count as interaction
                            'authored'
                        )
                        self.links.append({
                            "source": f"person-{person}",
                            "target": commit_id,
                            "value": weight,
                            "type": "authored"
                        })
            
            # Commit -> File
            sorted_files_dict = {file_path: file_data for file_path, file_data in sorted_files}
            for commit in self.commits[:30]:
                commit_id = f"commit-{commit['sha']}"
                if commit_id in self.nodes:
                    for file_path in commit['files']:
                        if file_path in sorted_files_dict:
                            file_id = f"file-{hash(file_path) % 100000}"
                            if file_id in self.nodes:
                                weight = self.calculate_relationship_weight(
                                    commit_id,
                                    file_id,
                                    1,
                                    'modified'
                                )
                                self.links.append({
                                    "source": commit_id,
                                    "target": file_id,
                                    "value": weight,
                                    "type": "modified"
                                })
            
            # Person -> File (contributed to)
            for file_path, file_data in sorted_files:
                file_id = f"file-{hash(file_path) % 100000}"
                if file_id in self.nodes:
                    for contributor in file_data['contributors']:
                        if contributor:
                            contribution_count = len([c for c in file_data['commits'] 
                                                     if c in [commit['full_sha'] for commit in person_to_commits.get(contributor, [])]])
                            weight = self.calculate_relationship_weight(
                                f"person-{contributor}",
                                file_id,
                                contribution_count,
                                'contributed'
                            )
                            self.links.append({
                                "source": f"person-{contributor}",
                                "target": file_id,
                                "value": weight,
                                "type": "contributed"
                            })
            
            # Add importance scores to nodes
            for node_id, node_data in self.nodes.items():
                # Count connections for this node
                connections = sum(1 for link in self.links if link['source'] == node_id or link['target'] == node_id)
                importance = self.compute_node_importance(node_id, connections, node_data.get('type', 'unknown'))
                node_data['importance'] = importance
                node_data['connections'] = connections
            
            
            # Update statistics
            self.stats['people'] = len(self.people)
            self.stats['modules'] = len(self.modules)
            self.stats['decisions'] = len(self.decisions)
            self.stats['commits'] = len(self.commits)
            self.stats['files'] = len(self.files)
            
            print(f"Graph built: {len(self.nodes)} nodes, {len(self.links)} links", file=sys.stderr)
            print(f"Stats: {self.stats['people']} people, {self.stats['commits']} commits, {self.stats['files']} files", file=sys.stderr)
            
            return {
                "nodes": list(self.nodes.values()),
                "links": self.links,
                "stats": self.stats,
                "branch": self.branch,
                "repository": self.raw_repo_name
            }
        
        except Exception as e:
            print(f"Error building graph: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return {
                "nodes": [], 
                "links": [], 
                "error": str(e),
                "branch": self.branch,
                "repository": self.raw_repo_name
            }


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
