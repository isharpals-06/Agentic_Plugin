import sys
import os
import argparse
import logging
import json
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
        print(json.dumps({"success": False, "error": result.get('error', 'Unknown error')}), flush=True)
        sys.exit(1)
        
    # Print completion JSON block
    print(json.dumps({
        "success": True,
        "type": "completion",
        "final_output": result.get("final_output"),
        "plan_description": result.get("plan_description")
    }), flush=True)

if __name__ == '__main__':
    main()

