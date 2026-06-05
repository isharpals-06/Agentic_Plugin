import json
import re
import logging
from typing import Dict, Any
from src.agents.base import BaseAgent
from src.llm.ollama_client import OllamaClient

logger = logging.getLogger(__name__)

MANAGER_SYSTEM_PROMPT = """You are the Manager Agent for AgentBrain. Your job is to orchestrate a team of specialized sub-agents:
1. "coder": Handles code generation, debugging, algorithms, and design.
2. "reviewer": Reviews code, evaluates logic, critiques, and finds bugs.
3. "researcher": Performs deep research, conceptual/theoretical breakdowns, and synthesizes technical concepts.
4. "brainstorm": Generates lateral thinking, creative options, and alternative design paths.

Analyze the user's request. Create a structured workflow plan using these specialists.
IMPORTANT: You must return ONLY a JSON block matching the structure below. Do not include any other text before or after the JSON block.

Expected Output Format:
{
  "plan_description": "Short summary of how the task will be achieved and why the chosen path is appropriate.",
  "steps": [
    {
      "step_number": 1,
      "agent": "researcher",
      "instruction": "What this agent needs to do. Be specific and include context."
    },
    {
      "step_number": 2,
      "agent": "coder",
      "instruction": "What the coder needs to do. Refer to inputs from previous steps if needed."
    }
  ]
}

Rules:
- Never generate final code or perform direct reviews yourself.
- Break the task down logically.
- Choose the correct specialized agents for each step (e.g. if the user wants code, use coder, then reviewer; if the user wants an explanation, use researcher).
- Keep the plan minimal but complete.
"""

class ManagerAgent(BaseAgent):
    def __init__(self, model: str, ollama_client: OllamaClient, temperature: float = 0.1):
        super().__init__(
            name="Manager",
            model=model,
            system_prompt=MANAGER_SYSTEM_PROMPT,
            ollama_client=ollama_client,
            temperature=temperature
        )

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
            # Return a simple fallback single-step plan
            # Let's decide based on keywords in prompt
            agent = "coder"
            if any(w in user_prompt.lower() for w in ["explain", "what is", "how does", "research"]):
                agent = "researcher"
            elif any(w in user_prompt.lower() for w in ["review", "critique", "audit"]):
                agent = "reviewer"
            elif any(w in user_prompt.lower() for w in ["brainstorm", "idea", "creative"]):
                agent = "brainstorm"
                
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
