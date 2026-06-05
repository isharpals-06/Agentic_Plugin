import { __awaiter } from "tslib";
import { Plugin, ItemView, Notice, requestUrl, setIcon } from 'obsidian';
import { spawn } from 'child_process';
import * as path from 'path';
import { DEFAULT_SETTINGS, AgentBrainSettingTab } from './settings';
export const VIEW_TYPE_AGENTBRAIN = 'agentbrain-chat';
export default class AgentBrainPlugin extends Plugin {
    constructor() {
        super(...arguments);
        this.settings = DEFAULT_SETTINGS;
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            // Register custom view
            this.registerView(VIEW_TYPE_AGENTBRAIN, (leaf) => new AgentBrainChatView(leaf, this));
            // Add ribbon icon
            this.addRibbonIcon('bot', 'Open AgentBrain Chat', () => {
                this.activateView();
            });
            // Add command to open chat
            this.addCommand({
                id: 'open-agentbrain-chat',
                name: 'Open Chat View',
                callback: () => this.activateView(),
            });
            // Add command to index current vault
            this.addCommand({
                id: 'index-vault-memory',
                name: 'Index Current Vault',
                callback: () => this.indexVault(),
            });
            // Add settings tab
            this.addSettingTab(new AgentBrainSettingTab(this.app, this));
        });
    }
    onunload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_AGENTBRAIN);
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    activateView() {
        return __awaiter(this, void 0, void 0, function* () {
            const { workspace } = this.app;
            let leaf = null;
            const leaves = workspace.getLeavesOfType(VIEW_TYPE_AGENTBRAIN);
            if (leaves.length > 0) {
                leaf = leaves[0];
            }
            else {
                const rightLeaf = workspace.getRightLeaf(false);
                if (rightLeaf) {
                    leaf = rightLeaf;
                    yield leaf.setViewState({
                        type: VIEW_TYPE_AGENTBRAIN,
                        active: true,
                    });
                }
            }
            if (leaf) {
                workspace.revealLeaf(leaf);
            }
        });
    }
    indexVault() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.settings.enableMemory) {
                new Notice('AgentBrain: Memory indexing is disabled in settings.');
                return;
            }
            const vaultPath = this.app.vault.adapter.getBasePath();
            if (!vaultPath) {
                new Notice('AgentBrain: Could not determine current vault path.');
                return;
            }
            new Notice('AgentBrain: Indexing vault notes...');
            try {
                const response = yield requestUrl({
                    url: `${this.settings.memoryServerUrl}/index`,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vault_path: vaultPath })
                });
                if (response.status === 200) {
                    const data = response.json;
                    if (data.success) {
                        new Notice(`AgentBrain: Vault indexed successfully! (${data.total_chunks} blocks)`);
                    }
                    else {
                        new Notice(`AgentBrain index failed: ${data.message}`);
                    }
                }
                else {
                    new Notice(`AgentBrain: Memory server error (${response.status})`);
                }
            }
            catch (error) {
                new Notice('AgentBrain: Could not connect to Memory server. Make sure it is running.');
                console.error(error);
            }
        });
    }
}
class AgentBrainChatView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
    }
    getViewType() {
        return VIEW_TYPE_AGENTBRAIN;
    }
    getDisplayText() {
        return 'AgentBrain';
    }
    getIcon() {
        return 'bot';
    }
    onOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            const container = this.containerEl.children[1];
            container.empty();
            container.addClass('agentbrain-view-container');
            // Create Header
            const header = container.createEl('div', { cls: 'agentbrain-header' });
            header.createEl('h3', { text: 'AgentBrain OS' });
            header.createEl('span', { text: 'Local Multi-Agent', cls: 'agentbrain-badge' });
            // Chat Container
            this.chatContainer = container.createEl('div', { cls: 'agentbrain-chat-container' });
            // Add Welcome Message
            this.addWelcomeMessage();
            // Footer status indicator
            this.statusEl = container.createEl('div', { cls: 'agentbrain-status-bar', text: 'Ready' });
            // Input Area
            const inputArea = container.createEl('div', { cls: 'agentbrain-input-area' });
            this.inputEl = inputArea.createEl('textarea', {
                cls: 'agentbrain-textarea',
                placeholder: 'Ask AgentBrain to write code, review, or research...'
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
        });
    }
    addWelcomeMessage() {
        const welcome = this.chatContainer.createEl('div', { cls: 'agentbrain-message system' });
        welcome.createEl('div', {
            text: 'Welcome to AgentBrain. Submit a task, and the Manager will plan and coordinate the local sub-agents sequentially to solve it.',
            cls: 'agentbrain-message-content'
        });
    }
    appendMessage(sender, content, type = 'agent') {
        const msg = this.chatContainer.createEl('div', { cls: `agentbrain-message ${type}` });
        const header = msg.createEl('div', { cls: 'agentbrain-message-header' });
        header.createEl('strong', { text: sender });
        const contentEl = msg.createEl('pre', { cls: 'agentbrain-message-content' });
        contentEl.createEl('code', { text: content });
        // Auto scroll
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        return contentEl;
    }
    submitTask() {
        return __awaiter(this, void 0, void 0, function* () {
            const task = this.inputEl.value.trim();
            if (!task)
                return;
            this.inputEl.value = '';
            this.appendMessage('You', task, 'user');
            this.setStatus('Manager Planning...', 'loading');
            const pythonCmd = this.plugin.settings.pythonPath;
            const corePath = this.plugin.settings.corePath;
            const mainScript = path.join(corePath, 'main.py');
            // Prepare context injection from memory if enabled
            let fullTask = task;
            if (this.plugin.settings.enableMemory) {
                this.setStatus('Querying local vault memories...', 'loading');
                try {
                    const response = yield requestUrl({
                        url: `${this.plugin.settings.memoryServerUrl}/query?q=${encodeURIComponent(task)}&top_k=3`,
                        method: 'GET'
                    });
                    if (response.status === 200) {
                        const data = response.json;
                        if (data.results && data.results.length > 0) {
                            fullTask += '\n\n--- RELATED LOCAL VAULT NOTES ---\n';
                            data.results.forEach((res) => {
                                fullTask += `[Note: ${res.metadata.title}]\n${res.text}\n\n`;
                            });
                            fullTask += '---------------------------------';
                        }
                    }
                }
                catch (err) {
                    console.warn('Memory query failed:', err);
                }
            }
            this.setStatus('Orchestrating agents...', 'loading');
            // Spawn core execution engine python child process
            const process = spawn(pythonCmd, [mainScript, fullTask], { cwd: corePath });
            let stdoutBuffer = '';
            let stderrBuffer = '';
            let currentAgentEl = null;
            let currentAgentName = '';
            process.stdout.on('data', (data) => {
                const text = data.toString();
                stdoutBuffer += text;
                // Simple parsing to detect active steps and stream content
                const lines = text.split('\n');
                for (const line of lines) {
                    if (line.startsWith('--- Step ') && line.endsWith(' ---')) {
                        const match = line.match(/Step \d+: ([A-Za-z]+)/);
                        if (match) {
                            currentAgentName = match[1];
                            currentAgentEl = this.appendMessage(`${currentAgentName} Agent`, '', 'agent');
                            this.setStatus(`Executing ${currentAgentName} specialist...`, 'loading');
                        }
                    }
                    else if (line.startsWith('Output:')) {
                        // Start of output content
                    }
                    else if (line.startsWith('Instruction:')) {
                        // Instruction logging
                    }
                    else if (line.trim() === '-'.repeat(60) || line.startsWith('====') || line.startsWith('Workflow Execution Completed')) {
                        // Step boundaries
                    }
                    else {
                        // Append streamable chunk to the active agent bubble
                        if (currentAgentEl) {
                            currentAgentEl.textContent += line + '\n';
                            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
                        }
                    }
                }
            });
            process.stderr.on('data', (data) => {
                stderrBuffer += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    this.setStatus('Execution Completed', 'ready');
                    new Notice('AgentBrain: Workflow finished successfully.');
                }
                else {
                    this.setStatus('Execution Failed', 'error');
                    this.appendMessage('Error Log', stderrBuffer || stdoutBuffer || 'Python process terminated with error.', 'error');
                    new Notice('AgentBrain: Work execution failed.');
                }
            });
        });
    }
    setStatus(text, state = 'ready') {
        this.statusEl.textContent = text;
        this.statusEl.className = `agentbrain-status-bar ${state}`;
    }
}
//# sourceMappingURL=main.js.map