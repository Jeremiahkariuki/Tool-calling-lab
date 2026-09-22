/**
 * webhookTester.ts
 * Core utility for executing real HTTP requests to webhook/REST endpoints,
 * capturing full request & response details for the inspector UI.
 */

export interface WebhookHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface WebhookRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: WebhookHeader[];
  body?: string;
  timeoutMs?: number;
}

export interface WebhookInspectorEntry {
  id: string;
  timestamp: string;
  url: string;
  method: string;
  // What was actually sent
  sentHeaders: Record<string, string>;
  sentBody?: string;
  // What came back
  statusCode: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
  contentType: string;
  latencyMs: number;
  success: boolean;
  error?: string;
  sizeBytes: number;
}

// ─── Preset Header Templates ─────────────────────────────────────────────────

export const HEADER_PRESETS: { label: string; key: string; placeholder: string }[] = [
  { label: 'Bearer Auth', key: 'Authorization', placeholder: 'Bearer YOUR_TOKEN_HERE' },
  { label: 'API Key Header', key: 'X-Api-Key', placeholder: 'YOUR_API_KEY' },
  { label: 'Custom API Key', key: 'X-API-Key', placeholder: 'sk-proj-...' },
  { label: 'Content-Type JSON', key: 'Content-Type', placeholder: 'application/json' },
  { label: 'Accept JSON', key: 'Accept', placeholder: 'application/json' },
  { label: 'Tenant ID', key: 'X-Tenant-Id', placeholder: 'tenant_12345' },
];

export function makeDefaultHeaders(): WebhookHeader[] {
  return [
    { id: genId(), key: 'Content-Type', value: 'application/json', enabled: true },
    { id: genId(), key: 'Accept', value: 'application/json', enabled: true },
    { id: genId(), key: 'Authorization', value: 'Bearer ', enabled: false },
  ];
}

function genId(): string {
  return `hdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

export function makeBlankHeader(): WebhookHeader {
  return { id: genId(), key: '', value: '', enabled: true };
}

// ─── Status Code Helpers ──────────────────────────────────────────────────────

export interface StatusMeta {
  bg: string;
  text: string;
  border: string;
  glow: string;
  label: string;
}

export function getStatusMeta(code: number): StatusMeta {
  if (code === 0)
    return { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-700', glow: '', label: 'Error' };
  if (code >= 200 && code < 300)
    return { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/50', glow: 'shadow-emerald-500/20', label: 'Success' };
  if (code >= 300 && code < 400)
    return { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/50', glow: 'shadow-blue-500/20', label: 'Redirect' };
  if (code >= 400 && code < 500)
    return { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/50', glow: 'shadow-amber-500/20', label: 'Client Error' };
  if (code >= 500)
    return { bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-500/50', glow: 'shadow-red-500/20', label: 'Server Error' };
  return { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-700', glow: '', label: 'Unknown' };
}

export function getMethodMeta(method: string): { bg: string; text: string; border: string } {
  switch (method.toUpperCase()) {
    case 'GET':    return { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' };
    case 'POST':   return { bg: 'bg-indigo-500/15',  text: 'text-indigo-300',  border: 'border-indigo-500/40' };
    case 'PUT':    return { bg: 'bg-amber-500/15',   text: 'text-amber-300',   border: 'border-amber-500/40' };
    case 'PATCH':  return { bg: 'bg-purple-500/15',  text: 'text-purple-300',  border: 'border-purple-500/40' };
    case 'DELETE': return { bg: 'bg-red-500/15',     text: 'text-red-300',     border: 'border-red-500/40' };
    default:       return { bg: 'bg-slate-700',      text: 'text-slate-300',   border: 'border-slate-600' };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ─── Core HTTP Executor ───────────────────────────────────────────────────────

export async function executeWebhookRequest(
  config: WebhookRequestConfig
): Promise<WebhookInspectorEntry> {
  const start = performance.now();
  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toLocaleTimeString();

  // Flatten enabled headers into a plain object
  const sentHeaders: Record<string, string> = {};
  config.headers.forEach((h) => {
    if (h.enabled && h.key.trim()) {
      sentHeaders[h.key.trim()] = h.value;
    }
  });

  // Auto-inject Content-Type for body requests if missing
  const hasContentType = Object.keys(sentHeaders).some(
    (k) => k.toLowerCase() === 'content-type'
  );
  if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method) && !hasContentType) {
    sentHeaders['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutMs = config.timeoutMs ?? 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOpts: RequestInit = {
      method: config.method,
      headers: sentHeaders,
      signal: controller.signal,
    };

    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      fetchOpts.body = config.body;
    }

    const res = await fetch(config.url, fetchOpts);
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

    // Capture response headers
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = res.headers.get('content-type') || '';

    // Read and prettify the body
    let responseBody = '';
    try {
      const raw = await res.text();
      const trimmed = raw.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          responseBody = JSON.stringify(JSON.parse(raw), null, 2);
        } catch {
          responseBody = raw;
        }
      } else {
        responseBody = raw;
      }
    } catch {
      responseBody = '[Unable to decode response body]';
    }

    const sizeBytes = new TextEncoder().encode(responseBody).length;

    return {
      id, timestamp, url: config.url, method: config.method,
      sentHeaders, sentBody: config.body,
      statusCode: res.status, statusText: res.statusText,
      responseHeaders, responseBody, contentType,
      latencyMs, success: res.ok, sizeBytes,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);
    const isTimeout = err.name === 'AbortError';
    return {
      id, timestamp, url: config.url, method: config.method,
      sentHeaders, sentBody: config.body,
      statusCode: 0,
      statusText: isTimeout ? 'Request Timeout' : 'Network Error',
      responseHeaders: {},
      responseBody: '',
      contentType: '',
      latencyMs, success: false,
      error: isTimeout
        ? `Request timed out after ${timeoutMs / 1000}s.`
        : (err.message || 'Network error. Verify the URL and check CORS policy on the target server.'),
      sizeBytes: 0,
    };
  }
}

/**
 * Execute a saved tool's webhookUrl with given LLM-extracted args.
 * Used by liveRunner when a custom tool has a real endpoint configured.
 */
export async function executeToolWebhook(
  tool: {
    webhookUrl?: string;
    httpMethod?: string;
    headers?: Record<string, string>;
  },
  args: any
): Promise<WebhookInspectorEntry> {
  if (!tool.webhookUrl) throw new Error('Tool has no webhookUrl configured');

  const method = (tool.httpMethod?.toUpperCase() || 'POST') as WebhookRequestConfig['method'];

  const headers: WebhookHeader[] = [
    { id: 'ct', key: 'Content-Type', value: 'application/json', enabled: true },
    { id: 'acc', key: 'Accept', value: 'application/json', enabled: true },
  ];

  if (tool.headers) {
    Object.entries(tool.headers).forEach(([k, v], i) => {
      headers.push({ id: `th_${i}`, key: k, value: v, enabled: true });
    });
  }

  const body = ['POST', 'PUT', 'PATCH'].includes(method)
    ? JSON.stringify(args, null, 2)
    : undefined;

  return executeWebhookRequest({ url: tool.webhookUrl, method, headers, body });
}
