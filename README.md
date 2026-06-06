# 🧠 AgentBrain OS

AgentBrain is a **local-first, multi-agent AI operating system** that integrates **Obsidian** and **Ollama**. It allows you to run complex multi-agent workflows entirely on your local machine, utilizing your own personal knowledge base (Obsidian vault notes) to contextually guide local LLMs.

---

## 🗺️ System Architecture

AgentBrain is divided into three interconnected, lightweight components:

```
┌─────────────────────────────────────────────────────────┐
│                    OBSIDIAN (Main UI)                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │     AgentBrain Plugin (TypeScript)               │  │
│  │                                                  │  │
│  │  ├─ Chat View Component                          │  │
│  │  ├─ Settings Management (with validation)        │  │
│  │  ├─ OllamaService (health check + retry)         │  │
│  │  ├─ MemoryService (vault context injection)      │  │
│  │  └─ ProcessManager (spawn + lifecycle)           │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓ (stdio)                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│           AgentBrain Core (Python Backend)              │
│                                                         │
│  ├─ Manager Agent (task analysis + planning)            │
│  ├─ Coder Agent (qwen3.6)                               │
│  ├─ Research Agent (lfm2.5-thinking)                    │
│  ├─ Brainstorm Agent (mixtral)                          │
│  ├─ Review Agent (mixtral)                              │
│  ├─ Learner Agent (mixtral)                             │
│  └─ Ollama Client (hot-swap model management)           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│           Ollama (Local Model Server)                   │
│                                                         │
│  ├─ mixtral (26GB)       ├─ qwen3.6 (23GB)              │
│  ├─ lfm2.5-thinking (731MB)                             │
└─────────────────────────────────────────────────────────┘
                    (Optional)
┌─────────────────────────────────────────────────────────┐
│    AgentBrain Memory (Vector Store & Retrieval)         │
│                                                         │
│  ├─ FastAPI Server (port 8000)                          │
│  ├─ Sentence-Transformers Embeddings                    │
│  └─ Vault Parsing + Chunking                            │
└─────────────────────────────────────────────────────────┘
```

### How It Works

1. **`agentbrain-core`**: A multi-agent framework powered by Ollama. A **Manager Agent** acts as an orchestrator, breaking tasks into structured plans using dynamic prompt templates and config-based keyword routing. The manager coordinates specialized agents (`coder`, `reviewer`, `researcher`, `brainstorm`, `learner`) sequentially, hot-swapping models to conserve VRAM.

2. **`agentbrain-memory`**: A local semantic search microservice built on FastAPI. It parses notes in your Obsidian vault, chunks them, and generates embeddings using `sentence-transformers` (falling back to keyword matching if unavailable) to enable vector similarity search.

3. **`agentbrain-obsidian`**: An Obsidian desktop plugin providing an interactive chat interface. It features modular services (`OllamaService`, `ProcessManager`, `MemoryService`), config validation, structured logging, and configurable timeouts up to 1 hour.

---

## ⚙️ Prerequisites & Installation

### 1. Ollama Setup
1. Download and install [Ollama](https://ollama.com/) on your system.
2. Pull the required models:
   ```bash
   ollama pull lfm2.5-thinking
   ollama pull qwen3.6
   ollama pull mixtral
   ```
3. Keep the Ollama service running:
   ```bash
   ollama serve
   ```

---

### 2. Setup the Memory Service (`agentbrain-memory`)
This microservice processes notes from your vault and maintains a local vector index.

1. Navigate to the `agentbrain-memory` directory.
2. Set up a Python virtual environment (recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   python main.py
   ```
   The server will run on `http://localhost:8000`.

---

### 3. Setup the Agent Engine (`agentbrain-core`)
The core workflow engine coordinates model inference.

1. Navigate to the `agentbrain-core` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure your local models and hosts in `config.yaml`.

---

### 4. Build the Obsidian Plugin (`agentbrain-obsidian`)
Compile the TypeScript plugin source code to load it in Obsidian.

1. Navigate to the `agentbrain-obsidian` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. Copy the `agentbrain-obsidian` folder to your Obsidian vault's plugin directory:
   - **Windows:** `<your-vault>/.obsidian/plugins/agentbrain-obsidian`
   - **macOS:** `<your-vault>/.obsidian/plugins/agentbrain-obsidian`
   - **Linux:** `<your-vault>/.obsidian/plugins/agentbrain-obsidian`
5. Open Obsidian → **Settings → Community Plugins** → Enable **AgentBrain**.

---

## 🚀 How to Use

### Step 1: Configure Plugin Settings
In Obsidian, open settings and configure the **AgentBrain** plugin:

| Setting | Description | Default |
|---------|-------------|---------|
| **Ollama URL** | URL where Ollama is running | `http://localhost:11434` |
| **Ollama Timeout** | How long to wait for responses (ms) | `30000` |
| **Python Command** | Command to run Python | `python` |
| **Core Path** | Absolute path to `agentbrain-core/` | *(must be set)* |
| **Max Execution Time** | Maximum task execution time (seconds) | `300` |
| **Enable Memory Context** | Toggle vault context injection | `true` |
| **Memory Server URL** | URL of the FastAPI memory server | `http://localhost:8000` |
| **Memory Search Results** | Number of vault results to inject (1-20) | `5` |
| **Debug Logging** | Verbose console output | `false` |

### Step 2: Verify Ollama Connection
1. Open the command palette (`Ctrl+P` or `Cmd+P`).
2. Run: **AgentBrain: Check Ollama Status**.
3. You should see a notice listing your installed models.

### Step 3: Index your Vault
Before you can query your notes semantically:
1. Make sure `agentbrain-memory` FastAPI server is running.
2. Open the command palette and run: **AgentBrain: Index Current Vault (For Memory)**.
3. Once completed, a notification will display the total chunks indexed.

### Step 4: Run Workflows in Chat
1. Click the 🤖 ribbon icon to open the AgentBrain Chat View.
2. Type a request — AgentBrain intelligently routes to the best specialist:
   - 💻 **Coding** → Qwen3.6
   - 📚 **Research** → LFM2.5-Thinking
   - 🧠 **Brainstorming** → Mixtral
   - ✏️ **Review** → Mixtral
   - 🎓 **Learning** → Mixtral
3. The plugin will:
   - Check Ollama connectivity (with retry)
   - Validate configuration
   - Fetch relevant vault context (if memory is enabled)
   - Spawn the `agentbrain-core` workflow engine
   - Display the Manager's plan and each agent's output in the chat

---

## 🛠️ Command Line Testing

You can also run the core agent engine or test Ollama connectivity directly from the terminal.

#### Test Ollama Status
```bash
python test_ollama.py
```

#### Run Core Workflow CLI
```bash
cd agentbrain-core
python main.py "Your prompt or instruction here"
```

---

## 📁 Repository Structure

```
Agentic_Plugin/
├── agentbrain-obsidian/          # Obsidian Plugin (TypeScript)
│   ├── src/
│   │   ├── main.ts               # Plugin entry + ChatView + Settings
│   │   ├── types/
│   │   │   ├── index.ts          # Core type definitions
│   │   │   └── agent.ts          # Agent-specific types
│   │   ├── utils/
│   │   │   ├── logger.ts         # Structured logging
│   │   │   ├── validators.ts     # Config & input validation
│   │   │   └── helpers.ts        # General utilities
│   │   └── services/
│   │       ├── OllamaService.ts  # Ollama API client (retry, health)
│   │       ├── ProcessManager.ts # Python subprocess lifecycle
│   │       └── MemoryService.ts  # Memory server client
│   ├── styles.css                # Plugin UI styles
│   ├── manifest.json             # Obsidian plugin manifest (v1.1.0)
│   ├── DEVELOPMENT.md            # Developer setup guide
│   ├── SETUP.md                  # User installation guide
│   └── TROUBLESHOOTING.md        # Common issues & fixes
│
├── agentbrain-core/              # Python Backend (Multi-Agent Engine)
│   ├── main.py                   # CLI entry point
│   ├── config.yaml               # Model & routing configuration
│   ├── requirements.txt
│   └── src/
│       ├── agents/               # Agent implementations
│       │   ├── base.py           # Abstract BaseAgent
│       │   ├── manager.py        # Manager (orchestration)
│       │   └── specialists.py    # Coder, Reviewer, Researcher, etc.
│       ├── engine/
│       │   └── workflow.py       # Workflow execution engine
│       ├── llm/
│       │   └── ollama_client.py  # Ollama API client + model hot-swap
│       └── prompts/              # System prompt templates (markdown)
│
├── agentbrain-memory/            # Vector Store & Retrieval (FastAPI)
│   ├── main.py                   # FastAPI server entry
│   ├── requirements.txt
│   └── src/
│       ├── parser/
│       │   └── vault_parser.py   # Markdown chunking & parsing
│       └── retrieval/
│           └── vector_store.py   # Embeddings + similarity search
│
├── test_ollama.py                # Quick Ollama verification script
└── README.md
```

---

## 📋 Model Requirements

| Model | Size | Used By |
|-------|------|---------|
| mixtral | ~26 GB | Brainstorm, Review, Learning agents |
| qwen3.6 | ~23 GB | Coding agent |
| lfm2.5-thinking | ~731 MB | Manager, Research agents |

> **Note:** AgentBrain hot-swaps models after each agent step to conserve VRAM. Only one model is loaded at a time.

---

## 📚 Additional Documentation

- [SETUP.md](agentbrain-obsidian/SETUP.md) — Step-by-step installation guide
- [DEVELOPMENT.md](agentbrain-obsidian/DEVELOPMENT.md) — Developer setup & architecture decisions
- [TROUBLESHOOTING.md](agentbrain-obsidian/TROUBLESHOOTING.md) — Common issues & solutions

---

## 📄 License

MIT
