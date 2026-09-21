import React, { useState } from 'react';
import { PREBUILT_TOOLS } from '../utils/sampleData';
import { executeLiveToolCalling } from '../utils/liveRunner';
import type { LiveRunResult } from '../utils/liveRunner';
import { runOpenAISimulation, runAnthropicSimulation } from '../utils/mockRunner';
import type { AllProviderConfigs } from '../utils/apiKeys';
import { Play, Sparkles, Code, CheckCircle, AlertTriangle, Clock, Zap, Cpu, Eye } from 'lucide-react';

interface SideBySideCompareProps {
  configs: AllProviderConfigs;
}

export const SideBySideCompare: React.FC<SideBySideCompareProps> = ({ configs }) => {
  const [userQuery, setUserQuery] = useState('What is the current weather in Tokyo in Celsius and AAPL stock price?');
  const [enabledTools, setEnabledTools] = useState<string[]>(['get_weather', 'get_stock_price', 'search_knowledge_base']);
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['openai', 'anthropic', 'gemini']);
  const [executionMode, setExecutionMode] = useState<'simulated' | 'live'>('simulated');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, LiveRunResult>>({});
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({});

  const toggleTool = (toolId: string) => {
    setEnabledTools(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev =>
      prev.includes(providerId) ? prev.filter(p => p !== providerId) : [...prev, providerId]
    );
  };

  const togglePayloadExpand = (providerId: string) => {
    setExpandedPayloads(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const handleRunComparison = async () => {
    if (selectedProviders.length === 0) return;
    setIsRunning(true);
    setResults({});

    const activeTools = PREBUILT_TOOLS.filter(t => enabledTools.includes(t.id));
    const newResults: Record<string, LiveRunResult> = {};

    if (executionMode === 'live') {
      const promises = selectedProviders.map(async (providerKey) => {
        const config = configs[providerKey as keyof AllProviderConfigs];
        const res = await executeLiveToolCalling(
          providerKey as any,
          config,
          userQuery,
          activeTools
        );
        newResults[providerKey] = res;
      });
      await Promise.all(promises);
    } else {
      // Simulated Mode
      await new Promise(resolve => setTimeout(resolve, 600));
      selectedProviders.forEach((providerKey) => {
        if (providerKey === 'openai' || providerKey === 'deepseek' || providerKey === 'localOpenAI') {
          const sim = runOpenAISimulation(userQuery, activeTools);
          newResults[providerKey] = {
            provider: providerKey,
            model: configs[providerKey as keyof AllProviderConfigs]?.model || 'gpt-4o',
            success: true,
            latencyMs: Math.floor(Math.random() * 250) + 320,
            toolCallsCount: sim.steps.filter(s => s.stage === 'tool_execution').length,
            toolCalls: sim.steps
              .filter(s => s.stage === 'tool_execution')
              .map(s => ({
                id: s.payload?.tool_call_id || 'sim_id',
                name: s.payload?.function_name || 'tool',
                arguments: s.payload?.parsed_arguments || {}
              })),
            finalText: sim.finalText,
            steps: sim.steps.map(s => ({
              stepIndex: s.stepIndex,
              title: s.title,
              stage: s.stage,
              description: s.description,
              requestPayload: s.payload,
              responsePayload: s.payload,
              timestamp: s.timestamp
            }))
          };
        } else {
          const sim = runAnthropicSimulation(userQuery, activeTools);
          newResults[providerKey] = {
            provider: providerKey,
            model: configs[providerKey as keyof AllProviderConfigs]?.model || 'claude-3-5-sonnet',
            success: true,
            latencyMs: Math.floor(Math.random() * 200) + 380,
            toolCallsCount: sim.steps.filter(s => s.stage === 'tool_execution').length,
            toolCalls: sim.steps
              .filter(s => s.stage === 'tool_execution')
              .map(s => ({
                id: s.payload?.tool_use_id || 'sim_id',
                name: s.payload?.tool_name || 'tool',
                arguments: s.payload?.input_object || {}
              })),
            finalText: sim.finalText,
            steps: sim.steps.map(s => ({
              stepIndex: s.stepIndex,
              title: s.title,
              stage: s.stage,
              description: s.description,
              requestPayload: s.payload,
              responsePayload: s.payload,
              timestamp: s.timestamp
            }))
          };
        }
      });
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const providersList = [
    { id: 'openai', name: 'OpenAI', badgeColor: 'badge-openai' },
    { id: 'anthropic', name: 'Anthropic', badgeColor: 'badge-anthropic' },
    { id: 'gemini', name: 'Google Gemini', badgeColor: 'badge-gemini' },
    { id: 'deepseek', name: 'DeepSeek', badgeColor: 'badge-deepseek' },
    { id: 'ollama', name: 'Ollama (Local)', badgeColor: 'badge-ollama' }
  ];

  return (
    <div className="space-y-8">
      
      {/* Top Banner Studio Setup */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Side-by-Side Provider Comparison Studio
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Simultaneously benchmark model latency, tool call selection logic, JSON argument schemas, and answer synthesis across OpenAI, Anthropic, Gemini, and DeepSeek.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner self-start lg:self-auto">
            <button
              onClick={() => setExecutionMode('simulated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                executionMode === 'simulated'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simulated Benchmark
            </button>

            <button
              onClick={() => setExecutionMode('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                executionMode === 'live'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Multi-Call
            </button>
          </div>
        </div>

        {/* Configuration Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Prompt Input */}
          <div className="lg:col-span-6 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Query Prompt
            </label>
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              rows={3}
              placeholder="Query requiring tool execution..."
              className="glass-input w-full p-3.5 text-xs text-slate-100 placeholder-slate-500 resize-none font-sans leading-relaxed"
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Presets:</span>
              {[
                'What is the current weather in Tokyo in Celsius and AAPL stock price?',
                'Get NVDA quote and search knowledge base for tool specs'
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => setUserQuery(p)}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300 transition-all truncate max-w-[280px]"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Target Providers Checkboxes */}
          <div className="lg:col-span-3 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Providers ({selectedProviders.length})
            </label>
            <div className="space-y-1.5">
              {providersList.map((p) => {
                const isChecked = selectedProviders.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProvider(p.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-slate-200'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-200">{p.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registered Active Tools */}
          <div className="lg:col-span-3 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Active Tools ({enabledTools.length})
            </label>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
              {PREBUILT_TOOLS.map((tool) => {
                const isChecked = enabledTools.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-slate-200'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span className="font-mono text-[11px] font-semibold">{tool.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRunComparison}
              disabled={isRunning || selectedProviders.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              {isRunning ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Running Parallel Benchmark...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Side-by-Side Comparison</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Provider Output Matrix */}
      {Object.keys(results).length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(selectedProviders.length, 3)} gap-6`}>
          {selectedProviders.map((providerId) => {
            const res = results[providerId];
            if (!res) return null;
            const pInfo = providersList.find(p => p.id === providerId);

            return (
              <div
                key={providerId}
                className="glass-card p-6 flex flex-col justify-between space-y-5 border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="space-y-4">
                  
                  {/* Provider Header Card */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                    <div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${pInfo?.badgeColor || 'bg-slate-800 text-slate-200'}`}>
                        {pInfo?.name || providerId}
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 mt-2 flex items-center gap-1.5 font-mono">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        {res.model}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        res.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {res.success ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-red-400" />}
                        {res.success ? 'Success' : 'Error'}
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono font-semibold">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {res.latencyMs} ms
                      </span>
                    </div>
                  </div>

                  {/* Error State */}
                  {res.error && (
                    <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 space-y-1">
                      <strong className="font-bold flex items-center gap-1 text-red-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Provider Error
                      </strong>
                      <p className="text-[11px] text-red-300">{res.error}</p>
                    </div>
                  )}

                  {/* Generated Tool Calls */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                      <span>Tool Calls Requested</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                        {res.toolCallsCount} function{res.toolCallsCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {res.toolCalls.length > 0 ? (
                      <div className="space-y-2">
                        {res.toolCalls.map((tc, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-indigo-300">{tc.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">ID: {tc.id.substring(0, 10)}</span>
                            </div>
                            <pre className="text-[11px] text-emerald-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono overflow-x-auto">
                              {JSON.stringify(tc.arguments, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 text-center">
                        No tools invoked by model.
                      </div>
                    )}
                  </div>

                  {/* Synthesized Output */}
                  {res.finalText && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Synthesized Answer</label>
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-line font-sans">
                        {res.finalText}
                      </div>
                    </div>
                  )}
                </div>

                {/* Inspect Raw REST Payloads */}
                <div className="border-t border-slate-800 pt-3">
                  <button
                    onClick={() => togglePayloadExpand(providerId)}
                    className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-all py-1 font-mono"
                  >
                    <span className="flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-400" />
                      Inspect Raw Payload Trace ({res.steps.length} steps)
                    </span>
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {expandedPayloads[providerId] && (
                    <div className="mt-3 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {res.steps.map((st) => (
                        <div key={st.stepIndex} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-indigo-300">{st.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{st.timestamp}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{st.description}</p>
                          <pre className="text-[10px] text-indigo-200 font-mono p-2.5 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
                            {JSON.stringify(st.requestPayload || st.responsePayload, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
