import os
import json
import re
import logging
from typing import Dict, Any
from src.agents.base import BaseAgent
from src.llm.ollama_client import OllamaClient

logger = logging.getLogger(__name__)

def _load_prompt(filename: str) -> str:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception as e:
        return ""

class ManagerAgent(BaseAgent):
    def __init__(self, model: str, ollama_client: OllamaClient, temperature: float = 0.1, routing_config: Dict[str, Any] = None):
        super().__init__(
            name="Manager",
            model=model,
            system_prompt=_load_prompt("manager_system.md"),
            ollama_client=ollama_client,
            temperature=temperature
        )
        self.routing_config = routing_config or {}

    def plan_task(self, user_prompt: str) -> Dict[str, Any]:
        """
        Runs the Manager agent on the user request and returns a parsed dictionary of the execution plan.
        """
        response_text = self.execute(user_prompt)
        
        # Parse JSON output from model response
        try:
            # Look for JSON block if model included markdown wraps
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            json_str = match.group(0) if match else response_text
            plan = json.loads(json_str)
            
            # Validation
            if "plan_description" not in plan or "steps" not in plan:
                raise ValueError("Missing required plan fields.")
            
            return plan
        except Exception as e:
            logger.warning(f"Failed to parse Manager JSON response. Raw output: {response_text}. Error: {e}")
            
            # Determine fallback agent based on task routing config
            agent = "coder"
            if self.routing_config:
                matched = False
                for route_name, route_info in self.routing_config.items():
                    keywords = route_info.get('keywords', [])
                    target_agent = route_info.get('agent')
                    if target_agent and any(w in user_prompt.lower() for w in keywords):
                        agent = target_agent
                        matched = True
                        break
            else:
                if any(w in user_prompt.lower() for w in ["explain", "what is", "how does", "research"]):
                    agent = "researcher"
                elif any(w in user_prompt.lower() for w in ["review", "critique", "audit"]):
                    agent = "reviewer"
                elif any(w in user_prompt.lower() for w in ["brainstorm", "idea", "creative"]):
                    agent = "brainstorm"
                elif any(w in user_prompt.lower() for w in ["learn", "teach", "understand"]):
                    agent = "learner"
                
            return {
                "plan_description": f"Fallback plan due to parsing error. Direct routing to {agent}.",
                "steps": [
                    {
                        "step_number": 1,
                        "agent": agent,
                        "instruction": user_prompt
                    }
                ]
            }

