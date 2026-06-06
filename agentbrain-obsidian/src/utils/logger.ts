export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    data?: any;
}

export class Logger {
    private logs: LogEntry[] = [];
    private level: LogLevel;
    private maxLogs: number = 500;

    constructor(logLevel: LogLevel = LogLevel.INFO) {
        this.level = logLevel;
    }

    debug(message: string, data?: any) {
        this.log(LogLevel.DEBUG, message, data);
    }

    info(message: string, data?: any) {
        this.log(LogLevel.INFO, message, data);
    }

    warn(message: string, data?: any) {
        this.log(LogLevel.WARN, message, data);
    }

    error(message: string, data?: any) {
        this.log(LogLevel.ERROR, message, data);
    }

    private log(level: LogLevel, message: string, data?: any) {
        if (level < this.level) return;

        const entry: LogEntry = {
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
                if (data !== undefined) { console.debug(output, data); } else { console.debug(output); }
                break;
            case LogLevel.INFO:
                if (data !== undefined) { console.log(output, data); } else { console.log(output); }
                break;
            case LogLevel.WARN:
                if (data !== undefined) { console.warn(output, data); } else { console.warn(output); }
                break;
            case LogLevel.ERROR:
                if (data !== undefined) { console.error(output, data); } else { console.error(output); }
                break;
        }
    }

    getLogs(level?: LogLevel): LogEntry[] {
        if (level === undefined) return [...this.logs];
        return this.logs.filter(l => l.level >= level);
    }

    clearLogs() {
        this.logs = [];
    }
}
