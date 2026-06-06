# AgentBrain - Troubleshooting Guide

## Common Issues

### ❌ "Ollama is not running"

**Cause:** The Ollama service is not started or is running on a different port.

**Fix:**
1. Start Ollama: `ollama serve`
2. Verify it's running: `curl http://localhost:11434/api/tags`
3. If using a custom port, update the **Ollama URL** in AgentBrain settings

### ❌ "Core path does not exist" or "main.py not found"

**Cause:** The AgentBrain Core Path is not set or points to a wrong directory.

**Fix:**
1. Open AgentBrain settings
2. Set **AgentBrain Core Path** to the absolute path of your `agentbrain-core/` directory
3. Make sure `main.py` exists in that directory

### ❌ "Process timed out"

**Cause:** The AI model is taking too long to respond, or the task is too complex.

**Fix:**
1. Increase **Max Execution Time** in settings (default: 300 seconds)
2. Try a simpler task first to verify the setup works
3. Check if Ollama is under heavy load: `ollama ps`

### ❌ "Process exited with code 1"

**Cause:** Python backend encountered an error.

**Fix:**
1. Enable **Debug Logging** in AgentBrain settings
2. Open the developer console (Ctrl+Shift+I) and check for error details
3. Test the Python backend directly:
   ```bash
   cd agentbrain-core
   python main.py "Hello, test task"
   ```
4. Verify Python dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

### ❌ "Memory server unreachable"

**Cause:** The memory FastAPI server is not running.

**Fix:**
1. Start the memory server:
   ```bash
   cd agentbrain-memory
   python main.py
   ```
2. Verify it's running: `curl http://localhost:8000/status`
3. If you don't need memory features, disable **Enable Memory Context** in settings

### ❌ Plugin doesn't appear in Obsidian

**Cause:** Plugin files are missing or in the wrong location.

**Fix:**
1. Rebuild: `npm run build` in the `agentbrain-obsidian/` directory
2. Ensure `main.js`, `manifest.json`, and `styles.css` are in the plugin folder
3. Reload Obsidian (Ctrl+R)
4. Check Settings → Community Plugins and enable AgentBrain

### ❌ Model not found errors

**Cause:** Required Ollama models haven't been pulled.

**Fix:**
```bash
ollama pull lfm2.5-thinking
ollama pull qwen3.6
ollama pull mixtral
```

Verify with: `ollama list`

## Debug Mode

Enable verbose logging for troubleshooting:

1. Open AgentBrain settings
2. Turn on **Enable Debug Logging**
3. Open Obsidian developer console: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
4. Filter console output by `[AgentBrain`
5. Reproduce the issue and check the logs

## Getting Help

If issues persist:
1. Check the developer console for detailed error messages
2. Test each component independently (Ollama, Python backend, memory server)
3. Verify your system meets the minimum requirements (RAM, disk space for models)
