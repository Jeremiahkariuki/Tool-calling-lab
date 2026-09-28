import React, { useState } from 'react';
import { PREBUILT_TOOLS } from '../utils/sampleData';
import { runOpenAISimulation, runAnthropicSimulation } from '../utils/mockRunner';
import { executeLiveToolCalling } from '../utils/liveRunner';
import type { SimulationStep } from '../utils/mockRunner';
import type { AllProviderConfigs } from '../utils/apiKeys';
import type { ToolDefinition } from '../utils/openapiParser';
import { Play, Sparkles, Code, CheckCircle, Layers, RefreshCw, Zap, Copy, Check, ArrowRight, CheckSquare, Square } from 'lucide-react';

interface SimulatorProps {
  configs: AllProviderConfigs;
  customTools?: ToolDefinition[];
}

export const Simulator: React.FC<SimulatorProps> = ({ configs, customTools = [] }) => {
  const allAvailableTools: ToolDefinition[] = [...(PREBUILT_TOOLS as any[]), ...customTools];

  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'ollama'>('openai');
  const [mode, setMode] = useState<'simulation' | 'live'>('simulation');
  const [userQuery, setUserQuery] = useState('What is the weather in Tokyo and stock price of AAPL?');
  const [enabledTools, setEnabledTools] = useState<string[]>(allAvailableTools.map(t => t.id));
  const [isSimulating, setIsSimulating] = useState(false);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [finalText, setFinalText] = useState<string>('');
  const [selectedStep, setSelectedStep] = useState<SimulationStep | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const toggleTool = (toolId: string) => {
    setEnabledTools(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const toggleSelectAll = () => {
    if (enabledTools.length === allAvailableTools.length) {
      setEnabledTools([]);
    } else {
      setEnabledTools(allAvailableTools.map(t => t.id));
    }
  };

  const handleRun = async () => {
    setIsSimulating(true);
    setErrorMessage('');
    const activeToolObjs = allAvailableTools.filter(t => enabledTools.includes(t.id));

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

  const handleCopyPayload = () => {
    if (selectedStep?.payload) {
      navigator.clipboard.writeText(JSON.stringify(selectedStep.payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const providersConfig = [
    { id: 'openai', name: 'OpenAI', badge: 'badge-openai', specLabel: 'JSON Function Spec', activeBg: 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 glow-openai' },
    { id: 'anthropic', name: 'Anthropic', badge: 'badge-anthropic', specLabel: 'Tools API Spec', activeBg: 'bg-amber-500/15 border-amber-500/60 text-amber-300 glow-anthropic' },
    { id: 'gemini', name: 'Google Gemini', badge: 'badge-gemini', specLabel: 'Function Call API', activeBg: 'bg-blue-500/15 border-blue-500/60 text-blue-300 glow-gemini' },
    { id: 'deepseek', name: 'DeepSeek', badge: 'badge-deepseek', specLabel: 'OpenAI Schema', activeBg: 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300 glow-deepseek' },
    { id: 'ollama', name: 'JkAi (Local)', badge: 'badge-ollama', specLabel: 'Native Tools', activeBg: 'bg-purple-500/15 border-purple-500/60 text-purple-300 glow-ollama' }
  ];

  return (
    <div className="space-y-8">
      
      {/* Top Configuration Panel */}
      <div className="glass-card p-6 md:p-8 space-y-8">
        
        {/* Header & Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Multi-Turn Tool Execution Simulator
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              Inspect LLM tool calling loops, test payload structures across providers, or execute live REST API tool calls.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner shrink-0 self-start lg:self-auto">
            <button
              onClick={() => setMode('simulation')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                mode === 'simulation'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 border border-indigo-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mock Simulation
            </button>
            <button
              onClick={() => setMode('live')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                mode === 'live'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/35 border border-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live API Call
            </button>
          </div>
        </div>

        {/* Provider Protocol Selector Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              Select Provider Protocol
            </label>
            <span className="text-xs font-semibold text-slate-400">
              Active: <strong className="text-indigo-400 uppercase font-bold">{provider}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {providersConfig.map((p) => {
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id as any)}
                  className={`flex flex-col justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer min-h-[95px] ${
                    isSelected
                      ? `${p.activeBg} font-bold shadow-xl border-indigo-500`
                      : 'bg-slate-900/80 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="text-sm font-bold text-white block">{p.name}</span>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${p.badge}`}>
                      {p.specLabel}
                    </span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Prompt Input & Tool Checklist Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* Left Column: Prompt Input */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                User Query Prompt
              </label>
              <span className="text-xs text-slate-500 font-mono">
                {userQuery.length} chars
              </span>
            </div>

            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              rows={4}
              placeholder="Ask a question requiring one or more tool executions..."
              className="glass-input w-full p-4 text-sm text-white placeholder-slate-500 resize-none font-sans leading-relaxed min-h-[130px]"
            />

            {/* Quick Prompt Presets */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-400">Quick Presets:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  'What is the weather in Tokyo and stock price of AAPL?',
                  'Fetch NVDA stock quote and search docs for tool specs',
                  'Get weather for Paris in Celsius'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setUserQuery(preset)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:border-indigo-500/60 hover:text-indigo-200 transition-all cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Registered Functions */}
          <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Registered Tools ({enabledTools.length}/{allAvailableTools.length})
                </label>
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                >
                  {enabledTools.length === allAvailableTools.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {allAvailableTools.map((tool) => {
                  const isChecked = enabledTools.includes(tool.id);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`p-3 sm:p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-950/40 border-indigo-500/60 text-slate-200 shadow-md'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-xs sm:text-sm text-slate-100 block truncate">{tool.name}</span>
                            <span className="text-[11px] text-slate-400 block truncate mt-0.5">{tool.description}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${
                          tool.isCustom
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700'
                        }`}>
                          {tool.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={isSimulating || enabledTools.length === 0}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer mt-2"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Executing Trace ({mode.toUpperCase()})...</span>
                </>
              ) : (
                <>
                  {mode === 'live' ? <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{mode === 'live' ? `Execute Live Call (${provider.toUpperCase()})` : 'Simulate Multi-Turn Loop'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 font-medium flex items-start gap-3 shadow-lg">
          <div className="p-1 rounded-xl bg-red-500/20 text-red-400 font-bold shrink-0">✕</div>
          <div>
            <strong className="font-bold text-red-200 text-sm block">Execution Error</strong>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Execution Trace Timeline & Payload Inspector */}
      {steps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Trace Steps Timeline */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Execution Trace ({steps.length} Steps)
              </h3>
              <span className="text-xs font-mono text-slate-400 font-semibold">
                Protocol: {provider.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3">
              {steps.map((step) => {
                const isSelected = selectedStep?.stepIndex === step.stepIndex;
                return (
                  <div
                    key={step.stepIndex}
                    onClick={() => setSelectedStep(step)}
                    className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 shadow-xl shadow-indigo-500/15'
                        : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        step.stage === 'user_prompt' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                        step.stage === 'tool_call' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        step.stage === 'tool_execution' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                        step.stage === 'tool_response' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        Step {step.stepIndex} • {step.stage.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{step.timestamp}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 mt-1">{step.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Final Synthesized Answer Box */}
            {finalText && (
              <div className="glass-card p-5 border-emerald-500/40 bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Synthesized Assistant Response
                </div>
                <div className="text-sm text-slate-200 whitespace-pre-line leading-relaxed bg-slate-950/90 p-4 rounded-xl border border-slate-800 font-sans">
                  {finalText}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Raw JSON Payload Inspector */}
          <div className="lg:col-span-7">
            {selectedStep ? (
              <div className="glass-card p-6 md:p-8 sticky top-28 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider block font-semibold">
                      Step {selectedStep.stepIndex} Payload Inspector
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">{selectedStep.title}</h3>
                  </div>
                  <button
                    onClick={handleCopyPayload}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  {selectedStep.description}
                </p>

                {/* Raw Code Editor / Viewer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-2 font-semibold">
                      <Code className="w-4 h-4 text-indigo-400" />
                      Raw JSON Payload ({provider.toUpperCase()})
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto max-h-[480px]">
                    <pre className="text-xs text-indigo-200 font-mono leading-relaxed">
                      {JSON.stringify(selectedStep.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center text-slate-500 text-sm">
                Select a step on the left to inspect its raw JSON payload.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
