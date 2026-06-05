import sys
import os
import argparse
import logging
from src.engine.workflow import WorkflowEngine

# Force stdout to use UTF-8 encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def main():
    parser = argparse.ArgumentParser(description="AgentBrain CLI Execution Engine")
    parser.add_argument("task", type=str, help="The task you want AgentBrain to perform")
    parser.add_argument("--config", type=str, default="config.yaml", help="Path to config.yaml file")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.config):
        print(f"Error: Config file not found at '{args.config}'. Please ensure you are running from the core directory.")
        sys.exit(1)
        
    print(f"Initializing AgentBrain Workflow Engine...")
    try:
        engine = WorkflowEngine(args.config)
    except Exception as e:
        print(f"Error initializing engine: {e}")
        sys.exit(1)
        
    print(f"\nProcessing Task: '{args.task}'\n")
    print("=" * 60)
    
    result = engine.execute_workflow(args.task)
    
    if not result.get("success", False):
        print(f"Workflow execution failed: {result.get('error', 'Unknown error')}")
        sys.exit(1)
        
    print(f"\nMANAGER PLAN:")
    print(f"Description: {result.get('plan_description')}\n")
    
    for step in result.get("history", []):
        print(f"--- Step {step['step_number']}: {step['agent'].upper()} ---")
        print(f"Instruction: {step['instruction']}")
        print(f"Output:\n{step['output']}")
        print("-" * 60)
        
    print("\nWorkflow Execution Completed successfully.")

if __name__ == '__main__':
    main()
