import React, { useState } from 'react';
import { PREBUILT_TOOLS } from '../utils/sampleData';
import { runOpenAISimulation, runAnthropicSimulation } from '../utils/mockRunner';
import { executeLiveToolCalling } from '../utils/liveRunner';
import type { SimulationStep } from '../utils/mockRunner';
import type { AllProviderConfigs } from '../utils/apiKeys';
import { Play, Sparkles, Code, CheckCircle, Layers, RefreshCw, Zap, Copy, Check, ArrowRight } from 'lucide-react';

interface SimulatorProps {
  configs: AllProviderConfigs;
}

export const Simulator: React.FC<SimulatorProps> = ({ configs }) => {
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'ollama'>('openai');
  const [mode, setMode] = useState<'simulation' | 'live'>('simulation');
  const [userQuery, setUserQuery] = useState('What is the weather in Tokyo and stock price of AAPL?');
  const [enabledTools, setEnabledTools] = useState<string[]>(['get_weather', 'get_stock_price', 'search_knowledge_base']);
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
    if (enabledTools.length === PREBUILT_TOOLS.length) {
      setEnabledTools([]);
    } else {
      setEnabledTools(PREBUILT_TOOLS.map(t => t.id));
    }
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

  const handleCopyPayload = () => {
    if (selectedStep?.payload) {
      navigator.clipboard.writeText(JSON.stringify(selectedStep.payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const providersConfig = [
    { id: 'openai', name: 'OpenAI', badge: 'badge-openai', activeBg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' },
    { id: 'anthropic', name: 'Anthropic', badge: 'badge-anthropic', activeBg: 'bg-amber-500/20 border-amber-500/50 text-amber-300' },
    { id: 'gemini', name: 'Gemini', badge: 'badge-gemini', activeBg: 'bg-blue-500/20 border-blue-500/50 text-blue-300' },
    { id: 'deepseek', name: 'DeepSeek', badge: 'badge-deepseek', activeBg: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' },
    { id: 'ollama', name: 'Ollama', badge: 'badge-ollama', activeBg: 'bg-purple-500/20 border-purple-500/50 text-purple-300' }
  ];

  return (
    <div className="space-y-8">
      
      {/* Configuration Studio Panel */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        
        {/* Top Header & Mode Selectors */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Multi-Turn Tool Execution Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Inspect LLM function calling loops, compare multi-provider payload structures, or execute live REST API tool calls.
            </p>
          </div>

          {/* Mode & Provider Switchers */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setMode('simulation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'simulation'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mock Simulation
              </button>
              <button
                onClick={() => setMode('live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'live'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live API Call
              </button>
            </div>
          </div>
        </div>

        {/* Provider Protocol Selector Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Select Provider Protocol</span>
            <span className="text-[11px] font-normal text-slate-500">
              Active Protocol: <strong className="text-indigo-400 uppercase">{provider}</strong>
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {providersConfig.map((p) => {
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id as any)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelected
                      ? `${p.activeBg} font-semibold shadow-lg`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold">{p.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${p.badge}`}>
                    {p.id === 'openai' || p.id === 'deepseek' || p.id === 'ollama' ? 'JSON Spec' : 'Tools API'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt Input & Tools Selection Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* Left Column: User Prompt */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                User Query Prompt
              </label>
              <span className="text-[11px] text-slate-500">
                {userQuery.length} characters
              </span>
            </div>

            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              rows={4}
              placeholder="Ask a question requiring one or more tool executions..."
              className="glass-input w-full p-4 text-sm text-slate-100 placeholder-slate-500 resize-none font-sans leading-relaxed"
            />

            {/* Quick Prompt Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">Quick Presets:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  'What is the weather in Tokyo and stock price of AAPL?',
                  'Fetch NVDA stock quote and search docs for tool specs',
                  'Get weather for Paris in Celsius'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setUserQuery(preset)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300 transition-all text-left truncate max-w-xs"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Registered Functions Checklist */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Registered Tools ({enabledTools.length}/{PREBUILT_TOOLS.length})
              </label>
              <button
                onClick={toggleSelectAll}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                {enabledTools.length === PREBUILT_TOOLS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {PREBUILT_TOOLS.map((tool) => {
                const isChecked = enabledTools.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-slate-200'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <span className="font-mono font-semibold text-slate-200 block">{tool.name}</span>
                        <span className="text-[10px] text-slate-400">{tool.description}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      {tool.category}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={isSimulating || enabledTools.length === 0}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Executing Trace ({mode.toUpperCase()})...</span>
                </>
              ) : (
                <>
                  {mode === 'live' ? <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{mode === 'live' ? `Execute Live REST Call (${provider.toUpperCase()})` : 'Simulate Multi-Turn Loop'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 font-medium flex items-start gap-3 shadow-lg">
          <div className="p-1 rounded-md bg-red-500/20 text-red-400 font-bold shrink-0">✕</div>
          <div>
            <strong className="font-bold text-red-200">Execution Error:</strong> {errorMessage}
          </div>
        </div>
      )}

      {/* Execution Trace Timeline & Payload Inspector */}
      {steps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Trace Steps Timeline */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Execution Trace ({steps.length} Steps)
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        step.stage === 'user_prompt' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        step.stage === 'tool_call' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        step.stage === 'tool_execution' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        step.stage === 'tool_response' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        Step {step.stepIndex} • {step.stage.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{step.timestamp}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100">{step.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Final Synthesized Answer Box */}
            {finalText && (
              <div className="glass-card p-5 border-emerald-500/40 bg-emerald-950/15 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Synthesized Assistant Response
                </div>
                <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-sans">
                  {finalText}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Raw JSON Payload Inspector */}
          <div className="lg:col-span-7">
            {selectedStep ? (
              <div className="glass-card p-6 sticky top-24 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider block">
                      Step {selectedStep.stepIndex} Payload Inspector
                    </span>
                    <h3 className="text-base font-bold text-slate-100">{selectedStep.title}</h3>
                  </div>
                  <button
                    onClick={handleCopyPayload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  {selectedStep.description}
                </p>

                {/* Raw Code Editor / Viewer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-400" />
                      Raw JSON Payload ({provider.toUpperCase()})
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[460px]">
                    <pre className="text-xs text-indigo-200 font-mono leading-relaxed">
                      {JSON.stringify(selectedStep.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center text-slate-500 text-xs">
                Select a step on the left to inspect its raw JSON payload.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
