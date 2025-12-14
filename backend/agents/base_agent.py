"""
Base Agent Class

Abstract base class for all AI agents with Hugging Face integration.
Provides common functionality for data collection, summarization, and error handling.
"""

import os
import sys
import time
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()


class BaseAgent(ABC):
    """Abstract base class for all AI agents"""
    
    def __init__(self, agent_name: str):
        """
        Initialize base agent
        
        Args:
            agent_name: Name of the agent (e.g., 'github', 'slack', 'notion')
        """
        self.agent_name = agent_name
        self.huggingface_api_key = os.getenv("HUGGINGFACE_API_KEY")
        # Use chat model instead of summarization model
        self.huggingface_model = os.getenv("HUGGINGFACE_MODEL", "meta-llama/Llama-3.2-3B-Instruct")
        # Fallback models if primary fails
        self.fallback_models = [
            "meta-llama/Llama-3.2-1B-Instruct",
            "google/flan-t5-base",
            "facebook/bart-large-cnn"
        ]
        self.max_retries = int(os.getenv("AGENT_MAX_RETRIES", "3"))
        self.retry_delay = int(os.getenv("AGENT_RETRY_DELAY", "2"))
        
        if not self.huggingface_api_key:
            print(f"Warning: HUGGINGFACE_API_KEY not found. Summarization will be disabled.", file=sys.stderr)
        else:
            # Initialize InferenceClient
            self.client = InferenceClient(api_key=self.huggingface_api_key)
        
        print(f"Initialized {self.agent_name} agent with model: {self.huggingface_model}", file=sys.stderr)
    
    @abstractmethod
    def collect_data(self, **kwargs) -> Dict[str, Any]:
        """
        Collect raw data from the source
        
        Returns:
            Dictionary containing collected data
        """
        pass
    
    @abstractmethod
    def format_data_for_summary(self, data: Dict[str, Any]) -> str:
        """
        Format collected data into text suitable for summarization
        
        Args:
            data: Raw data collected from source
            
        Returns:
            Formatted text string
        """
        pass
    
    def summarize_text(self, text: str, max_length: int = 500, temperature: float = 0.7) -> Dict[str, Any]:
        """
        Summarize text using Hugging Face model
        
        Args:
            text: Text to summarize
            max_length: Maximum length of summary
            temperature: Sampling temperature (0.0 to 1.0)
            
        Returns:
            Dictionary with summary and metadata
        """
        if not self.huggingface_api_key:
            return {
                "summary": text[:max_length] + "..." if len(text) > max_length else text,
                "error": "HUGGINGFACE_API_KEY not configured",
                "model": "none",
                "truncated": True
            }
        
        # Truncate input if too long (model has token limits)
        max_input_length = 4000  # Conservative limit for most models
        truncated = False
        if len(text) > max_input_length:
            text = text[:max_input_length]
            truncated = True
            print(f"Warning: Input text truncated to {max_input_length} characters", file=sys.stderr)
        
        # Try primary model first, then fallbacks
        models_to_try = [self.huggingface_model] + self.fallback_models
        
        for model_name in models_to_try:
            for attempt in range(self.max_retries):
                try:
                    # Use InferenceClient with chat completion
                    messages = [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant that summarizes text concisely and accurately. Provide a clear, structured summary that captures the key points."
                        },
                        {
                            "role": "user",
                            "content": f"Please summarize the following text in about {max_length} characters:\n\n{text}"
                        }
                    ]
                    
                    response = self.client.chat_completion(
                        messages=messages,
                        model=model_name,
                        max_tokens=max_length,
                        temperature=temperature
                    )
                    
                    # Extract the response text
                    summary_text = response.choices[0].message.content
                    
                    return {
                        "summary": summary_text,
                        "model": model_name,
                        "success": True,
                        "truncated": truncated,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                except Exception as e:
                    error_msg = str(e)
                    print(f"Hugging Face API error with model {model_name} (attempt {attempt + 1}/{self.max_retries}): {error_msg}", file=sys.stderr)
                    
                    # If it's a model loading error, wait longer
                    if "loading" in error_msg.lower():
                        print(f"Model {model_name} is loading, waiting...", file=sys.stderr)
                        time.sleep(20)
                        continue
                    
                    # If this was the last retry for this model, try next model
                    if attempt < self.max_retries - 1:
                        time.sleep(self.retry_delay * (2 ** attempt))
                        continue
                    else:
                        # Move to next model
                        print(f"Failed to use model {model_name}, trying next fallback...", file=sys.stderr)
                        break
        
        # Fallback: return truncated text if all models failed
        return {
            "summary": text[:max_length] + "..." if len(text) > max_length else text,
            "error": "All models failed",
            "model": self.huggingface_model,
            "success": False,
            "fallback": True
        }
    
    def process(self, **kwargs) -> Dict[str, Any]:
        """
        Main processing pipeline: collect data, format, and summarize
        
        Returns:
            Dictionary with raw data, formatted text, and summary
        """
        print(f"Starting {self.agent_name} agent processing...", file=sys.stderr)
        
        try:
            # Step 1: Collect raw data
            print(f"Collecting data from {self.agent_name}...", file=sys.stderr)
            raw_data = self.collect_data(**kwargs)
            
            # Step 2: Format for summarization
            print(f"Formatting data for summarization...", file=sys.stderr)
            formatted_text = self.format_data_for_summary(raw_data)
            
            # Step 3: Generate AI summary
            print(f"Generating AI summary...", file=sys.stderr)
            summary_result = self.summarize_text(formatted_text)
            
            # Step 4: Return complete result
            result = {
                "agent": self.agent_name,
                "raw_data": raw_data,
                "formatted_text": formatted_text,
                "ai_summary": summary_result,
                "timestamp": datetime.now().isoformat(),
                "success": True
            }
            
            print(f"{self.agent_name} agent processing completed successfully", file=sys.stderr)
            return result
            
        except Exception as e:
            print(f"Error in {self.agent_name} agent processing: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            
            return {
                "agent": self.agent_name,
                "error": str(e),
                "success": False,
                "timestamp": datetime.now().isoformat()
            }
    
    def get_metadata(self) -> Dict[str, Any]:
        """
        Get agent metadata
        
        Returns:
            Dictionary with agent configuration and status
        """
        return {
            "agent_name": self.agent_name,
            "model": self.huggingface_model,
            "max_retries": self.max_retries,
            "retry_delay": self.retry_delay,
            "api_configured": bool(self.huggingface_api_key)
        }
