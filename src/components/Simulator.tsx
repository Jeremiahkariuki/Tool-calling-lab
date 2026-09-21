import React, { useState } from 'react';
import { PREBUILT_TOOLS } from '../utils/sampleData';
import { runOpenAISimulation, runAnthropicSimulation } from '../utils/mockRunner';
import { executeLiveToolCalling } from '../utils/liveRunner';
import type { SimulationStep } from '../utils/mockRunner';
import type { AllProviderConfigs } from '../utils/apiKeys';
import { Play, Sparkles, Code, CheckCircle, Layers, RefreshCw, Zap } from 'lucide-react';

interface SimulatorProps {
  configs: AllProviderConfigs;
}

export const Simulator: React.FC<SimulatorProps> = ({ configs }) => {
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'ollama'>('openai');
  const [mode, setMode] = useState<'simulation' | 'live'>('simulation');
  const [userQuery, setUserQuery] = useState('What is the weather in Tokyo and stock price of AAPL?');
  const [enabledTools, setEnabledTools] = useState<string[]>(['get_weather', 'get_stock_price', 'search_database']);
  const [isSimulating, setIsSimulating] = useState(false);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [finalText, setFinalText] = useState<string>('');
  const [selectedStep, setSelectedStep] = useState<SimulationStep | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const toggleTool = (toolId: string) => {
    setEnabledTools(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const handleRun = async () => {
    setIsSimulating(true);
    setErrorMessage('');
    const activeToolObjs = PREBUILT_TOOLS.filter(t => enabledTools.includes(t.id));

    if (mode === 'live') {
      const config = configs[provider];
      const liveRes = await executeLiveToolCalling(provider, config, userQuery, activeToolObjs);

      if (!liveRes.success) {
        setErrorMessage(liveRes.error || 'Live API call failed');
      }

      const simSteps: SimulationStep[] = liveRes.steps.map(s => ({
        stepIndex: s.stepIndex,
        title: s.title,
        provider: provider as any,
        stage: s.stage,
        description: s.description,
        payload: s.requestPayload || s.responsePayload,
        timestamp: s.timestamp
      }));

      setSteps(simSteps);
      setFinalText(liveRes.finalText);
      setSelectedStep(simSteps[0] || null);
      setIsSimulating(false);
    } else {
      // Mock simulation mode
      setTimeout(() => {
        if (provider === 'openai' || provider === 'deepseek' || provider === 'ollama' || provider === 'gemini') {
          const result = runOpenAISimulation(userQuery, activeToolObjs);
          setSteps(result.steps);
          setFinalText(result.finalText);
          setSelectedStep(result.steps[0] || null);
        } else {
          const result = runAnthropicSimulation(userQuery, activeToolObjs);
          setSteps(result.steps);
          setFinalText(result.finalText);
          setSelectedStep(result.steps[0] || null);
        }
        setIsSimulating(false);
      }, 400);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration Panel */}
      <div className="glass-panel p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Multi-Turn Tool Execution Simulator
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Select an LLM provider protocol, toggle between mock simulation and live API calls, and inspect raw request/response payloads.
            </p>
          </div>

          {/* Provider & Mode Selector Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setMode('simulation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === 'simulation'
                    ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mock Simulation
              </button>
              <button
                onClick={() => setMode('live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === 'live'
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Live API
              </button>
            </div>

            {/* Provider selector */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              {[
                { id: 'openai', name: 'OpenAI', color: 'bg-emerald-400' },
                { id: 'anthropic', name: 'Anthropic', color: 'bg-amber-400' },
                { id: 'gemini', name: 'Gemini', color: 'bg-blue-400' },
                { id: 'deepseek', name: 'DeepSeek', color: 'bg-cyan-400' },
                { id: 'ollama', name: 'Ollama', color: 'bg-purple-400' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    provider === p.id
                      ? 'bg-white/15 text-white font-semibold border border-white/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.color}`} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input & Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          {/* User Prompt Input */}
          <div className="lg:col-span-2 space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
              <span>User Query Prompt</span>
              <span className="text-xs text-gray-500">
                {mode === 'live' ? 'Will execute live REST API call' : 'Simulates incoming prompt'}
              </span>
            </label>
            <div className="relative">
              <textarea
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                rows={3}
                placeholder="Ask something requiring tool execution..."
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-gray-400">Presets:</span>
              {[
                'What is the weather in Tokyo and stock price of AAPL?',
                'Fetch NVDA stock quote and search docs for tool specs',
                'Get weather for Paris in Celsius'
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setUserQuery(preset)}
                  className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5 transition-all truncate max-w-[280px]"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Available Registered Tools Checklist */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
              <span>Registered Tools ({enabledTools.length})</span>
              <span className="text-xs text-gray-500">Active functions</span>
            </label>

            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {PREBUILT_TOOLS.map((tool) => {
                const isChecked = enabledTools.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                        : 'bg-white/5 border-white/5 text-gray-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-gray-600 bg-gray-900 text-indigo-600 focus:ring-0"
                      />
                      <span className="font-mono font-medium">{tool.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      {tool.category}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRun}
              disabled={isSimulating || enabledTools.length === 0}
              className="w-full btn-primary justify-center py-2.5 text-sm mt-2 disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Executing Trace ({mode.toUpperCase()})...
                </>
              ) : (
                <>
                  {mode === 'live' ? <Zap className="w-4 h-4 text-amber-300" /> : <Play className="w-4 h-4 fill-white" />}
                  {mode === 'live' ? `Execute Live Call (${provider.toUpperCase()})` : 'Simulate Multi-Turn Execution'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error message display if any */}
      {errorMessage && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300">
          <strong>Execution Error:</strong> {errorMessage}
        </div>
      )}

      {/* Execution Trace Timeline & Payload Inspector */}
      {steps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Trace Timeline */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Trace Steps Timeline ({provider.toUpperCase()})
            </h3>

            <div className="space-y-3">
              {steps.map((step) => {
                const isSelected = selectedStep?.stepIndex === step.stepIndex;
                return (
                  <div
                    key={step.stepIndex}
                    onClick={() => setSelectedStep(step)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-900/30 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-black/30 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        step.stage === 'user_prompt' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        step.stage === 'tool_call' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        step.stage === 'tool_execution' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        step.stage === 'tool_response' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {step.stage.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-[11px] text-gray-500">{step.timestamp}</span>
                    </div>

                    <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{step.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Final Assistant Response Box */}
            {finalText && (
              <div className="glass-panel p-4 border-emerald-500/30 bg-emerald-950/10">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                  <CheckCircle className="w-4 h-4" />
                  Synthesized Assistant Answer
                </div>
                <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5 font-mono">
                  {finalText}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Raw JSON Payload Inspector */}
          <div className="lg:col-span-7">
            {selectedStep ? (
              <div className="glass-panel p-5 sticky top-24 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-xs font-mono text-indigo-400">Step {selectedStep.stepIndex} Payload</span>
                    <h3 className="text-base font-bold text-white">{selectedStep.title}</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {provider.toUpperCase()} Payload
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                  {selectedStep.description}
                </p>

                {/* Raw Code Viewer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-mono flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-400" />
                      Raw Payload Structure (JSON)
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-white/10 overflow-x-auto max-h-[500px]">
                    <pre className="text-xs text-indigo-200 font-mono leading-relaxed">
                      {JSON.stringify(selectedStep.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-gray-500">
                Select a step on the left to inspect raw payloads.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
