import React, { useState } from 'react';
import { convertOpenAIToAnthropic, convertAnthropicToOpenAI, safeFormatJson } from '../utils/schemaConverter';
import { PREBUILT_TOOLS } from '../utils/sampleData';
import { ArrowRightLeft, AlertTriangle, Copy, Check, FileCode, RefreshCw, Sparkles } from 'lucide-react';

export const SchemaConverter: React.FC = () => {
  const [direction, setDirection] = useState<'openai-to-anthropic' | 'anthropic-to-openai'>('openai-to-anthropic');
  const [inputJson, setInputJson] = useState<string>(
    JSON.stringify(PREBUILT_TOOLS[0].openaiSchema, null, 2)
  );
  const [outputJson, setOutputJson] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Perform Conversion
  const handleConvert = () => {
    setError(null);
    setWarnings([]);

    if (direction === 'openai-to-anthropic') {
      const res = convertOpenAIToAnthropic(inputJson);
      if (res.success && res.data) {
        setOutputJson(JSON.stringify(res.data, null, 2));
        setWarnings(res.warnings);
      } else {
        setError(res.error || 'Conversion failed.');
      }
    } else {
      const res = convertAnthropicToOpenAI(inputJson);
      if (res.success && res.data) {
        setOutputJson(JSON.stringify(res.data, null, 2));
        setWarnings(res.warnings);
      } else {
        setError(res.error || 'Conversion failed.');
      }
    }
  };

  // Swap Direction & Sync Inputs
  const handleSwapDirection = () => {
    const newDir = direction === 'openai-to-anthropic' ? 'anthropic-to-openai' : 'openai-to-anthropic';
    setDirection(newDir);
    if (outputJson && !error) {
      setInputJson(outputJson);
      setOutputJson('');
    } else {
      const sample = newDir === 'openai-to-anthropic'
        ? PREBUILT_TOOLS[0].openaiSchema
        : PREBUILT_TOOLS[0].anthropicSchema;
      setInputJson(JSON.stringify(sample, null, 2));
      setOutputJson('');
    }
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(outputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = (toolId: string) => {
    const matched = PREBUILT_TOOLS.find(t => t.id === toolId);
    if (matched) {
      const targetObj = direction === 'openai-to-anthropic'
        ? matched.openaiSchema
        : matched.anthropicSchema;
      setInputJson(JSON.stringify(targetObj, null, 2));
      setOutputJson('');
      setError(null);
      setWarnings([]);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Panel */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Bi-Directional Tool Schema Converter
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Instantly map between OpenAI JSON Function Calling specs and Anthropic Tool definitions without writing boilerplate normalization code.
            </p>
          </div>

          {/* Sample Loader */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Samples:</span>
            {PREBUILT_TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => loadSample(t.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300 transition-all font-mono"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Direction Switcher Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
              direction === 'openai-to-anthropic' ? 'badge-openai' : 'badge-anthropic'
            }`}>
              {direction === 'openai-to-anthropic' ? 'Source: OpenAI Function Spec' : 'Source: Anthropic Tool Spec'}
            </span>

            <button
              onClick={handleSwapDirection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Swap Direction</span>
            </button>

            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
              direction === 'openai-to-anthropic' ? 'badge-anthropic' : 'badge-openai'
            }`}>
              {direction === 'openai-to-anthropic' ? 'Target: Anthropic Tool Spec' : 'Target: OpenAI Function Spec'}
            </span>
          </div>

          <button
            onClick={handleConvert}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Convert Schema Now</span>
          </button>
        </div>
      </div>

      {/* Dual Panel Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Panel: Input Editor */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
              <FileCode className="w-4 h-4 text-indigo-400" />
              INPUT ({direction === 'openai-to-anthropic' ? 'OpenAI Spec' : 'Anthropic Spec'})
            </label>

            <button
              onClick={() => setInputJson(safeFormatJson(inputJson))}
              className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono transition-all"
            >
              Prettify JSON
            </button>
          </div>

          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            rows={18}
            className="w-full bg-slate-950 font-mono text-xs text-indigo-200 border border-slate-800 rounded-xl p-4 focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
            placeholder="Paste source JSON schema here..."
          />
        </div>

        {/* Right Panel: Converted Output */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
              <FileCode className="w-4 h-4 text-emerald-400" />
              OUTPUT ({direction === 'openai-to-anthropic' ? 'Anthropic Spec' : 'OpenAI Spec'})
            </label>

            {outputJson && (
              <button
                onClick={handleCopyOutput}
                className="text-xs flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-semibold transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Converted Schema'}</span>
              </button>
            )}
          </div>

          {error ? (
            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                Conversion Error
              </div>
              <p className="text-xs text-red-300 font-mono leading-relaxed">{error}</p>
            </div>
          ) : (
            <div className="relative">
              <textarea
                readOnly
                value={outputJson || 'Click "Convert Schema Now" above to generate converted schema payload.'}
                rows={18}
                className="w-full bg-slate-950 font-mono text-xs text-emerald-200 border border-slate-800 rounded-xl p-4 focus:outline-none transition-all resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Warnings Panel */}
          {warnings.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                Schema Normalization Warnings ({warnings.length})
              </div>
              <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1 font-mono">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
