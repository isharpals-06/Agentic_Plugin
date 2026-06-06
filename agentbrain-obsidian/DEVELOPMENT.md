# AgentBrain - Development Guide

## Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Python** ≥ 3.9
- **Ollama** installed and running
- **Obsidian** desktop app (latest version)

## Setting Up the Development Environment

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd agentbrain-obsidian
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Plugin

```bash
npm run build
```

### 4. Development Mode (Watch)

```bash
npm run dev
```

This watches for file changes and rebuilds automatically.

### 5. Install in Obsidian

1. Open Obsidian Settings → Community Plugins → Turn off Safe Mode
2. Click "Open plugins folder"
3. Create a folder named `agentbrain-obsidian`
4. Copy `main.js`, `manifest.json`, and `styles.css` into it
5. Reload Obsidian or toggle the plugin off/on

## Project Structure

```
src/
├── main.ts              # Plugin entry point + ChatView + SettingsTab
├── types/
│   ├── index.ts         # Core type definitions
│   └── agent.ts         # Agent-specific types
├── utils/
│   ├── logger.ts        # Structured logging
│   ├── validators.ts    # Config & input validation
│   └── helpers.ts       # General utilities
└── services/
    ├── OllamaService.ts   # Ollama API client
    ├── ProcessManager.ts  # Python subprocess manager
    └── MemoryService.ts   # Memory server client
```

## Architecture Decisions

### Service Pattern
All external interactions (Ollama, Python subprocess, Memory server) are encapsulated in service classes. This allows:
- Independent testing
- Easy mocking for unit tests
- Clean dependency injection

### Settings Validation
All settings are validated on load and on change using `ConfigValidator`. Invalid values trigger warnings but don't block plugin startup.

### Process Lifecycle
`ProcessManager` tracks active child processes and guarantees cleanup on plugin unload via `kill()`. This prevents orphaned Python processes.

## Testing

```bash
# Build and check for TypeScript errors
npm run build

# Manually test in Obsidian dev vault
# Enable debug logging in settings for verbose console output
```

## Code Style

- TypeScript strict mode enabled
- Use `Logger` class instead of raw `console.log`
- All settings changes go through `saveSettings()` to persist and reinitialize services
- Obsidian's `requestUrl` is used instead of `fetch` for CORS-safe HTTP requests
