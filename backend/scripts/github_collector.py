import os
import sys
import json
import time
from datetime import datetime
from typing import List, Dict, Any
from github import Github
from github.GithubException import RateLimitExceededException, GithubException
from dotenv import load_dotenv
import chromadb
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

load_dotenv()

class GitHubCollector:
    """Collects context from GitHub repository and stores in ChromaDB"""
    
    @staticmethod
    def sanitize_branch_name(branch: str) -> str:
        """Sanitize branch name to be valid for ChromaDB collection names.
        ChromaDB requires names with 3-512 characters from [a-zA-Z0-9._-],
        starting and ending with [a-zA-Z0-9].
        """
        if not branch:
            return "main"
        
        # Replace invalid characters with underscores
        import re
        sanitized = re.sub(r'[^a-zA-Z0-9._-]', '_', branch)
        
        # Ensure it starts and ends with alphanumeric
        sanitized = sanitized.strip('._-')
        
        # Ensure minimum length of 3
        if len(sanitized) < 3:
            sanitized = f"branch_{sanitized}"
        
        # Ensure maximum length of 512
        if len(sanitized) > 512:
            sanitized = sanitized[:512]
        
        return sanitized
    
    def __init__(self, repo_name: str = None, branch: str = None):
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.github_repo = repo_name or os.getenv("GITHUB_REPO")
        self.branch = branch or "main"
        
        if not self.github_token:
            raise ValueError("GITHUB_TOKEN not found in environment variables")
        if not self.github_repo:
            raise ValueError("GITHUB_REPO not found in environment variables")
        
        # Initialize GitHub client with retry
        print(f"Initializing GitHub client for {self.github_repo} (branch: {self.branch})...", file=sys.stderr)
        self.github = Github(self.github_token, per_page=100, retry=3)
        self.repo = self.github.get_repo(self.github_repo)
        
        # Repository-specific ChromaDB path with branch
        self.repo_safe_name = self.github_repo.replace("/", "_")
        self.branch_safe_name = self.sanitize_branch_name(self.branch)
        
        # New centralized ChromaDB path
        base_chroma_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../chroma")
        os.makedirs(base_chroma_path, exist_ok=True)
        
        chroma_dir_name = f"chroma_db_{self.repo_safe_name}_{self.branch_safe_name}"
        chroma_path = os.path.join(base_chroma_path, chroma_dir_name)
        
        print(f"Using ChromaDB path: {chroma_path}", file=sys.stderr)
        
        # Initialize ChromaDB with repository and branch-specific path
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(f"context_{self.repo_safe_name}_{self.branch_safe_name}")
        
        # Initialize embedding model
        print("Loading embedding model...", file=sys.stderr)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Embedding model loaded!", file=sys.stderr)
        
        # Initialize MongoDB client (optional, for metadata storage)
        self.mongo_client = None
        self.mongo_db = None
        try:
            mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/contextkeeper")
            self.mongo_client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            # Test connection
            self.mongo_client.admin.command('ping')
            self.mongo_db = self.mongo_client.get_database()
            print("MongoDB connected for metadata storage", file=sys.stderr)
        except (ConnectionFailure, Exception) as e:
            print(f"MongoDB not available (metadata won't be stored): {e}", file=sys.stderr)
            self.mongo_client = None
            self.mongo_db = None

    
    def _handle_rate_limit(self, e: RateLimitExceededException):
        """Handle GitHub API rate limiting"""
        reset_time = self.github.get_rate_limit().core.reset
        sleep_time = (reset_time - datetime.now()).total_seconds() + 10
        print(f"Rate limit exceeded. Sleeping for {sleep_time} seconds...", file=sys.stderr)
        time.sleep(min(sleep_time, 300))  # Max 5 minutes wait
    
    def _save_metadata_to_mongodb(self, latest_commit: Dict[str, Any] = None):
        """Save repository metadata to MongoDB"""
        if self.mongo_db is None:
            return
        
        try:
            metadata_collection = self.mongo_db['repository_metadata']
            
            metadata = {
                "repository": self.github_repo,
                "branch": self.branch,
                "latest_commit_sha": latest_commit.get("sha") if latest_commit else None,
                "latest_commit_date": latest_commit.get("date") if latest_commit else None,
                "last_synced": datetime.now().isoformat()
            }
            
            # Upsert metadata
            metadata_collection.update_one(
                {"repository": self.github_repo, "branch": self.branch},
                {"$set": metadata},
                upsert=True
            )
            print(f"Saved metadata to MongoDB for {self.github_repo}/{self.branch}", file=sys.stderr)
        except Exception as e:
            print(f"Failed to save metadata to MongoDB: {e}", file=sys.stderr)
    
    @staticmethod
    def check_for_updates(repo_name: str, branch: str) -> Dict[str, Any]:
        """Check if there are new commits on GitHub compared to local MongoDB metadata"""
        try:
            mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/contextkeeper")
            mongo_client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            mongo_db = mongo_client.get_database()
            metadata_collection = mongo_db['repository_metadata']
            
            # Get local metadata
            local_metadata = metadata_collection.find_one({
                "repository": repo_name,
                "branch": branch
            })
            
            if not local_metadata:
                return {
                    "has_updates": True,
                    "reason": "No local metadata found",
                    "local_commit": None,
                    "remote_commit": None
                }
            
            # Get remote latest commit
            github_token = os.getenv("GITHUB_TOKEN")
            if not github_token:
                 return {"has_updates": False, "error": "GITHUB_TOKEN missing"}
                 
            github = Github(github_token)
            repo = github.get_repo(repo_name)
            latest_commit = repo.get_commits(sha=branch)[0]
            
            current_sha = latest_commit.sha
            stored_sha = local_metadata.get("latest_commit_sha")
            
            has_updates = stored_sha != current_sha
            
            return {
                "update_available": has_updates, # Normalized key for frontend
                "has_updates": has_updates,      # Legacy key
                "local_commit": stored_sha,
                "remote_commit": current_sha,
                "local_date": local_metadata.get("latest_commit_date"),
                "remote_date": latest_commit.commit.author.date.isoformat() if latest_commit.commit.author else None
            }
        except Exception as e:
            return {
                "update_available": False,
                "has_updates": False,
                "error": str(e)
            }

    
    def collect_commits(self, max_commits: int = 100) -> List[Dict[str, Any]]:
        """Fetch recent commits from the repository with retry logic"""
        print(f"Fetching up to {max_commits} commits from branch {self.branch}...", file=sys.stderr)
        commits_data = []
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Fetch commits from specific branch
                commits = self.repo.get_commits(sha=self.branch)[:max_commits]
                
                for commit in commits:
                    try:
                        # Use GitHub username (login) for consistency, fallback to Git author name
                        author_name = "Unknown"
                        if commit.author and commit.author.login:
                            # Prefer GitHub username for consistency
                            author_name = commit.author.login
                        elif commit.commit.author and commit.commit.author.name:
                            # Fallback to Git author name
                            author_name = commit.commit.author.name
                        
                        commit_data = {
                            "type": "commit",
                            "sha": commit.sha,
                            "message": commit.commit.message,
                            "author": author_name,
                            "date": commit.commit.author.date.isoformat() if commit.commit.author else None,
                            "url": commit.html_url,
                            "files_changed": [f.filename for f in commit.files] if commit.files else []
                        }
                        commits_data.append(commit_data)
                    except Exception as e:
                        print(f"Error processing commit {commit.sha}: {e}", file=sys.stderr)
                        continue
                
                print(f"Fetched {len(commits_data)} commits", file=sys.stderr)
                break
            except RateLimitExceededException as e:
                self._handle_rate_limit(e)
                if attempt == max_retries - 1:
                    print(f"Failed to fetch commits after {max_retries} attempts", file=sys.stderr)
            except GithubException as e:
                print(f"GitHub API error fetching commits: {e}", file=sys.stderr)
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    break
            except Exception as e:
                print(f"Unexpected error fetching commits: {e}", file=sys.stderr)
                break
        
        return commits_data
    
    def collect_pull_requests(self, max_prs: int = 50) -> List[Dict[str, Any]]:
        """Fetch pull requests from the repository"""
        print(f"Fetching up to {max_prs} pull requests...", file=sys.stderr)
        prs_data = []
        
        try:
            prs = self.repo.get_pulls(state='all', sort='updated', direction='desc')[:max_prs]
            
            for pr in prs:
                # Get PR comments
                comments = []
                try:
                    for comment in pr.get_comments()[:10]:  # Limit to 10 comments per PR
                        comments.append({
                            "author": comment.user.login if comment.user else "Unknown",
                            "body": comment.body,
                            "created_at": comment.created_at.isoformat()
                        })
                except:
                    pass
                
                pr_data = {
                    "type": "pull_request",
                    "number": pr.number,
                    "title": pr.title,
                    "body": pr.body or "",
                    "author": pr.user.login if pr.user else "Unknown",
                    "state": pr.state,
                    "created_at": pr.created_at.isoformat(),
                    "updated_at": pr.updated_at.isoformat(),
                    "url": pr.html_url,
                    "comments": comments
                }
                prs_data.append(pr_data)
            
            print(f"Fetched {len(prs_data)} pull requests", file=sys.stderr)
        except Exception as e:
            print(f"Error fetching pull requests: {e}", file=sys.stderr)
        
        return prs_data
    
    def collect_issues(self, max_issues: int = 50) -> List[Dict[str, Any]]:
        """Fetch issues from the repository"""
        print(f"Fetching up to {max_issues} issues...", file=sys.stderr)
        issues_data = []
        
        try:
            issues = self.repo.get_issues(state='all', sort='updated', direction='desc')[:max_issues]
            
            for issue in issues:
                # Skip pull requests (they appear in issues too)
                if issue.pull_request:
                    continue
                
                # Get issue comments
                comments = []
                try:
                    for comment in issue.get_comments()[:10]:  # Limit to 10 comments per issue
                        comments.append({
                            "author": comment.user.login if comment.user else "Unknown",
                            "body": comment.body,
                            "created_at": comment.created_at.isoformat()
                        })
                except:
                    pass
                
                issue_data = {
                    "type": "issue",
                    "number": issue.number,
                    "title": issue.title,
                    "body": issue.body or "",
                    "author": issue.user.login if issue.user else "Unknown",
                    "state": issue.state,
                    "created_at": issue.created_at.isoformat(),
                    "updated_at": issue.updated_at.isoformat(),
                    "url": issue.html_url,
                    "labels": [label.name for label in issue.labels],
                    "comments": comments
                }
                issues_data.append(issue_data)
            
            print(f"Fetched {len(issues_data)} issues", file=sys.stderr)
        except Exception as e:
            print(f"Error fetching issues: {e}", file=sys.stderr)
        
        return issues_data
    
    def collect_readme(self) -> Dict[str, Any]:
        """Fetch README file from the repository"""
        print("Fetching README...", file=sys.stderr)
        
        try:
            readme = self.repo.get_readme()
            readme_data = {
                "type": "readme",
                "content": readme.decoded_content.decode('utf-8'),
                "url": readme.html_url,
                "path": readme.path
            }
            print("README fetched successfully", file=sys.stderr)
            return readme_data
        except Exception as e:
            print(f"Error fetching README: {e}", file=sys.stderr)
            return None
    
    def store_in_chromadb(self, data_items: List[Dict[str, Any]]):
        """Store collected data in ChromaDB with embeddings"""
        if not data_items:
            print("No data to store", file=sys.stderr)
            return
        
        print(f"Storing {len(data_items)} items in ChromaDB...", file=sys.stderr)
        
        documents = []
        metadatas = []
        ids = []
        
        for item in data_items:
            # Create document text based on type
            if item["type"] == "commit":
                doc_text = f"Commit: {item['message']}\nAuthor: {item['author']}\nFiles: {', '.join(item['files_changed'])}"
                doc_id = f"commit_{item['sha']}"
            elif item["type"] == "pull_request":
                comments_text = "\n".join([f"{c['author']}: {c['body']}" for c in item.get('comments', [])])
                doc_text = f"PR #{item['number']}: {item['title']}\n{item['body']}\nAuthor: {item['author']}\nComments:\n{comments_text}"
                doc_id = f"pr_{item['number']}"
            elif item["type"] == "issue":
                comments_text = "\n".join([f"{c['author']}: {c['body']}" for c in item.get('comments', [])])
                doc_text = f"Issue #{item['number']}: {item['title']}\n{item['body']}\nAuthor: {item['author']}\nLabels: {', '.join(item.get('labels', []))}\nComments:\n{comments_text}"
                doc_id = f"issue_{item['number']}"
            elif item["type"] == "readme":
                doc_text = f"README:\n{item['content']}"
                doc_id = "readme"
            else:
                continue
            
            documents.append(doc_text)
            ids.append(doc_id)
            
            # Store metadata
            metadata = {
                "type": item["type"],
                "url": item.get("url", ""),
                "author": item.get("author", ""),
                "date": item.get("date") or item.get("created_at", ""),
                "branch": self.branch
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
            print(f"Successfully stored {len(documents)} documents in ChromaDB", file=sys.stderr)
        except Exception as e:
            print(f"Error storing in ChromaDB: {e}", file=sys.stderr)
    
    def collect_all(self):
        """Collect all data from GitHub and store in ChromaDB"""
        print(f"Starting GitHub data collection for {self.github_repo} (branch: {self.branch})...", file=sys.stderr)
        
        all_data = []
        
        # Collect commits
        commits = self.collect_commits(max_commits=200)
        all_data.extend(commits)
        
        # Collect pull requests
        prs = self.collect_pull_requests(max_prs=50)
        all_data.extend(prs)
        
        # Collect issues
        issues = self.collect_issues(max_issues=50)
        all_data.extend(issues)
        
        # Collect README
        readme = self.collect_readme()
        if readme:
            all_data.append(readme)
        
        # Store everything in ChromaDB
        self.store_in_chromadb(all_data)
        
        # Save metadata to MongoDB (if available)
        if self.mongo_db is not None and commits:
            self._save_metadata_to_mongodb(commits[0] if commits else None)
        
        # Return summary
        summary = {
            "total_items": len(all_data),
            "commits": len(commits),
            "pull_requests": len(prs),
            "issues": len(issues),
            "readme": 1 if readme else 0,

            "branch": self.branch,
            "timestamp": datetime.now().isoformat()
        }
        
        return summary

    
    @staticmethod
    def check_chromadb_exists(repo_name: str, branch: str = None) -> dict:
        """Check if ChromaDB exists for a repository/branch"""
        repo_safe_name = repo_name.replace("/", "_")
        
        if branch:
            branch_safe_name = GitHubCollector.sanitize_branch_name(branch)
            base_chroma_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../chroma")
            chroma_dir_name = f"chroma_db_{repo_safe_name}_{branch_safe_name}"
            chroma_path = os.path.join(base_chroma_path, chroma_dir_name)
            collection_name = f"context_{repo_safe_name}_{branch_safe_name}"
        else:
            # Check if any ChromaDB exists for this repo in the new location
            import glob
            base_chroma_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../chroma")
            pattern = os.path.join(base_chroma_path, f"chroma_db_{repo_safe_name}_*")
            existing_dbs = glob.glob(pattern)
            return {
                "exists": len(existing_dbs) > 0,
                "databases": existing_dbs,
                "count": len(existing_dbs)
            }
        
        if not os.path.exists(chroma_path):
            return {"exists": False, "path": chroma_path, "count": 0}
        
        try:
            client = chromadb.PersistentClient(path=chroma_path)
            collection = client.get_or_create_collection(collection_name)
            count = collection.count()
            return {
                "exists": True,
                "path": chroma_path,
                "count": count,
                "status": "ok"
            }
        except Exception as e:
            return {
                "exists": False,
                "path": chroma_path,
                "count": 0,
                "error": str(e)
            }
    
    def get_cached_branches_from_mongodb(self, repo_name: str) -> List[Dict]:
        """Get list of branches from MongoDB metadata (Cache-First)"""
        if self.mongo_db is None and self.mongo_client is None:
             # Try connecting if not already connected
             try:
                mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/contextkeeper")
                self.mongo_client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=2000)
                self.mongo_db = self.mongo_client.get_database()
             except:
                return []
        
        if self.mongo_db is None:
            return []
            
        try:
            metadata_collection = self.mongo_db['repository_metadata']
            entries = metadata_collection.find({"repository": repo_name})
            
            branches = []
            for entry in entries:
                branches.append({
                    "name": entry['branch'],
                    "cached": True,
                    "last_synced": entry.get('last_synced'),
                    "synced": True  # If it's in metadata, we assume we synced it
                })
            return branches
        except Exception as e:
            print(f"Error fetching branches from MongoDB: {e}", file=sys.stderr)
            return []

    def list_branches(self, check_cache: bool = True, local_only: bool = False):
        """List all branches in the repository"""
        print(f"Listing branches for {self.github_repo}...", file=sys.stderr)
        
        # If local_only is True, strictly fetch from MongoDB/Cache
        if local_only:
            print("Mode: Local Cache Only", file=sys.stderr)
            cached_branches = self.get_cached_branches_from_mongodb(self.github_repo)
            if cached_branches:
                print(f"Found {len(cached_branches)} branches in local cache", file=sys.stderr)
                return {"branches": cached_branches, "from_cache": True}
            else:
                 # Fallback to checking folders if MongoDB is empty? 
                 # Maybe not. If we want strict cache-first, we return empty if nothing in DB.
                 # But let's keep the folder check as a backup for now.
                 pass

        # Check if we have cached branches in ChromaDB (File System Check)
        if check_cache or local_only:
            cache_check = self.check_chromadb_exists(self.github_repo)
            if cache_check.get("exists") and cache_check.get("count", 0) > 0:
                # Extract branch names from existing ChromaDB directories
                cached_branches = []
                for db_path in cache_check.get("databases", []):
                    # Extract branch name from path like "./chroma_db_owner_repo_branchname"
                    # Remove the prefix to get the sanitized branch name
                    prefix = os.path.join(base_chroma_path, f"chroma_db_{self.repo_safe_name}_")
                    if db_path.startswith(prefix):
                        sanitized_branch = db_path[len(prefix):]
                        # Skip if it looks like a path (contains backslashes or forward slashes after sanitization)
                        if "\\" in sanitized_branch or "/" in sanitized_branch:
                            print(f"Skipping invalid cached branch path: {db_path}", file=sys.stderr)
                            continue
                        # Only add if it's a valid identifier
                        if sanitized_branch and len(sanitized_branch) >= 3:
                            cached_branches.append({
                                "name": sanitized_branch,
                                "cached": True,
                                "db_path": db_path
                            })
                
                if cached_branches:
                    print(f"Found {len(cached_branches)} cached branches (filesystem)", file=sys.stderr)
                    return {"branches": cached_branches, "from_cache": True}
        
        if local_only:
             # If we reached here in local_only mode, we found nothing suitable
             return {"branches": [], "from_cache": True, "message": "No local branches found"}
        
        # Fetch from GitHub if no cache or cache check disabled
        try:
            branches = self.repo.get_branches()
            branch_list = []
            for branch in branches:
                # Check if this branch has ChromaDB
                db_check = self.check_chromadb_exists(self.github_repo, branch.name)
                branch_list.append({
                    "name": branch.name,
                    "commit": {
                        "sha": branch.commit.sha,
                        "url": branch.commit.html_url
                    },
                    "protected": branch.protected,
                    "synced": db_check.get("exists", False),
                    "doc_count": db_check.get("count", 0)
                })
            print(f"Found {len(branch_list)} branches from GitHub", file=sys.stderr)
            return {"branches": branch_list, "from_cache": False}
        except Exception as e:
            print(f"Error listing branches: {e}", file=sys.stderr)
            return {"branches": [], "error": str(e), "from_cache": False}
    
    def sync_all_branches(self, max_branches: int = 10):
        """Sync data from all branches in the repository"""
        print(f"Syncing all branches for {self.github_repo}...", file=sys.stderr)
        
        # Get all branches
        branches_result = self.list_branches(check_cache=False)
        branches = branches_result.get("branches", [])
        
        if not branches:
            return {
                "error": "No branches found",
                "synced_branches": [],
                "total_branches": 0
            }
        
        # Limit number of branches to sync
        branches_to_sync = branches[:max_branches]
        synced_branches = []
        errors = []
        
        for branch_info in branches_to_sync:
            branch_name = branch_info["name"]
            print(f"Syncing branch: {branch_name}...", file=sys.stderr)
            
            try:
                # Create a new collector instance for this branch
                branch_collector = GitHubCollector(repo_name=self.github_repo, branch=branch_name)
                summary = branch_collector.collect_all()
                synced_branches.append({
                    "branch": branch_name,
                    "success": True,
                    "summary": summary
                })
                print(f"Successfully synced branch {branch_name}", file=sys.stderr)
            except Exception as e:
                error_msg = f"Failed to sync branch {branch_name}: {str(e)}"
                print(error_msg, file=sys.stderr)
                errors.append(error_msg)
                synced_branches.append({
                    "branch": branch_name,
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "total_branches": len(branches),
            "synced_count": len([b for b in synced_branches if b["success"]]),
            "failed_count": len(errors),
            "synced_branches": synced_branches,
            "errors": errors,
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    try:
        # Check if --list-branches flag is present
        if len(sys.argv) > 1 and sys.argv[1] == '--list-branches':
            repo_name = sys.argv[2] if len(sys.argv) > 2 else None
            check_cache = sys.argv[3] != '--no-cache' if len(sys.argv) > 3 else True
            local_only = '--local-only' in sys.argv
            
            collector = GitHubCollector(repo_name=repo_name)
            result = collector.list_branches(check_cache=check_cache, local_only=local_only)
            print(json.dumps(result))
        # Check if --sync-all-branches flag is present
        elif len(sys.argv) > 1 and sys.argv[1] == '--sync-all-branches':
            repo_name = sys.argv[2] if len(sys.argv) > 2 else None
            collector = GitHubCollector(repo_name=repo_name)
            result = collector.sync_all_branches()
            print(json.dumps(result))
        # Check if --check-updates flag is present
        elif len(sys.argv) > 1 and sys.argv[1] == '--check-updates':
            repo_name = sys.argv[2] if len(sys.argv) > 2 else None
            branch = sys.argv[3] if len(sys.argv) > 3 else 'main'
            result = GitHubCollector.check_for_updates(repo_name, branch)
            print(json.dumps(result))
        # Check if --check-db flag is present
        elif len(sys.argv) > 1 and sys.argv[1] == '--check-db':

            repo_name = sys.argv[2] if len(sys.argv) > 2 else None
            branch = sys.argv[3] if len(sys.argv) > 3 else None
            result = GitHubCollector.check_chromadb_exists(repo_name, branch)
            print(json.dumps(result))
        else:
            # Get repository name and branch from command line or environment
            repo_name = sys.argv[1] if len(sys.argv) > 1 else None
            branch = sys.argv[2] if len(sys.argv) > 2 else None
            
            collector = GitHubCollector(repo_name=repo_name, branch=branch)
            summary = collector.collect_all()
            print(json.dumps(summary))
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
