import sys
import os
import json
import chromadb
# Google generative AI SDK (assuming google-generativeai package)
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Setup
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

class ContextRAG:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_or_create_collection("context")
        self.model = genai.GenerativeModel('gemini-pro')

    def query(self, question: str):
        # 1. Search similar contexts (Mock embedding search if no real embeddings)
        # In a real scenario, you'd embed the question first
        results = self.collection.query(
            query_texts=[question],
            n_results=5
        )
        
        # 3. Build context
        context_text = "\n".join([doc for sublist in results['documents'] for doc in sublist]) if results['documents'] else "No context found."

        # 4. Query Gemini
        prompt = f"""Context from codebase:
{context_text}

Question: {question}

Provide a detailed answer with:
1. Direct answer to the question
2. Links to relevant sources
3. People involved
4. Timeline
"""
        response = self.model.generate_content(prompt)
        
        # Return structured JSON for the API
        return json.dumps({
            "answer": response.text,
            "sources": [{"type": "db", "link": "#", "title": "Context Source"}],
            "relatedPeople": ["@detected_user"], # This would be parsed from context in real app
            "timeline": []
        })

if __name__ == "__main__":
    if len(sys.argv) > 1:
        q = sys.argv[1]
        rag = ContextRAG()
        print(rag.query(q))
    else:
        print(json.dumps({"error": "No question provided"}))
