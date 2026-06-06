import { requestUrl } from 'obsidian';
import { Logger, LogLevel } from '../utils/logger';

export interface OllamaModelInfo {
    name: string;
    size: number;
    modified: string;
    digest: string;
}

export class OllamaService {
    private url: string;
    private timeout: number;
    private logger: Logger;
    private retryAttempts: number = 3;
    private retryDelay: number = 1000; // ms

    constructor(url: string, timeout: number = 10000, logger?: Logger) {
        this.url = url;
        this.timeout = timeout;
        this.logger = logger || new Logger(LogLevel.INFO);
    }

    /**
     * Check if Ollama is running and accessible
     */
    async isHealthy(retries: number = this.retryAttempts): Promise<boolean> {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await requestUrl({
                    url: `${this.url}/api/tags`,
                    method: 'GET',
                    throw: false,
                } as any);

                if (response.status === 200) {
                    this.logger.debug('Ollama is healthy');
                    return true;
                }

                this.logger.warn(`Ollama returned status ${response.status}`);
            } catch (err: any) {
                this.logger.debug(`Ollama health check attempt ${i + 1} failed`, err.message);

                if (i < retries - 1) {
                    await this.sleep(this.retryDelay);
                }
            }
        }

        return false;
    }

    /**
     * Get list of available models
     */
    async getModels(): Promise<OllamaModelInfo[]> {
        try {
            const response = await requestUrl({
                url: `${this.url}/api/tags`,
                method: 'GET',
            });

            if (response.status === 200) {
                const data = response.json as any;
                return data.models || [];
            }

            throw new Error(`Ollama returned status ${response.status}`);
        } catch (err: any) {
            this.logger.error('Failed to fetch models', err);
            throw err;
        }
    }

    /**
     * Generate response from model
     */
    async generate(
        model: string,
        prompt: string,
        _onStream?: (chunk: string) => void
    ): Promise<string> {
        try {
            const response = await requestUrl({
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
                const data = response.json as any;
                return data.response || '';
            }

            throw new Error(`Model returned status ${response.status}`);
        } catch (err: any) {
            this.logger.error(`Failed to generate from ${model}`, err);
            throw err;
        }
    }

    /**
     * Check if specific model is available
     */
    async hasModel(modelName: string): Promise<boolean> {
        try {
            const models = await this.getModels();
            return models.some(m => m.name.includes(modelName));
        } catch {
            return false;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
