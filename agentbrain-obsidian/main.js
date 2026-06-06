'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var obsidian = require('obsidian');
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);
var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class ConfigValidator {
    /**
     * Validate Python path is executable
     */
    static validatePythonPath(pythonPath) {
        if (!pythonPath || pythonPath.trim() === '') {
            return { valid: false, error: 'Python path cannot be empty' };
        }
        // Just check it looks reasonable (more sophisticated check in actual plugin)
        if (pythonPath.includes('\0') || pythonPath.includes('*')) {
            return { valid: false, error: 'Python path contains invalid characters' };
        }
        return { valid: true };
    }
    /**
     * Validate core path exists and contains main.py
     */
    static validateCorePath(corePath) {
        if (!corePath || corePath.trim() === '') {
            return { valid: false, error: 'Core path cannot be empty' };
        }
        try {
            if (!fs__namespace.existsSync(corePath)) {
                return { valid: false, error: `Core path does not exist: ${corePath}` };
            }
            const mainPyPath = path__namespace.join(corePath, 'main.py');
            if (!fs__namespace.existsSync(mainPyPath)) {
                return { valid: false, error: `main.py not found in: ${corePath}` };
            }
            return { valid: true };
        }
        catch (err) {
            return { valid: false, error: `Error validating core path: ${err.message}` };
        }
    }
    /**
     * Validate Ollama URL format
     */
    static validateOllamaUrl(url) {
        try {
            new URL(url);
            return { valid: true };
        }
        catch (_a) {
            return { valid: false, error: 'Invalid Ollama URL format' };
        }
    }
    /**
     * Validate memory server URL format
     */
    static validateMemoryUrl(url) {
        if (!url)
            return { valid: true }; // Optional
        try {
            new URL(url);
            return { valid: true };
        }
        catch (_a) {
            return { valid: false, error: 'Invalid Memory Server URL format' };
        }
    }
    /**
     * Validate timeout values
     */
    static validateTimeout(seconds) {
        if (seconds < 10) {
            return { valid: false, error: 'Timeout must be at least 10 seconds' };
        }
        if (seconds > 3600) {
            return { valid: false, error: 'Timeout cannot exceed 1 hour' };
        }
        return { valid: true };
    }
}
class InputValidator {
    /**
     * Validate user task input
     */
    static validateTask(task) {
        if (!task || task.trim() === '') {
            return { valid: false, error: 'Task cannot be empty' };
        }
        if (task.length > 10000) {
            return { valid: false, error: 'Task is too long (max 10000 characters)' };
        }
        return { valid: true };
    }
}

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
class Logger {
    constructor(logLevel = LogLevel.INFO) {
        this.logs = [];
        this.maxLogs = 500;
        this.level = logLevel;
    }
    debug(message, data) {
        this.log(LogLevel.DEBUG, message, data);
    }
    info(message, data) {
        this.log(LogLevel.INFO, message, data);
    }
    warn(message, data) {
        this.log(LogLevel.WARN, message, data);
    }
    error(message, data) {
        this.log(LogLevel.ERROR, message, data);
    }
    log(level, message, data) {
        if (level < this.level)
            return;
        const entry = {
            timestamp: Date.now(),
            level,
            message,
            data,
        };
        this.logs.push(entry);
        // Keep logs bounded
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        // Console output
        const prefix = `[AgentBrain ${LogLevel[level]}]`;
        const output = `${prefix} ${message}`;
        switch (level) {
            case LogLevel.DEBUG:
                if (data !== undefined) {
                    console.debug(output, data);
                }
                else {
                    console.debug(output);
                }
                break;
            case LogLevel.INFO:
                if (data !== undefined) {
                    console.log(output, data);
                }
                else {
                    console.log(output);
                }
                break;
            case LogLevel.WARN:
                if (data !== undefined) {
                    console.warn(output, data);
                }
                else {
                    console.warn(output);
                }
                break;
            case LogLevel.ERROR:
                if (data !== undefined) {
                    console.error(output, data);
                }
                else {
                    console.error(output);
                }
                break;
        }
    }
    getLogs(level) {
        if (level === undefined)
            return [...this.logs];
        return this.logs.filter(l => l.level >= level);
    }
    clearLogs() {
        this.logs = [];
    }
}

class OllamaService {
    constructor(url, timeout = 10000, logger) {
        this.retryAttempts = 3;
        this.retryDelay = 1000; // ms
        this.url = url;
        this.timeout = timeout;
        this.logger = logger || new Logger(LogLevel.INFO);
    }
    /**
     * Check if Ollama is running and accessible
     */
    isHealthy() {
        return __awaiter(this, arguments, void 0, function* (retries = this.retryAttempts) {
            for (let i = 0; i < retries; i++) {
                try {
                    const response = yield obsidian.requestUrl({
                        url: `${this.url}/api/tags`,
                        method: 'GET',
                        throw: false,
                    });
                    if (response.status === 200) {
                        this.logger.debug('Ollama is healthy');
                        return true;
                    }
                    this.logger.warn(`Ollama returned status ${response.status}`);
                }
                catch (err) {
                    this.logger.debug(`Ollama health check attempt ${i + 1} failed`, err.message);
                    if (i < retries - 1) {
                        yield this.sleep(this.retryDelay);
                    }
                }
            }
            return false;
        });
    }
    /**
     * Get list of available models
     */
    getModels() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield obsidian.requestUrl({
                    url: `${this.url}/api/tags`,
                    method: 'GET',
                });
                if (response.status === 200) {
                    const data = response.json;
                    return data.models || [];
                }
                throw new Error(`Ollama returned status ${response.status}`);
            }
            catch (err) {
                this.logger.error('Failed to fetch models', err);
                throw err;
            }
        });
    }
    /**
     * Generate response from model
     */
    generate(model, prompt, _onStream) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield obsidian.requestUrl({
                    url: `${this.url}/api/generate`,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model,
                        prompt,
                        stream: false,
                    }),
                });
                if (response.status === 200) {
                    const data = response.json;
                    return data.response || '';
                }
                throw new Error(`Model returned status ${response.status}`);
            }
            catch (err) {
                this.logger.error(`Failed to generate from ${model}`, err);
                throw err;
            }
        });
    }
    /**
     * Check if specific model is available
     */
    hasModel(modelName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const models = yield this.getModels();
                return models.some(m => m.name.includes(modelName));
            }
            catch (_a) {
                return false;
            }
        });
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class ProcessManager {
    constructor(logger) {
        this.activeProcess = null;
        this.processTimeout = null;
        this.logger = logger || new Logger(LogLevel.INFO);
    }
    /**
     * Execute Python script and get output
     */
    execute(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var _a, _b;
                this.logger.info('Starting Python process', {
                    script: options.scriptPath,
                    args: options.args,
                });
                try {
                    this.activeProcess = child_process.spawn(options.pythonPath, [options.scriptPath, ...options.args], {
                        cwd: options.cwd,
                        stdio: ['pipe', 'pipe', 'pipe'],
                    });
                    let stdout = '';
                    let stderr = '';
                    (_a = this.activeProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
                        stdout += data.toString();
                    });
                    (_b = this.activeProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (data) => {
                        stderr += data.toString();
                    });
                    // Set timeout
                    if (options.timeout) {
                        this.processTimeout = setTimeout(() => {
                            if (this.activeProcess) {
                                this.logger.warn('Process timeout, killing');
                                this.activeProcess.kill();
                            }
                            reject(new Error(`Process timed out after ${options.timeout}ms`));
                        }, options.timeout);
                    }
                    this.activeProcess.on('close', (code) => {
                        this.clearProcessTimeout();
                        this.activeProcess = null;
                        if (code === 0) {
                            this.logger.info('Process completed successfully');
                            resolve(stdout);
                        }
                        else {
                            this.logger.error('Process failed', { code, stderr });
                            reject(new Error(stderr || `Process exited with code ${code}`));
                        }
                    });
                    this.activeProcess.on('error', (err) => {
                        this.clearProcessTimeout();
                        this.activeProcess = null;
                        this.logger.error('Process error', err);
                        reject(err);
                    });
                }
                catch (err) {
                    this.logger.error('Failed to spawn process', err);
                    reject(err);
                }
            });
        });
    }
    /**
     * Kill active process
     */
    kill() {
        if (this.activeProcess && !this.activeProcess.killed) {
            this.logger.info('Killing active process');
            this.activeProcess.kill();
        }
        this.clearProcessTimeout();
    }
    /**
     * Check if process is running
     */
    isRunning() {
        return this.activeProcess !== null && !this.activeProcess.killed;
    }
    clearProcessTimeout() {
        if (this.processTimeout) {
            clearTimeout(this.processTimeout);
            this.processTimeout = null;
        }
    }
}

class MemoryService {
    constructor(url, logger) {
        this.url = url;
        this.logger = logger || new Logger(LogLevel.INFO);
    }
    /**
     * Check if the memory server is reachable
     */
    isHealthy() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield obsidian.requestUrl({
                    url: `${this.url}/status`,
                    method: 'GET',
                    throw: false,
                });
                return response.status === 200;
            }
            catch (_a) {
                return false;
            }
        });
    }
    /**
     * Query memory for relevant context
     */
    query(queryText_1) {
        return __awaiter(this, arguments, void 0, function* (queryText, topK = 5) {
            try {
                const response = yield obsidian.requestUrl({
                    url: `${this.url}/query?q=${encodeURIComponent(queryText)}&top_k=${topK}`,
                    method: 'GET',
                    throw: false,
                });
                if (response.status === 200) {
                    const data = response.json;
                    if (data.results && data.results.length > 0) {
                        this.logger.debug('Memory query returned results', { count: data.results.length });
                        return data.results;
                    }
                }
                return [];
            }
            catch (err) {
                this.logger.warn('Memory query failed', err.message);
                return [];
            }
        });
    }
    /**
     * Trigger vault indexing
     */
    indexVault(vaultPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield obsidian.requestUrl({
                    url: `${this.url}/index`,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vault_path: vaultPath }),
                });
                if (response.status === 200) {
                    const data = response.json;
                    return {
                        success: data.success || false,
                        message: data.message || '',
                        totalChunks: data.total_chunks,
                    };
                }
                return { success: false, message: `Memory server error (${response.status})` };
            }
            catch (err) {
                this.logger.error('Memory server connection failed', err);
                return { success: false, message: 'Memory server unreachable' };
            }
        });
    }
}

const VIEW_TYPE_AGENTBRAIN = 'agentbrain-chat';
const DEFAULT_SETTINGS = {
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
class AgentBrainPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.settings = DEFAULT_SETTINGS;
        this.logger = new Logger(LogLevel.INFO);
        this.ollamaService = null;
        this.processManager = null;
        this.memoryService = null;
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            this.updateLogLevel();
            this.logger.info('AgentBrain plugin loading');
            // Initialize services
            this.ollamaService = new OllamaService(this.settings.ollamaUrl, this.settings.ollamaTimeout, this.logger);
            this.processManager = new ProcessManager(this.logger);
            this.memoryService = new MemoryService(this.settings.memoryServerUrl, this.logger);
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
        });
    }
    onunload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('AgentBrain plugin unloading');
            // Kill any running processes
            if (this.processManager) {
                this.processManager.kill();
            }
            // Detach views
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_AGENTBRAIN);
            this.logger.info('AgentBrain plugin unloaded');
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
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
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
            this.updateLogLevel();
            // Reinitialize services with new settings
            this.ollamaService = new OllamaService(this.settings.ollamaUrl, this.settings.ollamaTimeout, this.logger);
            this.memoryService = new MemoryService(this.settings.memoryServerUrl, this.logger);
        });
    }
    updateLogLevel() {
        const newLevel = this.settings.enableDebugLogging ? LogLevel.DEBUG : LogLevel.INFO;
        this.logger = new Logger(newLevel);
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
    checkOllamaStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.ollamaService) {
                new obsidian.Notice('Ollama service not initialized');
                return;
            }
            const isHealthy = yield this.ollamaService.isHealthy(1);
            if (isHealthy) {
                try {
                    const models = yield this.ollamaService.getModels();
                    const modelList = models.map(m => m.name).join(', ');
                    new obsidian.Notice(`✅ Ollama is running with ${models.length} models\n\n${modelList}`);
                }
                catch (err) {
                    new obsidian.Notice(`✅ Ollama is running (couldn't fetch model list: ${err.message})`);
                }
            }
            else {
                new obsidian.Notice(`❌ Ollama is not running.\n\nPlease start Ollama with:\nollama serve`);
            }
        });
    }
    indexVault() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!this.settings.enableMemory) {
                new obsidian.Notice('AgentBrain: Memory indexing is disabled in settings.');
                return;
            }
            if (!this.memoryService) {
                new obsidian.Notice('AgentBrain: Memory service not initialized.');
                return;
            }
            const vaultPath = (_b = (_a = this.app.vault.adapter).getBasePath) === null || _b === void 0 ? void 0 : _b.call(_a);
            if (!vaultPath) {
                new obsidian.Notice('AgentBrain: Could not determine vault path.');
                return;
            }
            new obsidian.Notice('Indexing vault notes...');
            this.logger.info('Starting vault indexing', { vaultPath });
            const result = yield this.memoryService.indexVault(vaultPath);
            if (result.success) {
                new obsidian.Notice(`✅ Vault indexed! (${result.totalChunks} chunks)`);
                this.logger.info('Vault indexed successfully', result);
            }
            else {
                new obsidian.Notice(`❌ ${result.message}\n\nMake sure the memory server is running:\npython agentbrain-memory/main.py`);
                this.logger.error('Vault indexing failed', result);
            }
        });
    }
}
class AgentBrainChatView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.messages = [];
        this.currentStatus = {
            state: 'idle',
            progress: 0,
        };
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
            obsidian.setIcon(sendBtn, 'send');
            sendBtn.addEventListener('click', () => this.submitTask());
        });
    }
    addWelcomeMessage() {
        const msg = this.chatContainer.createEl('div', { cls: 'agentbrain-message system' });
        msg.createEl('div', {
            text: '👋 Welcome to AgentBrain!\n\nDescribe your task and I\'ll intelligently route it to the best AI specialist:\n• 💻 Coding - Qwen3.6\n• 📚 Research - LFM2.5-Thinking\n• 🧠 Brainstorming - Mixtral\n• ✏️ Review - Mixtral\n• 🎓 Learning - Mixtral\n\nOr just ask anything!',
            cls: 'agentbrain-message-content',
        });
    }
    appendMessage(sender, content, type = 'agent') {
        const msg = this.chatContainer.createEl('div', { cls: `agentbrain-message ${type}` });
        const msgHeader = msg.createEl('div', { cls: 'agentbrain-message-header' });
        msgHeader.createEl('strong', { text: sender });
        const contentEl = msg.createEl('pre', { cls: 'agentbrain-message-content' });
        contentEl.textContent = content;
        // Auto scroll
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        const message = {
            sender,
            content,
            type,
            timestamp: Date.now(),
        };
        this.messages.push(message);
    }
    setStatus(text, state = 'ready') {
        const icons = { ready: '✅', loading: '⏳', error: '❌' };
        this.statusEl.textContent = `${icons[state]} ${text}`;
        this.statusEl.className = `agentbrain-status-bar ${state}`;
        this.currentStatus.state = state === 'loading' ? 'executing' : state === 'error' ? 'error' : 'idle';
    }
    submitTask() {
        return __awaiter(this, void 0, void 0, function* () {
            const task = this.inputEl.value.trim();
            if (!task)
                return;
            // Validate input
            const validation = InputValidator.validateTask(task);
            if (!validation.valid) {
                new obsidian.Notice(`❌ ${validation.error}`);
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
            const isHealthy = yield this.plugin.ollamaService.isHealthy();
            if (!isHealthy) {
                this.setStatus('Ollama Offline', 'error');
                this.appendMessage('Error', '❌ Ollama is not running.\n\nStart it with:\nollama serve', 'error');
                new obsidian.Notice('❌ Ollama is offline');
                return;
            }
            // Validate config
            const coreValidation = ConfigValidator.validateCorePath(this.plugin.settings.corePath);
            if (!coreValidation.valid) {
                this.setStatus('Config Error', 'error');
                this.appendMessage('Error', `Configuration error:\n${coreValidation.error}\n\nPlease set the Core Path in AgentBrain settings.`, 'error');
                return;
            }
            // Process task
            this.setStatus('Manager planning...', 'loading');
            let fullTask = task;
            // Add memory context if enabled
            if (this.plugin.settings.enableMemory && this.plugin.memoryService) {
                this.setStatus('Querying memory...', 'loading');
                const results = yield this.plugin.memoryService.query(task, this.plugin.settings.memoryTopK);
                if (results.length > 0) {
                    fullTask += '\n\n--- RELEVANT VAULT NOTES ---\n';
                    results.forEach((res) => {
                        var _a;
                        fullTask += `[${((_a = res.metadata) === null || _a === void 0 ? void 0 : _a.title) || 'Note'}]\n${res.text}\n\n`;
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
                const scriptPath = path__namespace.join(this.plugin.settings.corePath, 'main.py');
                this.plugin.logger.debug('Spawning process', {
                    python: this.plugin.settings.pythonPath,
                    script: scriptPath,
                    taskLength: fullTask.length,
                });
                // Execute python
                const output = yield this.plugin.processManager.execute({
                    pythonPath: this.plugin.settings.pythonPath,
                    scriptPath,
                    args: [fullTask],
                    cwd: this.plugin.settings.corePath,
                    timeout: this.plugin.settings.maxTimeout,
                });
                // Parse output
                this.parseAgentOutput(output);
                this.setStatus('Complete', 'ready');
                new obsidian.Notice('✅ Workflow completed');
            }
            catch (err) {
                this.plugin.logger.error('Execution failed', err);
                this.setStatus('Failed', 'error');
                this.appendMessage('Error', err.message || 'Execution failed', 'error');
                new obsidian.Notice(`❌ ${err.message}`);
            }
        });
    }
    parseAgentOutput(output) {
        const lines = output.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed.type === 'plan') {
                    const steps = (parsed.steps || [])
                        .map((s) => `${s.step_number}. ${s.agent.toUpperCase()}: ${s.instruction}`)
                        .join('\n');
                    this.appendMessage('Manager', `📋 Plan: ${parsed.description}\n\n${steps}`, 'manager');
                }
                else if (parsed.agent && parsed.output) {
                    this.appendMessage(`${parsed.agent} Agent`, `Instruction: ${parsed.instruction || '(none)'}\n\nOutput:\n${parsed.output}`, 'agent');
                }
            }
            catch (_a) {
                // Skip non-JSON lines
            }
        }
    }
}
class AgentBrainSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'AgentBrain Settings' });
        // Connection Settings
        containerEl.createEl('h3', { text: '🔌 Ollama Connection' });
        new obsidian.Setting(containerEl)
            .setName('Ollama URL')
            .setDesc('URL where Ollama is running (usually http://localhost:11434)')
            .addText((text) => text
            .setPlaceholder('http://localhost:11434')
            .setValue(this.plugin.settings.ollamaUrl)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            const validationResult = ConfigValidator.validateOllamaUrl(value);
            if (!validationResult.valid) {
                new obsidian.Notice(`❌ ${validationResult.error}`);
                return;
            }
            this.plugin.settings.ollamaUrl = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian.Setting(containerEl)
            .setName('Ollama Timeout (ms)')
            .setDesc('How long to wait for Ollama responses (milliseconds)')
            .addText((text) => text
            .setPlaceholder('30000')
            .setValue(String(this.plugin.settings.ollamaTimeout))
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 1000) {
                new obsidian.Notice('❌ Timeout must be at least 1000ms');
                return;
            }
            this.plugin.settings.ollamaTimeout = num;
            yield this.plugin.saveSettings();
        })));
        // Backend Settings
        containerEl.createEl('h3', { text: '⚙️ Backend Configuration' });
        new obsidian.Setting(containerEl)
            .setName('Python Command')
            .setDesc('Command to run Python (e.g., "python", "python3", or absolute path)')
            .addText((text) => text
            .setPlaceholder('python')
            .setValue(this.plugin.settings.pythonPath)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            const validationResult = ConfigValidator.validatePythonPath(value);
            if (!validationResult.valid) {
                new obsidian.Notice(`⚠️ ${validationResult.error}`);
            }
            this.plugin.settings.pythonPath = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian.Setting(containerEl)
            .setName('AgentBrain Core Path')
            .setDesc('Absolute path to agentbrain-core/ directory (required)')
            .addText((text) => text
            .setPlaceholder('/path/to/agentbrain-core')
            .setValue(this.plugin.settings.corePath)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.corePath = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian.Setting(containerEl)
            .setName('Max Execution Time')
            .setDesc('Maximum time to allow for task execution (seconds)')
            .addText((text) => text
            .setPlaceholder('300')
            .setValue(String(this.plugin.settings.maxTimeout / 1000))
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            const seconds = parseInt(value, 10);
            const validationResult = ConfigValidator.validateTimeout(seconds);
            if (!validationResult.valid) {
                new obsidian.Notice(`❌ ${validationResult.error}`);
                return;
            }
            this.plugin.settings.maxTimeout = seconds * 1000;
            yield this.plugin.saveSettings();
        })));
        // Memory Settings
        containerEl.createEl('h3', { text: '🧠 Memory & Context' });
        new obsidian.Setting(containerEl)
            .setName('Enable Memory Context')
            .setDesc('Index vault notes and inject relevant context into prompts for better responses')
            .addToggle((toggle) => toggle.setValue(this.plugin.settings.enableMemory).onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.enableMemory = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian.Setting(containerEl)
            .setName('Memory Server URL')
            .setDesc('URL where memory server (FastAPI) is running')
            .addText((text) => text
            .setPlaceholder('http://localhost:8000')
            .setValue(this.plugin.settings.memoryServerUrl)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            if (value && !ConfigValidator.validateMemoryUrl(value).valid) {
                new obsidian.Notice('❌ Invalid memory server URL');
                return;
            }
            this.plugin.settings.memoryServerUrl = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian.Setting(containerEl)
            .setName('Memory Search Results')
            .setDesc('Number of vault memory results to inject into context (1-20)')
            .addText((text) => text
            .setPlaceholder('5')
            .setValue(String(this.plugin.settings.memoryTopK))
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 1 || num > 20) {
                new obsidian.Notice('❌ Must be between 1 and 20');
                return;
            }
            this.plugin.settings.memoryTopK = num;
            yield this.plugin.saveSettings();
        })));
        // Debug Settings
        containerEl.createEl('h3', { text: '🐛 Debug' });
        new obsidian.Setting(containerEl)
            .setName('Enable Debug Logging')
            .setDesc('Show verbose logs in the developer console (Ctrl+Shift+I)')
            .addToggle((toggle) => toggle.setValue(this.plugin.settings.enableDebugLogging).onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.enableDebugLogging = value;
            yield this.plugin.saveSettings();
        })));
    }
}

exports.VIEW_TYPE_AGENTBRAIN = VIEW_TYPE_AGENTBRAIN;
exports.default = AgentBrainPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNyYy91dGlscy92YWxpZGF0b3JzLnRzIiwic3JjL3V0aWxzL2xvZ2dlci50cyIsInNyYy9zZXJ2aWNlcy9PbGxhbWFTZXJ2aWNlLnRzIiwic3JjL3NlcnZpY2VzL1Byb2Nlc3NNYW5hZ2VyLnRzIiwic3JjL3NlcnZpY2VzL01lbW9yeVNlcnZpY2UudHMiLCJzcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxyXG5cclxuUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55XHJcbnB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZC5cclxuXHJcblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEhcclxuUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZXHJcbkFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcclxuSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NXHJcbkxPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SXHJcbk9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcclxuUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UsIFN1cHByZXNzZWRFcnJvciwgU3ltYm9sLCBJdGVyYXRvciAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19lc0RlY29yYXRlKGN0b3IsIGRlc2NyaXB0b3JJbiwgZGVjb3JhdG9ycywgY29udGV4dEluLCBpbml0aWFsaXplcnMsIGV4dHJhSW5pdGlhbGl6ZXJzKSB7XHJcbiAgICBmdW5jdGlvbiBhY2NlcHQoZikgeyBpZiAoZiAhPT0gdm9pZCAwICYmIHR5cGVvZiBmICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbiBleHBlY3RlZFwiKTsgcmV0dXJuIGY7IH1cclxuICAgIHZhciBraW5kID0gY29udGV4dEluLmtpbmQsIGtleSA9IGtpbmQgPT09IFwiZ2V0dGVyXCIgPyBcImdldFwiIDoga2luZCA9PT0gXCJzZXR0ZXJcIiA/IFwic2V0XCIgOiBcInZhbHVlXCI7XHJcbiAgICB2YXIgdGFyZ2V0ID0gIWRlc2NyaXB0b3JJbiAmJiBjdG9yID8gY29udGV4dEluW1wic3RhdGljXCJdID8gY3RvciA6IGN0b3IucHJvdG90eXBlIDogbnVsbDtcclxuICAgIHZhciBkZXNjcmlwdG9yID0gZGVzY3JpcHRvckluIHx8ICh0YXJnZXQgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgY29udGV4dEluLm5hbWUpIDoge30pO1xyXG4gICAgdmFyIF8sIGRvbmUgPSBmYWxzZTtcclxuICAgIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgdmFyIGNvbnRleHQgPSB7fTtcclxuICAgICAgICBmb3IgKHZhciBwIGluIGNvbnRleHRJbikgY29udGV4dFtwXSA9IHAgPT09IFwiYWNjZXNzXCIgPyB7fSA6IGNvbnRleHRJbltwXTtcclxuICAgICAgICBmb3IgKHZhciBwIGluIGNvbnRleHRJbi5hY2Nlc3MpIGNvbnRleHQuYWNjZXNzW3BdID0gY29udGV4dEluLmFjY2Vzc1twXTtcclxuICAgICAgICBjb250ZXh0LmFkZEluaXRpYWxpemVyID0gZnVuY3Rpb24gKGYpIHsgaWYgKGRvbmUpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgYWRkIGluaXRpYWxpemVycyBhZnRlciBkZWNvcmF0aW9uIGhhcyBjb21wbGV0ZWRcIik7IGV4dHJhSW5pdGlhbGl6ZXJzLnB1c2goYWNjZXB0KGYgfHwgbnVsbCkpOyB9O1xyXG4gICAgICAgIHZhciByZXN1bHQgPSAoMCwgZGVjb3JhdG9yc1tpXSkoa2luZCA9PT0gXCJhY2Nlc3NvclwiID8geyBnZXQ6IGRlc2NyaXB0b3IuZ2V0LCBzZXQ6IGRlc2NyaXB0b3Iuc2V0IH0gOiBkZXNjcmlwdG9yW2tleV0sIGNvbnRleHQpO1xyXG4gICAgICAgIGlmIChraW5kID09PSBcImFjY2Vzc29yXCIpIHtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdm9pZCAwKSBjb250aW51ZTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gbnVsbCB8fCB0eXBlb2YgcmVzdWx0ICE9PSBcIm9iamVjdFwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0IGV4cGVjdGVkXCIpO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuZ2V0KSkgZGVzY3JpcHRvci5nZXQgPSBfO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuc2V0KSkgZGVzY3JpcHRvci5zZXQgPSBfO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuaW5pdCkpIGluaXRpYWxpemVycy51bnNoaWZ0KF8pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChfID0gYWNjZXB0KHJlc3VsdCkpIHtcclxuICAgICAgICAgICAgaWYgKGtpbmQgPT09IFwiZmllbGRcIikgaW5pdGlhbGl6ZXJzLnVuc2hpZnQoXyk7XHJcbiAgICAgICAgICAgIGVsc2UgZGVzY3JpcHRvcltrZXldID0gXztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGFyZ2V0KSBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBjb250ZXh0SW4ubmFtZSwgZGVzY3JpcHRvcik7XHJcbiAgICBkb25lID0gdHJ1ZTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3J1bkluaXRpYWxpemVycyh0aGlzQXJnLCBpbml0aWFsaXplcnMsIHZhbHVlKSB7XHJcbiAgICB2YXIgdXNlVmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5pdGlhbGl6ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFsdWUgPSB1c2VWYWx1ZSA/IGluaXRpYWxpemVyc1tpXS5jYWxsKHRoaXNBcmcsIHZhbHVlKSA6IGluaXRpYWxpemVyc1tpXS5jYWxsKHRoaXNBcmcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVzZVZhbHVlID8gdmFsdWUgOiB2b2lkIDA7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wcm9wS2V5KHgpIHtcclxuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIiA/IHggOiBcIlwiLmNvbmNhdCh4KTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NldEZ1bmN0aW9uTmFtZShmLCBuYW1lLCBwcmVmaXgpIHtcclxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJzeW1ib2xcIikgbmFtZSA9IG5hbWUuZGVzY3JpcHRpb24gPyBcIltcIi5jb25jYXQobmFtZS5kZXNjcmlwdGlvbiwgXCJdXCIpIDogXCJcIjtcclxuICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZiwgXCJuYW1lXCIsIHsgY29uZmlndXJhYmxlOiB0cnVlLCB2YWx1ZTogcHJlZml4ID8gXCJcIi5jb25jYXQocHJlZml4LCBcIiBcIiwgbmFtZSkgOiBuYW1lIH0pO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZyA9IE9iamVjdC5jcmVhdGUoKHR5cGVvZiBJdGVyYXRvciA9PT0gXCJmdW5jdGlvblwiID8gSXRlcmF0b3IgOiBPYmplY3QpLnByb3RvdHlwZSk7XHJcbiAgICByZXR1cm4gZy5uZXh0ID0gdmVyYigwKSwgZ1tcInRocm93XCJdID0gdmVyYigxKSwgZ1tcInJldHVyblwiXSA9IHZlcmIoMiksIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoZyAmJiAoZyA9IDAsIG9wWzBdICYmIChfID0gMCkpLCBfKSB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XHJcbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19jcmVhdGVCaW5kaW5nID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtLCBrKTtcclxuICAgIGlmICghZGVzYyB8fCAoXCJnZXRcIiBpbiBkZXNjID8gIW0uX19lc01vZHVsZSA6IGRlc2Mud3JpdGFibGUgfHwgZGVzYy5jb25maWd1cmFibGUpKSB7XHJcbiAgICAgICAgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgZGVzYyk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkgX19jcmVhdGVCaW5kaW5nKG8sIG0sIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tLCBwYWNrKSB7XHJcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcclxuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcclxuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0gT2JqZWN0LmNyZWF0ZSgodHlwZW9mIEFzeW5jSXRlcmF0b3IgPT09IFwiZnVuY3Rpb25cIiA/IEFzeW5jSXRlcmF0b3IgOiBPYmplY3QpLnByb3RvdHlwZSksIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiwgYXdhaXRSZXR1cm4pLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiBhd2FpdFJldHVybihmKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHYpLnRoZW4oZiwgcmVqZWN0KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlmIChnW25dKSB7IGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IGlmIChmKSBpW25dID0gZihpW25dKTsgfSB9XHJcbiAgICBmdW5jdGlvbiByZXN1bWUobiwgdikgeyB0cnkgeyBzdGVwKGdbbl0odikpOyB9IGNhdGNoIChlKSB7IHNldHRsZShxWzBdWzNdLCBlKTsgfSB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKHIpIHsgci52YWx1ZSBpbnN0YW5jZW9mIF9fYXdhaXQgPyBQcm9taXNlLnJlc29sdmUoci52YWx1ZS52KS50aGVuKGZ1bGZpbGwsIHJlamVjdCkgOiBzZXR0bGUocVswXVsyXSwgcik7IH1cclxuICAgIGZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHsgcmVzdW1lKFwibmV4dFwiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSkgeyByZXN1bWUoXCJ0aHJvd1wiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShmLCB2KSB7IGlmIChmKHYpLCBxLnNoaWZ0KCksIHEubGVuZ3RoKSByZXN1bWUocVswXVswXSwgcVswXVsxXSk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNEZWxlZ2F0b3Iobykge1xyXG4gICAgdmFyIGksIHA7XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIsIGZ1bmN0aW9uIChlKSB7IHRocm93IGU7IH0pLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlbbl0gPSBvW25dID8gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIChwID0gIXApID8geyB2YWx1ZTogX19hd2FpdChvW25dKHYpKSwgZG9uZTogZmFsc2UgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxudmFyIG93bktleXMgPSBmdW5jdGlvbihvKSB7XHJcbiAgICBvd25LZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgfHwgZnVuY3Rpb24gKG8pIHtcclxuICAgICAgICB2YXIgYXIgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrIGluIG8pIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgaykpIGFyW2FyLmxlbmd0aF0gPSBrO1xyXG4gICAgICAgIHJldHVybiBhcjtcclxuICAgIH07XHJcbiAgICByZXR1cm4gb3duS2V5cyhvKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydFN0YXIobW9kKSB7XHJcbiAgICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrID0gb3duS2V5cyhtb2QpLCBpID0gMDsgaSA8IGsubGVuZ3RoOyBpKyspIGlmIChrW2ldICE9PSBcImRlZmF1bHRcIikgX19jcmVhdGVCaW5kaW5nKHJlc3VsdCwgbW9kLCBrW2ldKTtcclxuICAgIF9fc2V0TW9kdWxlRGVmYXVsdChyZXN1bHQsIG1vZCk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnREZWZhdWx0KG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBkZWZhdWx0OiBtb2QgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRHZXQocmVjZWl2ZXIsIHN0YXRlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBnZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCByZWFkIHByaXZhdGUgbWVtYmVyIGZyb20gYW4gb2JqZWN0IHdob3NlIGNsYXNzIGRpZCBub3QgZGVjbGFyZSBpdFwiKTtcclxuICAgIHJldHVybiBraW5kID09PSBcIm1cIiA/IGYgOiBraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlcikgOiBmID8gZi52YWx1ZSA6IHN0YXRlLmdldChyZWNlaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0KHJlY2VpdmVyLCBzdGF0ZSwgdmFsdWUsIGtpbmQsIGYpIHtcclxuICAgIGlmIChraW5kID09PSBcIm1cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgbWV0aG9kIGlzIG5vdCB3cml0YWJsZVwiKTtcclxuICAgIGlmIChraW5kID09PSBcImFcIiAmJiAhZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgYWNjZXNzb3Igd2FzIGRlZmluZWQgd2l0aG91dCBhIHNldHRlclwiKTtcclxuICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyICE9PSBzdGF0ZSB8fCAhZiA6ICFzdGF0ZS5oYXMocmVjZWl2ZXIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHdyaXRlIHByaXZhdGUgbWVtYmVyIHRvIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4gKGtpbmQgPT09IFwiYVwiID8gZi5jYWxsKHJlY2VpdmVyLCB2YWx1ZSkgOiBmID8gZi52YWx1ZSA9IHZhbHVlIDogc3RhdGUuc2V0KHJlY2VpdmVyLCB2YWx1ZSkpLCB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRJbihzdGF0ZSwgcmVjZWl2ZXIpIHtcclxuICAgIGlmIChyZWNlaXZlciA9PT0gbnVsbCB8fCAodHlwZW9mIHJlY2VpdmVyICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiByZWNlaXZlciAhPT0gXCJmdW5jdGlvblwiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB1c2UgJ2luJyBvcGVyYXRvciBvbiBub24tb2JqZWN0XCIpO1xyXG4gICAgcmV0dXJuIHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgPT09IHN0YXRlIDogc3RhdGUuaGFzKHJlY2VpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYWRkRGlzcG9zYWJsZVJlc291cmNlKGVudiwgdmFsdWUsIGFzeW5jKSB7XHJcbiAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHZvaWQgMCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHZhbHVlICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3QgZXhwZWN0ZWQuXCIpO1xyXG4gICAgICAgIHZhciBkaXNwb3NlLCBpbm5lcjtcclxuICAgICAgICBpZiAoYXN5bmMpIHtcclxuICAgICAgICAgICAgaWYgKCFTeW1ib2wuYXN5bmNEaXNwb3NlKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jRGlzcG9zZSBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICAgICAgICAgIGRpc3Bvc2UgPSB2YWx1ZVtTeW1ib2wuYXN5bmNEaXNwb3NlXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRpc3Bvc2UgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICBpZiAoIVN5bWJvbC5kaXNwb3NlKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmRpc3Bvc2UgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgICAgICAgICBkaXNwb3NlID0gdmFsdWVbU3ltYm9sLmRpc3Bvc2VdO1xyXG4gICAgICAgICAgICBpZiAoYXN5bmMpIGlubmVyID0gZGlzcG9zZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBkaXNwb3NlICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3Qgbm90IGRpc3Bvc2FibGUuXCIpO1xyXG4gICAgICAgIGlmIChpbm5lcikgZGlzcG9zZSA9IGZ1bmN0aW9uKCkgeyB0cnkgeyBpbm5lci5jYWxsKHRoaXMpOyB9IGNhdGNoIChlKSB7IHJldHVybiBQcm9taXNlLnJlamVjdChlKTsgfSB9O1xyXG4gICAgICAgIGVudi5zdGFjay5wdXNoKHsgdmFsdWU6IHZhbHVlLCBkaXNwb3NlOiBkaXNwb3NlLCBhc3luYzogYXN5bmMgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhc3luYykge1xyXG4gICAgICAgIGVudi5zdGFjay5wdXNoKHsgYXN5bmM6IHRydWUgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcblxyXG59XHJcblxyXG52YXIgX1N1cHByZXNzZWRFcnJvciA9IHR5cGVvZiBTdXBwcmVzc2VkRXJyb3IgPT09IFwiZnVuY3Rpb25cIiA/IFN1cHByZXNzZWRFcnJvciA6IGZ1bmN0aW9uIChlcnJvciwgc3VwcHJlc3NlZCwgbWVzc2FnZSkge1xyXG4gICAgdmFyIGUgPSBuZXcgRXJyb3IobWVzc2FnZSk7XHJcbiAgICByZXR1cm4gZS5uYW1lID0gXCJTdXBwcmVzc2VkRXJyb3JcIiwgZS5lcnJvciA9IGVycm9yLCBlLnN1cHByZXNzZWQgPSBzdXBwcmVzc2VkLCBlO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZGlzcG9zZVJlc291cmNlcyhlbnYpIHtcclxuICAgIGZ1bmN0aW9uIGZhaWwoZSkge1xyXG4gICAgICAgIGVudi5lcnJvciA9IGVudi5oYXNFcnJvciA/IG5ldyBfU3VwcHJlc3NlZEVycm9yKGUsIGVudi5lcnJvciwgXCJBbiBlcnJvciB3YXMgc3VwcHJlc3NlZCBkdXJpbmcgZGlzcG9zYWwuXCIpIDogZTtcclxuICAgICAgICBlbnYuaGFzRXJyb3IgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgdmFyIHIsIHMgPSAwO1xyXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgICAgICB3aGlsZSAociA9IGVudi5zdGFjay5wb3AoKSkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFyLmFzeW5jICYmIHMgPT09IDEpIHJldHVybiBzID0gMCwgZW52LnN0YWNrLnB1c2gociksIFByb21pc2UucmVzb2x2ZSgpLnRoZW4obmV4dCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoci5kaXNwb3NlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHIuZGlzcG9zZS5jYWxsKHIudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyLmFzeW5jKSByZXR1cm4gcyB8PSAyLCBQcm9taXNlLnJlc29sdmUocmVzdWx0KS50aGVuKG5leHQsIGZ1bmN0aW9uKGUpIHsgZmFpbChlKTsgcmV0dXJuIG5leHQoKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHMgfD0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgZmFpbChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocyA9PT0gMSkgcmV0dXJuIGVudi5oYXNFcnJvciA/IFByb21pc2UucmVqZWN0KGVudi5lcnJvcikgOiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICBpZiAoZW52Lmhhc0Vycm9yKSB0aHJvdyBlbnYuZXJyb3I7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV4dCgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXdyaXRlUmVsYXRpdmVJbXBvcnRFeHRlbnNpb24ocGF0aCwgcHJlc2VydmVKc3gpIHtcclxuICAgIGlmICh0eXBlb2YgcGF0aCA9PT0gXCJzdHJpbmdcIiAmJiAvXlxcLlxcLj9cXC8vLnRlc3QocGF0aCkpIHtcclxuICAgICAgICByZXR1cm4gcGF0aC5yZXBsYWNlKC9cXC4odHN4KSR8KCg/OlxcLmQpPykoKD86XFwuW14uL10rPyk/KVxcLihbY21dPyl0cyQvaSwgZnVuY3Rpb24gKG0sIHRzeCwgZCwgZXh0LCBjbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHN4ID8gcHJlc2VydmVKc3ggPyBcIi5qc3hcIiA6IFwiLmpzXCIgOiBkICYmICghZXh0IHx8ICFjbSkgPyBtIDogKGQgKyBleHQgKyBcIi5cIiArIGNtLnRvTG93ZXJDYXNlKCkgKyBcImpzXCIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBhdGg7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHtcclxuICAgIF9fZXh0ZW5kczogX19leHRlbmRzLFxyXG4gICAgX19hc3NpZ246IF9fYXNzaWduLFxyXG4gICAgX19yZXN0OiBfX3Jlc3QsXHJcbiAgICBfX2RlY29yYXRlOiBfX2RlY29yYXRlLFxyXG4gICAgX19wYXJhbTogX19wYXJhbSxcclxuICAgIF9fZXNEZWNvcmF0ZTogX19lc0RlY29yYXRlLFxyXG4gICAgX19ydW5Jbml0aWFsaXplcnM6IF9fcnVuSW5pdGlhbGl6ZXJzLFxyXG4gICAgX19wcm9wS2V5OiBfX3Byb3BLZXksXHJcbiAgICBfX3NldEZ1bmN0aW9uTmFtZTogX19zZXRGdW5jdGlvbk5hbWUsXHJcbiAgICBfX21ldGFkYXRhOiBfX21ldGFkYXRhLFxyXG4gICAgX19hd2FpdGVyOiBfX2F3YWl0ZXIsXHJcbiAgICBfX2dlbmVyYXRvcjogX19nZW5lcmF0b3IsXHJcbiAgICBfX2NyZWF0ZUJpbmRpbmc6IF9fY3JlYXRlQmluZGluZyxcclxuICAgIF9fZXhwb3J0U3RhcjogX19leHBvcnRTdGFyLFxyXG4gICAgX192YWx1ZXM6IF9fdmFsdWVzLFxyXG4gICAgX19yZWFkOiBfX3JlYWQsXHJcbiAgICBfX3NwcmVhZDogX19zcHJlYWQsXHJcbiAgICBfX3NwcmVhZEFycmF5czogX19zcHJlYWRBcnJheXMsXHJcbiAgICBfX3NwcmVhZEFycmF5OiBfX3NwcmVhZEFycmF5LFxyXG4gICAgX19hd2FpdDogX19hd2FpdCxcclxuICAgIF9fYXN5bmNHZW5lcmF0b3I6IF9fYXN5bmNHZW5lcmF0b3IsXHJcbiAgICBfX2FzeW5jRGVsZWdhdG9yOiBfX2FzeW5jRGVsZWdhdG9yLFxyXG4gICAgX19hc3luY1ZhbHVlczogX19hc3luY1ZhbHVlcyxcclxuICAgIF9fbWFrZVRlbXBsYXRlT2JqZWN0OiBfX21ha2VUZW1wbGF0ZU9iamVjdCxcclxuICAgIF9faW1wb3J0U3RhcjogX19pbXBvcnRTdGFyLFxyXG4gICAgX19pbXBvcnREZWZhdWx0OiBfX2ltcG9ydERlZmF1bHQsXHJcbiAgICBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0OiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0LFxyXG4gICAgX19jbGFzc1ByaXZhdGVGaWVsZFNldDogX19jbGFzc1ByaXZhdGVGaWVsZFNldCxcclxuICAgIF9fY2xhc3NQcml2YXRlRmllbGRJbjogX19jbGFzc1ByaXZhdGVGaWVsZEluLFxyXG4gICAgX19hZGREaXNwb3NhYmxlUmVzb3VyY2U6IF9fYWRkRGlzcG9zYWJsZVJlc291cmNlLFxyXG4gICAgX19kaXNwb3NlUmVzb3VyY2VzOiBfX2Rpc3Bvc2VSZXNvdXJjZXMsXHJcbiAgICBfX3Jld3JpdGVSZWxhdGl2ZUltcG9ydEV4dGVuc2lvbjogX19yZXdyaXRlUmVsYXRpdmVJbXBvcnRFeHRlbnNpb24sXHJcbn07XHJcbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjbGFzcyBDb25maWdWYWxpZGF0b3Ige1xuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIFB5dGhvbiBwYXRoIGlzIGV4ZWN1dGFibGVcbiAgICAgKi9cbiAgICBzdGF0aWMgdmFsaWRhdGVQeXRob25QYXRoKHB5dGhvblBhdGg6IHN0cmluZyk6IHsgdmFsaWQ6IGJvb2xlYW47IGVycm9yPzogc3RyaW5nIH0ge1xuICAgICAgICBpZiAoIXB5dGhvblBhdGggfHwgcHl0aG9uUGF0aC50cmltKCkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogZmFsc2UsIGVycm9yOiAnUHl0aG9uIHBhdGggY2Fubm90IGJlIGVtcHR5JyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSnVzdCBjaGVjayBpdCBsb29rcyByZWFzb25hYmxlIChtb3JlIHNvcGhpc3RpY2F0ZWQgY2hlY2sgaW4gYWN0dWFsIHBsdWdpbilcbiAgICAgICAgaWYgKHB5dGhvblBhdGguaW5jbHVkZXMoJ1xcMCcpIHx8IHB5dGhvblBhdGguaW5jbHVkZXMoJyonKSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCBlcnJvcjogJ1B5dGhvbiBwYXRoIGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycycgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGUgY29yZSBwYXRoIGV4aXN0cyBhbmQgY29udGFpbnMgbWFpbi5weVxuICAgICAqL1xuICAgIHN0YXRpYyB2YWxpZGF0ZUNvcmVQYXRoKGNvcmVQYXRoOiBzdHJpbmcpOiB7IHZhbGlkOiBib29sZWFuOyBlcnJvcj86IHN0cmluZyB9IHtcbiAgICAgICAgaWYgKCFjb3JlUGF0aCB8fCBjb3JlUGF0aC50cmltKCkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogZmFsc2UsIGVycm9yOiAnQ29yZSBwYXRoIGNhbm5vdCBiZSBlbXB0eScgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoY29yZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCBlcnJvcjogYENvcmUgcGF0aCBkb2VzIG5vdCBleGlzdDogJHtjb3JlUGF0aH1gIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1haW5QeVBhdGggPSBwYXRoLmpvaW4oY29yZVBhdGgsICdtYWluLnB5Jyk7XG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobWFpblB5UGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB2YWxpZDogZmFsc2UsIGVycm9yOiBgbWFpbi5weSBub3QgZm91bmQgaW46ICR7Y29yZVBhdGh9YCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCBlcnJvcjogYEVycm9yIHZhbGlkYXRpbmcgY29yZSBwYXRoOiAke2Vyci5tZXNzYWdlfWAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIE9sbGFtYSBVUkwgZm9ybWF0XG4gICAgICovXG4gICAgc3RhdGljIHZhbGlkYXRlT2xsYW1hVXJsKHVybDogc3RyaW5nKTogeyB2YWxpZDogYm9vbGVhbjsgZXJyb3I/OiBzdHJpbmcgfSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBuZXcgVVJMKHVybCk7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiBmYWxzZSwgZXJyb3I6ICdJbnZhbGlkIE9sbGFtYSBVUkwgZm9ybWF0JyB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGUgbWVtb3J5IHNlcnZlciBVUkwgZm9ybWF0XG4gICAgICovXG4gICAgc3RhdGljIHZhbGlkYXRlTWVtb3J5VXJsKHVybDogc3RyaW5nKTogeyB2YWxpZDogYm9vbGVhbjsgZXJyb3I/OiBzdHJpbmcgfSB7XG4gICAgICAgIGlmICghdXJsKSByZXR1cm4geyB2YWxpZDogdHJ1ZSB9OyAvLyBPcHRpb25hbFxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBuZXcgVVJMKHVybCk7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiBmYWxzZSwgZXJyb3I6ICdJbnZhbGlkIE1lbW9yeSBTZXJ2ZXIgVVJMIGZvcm1hdCcgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIHRpbWVvdXQgdmFsdWVzXG4gICAgICovXG4gICAgc3RhdGljIHZhbGlkYXRlVGltZW91dChzZWNvbmRzOiBudW1iZXIpOiB7IHZhbGlkOiBib29sZWFuOyBlcnJvcj86IHN0cmluZyB9IHtcbiAgICAgICAgaWYgKHNlY29uZHMgPCAxMCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCBlcnJvcjogJ1RpbWVvdXQgbXVzdCBiZSBhdCBsZWFzdCAxMCBzZWNvbmRzJyB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWNvbmRzID4gMzYwMCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCBlcnJvcjogJ1RpbWVvdXQgY2Fubm90IGV4Y2VlZCAxIGhvdXInIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnB1dFZhbGlkYXRvciB7XG4gICAgLyoqXG4gICAgICogVmFsaWRhdGUgdXNlciB0YXNrIGlucHV0XG4gICAgICovXG4gICAgc3RhdGljIHZhbGlkYXRlVGFzayh0YXNrOiBzdHJpbmcpOiB7IHZhbGlkOiBib29sZWFuOyBlcnJvcj86IHN0cmluZyB9IHtcbiAgICAgICAgaWYgKCF0YXNrIHx8IHRhc2sudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCBlcnJvcjogJ1Rhc2sgY2Fubm90IGJlIGVtcHR5JyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRhc2subGVuZ3RoID4gMTAwMDApIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiBmYWxzZSwgZXJyb3I6ICdUYXNrIGlzIHRvbyBsb25nIChtYXggMTAwMDAgY2hhcmFjdGVycyknIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSB9O1xuICAgIH1cbn1cbiIsImV4cG9ydCBlbnVtIExvZ0xldmVsIHtcbiAgICBERUJVRyA9IDAsXG4gICAgSU5GTyA9IDEsXG4gICAgV0FSTiA9IDIsXG4gICAgRVJST1IgPSAzLFxufVxuXG5pbnRlcmZhY2UgTG9nRW50cnkge1xuICAgIHRpbWVzdGFtcDogbnVtYmVyO1xuICAgIGxldmVsOiBMb2dMZXZlbDtcbiAgICBtZXNzYWdlOiBzdHJpbmc7XG4gICAgZGF0YT86IGFueTtcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gICAgcHJpdmF0ZSBsb2dzOiBMb2dFbnRyeVtdID0gW107XG4gICAgcHJpdmF0ZSBsZXZlbDogTG9nTGV2ZWw7XG4gICAgcHJpdmF0ZSBtYXhMb2dzOiBudW1iZXIgPSA1MDA7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2dMZXZlbDogTG9nTGV2ZWwgPSBMb2dMZXZlbC5JTkZPKSB7XG4gICAgICAgIHRoaXMubGV2ZWwgPSBsb2dMZXZlbDtcbiAgICB9XG5cbiAgICBkZWJ1ZyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBhbnkpIHtcbiAgICAgICAgdGhpcy5sb2coTG9nTGV2ZWwuREVCVUcsIG1lc3NhZ2UsIGRhdGEpO1xuICAgIH1cblxuICAgIGluZm8obWVzc2FnZTogc3RyaW5nLCBkYXRhPzogYW55KSB7XG4gICAgICAgIHRoaXMubG9nKExvZ0xldmVsLklORk8sIG1lc3NhZ2UsIGRhdGEpO1xuICAgIH1cblxuICAgIHdhcm4obWVzc2FnZTogc3RyaW5nLCBkYXRhPzogYW55KSB7XG4gICAgICAgIHRoaXMubG9nKExvZ0xldmVsLldBUk4sIG1lc3NhZ2UsIGRhdGEpO1xuICAgIH1cblxuICAgIGVycm9yKG1lc3NhZ2U6IHN0cmluZywgZGF0YT86IGFueSkge1xuICAgICAgICB0aGlzLmxvZyhMb2dMZXZlbC5FUlJPUiwgbWVzc2FnZSwgZGF0YSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBsb2cobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBhbnkpIHtcbiAgICAgICAgaWYgKGxldmVsIDwgdGhpcy5sZXZlbCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGVudHJ5OiBMb2dFbnRyeSA9IHtcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIGxldmVsLFxuICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dzLnB1c2goZW50cnkpO1xuXG4gICAgICAgIC8vIEtlZXAgbG9ncyBib3VuZGVkXG4gICAgICAgIGlmICh0aGlzLmxvZ3MubGVuZ3RoID4gdGhpcy5tYXhMb2dzKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ3MgPSB0aGlzLmxvZ3Muc2xpY2UoLXRoaXMubWF4TG9ncyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb25zb2xlIG91dHB1dFxuICAgICAgICBjb25zdCBwcmVmaXggPSBgW0FnZW50QnJhaW4gJHtMb2dMZXZlbFtsZXZlbF19XWA7XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IGAke3ByZWZpeH0gJHttZXNzYWdlfWA7XG5cbiAgICAgICAgc3dpdGNoIChsZXZlbCkge1xuICAgICAgICAgICAgY2FzZSBMb2dMZXZlbC5ERUJVRzpcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7IGNvbnNvbGUuZGVidWcob3V0cHV0LCBkYXRhKTsgfSBlbHNlIHsgY29uc29sZS5kZWJ1ZyhvdXRwdXQpOyB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIExvZ0xldmVsLklORk86XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkgeyBjb25zb2xlLmxvZyhvdXRwdXQsIGRhdGEpOyB9IGVsc2UgeyBjb25zb2xlLmxvZyhvdXRwdXQpOyB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIExvZ0xldmVsLldBUk46XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkgeyBjb25zb2xlLndhcm4ob3V0cHV0LCBkYXRhKTsgfSBlbHNlIHsgY29uc29sZS53YXJuKG91dHB1dCk7IH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTG9nTGV2ZWwuRVJST1I6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkgeyBjb25zb2xlLmVycm9yKG91dHB1dCwgZGF0YSk7IH0gZWxzZSB7IGNvbnNvbGUuZXJyb3Iob3V0cHV0KTsgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0TG9ncyhsZXZlbD86IExvZ0xldmVsKTogTG9nRW50cnlbXSB7XG4gICAgICAgIGlmIChsZXZlbCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gWy4uLnRoaXMubG9nc107XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ3MuZmlsdGVyKGwgPT4gbC5sZXZlbCA+PSBsZXZlbCk7XG4gICAgfVxuXG4gICAgY2xlYXJMb2dzKCkge1xuICAgICAgICB0aGlzLmxvZ3MgPSBbXTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyByZXF1ZXN0VXJsIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgTG9nZ2VyLCBMb2dMZXZlbCB9IGZyb20gJy4uL3V0aWxzL2xvZ2dlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT2xsYW1hTW9kZWxJbmZvIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgc2l6ZTogbnVtYmVyO1xuICAgIG1vZGlmaWVkOiBzdHJpbmc7XG4gICAgZGlnZXN0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBPbGxhbWFTZXJ2aWNlIHtcbiAgICBwcml2YXRlIHVybDogc3RyaW5nO1xuICAgIHByaXZhdGUgdGltZW91dDogbnVtYmVyO1xuICAgIHByaXZhdGUgbG9nZ2VyOiBMb2dnZXI7XG4gICAgcHJpdmF0ZSByZXRyeUF0dGVtcHRzOiBudW1iZXIgPSAzO1xuICAgIHByaXZhdGUgcmV0cnlEZWxheTogbnVtYmVyID0gMTAwMDsgLy8gbXNcblxuICAgIGNvbnN0cnVjdG9yKHVybDogc3RyaW5nLCB0aW1lb3V0OiBudW1iZXIgPSAxMDAwMCwgbG9nZ2VyPzogTG9nZ2VyKSB7XG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xuICAgICAgICB0aGlzLnRpbWVvdXQgPSB0aW1lb3V0O1xuICAgICAgICB0aGlzLmxvZ2dlciA9IGxvZ2dlciB8fCBuZXcgTG9nZ2VyKExvZ0xldmVsLklORk8pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIE9sbGFtYSBpcyBydW5uaW5nIGFuZCBhY2Nlc3NpYmxlXG4gICAgICovXG4gICAgYXN5bmMgaXNIZWFsdGh5KHJldHJpZXM6IG51bWJlciA9IHRoaXMucmV0cnlBdHRlbXB0cyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJldHJpZXM7IGkrKykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgICAgICAgICAgICAgICB1cmw6IGAke3RoaXMudXJsfS9hcGkvdGFnc2AsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgIHRocm93OiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9IGFzIGFueSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ09sbGFtYSBpcyBoZWFsdGh5Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYE9sbGFtYSByZXR1cm5lZCBzdGF0dXMgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBPbGxhbWEgaGVhbHRoIGNoZWNrIGF0dGVtcHQgJHtpICsgMX0gZmFpbGVkYCwgZXJyLm1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGkgPCByZXRyaWVzIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNsZWVwKHRoaXMucmV0cnlEZWxheSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBsaXN0IG9mIGF2YWlsYWJsZSBtb2RlbHNcbiAgICAgKi9cbiAgICBhc3luYyBnZXRNb2RlbHMoKTogUHJvbWlzZTxPbGxhbWFNb2RlbEluZm9bXT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgICAgICAgICAgICB1cmw6IGAke3RoaXMudXJsfS9hcGkvdGFnc2AsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gcmVzcG9uc2UuanNvbiBhcyBhbnk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEubW9kZWxzIHx8IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE9sbGFtYSByZXR1cm5lZCBzdGF0dXMgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignRmFpbGVkIHRvIGZldGNoIG1vZGVscycsIGVycik7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSByZXNwb25zZSBmcm9tIG1vZGVsXG4gICAgICovXG4gICAgYXN5bmMgZ2VuZXJhdGUoXG4gICAgICAgIG1vZGVsOiBzdHJpbmcsXG4gICAgICAgIHByb21wdDogc3RyaW5nLFxuICAgICAgICBfb25TdHJlYW0/OiAoY2h1bms6IHN0cmluZykgPT4gdm9pZFxuICAgICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgICAgICAgICAgIHVybDogYCR7dGhpcy51cmx9L2FwaS9nZW5lcmF0ZWAsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICBtb2RlbCxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0LFxuICAgICAgICAgICAgICAgICAgICBzdHJlYW06IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSByZXNwb25zZS5qc29uIGFzIGFueTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5yZXNwb25zZSB8fCAnJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNb2RlbCByZXR1cm5lZCBzdGF0dXMgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihgRmFpbGVkIHRvIGdlbmVyYXRlIGZyb20gJHttb2RlbH1gLCBlcnIpO1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgc3BlY2lmaWMgbW9kZWwgaXMgYXZhaWxhYmxlXG4gICAgICovXG4gICAgYXN5bmMgaGFzTW9kZWwobW9kZWxOYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG1vZGVscyA9IGF3YWl0IHRoaXMuZ2V0TW9kZWxzKCk7XG4gICAgICAgICAgICByZXR1cm4gbW9kZWxzLnNvbWUobSA9PiBtLm5hbWUuaW5jbHVkZXMobW9kZWxOYW1lKSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzbGVlcChtczogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBzcGF3biwgQ2hpbGRQcm9jZXNzIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBMb2dnZXIsIExvZ0xldmVsIH0gZnJvbSAnLi4vdXRpbHMvbG9nZ2VyJztcblxuZXhwb3J0IGludGVyZmFjZSBQcm9jZXNzT3B0aW9ucyB7XG4gICAgcHl0aG9uUGF0aDogc3RyaW5nO1xuICAgIHNjcmlwdFBhdGg6IHN0cmluZztcbiAgICBhcmdzOiBzdHJpbmdbXTtcbiAgICBjd2Q6IHN0cmluZztcbiAgICB0aW1lb3V0PzogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUHJvY2Vzc01hbmFnZXIge1xuICAgIHByaXZhdGUgYWN0aXZlUHJvY2VzczogQ2hpbGRQcm9jZXNzIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBwcm9jZXNzVGltZW91dDogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyO1xuXG4gICAgY29uc3RydWN0b3IobG9nZ2VyPzogTG9nZ2VyKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyID0gbG9nZ2VyIHx8IG5ldyBMb2dnZXIoTG9nTGV2ZWwuSU5GTyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBQeXRob24gc2NyaXB0IGFuZCBnZXQgb3V0cHV0XG4gICAgICovXG4gICAgYXN5bmMgZXhlY3V0ZShvcHRpb25zOiBQcm9jZXNzT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdTdGFydGluZyBQeXRob24gcHJvY2VzcycsIHtcbiAgICAgICAgICAgICAgICBzY3JpcHQ6IG9wdGlvbnMuc2NyaXB0UGF0aCxcbiAgICAgICAgICAgICAgICBhcmdzOiBvcHRpb25zLmFyZ3MsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZVByb2Nlc3MgPSBzcGF3bihvcHRpb25zLnB5dGhvblBhdGgsIFtvcHRpb25zLnNjcmlwdFBhdGgsIC4uLm9wdGlvbnMuYXJnc10sIHtcbiAgICAgICAgICAgICAgICAgICAgY3dkOiBvcHRpb25zLmN3ZCxcbiAgICAgICAgICAgICAgICAgICAgc3RkaW86IFsncGlwZScsICdwaXBlJywgJ3BpcGUnXSxcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGxldCBzdGRvdXQgPSAnJztcbiAgICAgICAgICAgICAgICBsZXQgc3RkZXJyID0gJyc7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZVByb2Nlc3Muc3Rkb3V0Py5vbignZGF0YScsIChkYXRhOiBCdWZmZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3Rkb3V0ICs9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlUHJvY2Vzcy5zdGRlcnI/Lm9uKCdkYXRhJywgKGRhdGE6IEJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzdGRlcnIgKz0gZGF0YS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gU2V0IHRpbWVvdXRcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy50aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmFjdGl2ZVByb2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKCdQcm9jZXNzIHRpbWVvdXQsIGtpbGxpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZVByb2Nlc3Mua2lsbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgUHJvY2VzcyB0aW1lZCBvdXQgYWZ0ZXIgJHtvcHRpb25zLnRpbWVvdXR9bXNgKSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVQcm9jZXNzLm9uKCdjbG9zZScsIChjb2RlOiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJQcm9jZXNzVGltZW91dCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZVByb2Nlc3MgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdQcm9jZXNzIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc3Rkb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdQcm9jZXNzIGZhaWxlZCcsIHsgY29kZSwgc3RkZXJyIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihzdGRlcnIgfHwgYFByb2Nlc3MgZXhpdGVkIHdpdGggY29kZSAke2NvZGV9YCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZVByb2Nlc3Mub24oJ2Vycm9yJywgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhclByb2Nlc3NUaW1lb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlUHJvY2VzcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdQcm9jZXNzIGVycm9yJywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignRmFpbGVkIHRvIHNwYXduIHByb2Nlc3MnLCBlcnIpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBLaWxsIGFjdGl2ZSBwcm9jZXNzXG4gICAgICovXG4gICAga2lsbCgpIHtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlUHJvY2VzcyAmJiAhdGhpcy5hY3RpdmVQcm9jZXNzLmtpbGxlZCkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnS2lsbGluZyBhY3RpdmUgcHJvY2VzcycpO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVQcm9jZXNzLmtpbGwoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsZWFyUHJvY2Vzc1RpbWVvdXQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBwcm9jZXNzIGlzIHJ1bm5pbmdcbiAgICAgKi9cbiAgICBpc1J1bm5pbmcoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmFjdGl2ZVByb2Nlc3MgIT09IG51bGwgJiYgIXRoaXMuYWN0aXZlUHJvY2Vzcy5raWxsZWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbGVhclByb2Nlc3NUaW1lb3V0KCkge1xuICAgICAgICBpZiAodGhpcy5wcm9jZXNzVGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMucHJvY2Vzc1RpbWVvdXQpO1xuICAgICAgICAgICAgdGhpcy5wcm9jZXNzVGltZW91dCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyByZXF1ZXN0VXJsIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgTG9nZ2VyLCBMb2dMZXZlbCB9IGZyb20gJy4uL3V0aWxzL2xvZ2dlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVtb3J5UXVlcnlSZXN1bHQge1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBtZXRhZGF0YToge1xuICAgICAgICB0aXRsZT86IHN0cmluZztcbiAgICAgICAgc291cmNlPzogc3RyaW5nO1xuICAgICAgICBjaHVua19pbmRleD86IG51bWJlcjtcbiAgICB9O1xuICAgIHNjb3JlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTZXJ2aWNlIHtcbiAgICBwcml2YXRlIHVybDogc3RyaW5nO1xuICAgIHByaXZhdGUgbG9nZ2VyOiBMb2dnZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcih1cmw6IHN0cmluZywgbG9nZ2VyPzogTG9nZ2VyKSB7XG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xuICAgICAgICB0aGlzLmxvZ2dlciA9IGxvZ2dlciB8fCBuZXcgTG9nZ2VyKExvZ0xldmVsLklORk8pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBtZW1vcnkgc2VydmVyIGlzIHJlYWNoYWJsZVxuICAgICAqL1xuICAgIGFzeW5jIGlzSGVhbHRoeSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XG4gICAgICAgICAgICAgICAgdXJsOiBgJHt0aGlzLnVybH0vc3RhdHVzYCxcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHRocm93OiBmYWxzZSxcbiAgICAgICAgICAgIH0gYXMgYW55KTtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMgPT09IDIwMDtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBtZW1vcnkgZm9yIHJlbGV2YW50IGNvbnRleHRcbiAgICAgKi9cbiAgICBhc3luYyBxdWVyeShxdWVyeVRleHQ6IHN0cmluZywgdG9wSzogbnVtYmVyID0gNSk6IFByb21pc2U8TWVtb3J5UXVlcnlSZXN1bHRbXT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgICAgICAgICAgICB1cmw6IGAke3RoaXMudXJsfS9xdWVyeT9xPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5VGV4dCl9JnRvcF9rPSR7dG9wS31gLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdGhyb3c6IGZhbHNlLFxuICAgICAgICAgICAgfSBhcyBhbnkpO1xuXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gcmVzcG9uc2UuanNvbiBhcyBhbnk7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEucmVzdWx0cyAmJiBkYXRhLnJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnTWVtb3J5IHF1ZXJ5IHJldHVybmVkIHJlc3VsdHMnLCB7IGNvdW50OiBkYXRhLnJlc3VsdHMubGVuZ3RoIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5yZXN1bHRzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybignTWVtb3J5IHF1ZXJ5IGZhaWxlZCcsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgdmF1bHQgaW5kZXhpbmdcbiAgICAgKi9cbiAgICBhc3luYyBpbmRleFZhdWx0KHZhdWx0UGF0aDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U6IHN0cmluZzsgdG90YWxDaHVua3M/OiBudW1iZXIgfT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgICAgICAgICAgICB1cmw6IGAke3RoaXMudXJsfS9pbmRleGAsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyB2YXVsdF9wYXRoOiB2YXVsdFBhdGggfSksXG4gICAgICAgICAgICB9IGFzIGFueSk7XG5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSByZXNwb25zZS5qc29uIGFzIGFueTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBkYXRhLnN1Y2Nlc3MgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEubWVzc2FnZSB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgdG90YWxDaHVua3M6IGRhdGEudG90YWxfY2h1bmtzLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBgTWVtb3J5IHNlcnZlciBlcnJvciAoJHtyZXNwb25zZS5zdGF0dXN9KWAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdNZW1vcnkgc2VydmVyIGNvbm5lY3Rpb24gZmFpbGVkJywgZXJyKTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnTWVtb3J5IHNlcnZlciB1bnJlYWNoYWJsZScgfTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIFdvcmtzcGFjZUxlYWYsXG4gICAgSXRlbVZpZXcsXG4gICAgTm90aWNlLFxuICAgIHNldEljb24sXG4gICAgUGx1Z2luU2V0dGluZ1RhYixcbiAgICBBcHAsXG4gICAgU2V0dGluZyxcbn0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IENvbmZpZ1ZhbGlkYXRvciwgSW5wdXRWYWxpZGF0b3IgfSBmcm9tICcuL3V0aWxzL3ZhbGlkYXRvcnMnO1xuaW1wb3J0IHsgTG9nZ2VyLCBMb2dMZXZlbCB9IGZyb20gJy4vdXRpbHMvbG9nZ2VyJztcbmltcG9ydCB7IE9sbGFtYVNlcnZpY2UgfSBmcm9tICcuL3NlcnZpY2VzL09sbGFtYVNlcnZpY2UnO1xuaW1wb3J0IHsgUHJvY2Vzc01hbmFnZXIgfSBmcm9tICcuL3NlcnZpY2VzL1Byb2Nlc3NNYW5hZ2VyJztcbmltcG9ydCB7IE1lbW9yeVNlcnZpY2UgfSBmcm9tICcuL3NlcnZpY2VzL01lbW9yeVNlcnZpY2UnO1xuaW1wb3J0IHtcbiAgICBBZ2VudEJyYWluU2V0dGluZ3MsXG4gICAgQWdlbnRNZXNzYWdlLFxuICAgIEV4ZWN1dGlvblN0YXR1cyxcbn0gZnJvbSAnLi90eXBlcy9pbmRleCc7XG5cbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfQUdFTlRCUkFJTiA9ICdhZ2VudGJyYWluLWNoYXQnO1xuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBBZ2VudEJyYWluU2V0dGluZ3MgPSB7XG4gICAgcHl0aG9uUGF0aDogJ3B5dGhvbicsXG4gICAgY29yZVBhdGg6ICcnLFxuICAgIG9sbGFtYVVybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MTE0MzQnLFxuICAgIG9sbGFtYVRpbWVvdXQ6IDMwMDAwLFxuICAgIGVuYWJsZU1lbW9yeTogdHJ1ZSxcbiAgICBtZW1vcnlTZXJ2ZXJVcmw6ICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgIG1lbW9yeVRvcEs6IDUsXG4gICAgbWF4VGltZW91dDogMzAwMDAwLCAvLyA1IG1pbnV0ZXNcbiAgICBlbmFibGVEZWJ1Z0xvZ2dpbmc6IGZhbHNlLFxuICAgIHN0cmVhbVJlc3VsdHM6IHRydWUsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBZ2VudEJyYWluUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgICBzZXR0aW5nczogQWdlbnRCcmFpblNldHRpbmdzID0gREVGQVVMVF9TRVRUSU5HUztcbiAgICBsb2dnZXI6IExvZ2dlciA9IG5ldyBMb2dnZXIoTG9nTGV2ZWwuSU5GTyk7XG4gICAgb2xsYW1hU2VydmljZTogT2xsYW1hU2VydmljZSB8IG51bGwgPSBudWxsO1xuICAgIHByb2Nlc3NNYW5hZ2VyOiBQcm9jZXNzTWFuYWdlciB8IG51bGwgPSBudWxsO1xuICAgIG1lbW9yeVNlcnZpY2U6IE1lbW9yeVNlcnZpY2UgfCBudWxsID0gbnVsbDtcblxuICAgIGFzeW5jIG9ubG9hZCgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICAgICAgdGhpcy51cGRhdGVMb2dMZXZlbCgpO1xuXG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ0FnZW50QnJhaW4gcGx1Z2luIGxvYWRpbmcnKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHNlcnZpY2VzXG4gICAgICAgIHRoaXMub2xsYW1hU2VydmljZSA9IG5ldyBPbGxhbWFTZXJ2aWNlKFxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5vbGxhbWFVcmwsXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLm9sbGFtYVRpbWVvdXQsXG4gICAgICAgICAgICB0aGlzLmxvZ2dlclxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMucHJvY2Vzc01hbmFnZXIgPSBuZXcgUHJvY2Vzc01hbmFnZXIodGhpcy5sb2dnZXIpO1xuXG4gICAgICAgIHRoaXMubWVtb3J5U2VydmljZSA9IG5ldyBNZW1vcnlTZXJ2aWNlKFxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5tZW1vcnlTZXJ2ZXJVcmwsXG4gICAgICAgICAgICB0aGlzLmxvZ2dlclxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFJlZ2lzdGVyIGN1c3RvbSB2aWV3XG4gICAgICAgIHRoaXMucmVnaXN0ZXJWaWV3KFZJRVdfVFlQRV9BR0VOVEJSQUlOLCAobGVhZikgPT4gbmV3IEFnZW50QnJhaW5DaGF0VmlldyhsZWFmLCB0aGlzKSk7XG5cbiAgICAgICAgLy8gQWRkIHJpYmJvbiBpY29uXG4gICAgICAgIHRoaXMuYWRkUmliYm9uSWNvbignYm90JywgJ09wZW4gQWdlbnRCcmFpbiBDaGF0JywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmF0ZVZpZXcoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQWRkIGNvbW1hbmRzXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBpZDogJ29wZW4tYWdlbnRicmFpbi1jaGF0JyxcbiAgICAgICAgICAgIG5hbWU6ICdPcGVuIENoYXQgVmlldycsXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZVZpZXcoKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgICAgICAgIGlkOiAnaW5kZXgtdmF1bHQtbWVtb3J5JyxcbiAgICAgICAgICAgIG5hbWU6ICdJbmRleCBDdXJyZW50IFZhdWx0IChGb3IgTWVtb3J5KScsXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5pbmRleFZhdWx0KCksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBpZDogJ2NoZWNrLW9sbGFtYS1zdGF0dXMnLFxuICAgICAgICAgICAgbmFtZTogJ0NoZWNrIE9sbGFtYSBTdGF0dXMnLFxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMuY2hlY2tPbGxhbWFTdGF0dXMoKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQWRkIHNldHRpbmdzIHRhYlxuICAgICAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEFnZW50QnJhaW5TZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnQWdlbnRCcmFpbiBwbHVnaW4gbG9hZGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgIH1cblxuICAgIGFzeW5jIG9udW5sb2FkKCkge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdBZ2VudEJyYWluIHBsdWdpbiB1bmxvYWRpbmcnKTtcblxuICAgICAgICAvLyBLaWxsIGFueSBydW5uaW5nIHByb2Nlc3Nlc1xuICAgICAgICBpZiAodGhpcy5wcm9jZXNzTWFuYWdlcikge1xuICAgICAgICAgICAgdGhpcy5wcm9jZXNzTWFuYWdlci5raWxsKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZXRhY2ggdmlld3NcbiAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShWSUVXX1RZUEVfQUdFTlRCUkFJTik7XG5cbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnQWdlbnRCcmFpbiBwbHVnaW4gdW5sb2FkZWQnKTtcbiAgICB9XG5cbiAgICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuXG4gICAgICAgIC8vIFZhbGlkYXRlIHNldHRpbmdzXG4gICAgICAgIGNvbnN0IHB5dGhvblZhbGlkYXRpb24gPSBDb25maWdWYWxpZGF0b3IudmFsaWRhdGVQeXRob25QYXRoKHRoaXMuc2V0dGluZ3MucHl0aG9uUGF0aCk7XG4gICAgICAgIGlmICghcHl0aG9uVmFsaWRhdGlvbi52YWxpZCkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybihgSW52YWxpZCBQeXRob24gcGF0aDogJHtweXRob25WYWxpZGF0aW9uLmVycm9yfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29yZVZhbGlkYXRpb24gPSBDb25maWdWYWxpZGF0b3IudmFsaWRhdGVDb3JlUGF0aCh0aGlzLnNldHRpbmdzLmNvcmVQYXRoKTtcbiAgICAgICAgaWYgKCFjb3JlVmFsaWRhdGlvbi52YWxpZCkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybihgSW52YWxpZCBDb3JlIHBhdGg6ICR7Y29yZVZhbGlkYXRpb24uZXJyb3J9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvbGxhbWFWYWxpZGF0aW9uID0gQ29uZmlnVmFsaWRhdG9yLnZhbGlkYXRlT2xsYW1hVXJsKHRoaXMuc2V0dGluZ3Mub2xsYW1hVXJsKTtcbiAgICAgICAgaWYgKCFvbGxhbWFWYWxpZGF0aW9uLnZhbGlkKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIE9sbGFtYSBVUkw6ICR7b2xsYW1hVmFsaWRhdGlvbi5lcnJvcn1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmVuYWJsZU1lbW9yeSkge1xuICAgICAgICAgICAgY29uc3QgbWVtb3J5VmFsaWRhdGlvbiA9IENvbmZpZ1ZhbGlkYXRvci52YWxpZGF0ZU1lbW9yeVVybCh0aGlzLnNldHRpbmdzLm1lbW9yeVNlcnZlclVybCk7XG4gICAgICAgICAgICBpZiAoIW1lbW9yeVZhbGlkYXRpb24udmFsaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIE1lbW9yeSBTZXJ2ZXIgVVJMOiAke21lbW9yeVZhbGlkYXRpb24uZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0aW1lb3V0VmFsaWRhdGlvbiA9IENvbmZpZ1ZhbGlkYXRvci52YWxpZGF0ZVRpbWVvdXQodGhpcy5zZXR0aW5ncy5tYXhUaW1lb3V0IC8gMTAwMCk7XG4gICAgICAgIGlmICghdGltZW91dFZhbGlkYXRpb24udmFsaWQpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYEludmFsaWQgdGltZW91dDogJHt0aW1lb3V0VmFsaWRhdGlvbi5lcnJvcn1gKTtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MubWF4VGltZW91dCA9IDMwMDAwMDsgLy8gUmVzZXQgdG8gZGVmYXVsdFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgICAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLnVwZGF0ZUxvZ0xldmVsKCk7XG5cbiAgICAgICAgLy8gUmVpbml0aWFsaXplIHNlcnZpY2VzIHdpdGggbmV3IHNldHRpbmdzXG4gICAgICAgIHRoaXMub2xsYW1hU2VydmljZSA9IG5ldyBPbGxhbWFTZXJ2aWNlKFxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5vbGxhbWFVcmwsXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLm9sbGFtYVRpbWVvdXQsXG4gICAgICAgICAgICB0aGlzLmxvZ2dlclxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMubWVtb3J5U2VydmljZSA9IG5ldyBNZW1vcnlTZXJ2aWNlKFxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5tZW1vcnlTZXJ2ZXJVcmwsXG4gICAgICAgICAgICB0aGlzLmxvZ2dlclxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlTG9nTGV2ZWwoKSB7XG4gICAgICAgIGNvbnN0IG5ld0xldmVsID0gdGhpcy5zZXR0aW5ncy5lbmFibGVEZWJ1Z0xvZ2dpbmcgPyBMb2dMZXZlbC5ERUJVRyA6IExvZ0xldmVsLklORk87XG4gICAgICAgIHRoaXMubG9nZ2VyID0gbmV3IExvZ2dlcihuZXdMZXZlbCk7XG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aXZhdGVWaWV3KCkge1xuICAgICAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG5cbiAgICAgICAgbGV0IGxlYWY6IFdvcmtzcGFjZUxlYWYgfCBudWxsID0gbnVsbDtcbiAgICAgICAgY29uc3QgbGVhdmVzID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfQUdFTlRCUkFJTik7XG5cbiAgICAgICAgaWYgKGxlYXZlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBsZWFmID0gbGVhdmVzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcmlnaHRMZWFmID0gd29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgICAgICAgICBpZiAocmlnaHRMZWFmKSB7XG4gICAgICAgICAgICAgICAgbGVhZiA9IHJpZ2h0TGVhZjtcbiAgICAgICAgICAgICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFZJRVdfVFlQRV9BR0VOVEJSQUlOLFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGVhZikge1xuICAgICAgICAgICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBjaGVja09sbGFtYVN0YXR1cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9sbGFtYVNlcnZpY2UpIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoJ09sbGFtYSBzZXJ2aWNlIG5vdCBpbml0aWFsaXplZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNIZWFsdGh5ID0gYXdhaXQgdGhpcy5vbGxhbWFTZXJ2aWNlLmlzSGVhbHRoeSgxKTtcblxuICAgICAgICBpZiAoaXNIZWFsdGh5KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGVscyA9IGF3YWl0IHRoaXMub2xsYW1hU2VydmljZS5nZXRNb2RlbHMoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2RlbExpc3QgPSBtb2RlbHMubWFwKG0gPT4gbS5uYW1lKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoYOKchSBPbGxhbWEgaXMgcnVubmluZyB3aXRoICR7bW9kZWxzLmxlbmd0aH0gbW9kZWxzXFxuXFxuJHttb2RlbExpc3R9YCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoYOKchSBPbGxhbWEgaXMgcnVubmluZyAoY291bGRuJ3QgZmV0Y2ggbW9kZWwgbGlzdDogJHtlcnIubWVzc2FnZX0pYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXcgTm90aWNlKFxuICAgICAgICAgICAgICAgIGDinYwgT2xsYW1hIGlzIG5vdCBydW5uaW5nLlxcblxcblBsZWFzZSBzdGFydCBPbGxhbWEgd2l0aDpcXG5vbGxhbWEgc2VydmVgXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaW5kZXhWYXVsdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZU1lbW9yeSkge1xuICAgICAgICAgICAgbmV3IE5vdGljZSgnQWdlbnRCcmFpbjogTWVtb3J5IGluZGV4aW5nIGlzIGRpc2FibGVkIGluIHNldHRpbmdzLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLm1lbW9yeVNlcnZpY2UpIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoJ0FnZW50QnJhaW46IE1lbW9yeSBzZXJ2aWNlIG5vdCBpbml0aWFsaXplZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZhdWx0UGF0aCA9ICh0aGlzLmFwcC52YXVsdC5hZGFwdGVyIGFzIGFueSkuZ2V0QmFzZVBhdGg/LigpO1xuICAgICAgICBpZiAoIXZhdWx0UGF0aCkge1xuICAgICAgICAgICAgbmV3IE5vdGljZSgnQWdlbnRCcmFpbjogQ291bGQgbm90IGRldGVybWluZSB2YXVsdCBwYXRoLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbmV3IE5vdGljZSgnSW5kZXhpbmcgdmF1bHQgbm90ZXMuLi4nKTtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnU3RhcnRpbmcgdmF1bHQgaW5kZXhpbmcnLCB7IHZhdWx0UGF0aCB9KTtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLm1lbW9yeVNlcnZpY2UuaW5kZXhWYXVsdCh2YXVsdFBhdGgpO1xuXG4gICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgbmV3IE5vdGljZShg4pyFIFZhdWx0IGluZGV4ZWQhICgke3Jlc3VsdC50b3RhbENodW5rc30gY2h1bmtzKWApO1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnVmF1bHQgaW5kZXhlZCBzdWNjZXNzZnVsbHknLCByZXN1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3IE5vdGljZShg4p2MICR7cmVzdWx0Lm1lc3NhZ2V9XFxuXFxuTWFrZSBzdXJlIHRoZSBtZW1vcnkgc2VydmVyIGlzIHJ1bm5pbmc6XFxucHl0aG9uIGFnZW50YnJhaW4tbWVtb3J5L21haW4ucHlgKTtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdWYXVsdCBpbmRleGluZyBmYWlsZWQnLCByZXN1bHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jbGFzcyBBZ2VudEJyYWluQ2hhdFZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gICAgcGx1Z2luOiBBZ2VudEJyYWluUGx1Z2luO1xuICAgIGNoYXRDb250YWluZXIhOiBIVE1MRGl2RWxlbWVudDtcbiAgICBpbnB1dEVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgICBzdGF0dXNFbCE6IEhUTUxEaXZFbGVtZW50O1xuICAgIG1lc3NhZ2VzOiBBZ2VudE1lc3NhZ2VbXSA9IFtdO1xuICAgIGN1cnJlbnRTdGF0dXM6IEV4ZWN1dGlvblN0YXR1cyA9IHtcbiAgICAgICAgc3RhdGU6ICdpZGxlJyxcbiAgICAgICAgcHJvZ3Jlc3M6IDAsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogQWdlbnRCcmFpblBsdWdpbikge1xuICAgICAgICBzdXBlcihsZWFmKTtcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgfVxuXG4gICAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIFZJRVdfVFlQRV9BR0VOVEJSQUlOO1xuICAgIH1cblxuICAgIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiAnQWdlbnRCcmFpbic7XG4gICAgfVxuXG4gICAgZ2V0SWNvbigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gJ2JvdCc7XG4gICAgfVxuXG4gICAgYXN5bmMgb25PcGVuKCkge1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdIGFzIEhUTUxEaXZFbGVtZW50O1xuICAgICAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICAgICAgY29udGFpbmVyLmFkZENsYXNzKCdhZ2VudGJyYWluLXZpZXctY29udGFpbmVyJyk7XG5cbiAgICAgICAgLy8gSGVhZGVyXG4gICAgICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdhZ2VudGJyYWluLWhlYWRlcicgfSk7XG4gICAgICAgIGhlYWRlci5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6ICdBZ2VudEJyYWluJyB9KTtcbiAgICAgICAgaGVhZGVyLmNyZWF0ZUVsKCdzcGFuJywgeyB0ZXh0OiAn8J+kliBNdWx0aS1BZ2VudCBBSScsIGNsczogJ2FnZW50YnJhaW4tYmFkZ2UnIH0pO1xuXG4gICAgICAgIC8vIENoYXQgYXJlYVxuICAgICAgICB0aGlzLmNoYXRDb250YWluZXIgPSBjb250YWluZXIuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnYWdlbnRicmFpbi1jaGF0LWNvbnRhaW5lcicgfSk7XG4gICAgICAgIHRoaXMuYWRkV2VsY29tZU1lc3NhZ2UoKTtcblxuICAgICAgICAvLyBTdGF0dXMgYmFyXG4gICAgICAgIHRoaXMuc3RhdHVzRWwgPSBjb250YWluZXIuY3JlYXRlRWwoJ2RpdicsIHtcbiAgICAgICAgICAgIGNsczogJ2FnZW50YnJhaW4tc3RhdHVzLWJhciByZWFkeScsXG4gICAgICAgICAgICB0ZXh0OiAn4pyFIFJlYWR5JyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSW5wdXQgYXJlYVxuICAgICAgICBjb25zdCBpbnB1dEFyZWEgPSBjb250YWluZXIuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnYWdlbnRicmFpbi1pbnB1dC1hcmVhJyB9KTtcblxuICAgICAgICB0aGlzLmlucHV0RWwgPSBpbnB1dEFyZWEuY3JlYXRlRWwoJ3RleHRhcmVhJywge1xuICAgICAgICAgICAgY2xzOiAnYWdlbnRicmFpbi10ZXh0YXJlYScsXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogJ0FzayBBZ2VudEJyYWluIHRvIGNvZGUsIHJlc2VhcmNoLCBicmFpbnN0b3JtLCBvciByZXZpZXcuLi4nLFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlKSA9PiB7XG4gICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJtaXRUYXNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHNlbmRCdG4gPSBpbnB1dEFyZWEuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnYWdlbnRicmFpbi1zZW5kLWJ0bicgfSk7XG4gICAgICAgIHNldEljb24oc2VuZEJ0biwgJ3NlbmQnKTtcbiAgICAgICAgc2VuZEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuc3VibWl0VGFzaygpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZFdlbGNvbWVNZXNzYWdlKCkge1xuICAgICAgICBjb25zdCBtc2cgPSB0aGlzLmNoYXRDb250YWluZXIuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnYWdlbnRicmFpbi1tZXNzYWdlIHN5c3RlbScgfSk7XG4gICAgICAgIG1zZy5jcmVhdGVFbCgnZGl2Jywge1xuICAgICAgICAgICAgdGV4dDogJ/CfkYsgV2VsY29tZSB0byBBZ2VudEJyYWluIVxcblxcbkRlc2NyaWJlIHlvdXIgdGFzayBhbmQgSVxcJ2xsIGludGVsbGlnZW50bHkgcm91dGUgaXQgdG8gdGhlIGJlc3QgQUkgc3BlY2lhbGlzdDpcXG7igKIg8J+SuyBDb2RpbmcgLSBRd2VuMy42XFxu4oCiIPCfk5ogUmVzZWFyY2ggLSBMRk0yLjUtVGhpbmtpbmdcXG7igKIg8J+noCBCcmFpbnN0b3JtaW5nIC0gTWl4dHJhbFxcbuKAoiDinI/vuI8gUmV2aWV3IC0gTWl4dHJhbFxcbuKAoiDwn46TIExlYXJuaW5nIC0gTWl4dHJhbFxcblxcbk9yIGp1c3QgYXNrIGFueXRoaW5nIScsXG4gICAgICAgICAgICBjbHM6ICdhZ2VudGJyYWluLW1lc3NhZ2UtY29udGVudCcsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXBwZW5kTWVzc2FnZShcbiAgICAgICAgc2VuZGVyOiBzdHJpbmcsXG4gICAgICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICAgICAgdHlwZTogJ3VzZXInIHwgJ2FnZW50JyB8ICdtYW5hZ2VyJyB8ICdlcnJvcicgfCAnc3lzdGVtJyA9ICdhZ2VudCdcbiAgICApIHtcbiAgICAgICAgY29uc3QgbXNnID0gdGhpcy5jaGF0Q29udGFpbmVyLmNyZWF0ZUVsKCdkaXYnLCB7IGNsczogYGFnZW50YnJhaW4tbWVzc2FnZSAke3R5cGV9YCB9KTtcblxuICAgICAgICBjb25zdCBtc2dIZWFkZXIgPSBtc2cuY3JlYXRlRWwoJ2RpdicsIHsgY2xzOiAnYWdlbnRicmFpbi1tZXNzYWdlLWhlYWRlcicgfSk7XG4gICAgICAgIG1zZ0hlYWRlci5jcmVhdGVFbCgnc3Ryb25nJywgeyB0ZXh0OiBzZW5kZXIgfSk7XG5cbiAgICAgICAgY29uc3QgY29udGVudEVsID0gbXNnLmNyZWF0ZUVsKCdwcmUnLCB7IGNsczogJ2FnZW50YnJhaW4tbWVzc2FnZS1jb250ZW50JyB9KTtcbiAgICAgICAgY29udGVudEVsLnRleHRDb250ZW50ID0gY29udGVudDtcblxuICAgICAgICAvLyBBdXRvIHNjcm9sbFxuICAgICAgICB0aGlzLmNoYXRDb250YWluZXIuc2Nyb2xsVG9wID0gdGhpcy5jaGF0Q29udGFpbmVyLnNjcm9sbEhlaWdodDtcblxuICAgICAgICBjb25zdCBtZXNzYWdlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBzZW5kZXIsXG4gICAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0U3RhdHVzKHRleHQ6IHN0cmluZywgc3RhdGU6ICdyZWFkeScgfCAnbG9hZGluZycgfCAnZXJyb3InID0gJ3JlYWR5Jykge1xuICAgICAgICBjb25zdCBpY29ucyA9IHsgcmVhZHk6ICfinIUnLCBsb2FkaW5nOiAn4o+zJywgZXJyb3I6ICfinYwnIH07XG4gICAgICAgIHRoaXMuc3RhdHVzRWwudGV4dENvbnRlbnQgPSBgJHtpY29uc1tzdGF0ZV19ICR7dGV4dH1gO1xuICAgICAgICB0aGlzLnN0YXR1c0VsLmNsYXNzTmFtZSA9IGBhZ2VudGJyYWluLXN0YXR1cy1iYXIgJHtzdGF0ZX1gO1xuXG4gICAgICAgIHRoaXMuY3VycmVudFN0YXR1cy5zdGF0ZSA9IHN0YXRlID09PSAnbG9hZGluZycgPyAnZXhlY3V0aW5nJyA6IHN0YXRlID09PSAnZXJyb3InID8gJ2Vycm9yJyA6ICdpZGxlJztcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHN1Ym1pdFRhc2soKSB7XG4gICAgICAgIGNvbnN0IHRhc2sgPSB0aGlzLmlucHV0RWwudmFsdWUudHJpbSgpO1xuICAgICAgICBpZiAoIXRhc2spIHJldHVybjtcblxuICAgICAgICAvLyBWYWxpZGF0ZSBpbnB1dFxuICAgICAgICBjb25zdCB2YWxpZGF0aW9uID0gSW5wdXRWYWxpZGF0b3IudmFsaWRhdGVUYXNrKHRhc2spO1xuICAgICAgICBpZiAoIXZhbGlkYXRpb24udmFsaWQpIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoYOKdjCAke3ZhbGlkYXRpb24uZXJyb3J9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSAnJztcbiAgICAgICAgdGhpcy5hcHBlbmRNZXNzYWdlKCdZb3UnLCB0YXNrLCAndXNlcicpO1xuXG4gICAgICAgIC8vIENoZWNrIE9sbGFtYVxuICAgICAgICB0aGlzLnNldFN0YXR1cygnQ2hlY2tpbmcgT2xsYW1hLi4uJywgJ2xvYWRpbmcnKTtcbiAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5vbGxhbWFTZXJ2aWNlKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXR1cygnU2VydmljZSBlcnJvcicsICdlcnJvcicpO1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRNZXNzYWdlKCdFcnJvcicsICdPbGxhbWEgc2VydmljZSBub3QgaW5pdGlhbGl6ZWQnLCAnZXJyb3InKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlzSGVhbHRoeSA9IGF3YWl0IHRoaXMucGx1Z2luLm9sbGFtYVNlcnZpY2UuaXNIZWFsdGh5KCk7XG4gICAgICAgIGlmICghaXNIZWFsdGh5KSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXR1cygnT2xsYW1hIE9mZmxpbmUnLCAnZXJyb3InKTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZShcbiAgICAgICAgICAgICAgICAnRXJyb3InLFxuICAgICAgICAgICAgICAgICfinYwgT2xsYW1hIGlzIG5vdCBydW5uaW5nLlxcblxcblN0YXJ0IGl0IHdpdGg6XFxub2xsYW1hIHNlcnZlJyxcbiAgICAgICAgICAgICAgICAnZXJyb3InXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbmV3IE5vdGljZSgn4p2MIE9sbGFtYSBpcyBvZmZsaW5lJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBjb25maWdcbiAgICAgICAgY29uc3QgY29yZVZhbGlkYXRpb24gPSBDb25maWdWYWxpZGF0b3IudmFsaWRhdGVDb3JlUGF0aCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb3JlUGF0aCk7XG4gICAgICAgIGlmICghY29yZVZhbGlkYXRpb24udmFsaWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdHVzKCdDb25maWcgRXJyb3InLCAnZXJyb3InKTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZShcbiAgICAgICAgICAgICAgICAnRXJyb3InLFxuICAgICAgICAgICAgICAgIGBDb25maWd1cmF0aW9uIGVycm9yOlxcbiR7Y29yZVZhbGlkYXRpb24uZXJyb3J9XFxuXFxuUGxlYXNlIHNldCB0aGUgQ29yZSBQYXRoIGluIEFnZW50QnJhaW4gc2V0dGluZ3MuYCxcbiAgICAgICAgICAgICAgICAnZXJyb3InXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJvY2VzcyB0YXNrXG4gICAgICAgIHRoaXMuc2V0U3RhdHVzKCdNYW5hZ2VyIHBsYW5uaW5nLi4uJywgJ2xvYWRpbmcnKTtcblxuICAgICAgICBsZXQgZnVsbFRhc2sgPSB0YXNrO1xuXG4gICAgICAgIC8vIEFkZCBtZW1vcnkgY29udGV4dCBpZiBlbmFibGVkXG4gICAgICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVNZW1vcnkgJiYgdGhpcy5wbHVnaW4ubWVtb3J5U2VydmljZSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXMoJ1F1ZXJ5aW5nIG1lbW9yeS4uLicsICdsb2FkaW5nJyk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5wbHVnaW4ubWVtb3J5U2VydmljZS5xdWVyeSh0YXNrLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy5tZW1vcnlUb3BLKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBmdWxsVGFzayArPSAnXFxuXFxuLS0tIFJFTEVWQU5UIFZBVUxUIE5PVEVTIC0tLVxcbic7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKChyZXM6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBmdWxsVGFzayArPSBgWyR7cmVzLm1ldGFkYXRhPy50aXRsZSB8fCAnTm90ZSd9XVxcbiR7cmVzLnRleHR9XFxuXFxuYDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBmdWxsVGFzayArPSAnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmxvZ2dlci5kZWJ1ZygnTWVtb3J5IGNvbnRleHQgYWRkZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHM6IHJlc3VsdHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRXhlY3V0ZVxuICAgICAgICB0aGlzLnNldFN0YXR1cygnRXhlY3V0aW5nIGFnZW50cy4uLicsICdsb2FkaW5nJyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5wcm9jZXNzTWFuYWdlcikge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXMoJ0Vycm9yJywgJ2Vycm9yJyk7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZE1lc3NhZ2UoJ0Vycm9yJywgJ1Byb2Nlc3MgbWFuYWdlciBub3QgaW5pdGlhbGl6ZWQnLCAnZXJyb3InKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY3JpcHRQYXRoID0gcGF0aC5qb2luKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvcmVQYXRoLCAnbWFpbi5weScpO1xuXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5sb2dnZXIuZGVidWcoJ1NwYXduaW5nIHByb2Nlc3MnLCB7XG4gICAgICAgICAgICAgICAgcHl0aG9uOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5weXRob25QYXRoLFxuICAgICAgICAgICAgICAgIHNjcmlwdDogc2NyaXB0UGF0aCxcbiAgICAgICAgICAgICAgICB0YXNrTGVuZ3RoOiBmdWxsVGFzay5sZW5ndGgsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gRXhlY3V0ZSBweXRob25cbiAgICAgICAgICAgIGNvbnN0IG91dHB1dCA9IGF3YWl0IHRoaXMucGx1Z2luLnByb2Nlc3NNYW5hZ2VyLmV4ZWN1dGUoe1xuICAgICAgICAgICAgICAgIHB5dGhvblBhdGg6IHRoaXMucGx1Z2luLnNldHRpbmdzLnB5dGhvblBhdGgsXG4gICAgICAgICAgICAgICAgc2NyaXB0UGF0aCxcbiAgICAgICAgICAgICAgICBhcmdzOiBbZnVsbFRhc2tdLFxuICAgICAgICAgICAgICAgIGN3ZDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29yZVBhdGgsXG4gICAgICAgICAgICAgICAgdGltZW91dDogdGhpcy5wbHVnaW4uc2V0dGluZ3MubWF4VGltZW91dCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBQYXJzZSBvdXRwdXRcbiAgICAgICAgICAgIHRoaXMucGFyc2VBZ2VudE91dHB1dChvdXRwdXQpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXMoJ0NvbXBsZXRlJywgJ3JlYWR5Jyk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKCfinIUgV29ya2Zsb3cgY29tcGxldGVkJyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5sb2dnZXIuZXJyb3IoJ0V4ZWN1dGlvbiBmYWlsZWQnLCBlcnIpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXMoJ0ZhaWxlZCcsICdlcnJvcicpO1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRNZXNzYWdlKCdFcnJvcicsIGVyci5tZXNzYWdlIHx8ICdFeGVjdXRpb24gZmFpbGVkJywgJ2Vycm9yJyk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGDinYwgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcGFyc2VBZ2VudE91dHB1dChvdXRwdXQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBsaW5lcyA9IG91dHB1dC5zcGxpdCgnXFxuJyk7XG5cbiAgICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAgICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICAgICAgICBpZiAoIXRyaW1tZWQpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UodHJpbW1lZCk7XG5cbiAgICAgICAgICAgICAgICBpZiAocGFyc2VkLnR5cGUgPT09ICdwbGFuJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGVwcyA9IChwYXJzZWQuc3RlcHMgfHwgW10pXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKChzOiBhbnkpID0+IGAke3Muc3RlcF9udW1iZXJ9LiAke3MuYWdlbnQudG9VcHBlckNhc2UoKX06ICR7cy5pbnN0cnVjdGlvbn1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZE1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAnTWFuYWdlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBg8J+TiyBQbGFuOiAke3BhcnNlZC5kZXNjcmlwdGlvbn1cXG5cXG4ke3N0ZXBzfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAnbWFuYWdlcidcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnNlZC5hZ2VudCAmJiBwYXJzZWQub3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kTWVzc2FnZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGAke3BhcnNlZC5hZ2VudH0gQWdlbnRgLFxuICAgICAgICAgICAgICAgICAgICAgICAgYEluc3RydWN0aW9uOiAke3BhcnNlZC5pbnN0cnVjdGlvbiB8fCAnKG5vbmUpJ31cXG5cXG5PdXRwdXQ6XFxuJHtwYXJzZWQub3V0cHV0fWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAnYWdlbnQnXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgLy8gU2tpcCBub24tSlNPTiBsaW5lc1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5jbGFzcyBBZ2VudEJyYWluU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICAgIHBsdWdpbjogQWdlbnRCcmFpblBsdWdpbjtcblxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEFnZW50QnJhaW5QbHVnaW4pIHtcbiAgICAgICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICB9XG5cbiAgICBkaXNwbGF5KCk6IHZvaWQge1xuICAgICAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgICAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogJ0FnZW50QnJhaW4gU2V0dGluZ3MnIH0pO1xuXG4gICAgICAgIC8vIENvbm5lY3Rpb24gU2V0dGluZ3NcbiAgICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiAn8J+UjCBPbGxhbWEgQ29ubmVjdGlvbicgfSk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZSgnT2xsYW1hIFVSTCcpXG4gICAgICAgICAgICAuc2V0RGVzYygnVVJMIHdoZXJlIE9sbGFtYSBpcyBydW5uaW5nICh1c3VhbGx5IGh0dHA6Ly9sb2NhbGhvc3Q6MTE0MzQpJylcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdodHRwOi8vbG9jYWxob3N0OjExNDM0JylcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm9sbGFtYVVybClcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsaWRhdGlvblJlc3VsdCA9IENvbmZpZ1ZhbGlkYXRvci52YWxpZGF0ZU9sbGFtYVVybCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbGlkYXRpb25SZXN1bHQudmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKGDinYwgJHt2YWxpZGF0aW9uUmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9sbGFtYVVybCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoJ09sbGFtYSBUaW1lb3V0IChtcyknKVxuICAgICAgICAgICAgLnNldERlc2MoJ0hvdyBsb25nIHRvIHdhaXQgZm9yIE9sbGFtYSByZXNwb25zZXMgKG1pbGxpc2Vjb25kcyknKVxuICAgICAgICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJzMwMDAwJylcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5vbGxhbWFUaW1lb3V0KSlcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbnVtID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc05hTihudW0pIHx8IG51bSA8IDEwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKCfinYwgVGltZW91dCBtdXN0IGJlIGF0IGxlYXN0IDEwMDBtcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9sbGFtYVRpbWVvdXQgPSBudW07XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgLy8gQmFja2VuZCBTZXR0aW5nc1xuICAgICAgICBjb250YWluZXJFbC5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6ICfimpnvuI8gQmFja2VuZCBDb25maWd1cmF0aW9uJyB9KTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKCdQeXRob24gQ29tbWFuZCcpXG4gICAgICAgICAgICAuc2V0RGVzYygnQ29tbWFuZCB0byBydW4gUHl0aG9uIChlLmcuLCBcInB5dGhvblwiLCBcInB5dGhvbjNcIiwgb3IgYWJzb2x1dGUgcGF0aCknKVxuICAgICAgICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ3B5dGhvbicpXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5weXRob25QYXRoKVxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uUmVzdWx0ID0gQ29uZmlnVmFsaWRhdG9yLnZhbGlkYXRlUHl0aG9uUGF0aCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbGlkYXRpb25SZXN1bHQudmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKGDimqDvuI8gJHt2YWxpZGF0aW9uUmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucHl0aG9uUGF0aCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoJ0FnZW50QnJhaW4gQ29yZSBQYXRoJylcbiAgICAgICAgICAgIC5zZXREZXNjKCdBYnNvbHV0ZSBwYXRoIHRvIGFnZW50YnJhaW4tY29yZS8gZGlyZWN0b3J5IChyZXF1aXJlZCknKVxuICAgICAgICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJy9wYXRoL3RvL2FnZW50YnJhaW4tY29yZScpXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb3JlUGF0aClcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29yZVBhdGggPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKCdNYXggRXhlY3V0aW9uIFRpbWUnKVxuICAgICAgICAgICAgLnNldERlc2MoJ01heGltdW0gdGltZSB0byBhbGxvdyBmb3IgdGFzayBleGVjdXRpb24gKHNlY29uZHMpJylcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCczMDAnKVxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLm1heFRpbWVvdXQgLyAxMDAwKSlcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Vjb25kcyA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uUmVzdWx0ID0gQ29uZmlnVmFsaWRhdG9yLnZhbGlkYXRlVGltZW91dChzZWNvbmRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsaWRhdGlvblJlc3VsdC52YWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoYOKdjCAke3ZhbGlkYXRpb25SZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MubWF4VGltZW91dCA9IHNlY29uZHMgKiAxMDAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIC8vIE1lbW9yeSBTZXR0aW5nc1xuICAgICAgICBjb250YWluZXJFbC5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6ICfwn6egIE1lbW9yeSAmIENvbnRleHQnIH0pO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoJ0VuYWJsZSBNZW1vcnkgQ29udGV4dCcpXG4gICAgICAgICAgICAuc2V0RGVzYyhcbiAgICAgICAgICAgICAgICAnSW5kZXggdmF1bHQgbm90ZXMgYW5kIGluamVjdCByZWxldmFudCBjb250ZXh0IGludG8gcHJvbXB0cyBmb3IgYmV0dGVyIHJlc3BvbnNlcydcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlTWVtb3J5KS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlTWVtb3J5ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoJ01lbW9yeSBTZXJ2ZXIgVVJMJylcbiAgICAgICAgICAgIC5zZXREZXNjKCdVUkwgd2hlcmUgbWVtb3J5IHNlcnZlciAoRmFzdEFQSSkgaXMgcnVubmluZycpXG4gICAgICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcignaHR0cDovL2xvY2FsaG9zdDo4MDAwJylcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm1lbW9yeVNlcnZlclVybClcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmICFDb25maWdWYWxpZGF0b3IudmFsaWRhdGVNZW1vcnlVcmwodmFsdWUpLnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSgn4p2MIEludmFsaWQgbWVtb3J5IHNlcnZlciBVUkwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5tZW1vcnlTZXJ2ZXJVcmwgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKCdNZW1vcnkgU2VhcmNoIFJlc3VsdHMnKVxuICAgICAgICAgICAgLnNldERlc2MoJ051bWJlciBvZiB2YXVsdCBtZW1vcnkgcmVzdWx0cyB0byBpbmplY3QgaW50byBjb250ZXh0ICgxLTIwKScpXG4gICAgICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcignNScpXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MubWVtb3J5VG9wSykpXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG51bSA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4obnVtKSB8fCBudW0gPCAxIHx8IG51bSA+IDIwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSgn4p2MIE11c3QgYmUgYmV0d2VlbiAxIGFuZCAyMCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm1lbW9yeVRvcEsgPSBudW07XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgLy8gRGVidWcgU2V0dGluZ3NcbiAgICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiAn8J+QmyBEZWJ1ZycgfSk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZSgnRW5hYmxlIERlYnVnIExvZ2dpbmcnKVxuICAgICAgICAgICAgLnNldERlc2MoJ1Nob3cgdmVyYm9zZSBsb2dzIGluIHRoZSBkZXZlbG9wZXIgY29uc29sZSAoQ3RybCtTaGlmdCtJKScpXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgICAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZURlYnVnTG9nZ2luZykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZURlYnVnTG9nZ2luZyA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICB9XG59XG4iXSwibmFtZXMiOlsiZnMiLCJwYXRoIiwicmVxdWVzdFVybCIsInNwYXduIiwiUGx1Z2luIiwiTm90aWNlIiwiSXRlbVZpZXciLCJzZXRJY29uIiwiUGx1Z2luU2V0dGluZ1RhYiIsIlNldHRpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFrR0E7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hILElBQUksT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsVUFBVSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQy9ELFFBQVEsU0FBUyxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRyxRQUFRLFNBQVMsUUFBUSxDQUFD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
