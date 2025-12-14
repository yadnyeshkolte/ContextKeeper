import os
import sys
import requests
from dotenv import load_dotenv

# Load from ../.env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

api_key = os.getenv("HUGGINGFACE_API_KEY")
if not api_key:
    print("No API key found")
    sys.exit(1)

model = "facebook/bart-large-cnn"
url = f"https://router.huggingface.co/models/{model}"
headers = {"Authorization": f"Bearer {api_key}"}
payload = {"inputs": "Test summary", "parameters": {"max_length": 10}}

print(f"Testing {url}")
try:
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Success!")
    else:
        print(f"Failed: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
