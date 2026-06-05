from typing import List, Dict
from src.llm.ollama_client import OllamaClient

class BaseAgent:
    def __init__(self, name: str, model: str, system_prompt: str, ollama_client: OllamaClient, temperature: float = 0.2):
        self.name = name
        self.model = model
        self.system_prompt = system_prompt
        self.client = ollama_client
        self.temperature = temperature

    def execute(self, user_prompt: str, chat_history: List[Dict[str, str]] = None) -> str:
        """
        Executes the agent logic with the user prompt and optional chat history.
        """
        messages = []
        if self.system_prompt:
            messages.append({"role": "system", "content": self.system_prompt})
        
        if chat_history:
            for msg in chat_history:
                messages.append(msg)
                
        messages.append({"role": "user", "content": user_prompt})
        
        return self.client.generate_chat(
            model_name=self.model,
            messages=messages,
            temperature=self.temperature
        )
