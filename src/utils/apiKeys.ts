export interface ProviderSetting {
  enabled: boolean;
  apiKey: string;
  endpoint?: string;
  model: string;
}

export interface AllProviderConfigs {
  openai: ProviderSetting;
  anthropic: ProviderSetting;
  gemini: ProviderSetting;
  deepseek: ProviderSetting;
  ollama: ProviderSetting;
  localOpenAI: ProviderSetting;
}

export const DEFAULT_PROVIDER_CONFIGS: AllProviderConfigs = {
  openai: {
    enabled: true,
    apiKey: '',
    model: 'gpt-4o'
  },
  anthropic: {
    enabled: true,
    apiKey: '',
    model: 'claude-3-5-sonnet-20241022'
  },
  gemini: {
    enabled: true,
    apiKey: '',
    model: 'gemini-1.5-flash'
  },
  deepseek: {
    enabled: true,
    apiKey: '',
    model: 'deepseek-chat'
  },
  ollama: {
    enabled: false,
    apiKey: '',
    endpoint: 'http://localhost:11434',
    model: 'llama3.1'
  },
  localOpenAI: {
    enabled: false,
    apiKey: '',
    endpoint: 'http://localhost:1234/v1',
    model: 'local-model'
  }
};

const STORAGE_KEY = 'tool_calling_lab_provider_configs';

export function loadProviderConfigs(): AllProviderConfigs {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        openai: { ...DEFAULT_PROVIDER_CONFIGS.openai, ...parsed.openai },
        anthropic: { ...DEFAULT_PROVIDER_CONFIGS.anthropic, ...parsed.anthropic },
        gemini: { ...DEFAULT_PROVIDER_CONFIGS.gemini, ...parsed.gemini },
        deepseek: { ...DEFAULT_PROVIDER_CONFIGS.deepseek, ...parsed.deepseek },
        ollama: { ...DEFAULT_PROVIDER_CONFIGS.ollama, ...parsed.ollama },
        localOpenAI: { ...DEFAULT_PROVIDER_CONFIGS.localOpenAI, ...parsed.localOpenAI }
      };
    }
  } catch (err) {
    console.error('Failed to parse saved provider configs:', err);
  }

  // Fallback check legacy storage keys if present
  const legacyOpenAI = localStorage.getItem('openai_key') || '';
  const legacyAnthropic = localStorage.getItem('anthropic_key') || '';

  const configs = { ...DEFAULT_PROVIDER_CONFIGS };
  if (legacyOpenAI) configs.openai.apiKey = legacyOpenAI;
  if (legacyAnthropic) configs.anthropic.apiKey = legacyAnthropic;

  return configs;
}

export function saveProviderConfigs(configs: AllProviderConfigs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    // Also save legacy keys for backward compatibility
    if (configs.openai.apiKey) localStorage.setItem('openai_key', configs.openai.apiKey);
    if (configs.anthropic.apiKey) localStorage.setItem('anthropic_key', configs.anthropic.apiKey);
  } catch (err) {
    console.error('Failed to save provider configs:', err);
  }
}

export function hasAnyApiKey(configs: AllProviderConfigs): boolean {
  return Boolean(
    configs.openai.apiKey ||
    configs.anthropic.apiKey ||
    configs.gemini.apiKey ||
    configs.deepseek.apiKey ||
    configs.ollama.endpoint ||
    configs.localOpenAI.endpoint
  );
}

export async function testProviderConnection(
  provider: keyof AllProviderConfigs,
  config: ProviderSetting
): Promise<{ success: boolean; message: string }> {
  try {
    if (provider === 'openai') {
      if (!config.apiKey) return { success: false, message: 'API key is missing' };
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${config.apiKey}` }
      });
      if (res.ok) return { success: true, message: 'Connected to OpenAI' };
      return { success: false, message: `HTTP ${res.status}: ${res.statusText}` };
    }

    if (provider === 'anthropic') {
      if (!config.apiKey) return { success: false, message: 'API key is missing' };
      // Anthropic does not have a lightweight GET endpoint, test with headers
      return { success: true, message: 'Anthropic Key configured' };
    }

    if (provider === 'gemini') {
      if (!config.apiKey) return { success: false, message: 'API key is missing' };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
      if (res.ok) return { success: true, message: 'Connected to Google Gemini' };
      return { success: false, message: `HTTP ${res.status}: ${res.statusText}` };
    }

    if (provider === 'deepseek') {
      if (!config.apiKey) return { success: false, message: 'API key is missing' };
      const res = await fetch('https://api.deepseek.com/models', {
        headers: { Authorization: `Bearer ${config.apiKey}` }
      });
      if (res.ok) return { success: true, message: 'Connected to DeepSeek' };
      return { success: false, message: `HTTP ${res.status}: ${res.statusText}` };
    }

    if (provider === 'ollama') {
      const endpoint = config.endpoint || 'http://localhost:11434';
      const res = await fetch(`${endpoint}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        const count = data.models?.length || 0;
        return { success: true, message: `Connected to JkAi (${count} models found)` };
      }
      return { success: false, message: `HTTP ${res.status}: ${res.statusText}` };
    }

    if (provider === 'localOpenAI') {
      const endpoint = config.endpoint || 'http://localhost:1234/v1';
      const headers: Record<string, string> = {};
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
      const res = await fetch(`${endpoint}/models`, { headers });
      if (res.ok) return { success: true, message: 'Connected to Local Server' };
      return { success: false, message: `HTTP ${res.status}: ${res.statusText}` };
    }

    return { success: false, message: 'Unknown provider' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed (CORS or server offline)' };
  }
}
