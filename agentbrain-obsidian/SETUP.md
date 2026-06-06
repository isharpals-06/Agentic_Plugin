# AgentBrain - Setup & Installation Guide

## Quick Start

### Step 1: Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com/).

Start the Ollama service:
```bash
ollama serve
```

### Step 2: Pull Required Models

Pull the models used by AgentBrain agents:

```bash
# Manager & Research agent
ollama pull lfm2.5-thinking

# Coding agent
ollama pull qwen3.6

# Brainstorm, Review & Learning agents
ollama pull mixtral
```

### Step 3: Install the Python Backend

```bash
cd agentbrain-core
pip install -r requirements.txt
```

### Step 4: Install the Obsidian Plugin

1. Build the plugin:
   ```bash
   cd agentbrain-obsidian
   npm install
   npm run build
   ```

2. Copy these files to your Obsidian plugins folder:
   - `main.js`
   - `manifest.json`
   - `styles.css`

   The plugins folder is typically at:
   - **Windows:** `%APPDATA%\Obsidian\plugins\agentbrain-obsidian\`
   - **macOS:** `~/Library/Application Support/obsidian/plugins/agentbrain-obsidian/`
   - **Linux:** `~/.config/obsidian/plugins/agentbrain-obsidian/`

3. Enable the plugin in Obsidian: Settings → Community Plugins → AgentBrain

### Step 5: Configure the Plugin

Open AgentBrain settings and configure:

| Setting | Value |
|---------|-------|
| **Ollama URL** | `http://localhost:11434` (default) |
| **Python Command** | `python` or `python3` |
| **Core Path** | Absolute path to `agentbrain-core/` directory |
| **Max Execution Time** | `300` seconds (default) |

### Step 6 (Optional): Set Up Memory Server

For vault-aware context injection:

```bash
cd agentbrain-memory
pip install -r requirements.txt
python main.py
```

Then in settings:
- Enable **Memory Context**
- Set **Memory Server URL** to `http://localhost:8000`

## Verifying Your Setup

1. Open the AgentBrain chat panel (click the bot icon in the ribbon)
2. Run the command: **AgentBrain: Check Ollama Status**
3. You should see a notice listing your installed models

## Model Requirements

| Model | Size | Agent |
|-------|------|-------|
| mixtral | ~26 GB | Brainstorm, Review, Learning |
| qwen3.6 | ~23 GB | Coding |
| lfm2.5-thinking | ~731 MB | Manager, Research |

> **Note:** You need sufficient RAM/VRAM to run these models. AgentBrain hot-swaps models to conserve memory — only one model is loaded at a time.
