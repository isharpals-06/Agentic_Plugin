export interface AgentBrainSettings {
    // Paths
    pythonPath: string;
    corePath: string;

    // Ollama Configuration
    ollamaUrl: string;
    ollamaTimeout: number;

    // Memory Configuration
    enableMemory: boolean;
    memoryServerUrl: string;
    memoryTopK: number;

    // Execution Configuration
    maxTimeout: number;
    enableDebugLogging: boolean;

    // Performance
    streamResults: boolean;
}

export interface AgentMessage {
    sender: string;
    content: string;
    type: 'user' | 'agent' | 'manager' | 'error' | 'system';
    timestamp: number;
    agentName?: string;
}

export interface ManagerPlan {
    type: 'plan';
    description: string;
    steps: AgentStep[];
}

export interface AgentStep {
    step_number: number;
    agent: string;
    instruction: string;
    estimated_time?: number;
}

export interface AgentOutput {
    type: 'agent_output';
    agent: string;
    step: number;
    instruction: string;
    output: string;
    metadata?: Record<string, any>;
}

export interface ExecutionStatus {
    state: 'idle' | 'planning' | 'executing' | 'complete' | 'error';
    currentStep?: number;
    currentAgent?: string;
    errorMessage?: string;
    progress: number; // 0-100
}

export interface OllamaModel {
    name: string;
    size: number;
    modified: string;
}
