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
  const [enabledTools, setEnabledTools] = useState<string[]>(['get_weather', 'get_stock_price', 'search_database']);
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
    { id: 'openai', name: 'OpenAI', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { id: 'anthropic', name: 'Anthropic', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { id: 'gemini', name: 'Google Gemini', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    { id: 'deepseek', name: 'DeepSeek', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { id: 'ollama', name: 'Ollama (Local)', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Setup */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Side-by-Side Provider Comparison Studio
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Compare tool selection reasoning, JSON argument formatting, and response speed across models simultaneously.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 self-start lg:self-auto">
            <button
              onClick={() => setExecutionMode('simulated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                executionMode === 'simulated'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Simulated Mode
            </button>

            <button
              onClick={() => setExecutionMode('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                executionMode === 'live'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Live API Mode
            </button>
          </div>
        </div>

        {/* Input & Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Prompt input */}
          <div className="lg:col-span-6 space-y-3">
            <label className="text-xs font-semibold text-gray-300">Prompt Query</label>
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              rows={3}
              placeholder="Query requiring tool execution..."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all resize-none font-sans"
            />

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-400">Presets:</span>
              {[
                'What is the current weather in Tokyo in Celsius and AAPL stock price?',
                'Get NVDA quote and search knowledge base for tool specs'
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => setUserQuery(p)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5 transition-all truncate max-w-[280px]"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Target Providers Selector */}
          <div className="lg:col-span-3 space-y-3">
            <label className="text-xs font-semibold text-gray-300">Compare Providers</label>
            <div className="space-y-1.5">
              {providersList.map((p) => {
                const isChecked = selectedProviders.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProvider(p.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                        : 'bg-white/5 border-white/5 text-gray-500 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-gray-600 bg-gray-900 text-indigo-600 focus:ring-0"
                      />
                      <span>{p.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registered Tools */}
          <div className="lg:col-span-3 space-y-3">
            <label className="text-xs font-semibold text-gray-300">Active Tools ({enabledTools.length})</label>
            <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
              {PREBUILT_TOOLS.map((tool) => {
                const isChecked = enabledTools.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                        : 'bg-white/5 border-white/5 text-gray-500 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-gray-600 bg-gray-900 text-indigo-600 focus:ring-0"
                      />
                      <span className="font-mono text-[11px]">{tool.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRunComparison}
              disabled={isRunning || selectedProviders.length === 0}
              className="w-full btn-primary justify-center py-2.5 text-xs mt-2 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-amber-300" />
                  Running Simultaneous Calls...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Run Side-by-Side Comparison
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Grid */}
      {Object.keys(results).length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(Object.keys(results).length, 3)} gap-6`}>
          {selectedProviders.map((providerId) => {
            const res = results[providerId];
            if (!res) return null;
            const pInfo = providersList.find(p => p.id === providerId);

            return (
              <div
                key={providerId}
                className="glass-panel p-5 flex flex-col justify-between space-y-4 border-white/10 hover:border-white/20 transition-all"
              >
                <div className="space-y-4">
                  {/* Provider Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-medium border ${pInfo?.badgeColor || 'bg-white/10 text-white'}`}>
                        {pInfo?.name || providerId}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5 font-mono">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        {res.model}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        res.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {res.success ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {res.success ? 'Success' : 'Error'}
                      </span>

                      <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {res.latencyMs} ms
                      </span>
                    </div>
                  </div>

                  {/* Error state if failed */}
                  {res.error && (
                    <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-red-300 space-y-1">
                      <span className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Execution Failed
                      </span>
                      <p className="text-[11px] opacity-90">{res.error}</p>
                    </div>
                  )}

                  {/* Tool Call Decisions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                      <span>Tool Calls Generated</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        {res.toolCallsCount} tool{res.toolCallsCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {res.toolCalls.length > 0 ? (
                      <div className="space-y-2">
                        {res.toolCalls.map((tc, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-indigo-300">{tc.name}</span>
                              <span className="text-[10px] text-gray-500 font-mono">ID: {tc.id.substring(0, 10)}</span>
                            </div>
                            <pre className="text-[11px] text-emerald-300 bg-slate-950 p-2 rounded border border-white/5 font-mono overflow-x-auto">
                              {JSON.stringify(tc.arguments, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-white/5 rounded-lg text-xs text-gray-400 text-center">
                        No tool calls requested by model.
                      </div>
                    )}
                  </div>

                  {/* Synthesized Output */}
                  {res.finalText && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-300">Synthesized Answer</label>
                      <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs text-gray-200 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-line font-sans">
                        {res.finalText}
                      </div>
                    </div>
                  )}
                </div>

                {/* Raw HTTP Payload Inspector Drawer Toggle */}
                <div className="border-t border-white/10 pt-3">
                  <button
                    onClick={() => togglePayloadExpand(providerId)}
                    className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-white transition-all py-1 font-mono"
                  >
                    <span className="flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-400" />
                      Inspect Raw REST Payloads ({res.steps.length} steps)
                    </span>
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {expandedPayloads[providerId] && (
                    <div className="mt-3 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {res.steps.map((st) => (
                        <div key={st.stepIndex} className="p-2.5 bg-slate-950 rounded-lg border border-white/10 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-indigo-300">{st.title}</span>
                            <span className="text-[10px] text-gray-500">{st.timestamp}</span>
                          </div>
                          <p className="text-[10px] text-gray-400">{st.description}</p>
                          <pre className="text-[10px] text-indigo-200 font-mono p-2 bg-black/60 rounded border border-white/5 overflow-x-auto">
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
