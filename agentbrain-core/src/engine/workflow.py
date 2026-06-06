import logging
import yaml
import json
from typing import Dict, Any, List
from src.llm.ollama_client import OllamaClient
from src.agents.manager import ManagerAgent
from src.agents.specialists import CoderAgent, ReviewerAgent, ResearcherAgent, BrainstormAgent, LearnerAgent

logger = logging.getLogger(__name__)

class WorkflowEngine:
    def __init__(self, config_path: str):
        self.config = self._load_config(config_path)
        ollama_cfg = self.config.get('ollama', {})
        self.client = OllamaClient(host=ollama_cfg.get('host', 'http://localhost:11434'))
        
        # Instantiate agents based on config
        agents_cfg = self.config.get('agents', {})
        
        self.manager = ManagerAgent(
            model=agents_cfg.get('manager', {}).get('model', 'lfm2.5-thinking'),
            ollama_client=self.client,
            temperature=agents_cfg.get('manager', {}).get('temperature', 0.1),
            routing_config=self.config.get('task_routing', {})
        )
        
        self.specialists = {
            "coder": CoderAgent(
                model=agents_cfg.get('coder', {}).get('model', 'qwen3.6'),
                ollama_client=self.client,
                temperature=agents_cfg.get('coder', {}).get('temperature', 0.2)
            ),
            "reviewer": ReviewerAgent(
                model=agents_cfg.get('reviewer', {}).get('model', 'mistral'),
                ollama_client=self.client,
                temperature=agents_cfg.get('reviewer', {}).get('temperature', 0.1)
            ),
            "researcher": ResearcherAgent(
                model=agents_cfg.get('researcher', {}).get('model', 'lfm2.5-thinking'),
                ollama_client=self.client,
                temperature=agents_cfg.get('researcher', {}).get('temperature', 0.3)
            ),
            "brainstorm": BrainstormAgent(
                model=agents_cfg.get('brainstorm', {}).get('model', 'mistral'),
                ollama_client=self.client,
                temperature=agents_cfg.get('brainstorm', {}).get('temperature', 0.7)
            ),
            "learner": LearnerAgent(
                model=agents_cfg.get('learner', {}).get('model', 'mistral'),
                ollama_client=self.client,
                temperature=agents_cfg.get('learner', {}).get('temperature', 0.2)
            )
        }

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            logger.warning(f"Failed to load config from {config_path}, using defaults. Error: {e}")
            return {}

    def execute_workflow(self, task: str) -> Dict[str, Any]:
        """
        Runs the full multi-agent task execution.
        1. Gets execution plan from Manager.
        2. Executes each specialist step.
        3. Hot-swaps models (unloads after use) to conserve memory.
        """
        logger.info(f"Starting workflow for task: {task}")
        
        # Check connection to Ollama first
        if not self.client.is_running():
            return {
                "success": False,
                "error": "Ollama service is not running or unreachable. Please check your Ollama installation."
            }

        # Step 1: Query Manager for execution plan
        plan = self.manager.plan_task(task)
        # Unload Manager immediately after planning to free VRAM
        self.client.unload_model(self.manager.model)
        
        steps = plan.get("steps", [])
        plan_desc = plan.get("plan_description", "")
        
        # Print manager plan as JSON for frontend
        print(json.dumps({
            "type": "plan",
            "description": plan_desc,
            "steps": steps
        }), flush=True)

        
        execution_history = []
        context_str = ""
        
        for idx, step in enumerate(steps):
            agent_key = step.get("agent")
            instruction = step.get("instruction")
            step_num = step.get("step_number", idx + 1)
            
            logger.info(f"Running step {step_num}: {agent_key}")
            
            if agent_key not in self.specialists:
                logger.error(f"Unknown agent type '{agent_key}' requested in step {step_num}")
                continue
                
            agent = self.specialists[agent_key]
            
            # Format step instruction with preceding context
            prompt = ""
            if context_str:
                prompt += "--- PREVIOUS STEPS CONTEXT ---\n"
                prompt += context_str
                prompt += "------------------------------\n\n"
            
            prompt += f"Current Task:\n{instruction}"
            
            # Run the specialist agent
            try:
                output = agent.execute(prompt)
            except Exception as e:
                output = f"Execution failed: {e}"
                logger.error(f"Error during step {step_num} execution: {e}")
            
            # Stream JSON output immediately to stdout for frontend parsing
            step_output = {
                "step": step_num,
                "agent": agent_key.upper(),
                "instruction": instruction,
                "output": output
            }
            print(json.dumps(step_output), flush=True)

            # Add to log
            execution_history.append({
                "step_number": step_num,
                "agent": agent_key,
                "instruction": instruction,
                "output": output
            })
            
            # Update history context for next agents
            context_str += f"### Step {step_num} ({agent.name} Output):\n{output}\n\n"
            
            # Sequential execution: unload this agent's model to free VRAM
            self.client.unload_model(agent.model)
            
        return {
            "success": True,
            "plan_description": plan_desc,
            "history": execution_history,
            "final_output": context_str
        }
