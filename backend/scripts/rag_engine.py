import sys
import os
import json
import chromadb
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from datetime import datetime

load_dotenv()

# Setup
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
if not HUGGINGFACE_API_KEY:
     # Fallback or warning - for now just print to stderr
     print("Warning: HUGGINGFACE_API_KEY not found in environment", file=sys.stderr)

class ContextRAG:
    def __init__(self, repo_name: str = None):
        # Get repository name for ChromaDB path and sanitize it
        # ChromaDB collection names must match [a-zA-Z0-9._-] and cannot contain '/'
        raw_repo_name = repo_name or os.getenv("GITHUB_REPO", "default")
        self.repo_name = raw_repo_name.replace("/", "_")
        
        # Repository-specific ChromaDB path
        chroma_path = f"./chroma_db_{self.repo_name}"
        print(f"Using ChromaDB path: {chroma_path}", file=sys.stderr)
        
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(f"context_{self.repo_name}")
        
        # Validate Hugging Face API key
        if not HUGGINGFACE_API_KEY:
            print("Warning: HUGGINGFACE_API_KEY not found, queries may fail", file=sys.stderr)
        
        self.client = InferenceClient(api_key=HUGGINGFACE_API_KEY)
        self.model_id = "meta-llama/Llama-3.2-3B-Instruct"
        
        # Initialize embedding model for better query matching
        print("Loading embedding model...", file=sys.stderr)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print(f"Embedding model loaded! Repository: {self.repo_name}", file=sys.stderr)

    def query(self, question: str):
        try:
            # Check if ChromaDB has any data
            count = self.collection.count()
            print(f"ChromaDB contains {count} documents", file=sys.stderr)
            
            if count == 0:
                return json.dumps({
                    "answer": "No context data available. Please run the GitHub collector first to populate the database with your repository data.",
                    "sources": [],
                    "relatedPeople": [],
                    "timeline": [],
                    "status": "empty_db"
                })
            
            # 1. Generate embedding for the question
            print("Generating query embedding...", file=sys.stderr)
            query_embedding = self.embedding_model.encode([question]).tolist()[0]
            
            # 2. Search similar contexts using embeddings
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(5, count)
            )
            
            # 3. Extract metadata and build context
            context_text = ""
            sources = []
            people = set()
            timeline = []
            
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    context_text += f"\n--- Context {i+1} ---\n{doc}\n"
                    
                    # Extract metadata
                    if results['metadatas'] and results['metadatas'][0] and i < len(results['metadatas'][0]):
                        metadata = results['metadatas'][0][i]
                        
                        # Add source
                        if metadata.get('url'):
                            sources.append({
                                "type": metadata.get('type', 'unknown'),
                                "link": metadata['url'],
                                "title": f"{metadata.get('type', 'Source').title()} - {metadata.get('author', 'Unknown')}"
                            })
                        
                        # Add person
                        if metadata.get('author'):
                            people.add(f"@{metadata['author']}")
                        
                        # Add timeline event
                        if metadata.get('date'):
                            try:
                                timeline.append({
                                    "date": metadata['date'],
                                    "event": f"{metadata.get('type', 'Event')} by {metadata.get('author', 'Unknown')}",
                                    "url": metadata.get('url', '#')
                                })
                            except:
                                pass
            else:
                context_text = "No relevant context found for this question."

            # 4. Query Hugging Face using chat completion
            messages = [
                {
                    "role": "system",
                    "content": "You are ContextKeeper, an AI assistant that helps answer questions about codebases and development context. Provide detailed, structured answers based on the context provided. If the context doesn't contain enough information, say so clearly."
                },
                {
                    "role": "user",
                    "content": f"""Context from GitHub repository:
{context_text}

Question: {question}

Based on the context above, provide a detailed answer. Focus on:
1. Direct answer to the question
2. Relevant technical details from the context
3. Any decisions or reasoning mentioned
4. Key people or contributors involved"""
                }
            ]
            
            print("Querying Hugging Face model...", file=sys.stderr)
            response = self.client.chat_completion(
                messages=messages,
                model=self.model_id,
                max_tokens=1024,
                temperature=0.7
            )
            
            # Extract the response text
            answer_text = response.choices[0].message.content
            
            # Sort timeline by date (most recent first)
            timeline.sort(key=lambda x: x['date'], reverse=True)
            
            # Return structured JSON for the API
            return json.dumps({
                "answer": answer_text,
                "sources": sources[:5],  # Limit to top 5 sources
                "relatedPeople": list(people)[:10],  # Limit to 10 people
                "timeline": timeline[:10],  # Limit to 10 timeline events
                "context_count": count,
                "results_found": len(results['documents'][0]) if results['documents'] else 0
            })
        except Exception as e:
            print(f"Error in query: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return json.dumps({
                "answer": f"Error processing query: {str(e)}",
                "sources": [],
                "relatedPeople": [],
                "timeline": [],
                "error": str(e)
            })

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            # First argument is the question, optional second argument is repo name
            q = sys.argv[1]
            repo_name = sys.argv[2] if len(sys.argv) > 2 else None
            
            rag = ContextRAG(repo_name=repo_name)
            print(rag.query(q))
        except Exception as e:
            import traceback
            traceback.print_exc(file=sys.stderr)
            print(json.dumps({"error": str(e), "answer": f"Failed to initialize RAG engine: {str(e)}"}))
    else:
        print(json.dumps({"error": "No question provided"}))

