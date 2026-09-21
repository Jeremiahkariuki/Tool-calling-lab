import type { ToolDefinition } from './openapiParser';
import { PREBUILT_TOOLS } from './sampleData';

const STORAGE_KEY = 'tool_calling_lab_custom_tools';

export function loadCustomTools(): ToolDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    
    // Re-attach mock handlers
    return parsed.map((t: any) => ({
      ...t,
      mockHandler: (args: any) => ({
        status: 200,
        toolName: t.name,
        source: t.source || 'custom',
        executedArguments: args,
        timestamp: new Date().toISOString()
      })
    }));
  } catch (err) {
    console.error('Failed to load custom tools from localStorage:', err);
    return [];
  }
}

export function saveCustomTools(tools: ToolDefinition[]): void {
  try {
    // Strip mockHandler before serializing to JSON
    const serializable = tools.map(({ mockHandler, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (err) {
    console.error('Failed to save custom tools to localStorage:', err);
  }
}

export function getAllTools(customTools: ToolDefinition[]): ToolDefinition[] {
  return [...(PREBUILT_TOOLS as any[]), ...customTools];
}
