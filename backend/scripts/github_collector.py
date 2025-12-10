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

load_dotenv()

class GitHubCollector:
    """Collects context from GitHub repository and stores in ChromaDB"""
    
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
        self.branch_safe_name = self.branch.replace("/", "_").replace("^", "_").replace("~", "_")
        chroma_path = f"./chroma_db_{self.repo_safe_name}_{self.branch_safe_name}"
        print(f"Using ChromaDB path: {chroma_path}", file=sys.stderr)
        
        # Initialize ChromaDB with repository and branch-specific path
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(f"context_{self.repo_safe_name}_{self.branch_safe_name}")
        
        # Initialize embedding model
        print("Loading embedding model...", file=sys.stderr)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Embedding model loaded!", file=sys.stderr)
    
    def _handle_rate_limit(self, e: RateLimitExceededException):
        """Handle GitHub API rate limiting"""
        reset_time = self.github.get_rate_limit().core.reset
        sleep_time = (reset_time - datetime.now()).total_seconds() + 10
        print(f"Rate limit exceeded. Sleeping for {sleep_time} seconds...", file=sys.stderr)
        time.sleep(min(sleep_time, 300))  # Max 5 minutes wait
    
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

    
    def list_branches(self):
        """List all branches in the repository"""
        print(f"Listing branches for {self.github_repo}...", file=sys.stderr)
        try:
            branches = self.repo.get_branches()
            branch_list = []
            for branch in branches:
                branch_list.append({
                    "name": branch.name,
                    "commit": {
                        "sha": branch.commit.sha,
                        "url": branch.commit.html_url
                    },
                    "protected": branch.protected
                })
            print(f"Found {len(branch_list)} branches", file=sys.stderr)
            return {"branches": branch_list}
        except Exception as e:
            print(f"Error listing branches: {e}", file=sys.stderr)
            return {"branches": [], "error": str(e)}

if __name__ == "__main__":
    try:
        # Check if --list-branches flag is present
        if len(sys.argv) > 1 and sys.argv[1] == '--list-branches':
            repo_name = sys.argv[2] if len(sys.argv) > 2 else None
            collector = GitHubCollector(repo_name=repo_name)
            result = collector.list_branches()
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
