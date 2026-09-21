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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] flex flex-col p-6 space-y-5 border-white/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Multi-Provider & API Settings</h3>
              <p className="text-xs text-gray-400">Configure Cloud LLMs & Local Server Endpoints</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-3 shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            API keys and local endpoints are stored <strong>strictly inside your browser (<code className="font-mono">localStorage</code>)</strong> and are directly dispatched to provider endpoints.
          </p>
        </div>

        {/* Category Toggle */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 shrink-0">
          <button
            onClick={() => setActiveSubTab('cloud')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'cloud'
                ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Cloud AI Providers (OpenAI, Anthropic, Gemini, DeepSeek)
          </button>

          <button
            onClick={() => setActiveSubTab('local')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'local'
                ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-4 h-4" />
            Local Models (Ollama / VLLM / LM Studio)
          </button>
        </div>

        {/* Scrollable Provider Settings List */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {activeSubTab === 'cloud' && (
            <>
              {/* OpenAI Card */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-sm font-bold text-white">OpenAI</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection('openai')}
                      disabled={testResults.openai?.testing}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5 transition-all"
                    >
                      {testResults.openai?.testing ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                      ) : (
                        'Test Key'
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-gray-400 font-medium">API Key</label>
                    <input
                      type="password"
                      value={localConfigs.openai.apiKey}
                      onChange={(e) => updateConfig('openai', 'apiKey', e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-medium">Model</label>
                    <select
                      value={localConfigs.openai.model}
                      onChange={(e) => updateConfig('openai', 'model', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="gpt-4-turbo">gpt-4-turbo</option>
                    </select>
                  </div>
                </div>

                {testResults.openai?.message && (
                  <div className={`text-[11px] flex items-center gap-1.5 ${testResults.openai.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testResults.openai.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResults.openai.message}
                  </div>
                )}
              </div>

              {/* Anthropic Card */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-sm font-bold text-white">Anthropic</span>
                  </div>

                  <button
                    onClick={() => handleTestConnection('anthropic')}
                    disabled={testResults.anthropic?.testing}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5 transition-all"
                  >
                    {testResults.anthropic?.testing ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    ) : (
                      'Check Status'
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-gray-400 font-medium">API Key</label>
                    <input
                      type="password"
                      value={localConfigs.anthropic.apiKey}
                      onChange={(e) => updateConfig('anthropic', 'apiKey', e.target.value)}
                      placeholder="sk-ant-api03-..."
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-medium">Model</label>
                    <select
                      value={localConfigs.anthropic.model}
                      onChange={(e) => updateConfig('anthropic', 'model', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet</option>
                      <option value="claude-3-5-haiku-20241022">claude-3-5-haiku</option>
                      <option value="claude-3-haiku-20240307">claude-3-haiku</option>
                    </select>
                  </div>
                </div>

                {testResults.anthropic?.message && (
                  <div className={`text-[11px] flex items-center gap-1.5 ${testResults.anthropic.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testResults.anthropic.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResults.anthropic.message}
                  </div>
                )}
              </div>

              {/* Google Gemini Card */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="text-sm font-bold text-white">Google Gemini</span>
                  </div>

                  <button
                    onClick={() => handleTestConnection('gemini')}
                    disabled={testResults.gemini?.testing}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5 transition-all"
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
                    <label className="text-[11px] text-gray-400 font-medium">API Key</label>
                    <input
                      type="password"
                      value={localConfigs.gemini.apiKey}
                      onChange={(e) => updateConfig('gemini', 'apiKey', e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-medium">Model</label>
                    <select
                      value={localConfigs.gemini.model}
                      onChange={(e) => updateConfig('gemini', 'model', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                  </div>
                </div>

                {testResults.gemini?.message && (
                  <div className={`text-[11px] flex items-center gap-1.5 ${testResults.gemini.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testResults.gemini.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResults.gemini.message}
                  </div>
                )}
              </div>

              {/* DeepSeek Card */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-sm font-bold text-white">DeepSeek</span>
                  </div>

                  <button
                    onClick={() => handleTestConnection('deepseek')}
                    disabled={testResults.deepseek?.testing}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5 transition-all"
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
                    <label className="text-[11px] text-gray-400 font-medium">API Key</label>
                    <input
                      type="password"
                      value={localConfigs.deepseek.apiKey}
                      onChange={(e) => updateConfig('deepseek', 'apiKey', e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-medium">Model</label>
                    <select
                      value={localConfigs.deepseek.model}
                      onChange={(e) => updateConfig('deepseek', 'model', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="deepseek-chat">deepseek-chat</option>
                      <option value="deepseek-reasoner">deepseek-reasoner</option>
                    </select>
                  </div>
                </div>

                {testResults.deepseek?.message && (
                  <div className={`text-[11px] flex items-center gap-1.5 ${testResults.deepseek.success ? 'text-emerald-400' : 'text-red-400'}`}>
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
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="text-sm font-bold text-white">Ollama Local Server</span>
                  </div>

                  <button
                    onClick={() => handleTestConnection('ollama')}
                    disabled={testResults.ollama?.testing}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5 transition-all"
                  >
                    {testResults.ollama?.testing ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    ) : (
                      'Ping Ollama'
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-gray-400 font-medium">Endpoint Base URL</label>
                    <input
                      type="text"
                      value={localConfigs.ollama.endpoint || 'http://localhost:11434'}
                      onChange={(e) => updateConfig('ollama', 'endpoint', e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-medium">Model Name</label>
                    <input
                      type="text"
                      value={localConfigs.ollama.model}
                      onChange={(e) => updateConfig('ollama', 'model', e.target.value)}
                      placeholder="llama3.1"
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {testResults.ollama?.message && (
                  <div className={`text-[11px] flex items-center gap-1.5 ${testResults.ollama.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testResults.ollama.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResults.ollama.message}
                  </div>
                )}
              </div>

              {/* Local OpenAI Compatible (VLLM / LM Studio) */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                    <span className="text-sm font-bold text-white">Custom OpenAI Server (LM Studio / VLLM / LocalAI)</span>
                  </div>

                  <button
                    onClick={() => handleTestConnection('localOpenAI')}
                    disabled={testResults.localOpenAI?.testing}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5 transition-all"
                  >
                    {testResults.localOpenAI?.testing ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    ) : (
                      'Ping Endpoint'
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-gray-400 font-medium">v1 Endpoint URL</label>
                    <input
                      type="text"
                      value={localConfigs.localOpenAI.endpoint || 'http://localhost:1234/v1'}
                      onChange={(e) => updateConfig('localOpenAI', 'endpoint', e.target.value)}
                      placeholder="http://localhost:1234/v1"
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-medium">Model Identifier</label>
                    <input
                      type="text"
                      value={localConfigs.localOpenAI.model}
                      onChange={(e) => updateConfig('localOpenAI', 'model', e.target.value)}
                      placeholder="local-model"
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {testResults.localOpenAI?.message && (
                  <div className={`text-[11px] flex items-center gap-1.5 ${testResults.localOpenAI.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testResults.localOpenAI.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResults.localOpenAI.message}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary text-xs py-2 px-5"
          >
            Save All Provider Settings
          </button>
        </div>
      </div>
    </div>
  );
};
