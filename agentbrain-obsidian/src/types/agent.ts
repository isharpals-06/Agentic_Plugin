/**
 * Agent-specific type definitions for future extension.
 * Currently re-exports core types and defines agent configuration interfaces.
 */

export interface AgentConfig {
    name: string;
    model: string;
    temperature: number;
    systemPrompt?: string;
}

export interface AgentRegistry {
    [key: string]: AgentConfig;
}

export type AgentRole = 'coder' | 'reviewer' | 'researcher' | 'brainstorm' | 'learner';

export const AGENT_DISPLAY_NAMES: Record<AgentRole, string> = {
    coder: '💻 Coder',
    reviewer: '✏️ Reviewer',
    researcher: '📚 Researcher',
    brainstorm: '🧠 Brainstormer',
    learner: '🎓 Learner',
};
