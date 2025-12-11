
import os
import chromadb
import sys

def check(path, name):
    print(f"Checking {path}...")
    try:
        client = chromadb.PersistentClient(path=path)
        collection = client.get_or_create_collection(name)
        print(f"Count: {collection.count()}")
    except Exception as e:
        print(f"Error: {e}")

base = r"c:\Users\Yadnyesh Kolte\ContextKeeper\backend\chroma"
# Check docs branch
path = os.path.join(base, "chroma_db_yadnyeshkolte_online-voting-system_docs")
name = "context_yadnyeshkolte_online-voting-system_docs"

check(path, name)
