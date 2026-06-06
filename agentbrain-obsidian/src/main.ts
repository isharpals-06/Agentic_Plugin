import {
    Plugin,
    WorkspaceLeaf,
    ItemView,
    Notice,
    setIcon,
    PluginSettingTab,
    App,
    Setting,
} from 'obsidian';
import * as path from 'path';
import { ConfigValidator, InputValidator } from './utils/validators';
import { Logger, LogLevel } from './utils/logger';
import { OllamaService } from './services/OllamaService';
import { ProcessManager } from './services/ProcessManager';
import { MemoryService } from './services/MemoryService';
import {
    AgentBrainSettings,
    AgentMessage,
    ExecutionStatus,
} from './types/index';

export const VIEW_TYPE_AGENTBRAIN = 'agentbrain-chat';

const DEFAULT_SETTINGS: AgentBrainSettings = {
    pythonPath: 'python',
    corePath: '',
    ollamaUrl: 'http://localhost:11434',
    ollamaTimeout: 30000,
    enableMemory: true,
    memoryServerUrl: 'http://localhost:8000',
    memoryTopK: 5,
    maxTimeout: 300000, // 5 minutes
    enableDebugLogging: false,
    streamResults: true,
};

export default class AgentBrainPlugin extends Plugin {
    settings: AgentBrainSettings = DEFAULT_SETTINGS;
    logger: Logger = new Logger(LogLevel.INFO);
    ollamaService: OllamaService | null = null;
    processManager: ProcessManager | null = null;
    memoryService: MemoryService | null = null;

    async onload() {
        await this.loadSettings();
        this.updateLogLevel();

        this.logger.info('AgentBrain plugin loading');

        // Initialize services
        this.ollamaService = new OllamaService(
            this.settings.ollamaUrl,
            this.settings.ollamaTimeout,
            this.logger
        );

        this.processManager = new ProcessManager(this.logger);

        this.memoryService = new MemoryService(
            this.settings.memoryServerUrl,
            this.logger
        );

        // Register custom view
        this.registerView(VIEW_TYPE_AGENTBRAIN, (leaf) => new AgentBrainChatView(leaf, this));

        // Add ribbon icon
        this.addRibbonIcon('bot', 'Open AgentBrain Chat', () => {
            this.activateView();
        });

        // Add commands
        this.addCommand({
            id: 'open-agentbrain-chat',
            name: 'Open Chat View',
            callback: () => this.activateView(),
        });

        this.addCommand({
            id: 'index-vault-memory',
            name: 'Index Current Vault (For Memory)',
            callback: () => this.indexVault(),
        });

        this.addCommand({
            id: 'check-ollama-status',
            name: 'Check Ollama Status',
            callback: () => this.checkOllamaStatus(),
        });

        // Add settings tab
        this.addSettingTab(new AgentBrainSettingTab(this.app, this));

        this.logger.info('AgentBrain plugin loaded successfully');
    }

    async onunload() {
        this.logger.info('AgentBrain plugin unloading');

        // Kill any running processes
        if (this.processManager) {
            this.processManager.kill();
        }

        // Detach views
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_AGENTBRAIN);

        this.logger.info('AgentBrain plugin unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

        // Validate settings
        const pythonValidation = ConfigValidator.validatePythonPath(this.settings.pythonPath);
        if (!pythonValidation.valid) {
            this.logger.warn(`Invalid Python path: ${pythonValidation.error}`);
        }

        const coreValidation = ConfigValidator.validateCorePath(this.settings.corePath);
        if (!coreValidation.valid) {
            this.logger.warn(`Invalid Core path: ${coreValidation.error}`);
        }

        const ollamaValidation = ConfigValidator.validateOllamaUrl(this.settings.ollamaUrl);
        if (!ollamaValidation.valid) {
            this.logger.warn(`Invalid Ollama URL: ${ollamaValidation.error}`);
        }

        if (this.settings.enableMemory) {
            const memoryValidation = ConfigValidator.validateMemoryUrl(this.settings.memoryServerUrl);
            if (!memoryValidation.valid) {
                this.logger.warn(`Invalid Memory Server URL: ${memoryValidation.error}`);
            }
        }

        const timeoutValidation = ConfigValidator.validateTimeout(this.settings.maxTimeout / 1000);
        if (!timeoutValidation.valid) {
            this.logger.warn(`Invalid timeout: ${timeoutValidation.error}`);
            this.settings.maxTimeout = 300000; // Reset to default
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.updateLogLevel();

        // Reinitialize services with new settings
        this.ollamaService = new OllamaService(
            this.settings.ollamaUrl,
            this.settings.ollamaTimeout,
            this.logger
        );

        this.memoryService = new MemoryService(
            this.settings.memoryServerUrl,
            this.logger
        );
    }

    private updateLogLevel() {
        const newLevel = this.settings.enableDebugLogging ? LogLevel.DEBUG : LogLevel.INFO;
        this.logger = new Logger(newLevel);
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_AGENTBRAIN);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                leaf = rightLeaf;
                await leaf.setViewState({
                    type: VIEW_TYPE_AGENTBRAIN,
                    active: true,
                });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async checkOllamaStatus() {
        if (!this.ollamaService) {
            new Notice('Ollama service not initialized');
            return;
        }

        const isHealthy = await this.ollamaService.isHealthy(1);

        if (isHealthy) {
            try {
                const models = await this.ollamaService.getModels();
                const modelList = models.map(m => m.name).join(', ');
                new Notice(`✅ Ollama is running with ${models.length} models\n\n${modelList}`);
            } catch (err: any) {
                new Notice(`✅ Ollama is running (couldn't fetch model list: ${err.message})`);
            }
        } else {
            new Notice(
                `❌ Ollama is not running.\n\nPlease start Ollama with:\nollama serve`
            );
        }
    }

    async indexVault() {
        if (!this.settings.enableMemory) {
            new Notice('AgentBrain: Memory indexing is disabled in settings.');
            return;
        }

        if (!this.memoryService) {
            new Notice('AgentBrain: Memory service not initialized.');
            return;
        }

        const vaultPath = (this.app.vault.adapter as any).getBasePath?.();
        if (!vaultPath) {
            new Notice('AgentBrain: Could not determine vault path.');
            return;
        }

        new Notice('Indexing vault notes...');
        this.logger.info('Starting vault indexing', { vaultPath });

        const result = await this.memoryService.indexVault(vaultPath);

        if (result.success) {
            new Notice(`✅ Vault indexed! (${result.totalChunks} chunks)`);
            this.logger.info('Vault indexed successfully', result);
        } else {
            new Notice(`❌ ${result.message}\n\nMake sure the memory server is running:\npython agentbrain-memory/main.py`);
            this.logger.error('Vault indexing failed', result);
        }
    }
}

class AgentBrainChatView extends ItemView {
    plugin: AgentBrainPlugin;
    chatContainer!: HTMLDivElement;
    inputEl!: HTMLTextAreaElement;
    statusEl!: HTMLDivElement;
    messages: AgentMessage[] = [];
    currentStatus: ExecutionStatus = {
        state: 'idle',
        progress: 0,
    };

    constructor(leaf: WorkspaceLeaf, plugin: AgentBrainPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_AGENTBRAIN;
    }

    getDisplayText(): string {
        return 'AgentBrain';
    }

    getIcon(): string {
        return 'bot';
    }

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLDivElement;
        container.empty();
        container.addClass('agentbrain-view-container');

        // Header
        const header = container.createEl('div', { cls: 'agentbrain-header' });
        header.createEl('h3', { text: 'AgentBrain' });
        header.createEl('span', { text: '🤖 Multi-Agent AI', cls: 'agentbrain-badge' });

        // Chat area
        this.chatContainer = container.createEl('div', { cls: 'agentbrain-chat-container' });
        this.addWelcomeMessage();

        // Status bar
        this.statusEl = container.createEl('div', {
            cls: 'agentbrain-status-bar ready',
            text: '✅ Ready',
        });

        // Input area
        const inputArea = container.createEl('div', { cls: 'agentbrain-input-area' });

        this.inputEl = inputArea.createEl('textarea', {
            cls: 'agentbrain-textarea',
            placeholder: 'Ask AgentBrain to code, research, brainstorm, or review...',
        });

        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitTask();
            }
        });

        const sendBtn = inputArea.createEl('button', { cls: 'agentbrain-send-btn' });
        setIcon(sendBtn, 'send');
        sendBtn.addEventListener('click', () => this.submitTask());
    }

    private addWelcomeMessage() {
        const msg = this.chatContainer.createEl('div', { cls: 'agentbrain-message system' });
        msg.createEl('div', {
            text: '👋 Welcome to AgentBrain!\n\nDescribe your task and I\'ll intelligently route it to the best AI specialist:\n• 💻 Coding - Qwen3.6\n• 📚 Research - LFM2.5-Thinking\n• 🧠 Brainstorming - Mixtral\n• ✏️ Review - Mixtral\n• 🎓 Learning - Mixtral\n\nOr just ask anything!',
            cls: 'agentbrain-message-content',
        });
    }

    private appendMessage(
        sender: string,
        content: string,
        type: 'user' | 'agent' | 'manager' | 'error' | 'system' = 'agent'
    ) {
        const msg = this.chatContainer.createEl('div', { cls: `agentbrain-message ${type}` });

        const msgHeader = msg.createEl('div', { cls: 'agentbrain-message-header' });
        msgHeader.createEl('strong', { text: sender });

        const contentEl = msg.createEl('pre', { cls: 'agentbrain-message-content' });
        contentEl.textContent = content;

        // Auto scroll
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;

        const message: AgentMessage = {
            sender,
            content,
            type,
            timestamp: Date.now(),
        };
        this.messages.push(message);
    }

    private setStatus(text: string, state: 'ready' | 'loading' | 'error' = 'ready') {
        const icons = { ready: '✅', loading: '⏳', error: '❌' };
        this.statusEl.textContent = `${icons[state]} ${text}`;
        this.statusEl.className = `agentbrain-status-bar ${state}`;

        this.currentStatus.state = state === 'loading' ? 'executing' : state === 'error' ? 'error' : 'idle';
    }

    private async submitTask() {
        const task = this.inputEl.value.trim();
        if (!task) return;

        // Validate input
        const validation = InputValidator.validateTask(task);
        if (!validation.valid) {
            new Notice(`❌ ${validation.error}`);
            return;
        }

        this.inputEl.value = '';
        this.appendMessage('You', task, 'user');

        // Check Ollama
        this.setStatus('Checking Ollama...', 'loading');
        if (!this.plugin.ollamaService) {
            this.setStatus('Service error', 'error');
            this.appendMessage('Error', 'Ollama service not initialized', 'error');
            return;
        }

        const isHealthy = await this.plugin.ollamaService.isHealthy();
        if (!isHealthy) {
            this.setStatus('Ollama Offline', 'error');
            this.appendMessage(
                'Error',
                '❌ Ollama is not running.\n\nStart it with:\nollama serve',
                'error'
            );
            new Notice('❌ Ollama is offline');
            return;
        }

        // Validate config
        const coreValidation = ConfigValidator.validateCorePath(this.plugin.settings.corePath);
        if (!coreValidation.valid) {
            this.setStatus('Config Error', 'error');
            this.appendMessage(
                'Error',
                `Configuration error:\n${coreValidation.error}\n\nPlease set the Core Path in AgentBrain settings.`,
                'error'
            );
            return;
        }

        // Process task
        this.setStatus('Manager planning...', 'loading');

        let fullTask = task;

        // Add memory context if enabled
        if (this.plugin.settings.enableMemory && this.plugin.memoryService) {
            this.setStatus('Querying memory...', 'loading');
            const results = await this.plugin.memoryService.query(task, this.plugin.settings.memoryTopK);
            if (results.length > 0) {
                fullTask += '\n\n--- RELEVANT VAULT NOTES ---\n';
                results.forEach((res: any) => {
                    fullTask += `[${res.metadata?.title || 'Note'}]\n${res.text}\n\n`;
                });
                fullTask += '-----------------------------';
                this.plugin.logger.debug('Memory context added', {
                    results: results.length,
                });
            }
        }

        // Execute
        this.setStatus('Executing agents...', 'loading');

        if (!this.plugin.processManager) {
            this.setStatus('Error', 'error');
            this.appendMessage('Error', 'Process manager not initialized', 'error');
            return;
        }

        try {
            const scriptPath = path.join(this.plugin.settings.corePath, 'main.py');

            this.plugin.logger.debug('Spawning process', {
                python: this.plugin.settings.pythonPath,
                script: scriptPath,
                taskLength: fullTask.length,
            });

            // Execute python
            const output = await this.plugin.processManager.execute({
                pythonPath: this.plugin.settings.pythonPath,
                scriptPath,
                args: [fullTask],
                cwd: this.plugin.settings.corePath,
                timeout: this.plugin.settings.maxTimeout,
            });

            // Parse output
            this.parseAgentOutput(output);
            this.setStatus('Complete', 'ready');
            new Notice('✅ Workflow completed');
        } catch (err: any) {
            this.plugin.logger.error('Execution failed', err);
            this.setStatus('Failed', 'error');
            this.appendMessage('Error', err.message || 'Execution failed', 'error');
            new Notice(`❌ ${err.message}`);
        }
    }

    private parseAgentOutput(output: string) {
        const lines = output.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
                const parsed = JSON.parse(trimmed);

                if (parsed.type === 'plan') {
                    const steps = (parsed.steps || [])
                        .map((s: any) => `${s.step_number}. ${s.agent.toUpperCase()}: ${s.instruction}`)
                        .join('\n');
                    this.appendMessage(
                        'Manager',
                        `📋 Plan: ${parsed.description}\n\n${steps}`,
                        'manager'
                    );
                } else if (parsed.agent && parsed.output) {
                    this.appendMessage(
                        `${parsed.agent} Agent`,
                        `Instruction: ${parsed.instruction || '(none)'}\n\nOutput:\n${parsed.output}`,
                        'agent'
                    );
                }
            } catch {
                // Skip non-JSON lines
            }
        }
    }
}

class AgentBrainSettingTab extends PluginSettingTab {
    plugin: AgentBrainPlugin;

    constructor(app: App, plugin: AgentBrainPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'AgentBrain Settings' });

        // Connection Settings
        containerEl.createEl('h3', { text: '🔌 Ollama Connection' });

        new Setting(containerEl)
            .setName('Ollama URL')
            .setDesc('URL where Ollama is running (usually http://localhost:11434)')
            .addText((text) =>
                text
                    .setPlaceholder('http://localhost:11434')
                    .setValue(this.plugin.settings.ollamaUrl)
                    .onChange(async (value) => {
                        const validationResult = ConfigValidator.validateOllamaUrl(value);
                        if (!validationResult.valid) {
                            new Notice(`❌ ${validationResult.error}`);
                            return;
                        }
                        this.plugin.settings.ollamaUrl = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Ollama Timeout (ms)')
            .setDesc('How long to wait for Ollama responses (milliseconds)')
            .addText((text) =>
                text
                    .setPlaceholder('30000')
                    .setValue(String(this.plugin.settings.ollamaTimeout))
                    .onChange(async (value) => {
                        const num = parseInt(value, 10);
                        if (isNaN(num) || num < 1000) {
                            new Notice('❌ Timeout must be at least 1000ms');
                            return;
                        }
                        this.plugin.settings.ollamaTimeout = num;
                        await this.plugin.saveSettings();
                    })
            );

        // Backend Settings
        containerEl.createEl('h3', { text: '⚙️ Backend Configuration' });

        new Setting(containerEl)
            .setName('Python Command')
            .setDesc('Command to run Python (e.g., "python", "python3", or absolute path)')
            .addText((text) =>
                text
                    .setPlaceholder('python')
                    .setValue(this.plugin.settings.pythonPath)
                    .onChange(async (value) => {
                        const validationResult = ConfigValidator.validatePythonPath(value);
                        if (!validationResult.valid) {
                            new Notice(`⚠️ ${validationResult.error}`);
                        }
                        this.plugin.settings.pythonPath = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('AgentBrain Core Path')
            .setDesc('Absolute path to agentbrain-core/ directory (required)')
            .addText((text) =>
                text
                    .setPlaceholder('/path/to/agentbrain-core')
                    .setValue(this.plugin.settings.corePath)
                    .onChange(async (value) => {
                        this.plugin.settings.corePath = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Max Execution Time')
            .setDesc('Maximum time to allow for task execution (seconds)')
            .addText((text) =>
                text
                    .setPlaceholder('300')
                    .setValue(String(this.plugin.settings.maxTimeout / 1000))
                    .onChange(async (value) => {
                        const seconds = parseInt(value, 10);
                        const validationResult = ConfigValidator.validateTimeout(seconds);
                        if (!validationResult.valid) {
                            new Notice(`❌ ${validationResult.error}`);
                            return;
                        }
                        this.plugin.settings.maxTimeout = seconds * 1000;
                        await this.plugin.saveSettings();
                    })
            );

        // Memory Settings
        containerEl.createEl('h3', { text: '🧠 Memory & Context' });

        new Setting(containerEl)
            .setName('Enable Memory Context')
            .setDesc(
                'Index vault notes and inject relevant context into prompts for better responses'
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.enableMemory).onChange(async (value) => {
                    this.plugin.settings.enableMemory = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Memory Server URL')
            .setDesc('URL where memory server (FastAPI) is running')
            .addText((text) =>
                text
                    .setPlaceholder('http://localhost:8000')
                    .setValue(this.plugin.settings.memoryServerUrl)
                    .onChange(async (value) => {
                        if (value && !ConfigValidator.validateMemoryUrl(value).valid) {
                            new Notice('❌ Invalid memory server URL');
                            return;
                        }
                        this.plugin.settings.memoryServerUrl = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Memory Search Results')
            .setDesc('Number of vault memory results to inject into context (1-20)')
            .addText((text) =>
                text
                    .setPlaceholder('5')
                    .setValue(String(this.plugin.settings.memoryTopK))
                    .onChange(async (value) => {
                        const num = parseInt(value, 10);
                        if (isNaN(num) || num < 1 || num > 20) {
                            new Notice('❌ Must be between 1 and 20');
                            return;
                        }
                        this.plugin.settings.memoryTopK = num;
                        await this.plugin.saveSettings();
                    })
            );

        // Debug Settings
        containerEl.createEl('h3', { text: '🐛 Debug' });

        new Setting(containerEl)
            .setName('Enable Debug Logging')
            .setDesc('Show verbose logs in the developer console (Ctrl+Shift+I)')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.enableDebugLogging).onChange(async (value) => {
                    this.plugin.settings.enableDebugLogging = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}
