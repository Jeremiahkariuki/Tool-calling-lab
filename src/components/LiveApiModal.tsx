import React, { useState } from 'react';
import { X, Key, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Cpu, Server } from 'lucide-react';
import { testProviderConnection } from '../utils/apiKeys';
import type { AllProviderConfigs } from '../utils/apiKeys';

interface LiveApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  configs: AllProviderConfigs;
  onSaveConfigs: (newConfigs: AllProviderConfigs) => void;
}

export const LiveApiModal: React.FC<LiveApiModalProps> = ({
  isOpen,
  onClose,
  configs,
  onSaveConfigs
}) => {
  const [localConfigs, setLocalConfigs] = useState<AllProviderConfigs>(configs);
  const [testResults, setTestResults] = useState<Record<string, { testing?: boolean; success?: boolean; message?: string }>>({});
  const [activeSubTab, setActiveSubTab] = useState<'cloud' | 'local'>('cloud');

  if (!isOpen) return null;

  const updateConfig = (
    provider: keyof AllProviderConfigs,
    field: string,
    value: any
  ) => {
    setLocalConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleTestConnection = async (provider: keyof AllProviderConfigs) => {
    setTestResults(prev => ({
      ...prev,
      [provider]: { testing: true }
    }));
    const res = await testProviderConnection(provider, localConfigs[provider]);
    setTestResults(prev => ({
      ...prev,
      [provider]: { testing: false, success: res.success, message: res.message }
    }));
  };

  const handleSave = () => {
    onSaveConfigs(localConfigs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col p-6 md:p-8 space-y-6 border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Key className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">Multi-Provider & API Key Settings</h3>
              <p className="text-xs text-slate-400">Configure Cloud LLMs & Local Endpoint Server Connections</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3 shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            API keys and local endpoints are stored <strong>strictly in your local browser storage (<code className="font-mono text-emerald-300">localStorage</code>)</strong> and are directly dispatched to LLM REST endpoints.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 shrink-0">
          <button
            onClick={() => setActiveSubTab('cloud')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'cloud'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Cloud AI Providers (OpenAI, Anthropic, Gemini, DeepSeek)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('local')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'local'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Local Models (JkAi / VLLM / LM Studio)</span>
          </button>
        </div>

        {/* Scrollable Provider Config List */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {activeSubTab === 'cloud' && (
            <>
              {/* OpenAI Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-sm font-bold text-slate-100">OpenAI</span>
                  </div>

                  <button
                    onClick={() => handleTestConnection('openai')}
                    disabled={testResults.openai?.testing}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {testResults.openai?.testing ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    ) : (
                      'Test Key'
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">API Key</label>
                    <input
                      type="password"
                      value={localConfigs.openai.apiKey}
                      onChange={(e) => updateConfig('openai', 'apiKey', e.target.value)}
                      placeholder="sk-proj-..."
                      className="glass-input w-full px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Model</label>
                    <select
                      value={localConfigs.openai.model}
                      onChange={(e) => updateConfig('openai', 'model', e.target.value)}
                      className="glass-input w-full px-3 py-2 text-xs text-slate-100 font-mono"
                    >
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="gpt-4-turbo">gpt-4-turbo</option>
                    </select>
                  </div>
                </div>

                {testResults.openai?.message && (
                  <div className={`text-xs flex items-center gap-1.5 font-semibold ${testResults.openai.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testResults.openai.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResults.openai.message}
                  </div>
                )}
              </div>

              {/* Anthropic Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-sm font-bold text-slate-100">Anthropic</span>
                  </div>

                  <button
                    onClick={() => handleTestConnection('anthropic')}
                    disabled={testResults.anthropic?.testing}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {testResults.anthropic?.testing ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    ) : (
                      'Test Key'
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">API Key</label>
                    <input
                      type="password"
                      value={localConfigs.anthropic.apiKey}
                      onChange={(e) => updateConfig('anthropic', 'apiKey', e.target.value)}
                      placeholder="sk-ant-api03-..."
                      className="glass-input w-full px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Model</label>
                    <select
                      value={localConfigs.anthropic.model}
                      onChange={(e) => updateConfig('anthropic', 'model', e.target.value)}
                      className="glass-input w-full px-3 py-2 text-xs text-slate-100 font-mono"
                    >
                      <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet</option>
                      <option value="claude-3-5-haiku-20241022">claude-3-5-haiku</option>
                      <option value="claude-3-haiku-20240307">claude-3-haiku</option>
                    </select>
                  </div>
                </div>

                {testResults.anthropic?.message && (
                  <div className={`text-xs flex items-center gap-1.5 font-semibold ${testResults.anthropic.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testResults.anthropic.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResults.anthropic.message}
                  </div>
                )}
              </div>

              {/* Google Gemini Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="text-sm font-bold text-slate-100">Google Gemini</span>
                  </div>

                  <button
                    onClick={() => handleTestConnection('gemini')}
                    disabled={testResults.gemini?.testing}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {testResults.gemini?.testing ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    ) : (
                      'Test Key'
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">API Key</label>
                    <input
                      type="password"
                      value={localConfigs.gemini.apiKey}
                      onChange={(e) => updateConfig('gemini', 'apiKey', e.target.value)}
                      placeholder="AIzaSy..."
                      className="glass-input w-full px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Model</label>
                    <select
                      value={localConfigs.gemini.model}
                      onChange={(e) => updateConfig('gemini', 'model', e.target.value)}
                      className="glass-input w-full px-3 py-2 text-xs text-slate-100 font-mono"
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                  </div>
                </div>

                {testResults.gemini?.message && (
                  <div className={`text-xs flex items-center gap-1.5 font-semibold ${testResults.gemini.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testResults.gemini.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResults.gemini.message}
                  </div>
                )}
              </div>

              {/* DeepSeek Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-sm font-bold text-slate-100">DeepSeek</span>
                  </div>

                  <button
                    onClick={() => handleTestConnection('deepseek')}
                    disabled={testResults.deepseek?.testing}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {testResults.deepseek?.testing ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    ) : (
                      'Test Key'
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">API Key</label>
                    <input
                      type="password"
                      value={localConfigs.deepseek.apiKey}
                      onChange={(e) => updateConfig('deepseek', 'apiKey', e.target.value)}
                      placeholder="sk-..."
                      className="glass-input w-full px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Model</label>
                    <select
                      value={localConfigs.deepseek.model}
                      onChange={(e) => updateConfig('deepseek', 'model', e.target.value)}
                      className="glass-input w-full px-3 py-2 text-xs text-slate-100 font-mono"
                    >
                      <option value="deepseek-chat">deepseek-chat</option>
                      <option value="deepseek-reasoner">deepseek-reasoner</option>
                    </select>
                  </div>
                </div>

                {testResults.deepseek?.message && (
                  <div className={`text-xs flex items-center gap-1.5 font-semibold ${testResults.deepseek.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testResults.deepseek.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResults.deepseek.message}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSubTab === 'local' && (
            <>
              {/* Ollama Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="text-sm font-bold text-slate-100">JkAi Local Server</span>
                  </div>

                  <button
                    onClick={() => handleTestConnection('ollama')}
                    disabled={testResults.ollama?.testing}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {testResults.ollama?.testing ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    ) : (
                      'Ping Server'
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Endpoint Base URL</label>
                    <input
                      type="text"
                      value={localConfigs.ollama.endpoint || 'http://localhost:11434'}
                      onChange={(e) => updateConfig('ollama', 'endpoint', e.target.value)}
                      placeholder="http://localhost:11434"
                      className="glass-input w-full px-3 py-2 text-xs text-slate-100 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Model Name</label>
                    <input
                      type="text"
                      value={localConfigs.ollama.model}
                      onChange={(e) => updateConfig('ollama', 'model', e.target.value)}
                      placeholder="llama3.1"
                      className="glass-input w-full px-3 py-2 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>

                {testResults.ollama?.message && (
                  <div className={`text-xs flex items-center gap-1.5 font-semibold ${testResults.ollama.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testResults.ollama.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResults.ollama.message}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            Save All Provider Settings
          </button>
        </div>
      </div>
    </div>
  );
};
