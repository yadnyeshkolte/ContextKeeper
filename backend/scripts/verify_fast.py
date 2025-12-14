import os
import sys
import requests
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

api_key = os.getenv("HUGGINGFACE_API_KEY")
model = "facebook/bart-large-cnn"
url = f"https://router.huggingface.co/hf-inference/models/{model}"
headers = {"Authorization": f"Bearer {api_key}"}
payload = {"inputs": "Test", "parameters": {"max_length": 5}}

print(f"Testing {url}")
try:
    resp = requests.post(url, headers=headers, json=payload, timeout=5)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("SUCCESS")
    else:
        print(f"FAIL: {resp.status_code}")
except Exception as e:
    print(f"ERROR: {e}")
