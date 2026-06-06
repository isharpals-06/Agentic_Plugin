import * as fs from 'fs';
import * as path from 'path';

export class ConfigValidator {
    /**
     * Validate Python path is executable
     */
    static validatePythonPath(pythonPath: string): { valid: boolean; error?: string } {
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
    static validateCorePath(corePath: string): { valid: boolean; error?: string } {
        if (!corePath || corePath.trim() === '') {
            return { valid: false, error: 'Core path cannot be empty' };
        }

        try {
            if (!fs.existsSync(corePath)) {
                return { valid: false, error: `Core path does not exist: ${corePath}` };
            }

            const mainPyPath = path.join(corePath, 'main.py');
            if (!fs.existsSync(mainPyPath)) {
                return { valid: false, error: `main.py not found in: ${corePath}` };
            }

            return { valid: true };
        } catch (err: any) {
            return { valid: false, error: `Error validating core path: ${err.message}` };
        }
    }

    /**
     * Validate Ollama URL format
     */
    static validateOllamaUrl(url: string): { valid: boolean; error?: string } {
        try {
            new URL(url);
            return { valid: true };
        } catch {
            return { valid: false, error: 'Invalid Ollama URL format' };
        }
    }

    /**
     * Validate memory server URL format
     */
    static validateMemoryUrl(url: string): { valid: boolean; error?: string } {
        if (!url) return { valid: true }; // Optional

        try {
            new URL(url);
            return { valid: true };
        } catch {
            return { valid: false, error: 'Invalid Memory Server URL format' };
        }
    }

    /**
     * Validate timeout values
     */
    static validateTimeout(seconds: number): { valid: boolean; error?: string } {
        if (seconds < 10) {
            return { valid: false, error: 'Timeout must be at least 10 seconds' };
        }
        if (seconds > 3600) {
            return { valid: false, error: 'Timeout cannot exceed 1 hour' };
        }
        return { valid: true };
    }
}

export class InputValidator {
    /**
     * Validate user task input
     */
    static validateTask(task: string): { valid: boolean; error?: string } {
        if (!task || task.trim() === '') {
            return { valid: false, error: 'Task cannot be empty' };
        }

        if (task.length > 10000) {
            return { valid: false, error: 'Task is too long (max 10000 characters)' };
        }

        return { valid: true };
    }
}
