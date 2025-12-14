"""
Test script to verify the HuggingFace API integration
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.base_agent import BaseAgent

class TestAgent(BaseAgent):
    """Simple test agent to verify HuggingFace integration"""
    
    def collect_data(self, **kwargs):
        return {
            "test_data": "This is a test message to verify the HuggingFace API integration is working correctly."
        }
    
    def format_data_for_summary(self, data):
        return data.get("test_data", "")

if __name__ == "__main__":
    print("Testing HuggingFace API integration...")
    print("-" * 50)
    
    # Initialize test agent
    agent = TestAgent("test")
    
    # Test summarization
    test_text = """
    This is a comprehensive test of the HuggingFace API integration.
    We have updated the base_agent.py to use InferenceClient with chat models
    instead of the deprecated REST API. The new implementation uses
    meta-llama/Llama-3.2-3B-Instruct as the primary model with fallbacks to
    meta-llama/Llama-3.2-1B-Instruct, google/flan-t5-base, and facebook/bart-large-cnn.
    This ensures better reliability and compatibility with the HuggingFace platform.
    """
    
    result = agent.summarize_text(test_text)
    
    print("\nSummarization Result:")
    print(f"Success: {result.get('success', False)}")
    print(f"Model: {result.get('model', 'unknown')}")
    print(f"Summary: {result.get('summary', 'N/A')}")
    
    if result.get('error'):
        print(f"Error: {result.get('error')}")
    
    print("-" * 50)
    print("Test complete!")
