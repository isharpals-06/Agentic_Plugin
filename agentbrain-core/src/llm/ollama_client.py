import requests
import json
import logging

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self, host="http://localhost:11434"):
        self.host = host.rstrip('/')

    def is_running(self) -> bool:
        """Check if the Ollama service is reachable."""
        try:
            response = requests.get(f"{self.host}/", timeout=3)
            return response.status_code == 200
        except Exception:
            return False

    def list_local_models(self) -> list:
        """Get the list of models already pulled locally."""
        try:
            response = requests.get(f"{self.host}/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return [m['name'] for m in data.get('models', [])]
        except Exception as e:
            logger.error(f"Failed to list local Ollama models: {e}")
        return []

    def is_model_available(self, model_name: str) -> bool:
        """Check if a specific model is available in Ollama."""
        local_models = self.list_local_models()
        # Handle exact match and matches without the ':latest' tag
        for m in local_models:
            if m == model_name or m.split(':')[0] == model_name.split(':')[0]:
                return True
        return False

    def generate_chat(self, model_name: str, messages: list, temperature: float = 0.2, stream: bool = False, options: dict = None) -> str:
        """
        Send a chat completion request.
        messages: list of dicts like {"role": "user", "content": "hello"}
        """
        url = f"{self.host}/api/chat"
        payload = {
            "model": model_name,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": temperature,
                **(options or {})
            }
        }
        
        try:
            response = requests.post(url, json=payload, timeout=180)
            if response.status_code == 200:
                result = response.json()
                return result.get('message', {}).get('content', '')
            else:
                raise Exception(f"Ollama returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Ollama chat generation error: {e}")
            raise

    def unload_model(self, model_name: str) -> bool:
        """
        Unloads a model from VRAM by sending a dummy generate request with keep_alive: 0.
        """
        url = f"{self.host}/api/generate"
        payload = {
            "model": model_name,
            "prompt": "",
            "keep_alive": 0
        }
        try:
            # We use a short timeout as this is a quick unload request.
            response = requests.post(url, json=payload, timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Failed to unload model {model_name}: {e}")
            return False
