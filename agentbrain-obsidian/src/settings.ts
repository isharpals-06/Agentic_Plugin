import { App, PluginSettingTab, Setting } from 'obsidian';
import type AgentBrainPlugin from './main';

export interface AgentBrainSettings {
    pythonPath: string;
    corePath: string;
    memoryServerUrl: string;
    enableMemory: boolean;
}

export const DEFAULT_SETTINGS: AgentBrainSettings = {
    pythonPath: 'python',
    corePath: 'c:/Users/ishar/Plugin/agentbrain-core',
    memoryServerUrl: 'http://localhost:8000',
    enableMemory: true
};

export class AgentBrainSettingTab extends PluginSettingTab {
    plugin: AgentBrainPlugin;

    constructor(app: App, plugin: AgentBrainPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'AgentBrain Settings' });

        new Setting(containerEl)
            .setName('Python Path / Command')
            .setDesc('Command to run Python (e.g. "python", "python3", or absolute path).')
            .addText(text => text
                .setPlaceholder('python')
                .setValue(this.plugin.settings.pythonPath)
                .onChange(async (value) => {
                    this.plugin.settings.pythonPath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Core Path')
            .setDesc('Absolute path to your agentbrain-core/ folder.')
            .addText(text => text
                .setPlaceholder('c:/Users/ishar/Plugin/agentbrain-core')
                .setValue(this.plugin.settings.corePath)
                .onChange(async (value) => {
                    this.plugin.settings.corePath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Memory Server URL')
            .setDesc('URL where the agentbrain-memory FastAPI server is running.')
            .addText(text => text
                .setPlaceholder('http://localhost:8000')
                .setValue(this.plugin.settings.memoryServerUrl)
                .onChange(async (value) => {
                    this.plugin.settings.memoryServerUrl = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable Memory Context')
            .setDesc('Index your vault notes and automatically query memory to inject relevant context into agent prompts.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableMemory)
                .onChange(async (value) => {
                    this.plugin.settings.enableMemory = value;
                    await this.plugin.saveSettings();
                }));
    }
}
