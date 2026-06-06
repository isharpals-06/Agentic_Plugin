import { spawn, ChildProcess } from 'child_process';
import { Logger, LogLevel } from '../utils/logger';

export interface ProcessOptions {
    pythonPath: string;
    scriptPath: string;
    args: string[];
    cwd: string;
    timeout?: number;
}

export class ProcessManager {
    private activeProcess: ChildProcess | null = null;
    private processTimeout: ReturnType<typeof setTimeout> | null = null;
    private logger: Logger;

    constructor(logger?: Logger) {
        this.logger = logger || new Logger(LogLevel.INFO);
    }

    /**
     * Execute Python script and get output
     */
    async execute(options: ProcessOptions): Promise<string> {
        return new Promise((resolve, reject) => {
            this.logger.info('Starting Python process', {
                script: options.scriptPath,
                args: options.args,
            });

            try {
                this.activeProcess = spawn(options.pythonPath, [options.scriptPath, ...options.args], {
                    cwd: options.cwd,
                    stdio: ['pipe', 'pipe', 'pipe'],
                });

                let stdout = '';
                let stderr = '';

                this.activeProcess.stdout?.on('data', (data: Buffer) => {
                    stdout += data.toString();
                });

                this.activeProcess.stderr?.on('data', (data: Buffer) => {
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

                this.activeProcess.on('close', (code: number | null) => {
                    this.clearProcessTimeout();
                    this.activeProcess = null;

                    if (code === 0) {
                        this.logger.info('Process completed successfully');
                        resolve(stdout);
                    } else {
                        this.logger.error('Process failed', { code, stderr });
                        reject(new Error(stderr || `Process exited with code ${code}`));
                    }
                });

                this.activeProcess.on('error', (err: Error) => {
                    this.clearProcessTimeout();
                    this.activeProcess = null;
                    this.logger.error('Process error', err);
                    reject(err);
                });
            } catch (err) {
                this.logger.error('Failed to spawn process', err);
                reject(err);
            }
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
    isRunning(): boolean {
        return this.activeProcess !== null && !this.activeProcess.killed;
    }

    private clearProcessTimeout() {
        if (this.processTimeout) {
            clearTimeout(this.processTimeout);
            this.processTimeout = null;
        }
    }
}
