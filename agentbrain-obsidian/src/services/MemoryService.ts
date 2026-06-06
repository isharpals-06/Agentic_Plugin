import { requestUrl } from 'obsidian';
import { Logger, LogLevel } from '../utils/logger';

export interface MemoryQueryResult {
    text: string;
    metadata: {
        title?: string;
        source?: string;
        chunk_index?: number;
    };
    score: number;
}

export class MemoryService {
    private url: string;
    private logger: Logger;

    constructor(url: string, logger?: Logger) {
        this.url = url;
        this.logger = logger || new Logger(LogLevel.INFO);
    }

    /**
     * Check if the memory server is reachable
     */
    async isHealthy(): Promise<boolean> {
        try {
            const response = await requestUrl({
                url: `${this.url}/status`,
                method: 'GET',
                throw: false,
            } as any);
            return response.status === 200;
        } catch {
            return false;
        }
    }

    /**
     * Query memory for relevant context
     */
    async query(queryText: string, topK: number = 5): Promise<MemoryQueryResult[]> {
        try {
            const response = await requestUrl({
                url: `${this.url}/query?q=${encodeURIComponent(queryText)}&top_k=${topK}`,
                method: 'GET',
                throw: false,
            } as any);

            if (response.status === 200) {
                const data = response.json as any;
                if (data.results && data.results.length > 0) {
                    this.logger.debug('Memory query returned results', { count: data.results.length });
                    return data.results;
                }
            }

            return [];
        } catch (err: any) {
            this.logger.warn('Memory query failed', err.message);
            return [];
        }
    }

    /**
     * Trigger vault indexing
     */
    async indexVault(vaultPath: string): Promise<{ success: boolean; message: string; totalChunks?: number }> {
        try {
            const response = await requestUrl({
                url: `${this.url}/index`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vault_path: vaultPath }),
            } as any);

            if (response.status === 200) {
                const data = response.json as any;
                return {
                    success: data.success || false,
                    message: data.message || '',
                    totalChunks: data.total_chunks,
                };
            }

            return { success: false, message: `Memory server error (${response.status})` };
        } catch (err: any) {
            this.logger.error('Memory server connection failed', err);
            return { success: false, message: 'Memory server unreachable' };
        }
    }
}
