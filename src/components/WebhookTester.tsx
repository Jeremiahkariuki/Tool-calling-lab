import React, { useState, useCallback } from 'react';
import type { ToolDefinition } from '../utils/openapiParser';
import {
  executeWebhookRequest,
  makeDefaultHeaders,
  makeBlankHeader,
  getStatusMeta,
  getMethodMeta,
  formatBytes,
  HEADER_PRESETS,
} from '../utils/webhookTester';
import type { WebhookHeader, WebhookInspectorEntry } from '../utils/webhookTester';
import {
  Globe, Send, Plus, Trash2, ChevronDown, Clock, AlertTriangle,
  Copy, Check, History, Code, List, FileJson, Zap, Eye, EyeOff,
  RefreshCw, X, Shield
} from 'lucide-react';

interface WebhookTesterProps {
  customTools?: ToolDefinition[];
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
type Method = typeof METHODS[number];

const SAMPLE_BODIES: Record<string, string> = {
  empty: '',
  basic: JSON.stringify({ query: 'hello', limit: 10 }, null, 2),
  auth_test: JSON.stringify({ user_id: 'usr_123', action: 'verify', metadata: { source: 'webhook-tester' } }, null, 2),
  search: JSON.stringify({ q: 'product search', filters: { category: 'electronics', price_max: 500 }, page: 1 }, null, 2),
};

export const WebhookTester: React.FC<WebhookTesterProps> = ({ customTools = [] }) => {
  // ─── Request State ─────────────────────────────────────────────────────────
  const [url, setUrl] = useState('https://httpbin.org/post');
  const [method, setMethod] = useState<Method>('POST');
  const [headers, setHeaders] = useState<WebhookHeader[]>(makeDefaultHeaders());
  const [body, setBody] = useState(JSON.stringify({ message: 'Hello from Tool Calling Lab!', timestamp: new Date().toISOString() }, null, 2));
  const [isSending, setIsSending] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string>('');

  // ─── Response State ────────────────────────────────────────────────────────
  const [currentResponse, setCurrentResponse] = useState<WebhookInspectorEntry | null>(null);
  const [history, setHistory] = useState<WebhookInspectorEntry[]>([]);
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'request'>('body');
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHeaderValues, setShowHeaderValues] = useState<Record<string, boolean>>({});

  // ─── Header Management ─────────────────────────────────────────────────────
  const addHeader = () => setHeaders((h) => [...h, makeBlankHeader()]);

  const removeHeader = (id: string) => setHeaders((h) => h.filter((hdr) => hdr.id !== id));

  const updateHeader = (id: string, field: 'key' | 'value', val: string) =>
    setHeaders((h) => h.map((hdr) => (hdr.id === id ? { ...hdr, [field]: val } : hdr)));

  const toggleHeader = (id: string) =>
    setHeaders((h) => h.map((hdr) => (hdr.id === id ? { ...hdr, enabled: !hdr.enabled } : hdr)));

  const addPreset = (preset: typeof HEADER_PRESETS[number]) => {
    const exists = headers.find((h) => h.key.toLowerCase() === preset.key.toLowerCase());
    if (exists) {
      setHeaders((h) => h.map((hdr) =>
        hdr.key.toLowerCase() === preset.key.toLowerCase()
          ? { ...hdr, enabled: true, value: preset.placeholder }
          : hdr
      ));
    } else {
      setHeaders((h) => [...h, { id: `preset_${Date.now()}`, key: preset.key, value: preset.placeholder, enabled: true }]);
    }
  };

  // ─── Load from Custom Tool ─────────────────────────────────────────────────
  const loadFromTool = useCallback((toolId: string) => {
    const tool = customTools.find((t) => t.id === toolId);
    if (!tool) return;
    setSelectedToolId(toolId);
    if (tool.webhookUrl) setUrl(tool.webhookUrl);
    if (tool.httpMethod) setMethod(tool.httpMethod as Method);

    const newHeaders = makeDefaultHeaders();
    if (tool.headers) {
      Object.entries(tool.headers).forEach(([k, v]) => {
        const exists = newHeaders.find((h) => h.key.toLowerCase() === k.toLowerCase());
        if (exists) {
          exists.value = v;
          exists.enabled = true;
        } else {
          newHeaders.push({ id: `tool_${Date.now()}`, key: k, value: v, enabled: true });
        }
      });
    }
    setHeaders(newHeaders);

    // Auto-generate body from tool parameters schema
    const props = tool.parameters?.properties || {};
    const sampleArgs: Record<string, any> = {};
    Object.entries(props).forEach(([k, v]: [string, any]) => {
      if (v.enum) sampleArgs[k] = v.enum[0];
      else if (v.type === 'integer' || v.type === 'number') sampleArgs[k] = 0;
      else if (v.type === 'boolean') sampleArgs[k] = true;
      else if (v.type === 'array') sampleArgs[k] = [];
      else sampleArgs[k] = `example_${k}`;
    });
    setBody(JSON.stringify(sampleArgs, null, 2));
  }, [customTools]);

  // ─── Send Request ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!url.trim()) return;
    setIsSending(true);
    setResponseTab('body');

    const result = await executeWebhookRequest({
      url: url.trim(),
      method,
      headers,
      body: ['GET', 'DELETE'].includes(method) ? undefined : body,
    });

    setCurrentResponse(result);
    setHistory((prev) => [result, ...prev].slice(0, 20));
    setIsSending(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enabledHeaderCount = headers.filter((h) => h.enabled && h.key.trim()).length;
  const statusMeta = currentResponse ? getStatusMeta(currentResponse.statusCode) : null;

  return (
    <div className="space-y-8">

      {/* ── Header Panel ─────────────────────────────────────────────────── */}
      <div className="glass-card p-6 md:p-10 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Globe className="w-6 h-6" />
              </span>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                Real Webhook & REST Endpoint Tester
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Test live production or staging API endpoints with custom HTTP headers, bearer tokens, and API keys.
              Inspect raw status codes, response headers, and body payloads in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Load from Custom Tool */}
            {customTools.length > 0 && (
              <div className="relative">
                <select
                  value={selectedToolId}
                  onChange={(e) => loadFromTool(e.target.value)}
                  className="glass-input pl-3 pr-8 py-2.5 text-xs font-mono text-slate-200 appearance-none cursor-pointer min-w-[200px]"
                >
                  <option value="">⚡ Load from saved tool...</option>
                  {customTools.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.httpMethod || 'POST'} · {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* History toggle */}
            <button
              onClick={() => setShowHistory((s) => !s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                showHistory
                  ? 'bg-slate-700 text-slate-100 border-slate-600'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History ({history.length})</span>
            </button>
          </div>
        </div>

        {/* ── URL Bar + Method + Send ──────────────────────────────────────── */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Endpoint URL
          </label>
          <div className="flex gap-3">
            {/* Method Selector */}
            <div className="relative shrink-0">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as Method)}
                className={`appearance-none cursor-pointer px-4 pr-8 py-3.5 rounded-2xl border font-bold text-xs font-mono transition-all focus:outline-none ${
                  getMethodMeta(method).bg
                } ${getMethodMeta(method).text} ${getMethodMeta(method).border}`}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${getMethodMeta(method).text}`} />
            </div>

            {/* URL Input */}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="https://api.example.com/v1/endpoint"
              className="glass-input flex-1 px-5 py-3.5 text-sm font-mono text-slate-100 placeholder-slate-600"
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isSending || !url.trim()}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 hover:from-cyan-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /><span>Sending...</span></>
              ) : (
                <><Send className="w-4 h-4" /><span>Send Request</span></>
              )}
            </button>
          </div>

          {/* Quick URL Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Try:</span>
            {[
              { label: 'httpbin POST', url: 'https://httpbin.org/post', method: 'POST' as Method },
              { label: 'httpbin GET', url: 'https://httpbin.org/get', method: 'GET' as Method },
              { label: 'JSONPlaceholder todos', url: 'https://jsonplaceholder.typicode.com/todos/1', method: 'GET' as Method },
              { label: 'httpbin Status 401', url: 'https://httpbin.org/status/401', method: 'GET' as Method },
              { label: 'httpbin Status 500', url: 'https://httpbin.org/status/500', method: 'GET' as Method },
            ].map((preset) => (
              <button
                key={preset.url}
                onClick={() => { setUrl(preset.url); setMethod(preset.method); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all font-mono cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Headers Editor ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              HTTP Headers ({enabledHeaderCount} active)
            </label>
            <div className="flex items-center gap-2">
              {/* Preset quick-add buttons */}
              {HEADER_PRESETS.slice(0, 3).map((p) => (
                <button
                  key={p.key}
                  onClick={() => addPreset(p)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-mono font-bold transition-all cursor-pointer"
                >
                  + {p.label}
                </button>
              ))}
              <button
                onClick={addHeader}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Header
              </button>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
            {/* Column labels */}
            <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 px-2 pb-1 border-b border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-600 uppercase">On</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Header Key</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Value</span>
              <span />
            </div>

            {headers.map((hdr) => {
              const isSensitive = ['authorization', 'x-api-key', 'x-apikey'].includes(hdr.key.toLowerCase());
              const revealed = showHeaderValues[hdr.id];
              return (
                <div key={hdr.id} className={`grid grid-cols-[32px_1fr_1fr_32px] gap-2 items-center px-2 py-1 rounded-xl transition-all ${hdr.enabled ? '' : 'opacity-40'}`}>
                  {/* Enable toggle */}
                  <button
                    onClick={() => toggleHeader(hdr.id)}
                    className={`w-5 h-5 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
                      hdr.enabled
                        ? 'bg-cyan-500 border-cyan-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </button>

                  {/* Key */}
                  <input
                    type="text"
                    value={hdr.key}
                    onChange={(e) => updateHeader(hdr.id, 'key', e.target.value)}
                    placeholder="Header-Name"
                    className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-all"
                  />

                  {/* Value + reveal toggle for sensitive */}
                  <div className="relative">
                    <input
                      type={isSensitive && !revealed ? 'password' : 'text'}
                      value={hdr.value}
                      onChange={(e) => updateHeader(hdr.id, 'value', e.target.value)}
                      placeholder="value"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-all pr-8"
                    />
                    {isSensitive && (
                      <button
                        onClick={() => setShowHeaderValues((s) => ({ ...s, [hdr.id]: !revealed }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeHeader(hdr.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {headers.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-600 font-mono">
                No headers configured. Click "Add Header" to start.
              </div>
            )}
          </div>
        </div>

        {/* ── Request Body ─────────────────────────────────────────────────── */}
        {!['GET', 'DELETE'].includes(method) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                Request Body (JSON)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Templates:</span>
                {Object.entries(SAMPLE_BODIES).map(([name, val]) => (
                  <button
                    key={name}
                    onClick={() => setBody(val)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 font-mono transition-all cursor-pointer capitalize"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder='{ "key": "value" }'
              className="w-full bg-slate-950 font-mono text-xs text-cyan-200 border border-slate-800 rounded-2xl p-4 focus:outline-none focus:border-cyan-500/60 transition-all resize-none leading-relaxed min-h-[180px]"
            />
          </div>
        )}
      </div>

      {/* ── Response Inspector ────────────────────────────────────────────── */}
      {currentResponse ? (
        <div className="glass-card p-6 md:p-8 space-y-6">

          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className={`px-5 py-2.5 rounded-2xl border font-bold text-lg shadow-lg ${statusMeta!.bg} ${statusMeta!.text} ${statusMeta!.border} ${statusMeta!.glow}`}>
                {currentResponse.statusCode === 0 ? '—' : currentResponse.statusCode}
                <span className="text-sm font-normal ml-2 opacity-80">{currentResponse.statusText}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {currentResponse.latencyMs} ms
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Code className="w-3.5 h-3.5 text-slate-500" />
                  {formatBytes(currentResponse.sizeBytes)}
                </span>
                <span className={`text-xs px-3 py-1.5 rounded-xl border font-bold font-mono ${statusMeta!.bg} ${statusMeta!.text} ${statusMeta!.border}`}>
                  {statusMeta!.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 truncate max-w-xs">
                {currentResponse.timestamp} • {currentResponse.method} {currentResponse.url.replace(/^https?:\/\//, '').slice(0, 40)}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {currentResponse.error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-950/40 border border-red-500/40">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-200 text-sm font-bold block">Request Failed</strong>
                <p className="text-xs text-red-300 mt-1 font-mono leading-relaxed">{currentResponse.error}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-fit">
            {([
              { id: 'body', label: 'Response Body', icon: <FileJson className="w-3.5 h-3.5" /> },
              { id: 'headers', label: `Response Headers (${Object.keys(currentResponse.responseHeaders).length})`, icon: <List className="w-3.5 h-3.5" /> },
              { id: 'request', label: 'Request Details', icon: <Zap className="w-3.5 h-3.5" /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setResponseTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  responseTab === tab.id
                    ? 'bg-slate-700 text-slate-100 shadow'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Response Body */}
          {responseTab === 'body' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500">
                  {currentResponse.contentType || 'text/plain'}
                </span>
                <button
                  onClick={() => handleCopy(currentResponse.responseBody)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Body'}
                </button>
              </div>
              {currentResponse.responseBody ? (
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 overflow-x-auto max-h-[500px] overflow-y-auto">
                  <pre className="text-xs text-cyan-200 font-mono leading-relaxed whitespace-pre-wrap">
                    {currentResponse.responseBody}
                  </pre>
                </div>
              ) : (
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-8 text-center text-xs text-slate-600 font-mono">
                  No response body returned.
                </div>
              )}
            </div>
          )}

          {/* Tab: Response Headers */}
          {responseTab === 'headers' && (
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              {Object.entries(currentResponse.responseHeaders).length > 0 ? (
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950">
                      <th className="text-left text-slate-500 font-bold uppercase px-5 py-3 w-1/3">Header</th>
                      <th className="text-left text-slate-500 font-bold uppercase px-5 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(currentResponse.responseHeaders).map(([k, v]) => (
                      <tr key={k} className="border-b border-slate-800/60 hover:bg-slate-900/50 transition-colors">
                        <td className="px-5 py-3 text-cyan-400 font-bold">{k}</td>
                        <td className="px-5 py-3 text-slate-300 break-all">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-xs text-slate-600 font-mono">No response headers captured.</div>
              )}
            </div>
          )}

          {/* Tab: Request Details */}
          {responseTab === 'request' && (
            <div className="space-y-5">
              {/* Sent URL + Method */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Request URL</span>
                <div className="flex items-center gap-3 bg-slate-950 rounded-xl p-4 border border-slate-800">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${getMethodMeta(currentResponse.method).bg} ${getMethodMeta(currentResponse.method).text} ${getMethodMeta(currentResponse.method).border}`}>
                    {currentResponse.method}
                  </span>
                  <span className="text-xs font-mono text-slate-300 break-all">{currentResponse.url}</span>
                </div>
              </div>

              {/* Sent Headers */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Sent Headers ({Object.keys(currentResponse.sentHeaders).length})
                </span>
                <div className="rounded-2xl border border-slate-800 overflow-hidden">
                  {Object.entries(currentResponse.sentHeaders).length > 0 ? (
                    <table className="w-full text-xs font-mono">
                      <tbody>
                        {Object.entries(currentResponse.sentHeaders).map(([k, v]) => (
                          <tr key={k} className="border-b border-slate-800/60">
                            <td className="px-5 py-2.5 text-cyan-400 font-bold w-1/3">{k}</td>
                            <td className="px-5 py-2.5 text-slate-400 break-all">
                              {['authorization', 'x-api-key'].includes(k.toLowerCase())
                                ? `${v.slice(0, 12)}••••••`
                                : v}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-600">No custom headers sent.</div>
                  )}
                </div>
              </div>

              {/* Sent Body */}
              {currentResponse.sentBody && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Request Body</span>
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-x-auto max-h-[280px]">
                    <pre className="text-xs text-indigo-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {currentResponse.sentBody}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-600 w-fit mx-auto">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-slate-400 font-bold text-sm">No Request Sent Yet</h3>
            <p className="text-slate-600 text-xs mt-1">Configure your endpoint above and click <strong className="text-slate-400">Send Request</strong> to inspect the live response.</p>
          </div>
        </div>
      )}

      {/* ── Request History ───────────────────────────────────────────────── */}
      {showHistory && (
        <div className="glass-card p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">Request Log</span>
              <h3 className="text-lg font-bold text-slate-100 mt-1">History ({history.length})</h3>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-600 font-mono">No requests in history yet.</div>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => {
                const meta = getStatusMeta(entry.statusCode);
                const mMeta = getMethodMeta(entry.method);
                return (
                  <div
                    key={entry.id}
                    onClick={() => { setCurrentResponse(entry); setResponseTab('body'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 cursor-pointer transition-all group"
                  >
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border shrink-0 ${mMeta.bg} ${mMeta.text} ${mMeta.border}`}>
                      {entry.method}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex-1 truncate group-hover:text-slate-200 transition-colors">
                      {entry.url}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border shrink-0 ${meta.bg} ${meta.text} ${meta.border}`}>
                      {entry.statusCode || 'ERR'}
                    </span>
                    <span className="text-xs font-mono text-slate-500 shrink-0 w-16 text-right">
                      {entry.latencyMs}ms
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 shrink-0">{entry.timestamp}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
