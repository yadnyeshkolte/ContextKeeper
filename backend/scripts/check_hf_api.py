import os
import requests
from dotenv import load_dotenv

# Load environment variables from the backend/.env file specifically
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

api_key = os.getenv("HUGGINGFACE_API_KEY")
model = "facebook/bart-large-cnn"
text = "The quick brown fox jumps over the lazy dog. " * 20

if not api_key:
    print("Error: HUGGINGFACE_API_KEY not found in environment")
    exit(1)

headers = {"Authorization": f"Bearer {api_key}"}
payload = {"inputs": text, "parameters": {"max_length": 50, "do_sample": False}}

# Test 1: api-inference.huggingface.co
url1 = f"https://api-inference.huggingface.co/models/{model}"
print(f"Testing {url1}...")
try:
    response1 = requests.post(url1, headers=headers, json=payload, timeout=10)
    print(f"Status: {response1.status_code}")
    print(f"Response: {response1.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

print("-" * 20)

# Test 2: router.huggingface.co
url2 = f"https://router.huggingface.co/models/{model}"
print(f"Testing {url2}...")
try:
    response2 = requests.post(url2, headers=headers, json=payload, timeout=10)
    print(f"Status: {response2.status_code}")
    print(f"Response: {response2.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
