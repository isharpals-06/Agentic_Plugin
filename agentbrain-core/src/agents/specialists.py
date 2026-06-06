import os
from src.agents.base import BaseAgent
from src.llm.ollama_client import OllamaClient

def _load_prompt(filename: str) -> str:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception as e:
        return ""

class CoderAgent(BaseAgent):
    def __init__(self, model: str, ollama_client: OllamaClient, temperature: float = 0.2):
        super().__init__("Coder", model, _load_prompt("coder_system.md"), ollama_client, temperature)

class ReviewerAgent(BaseAgent):
    def __init__(self, model: str, ollama_client: OllamaClient, temperature: float = 0.1):
        super().__init__("Reviewer", model, _load_prompt("reviewer_system.md"), ollama_client, temperature)

class ResearcherAgent(BaseAgent):
    def __init__(self, model: str, ollama_client: OllamaClient, temperature: float = 0.3):
        super().__init__("Researcher", model, _load_prompt("researcher_system.md"), ollama_client, temperature)

class BrainstormAgent(BaseAgent):
    def __init__(self, model: str, ollama_client: OllamaClient, temperature: float = 0.7):
        super().__init__("Brainstormer", model, _load_prompt("brainstorm_system.md"), ollama_client, temperature)

class LearnerAgent(BaseAgent):
    def __init__(self, model: str, ollama_client: OllamaClient, temperature: float = 0.2):
        super().__init__("Learner", model, _load_prompt("learner_system.md"), ollama_client, temperature)

