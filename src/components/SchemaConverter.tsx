import React, { useState } from 'react';
import { convertOpenAIToAnthropic, convertAnthropicToOpenAI, safeFormatJson } from '../utils/schemaConverter';
import { PREBUILT_TOOLS } from '../utils/sampleData';
import { ArrowRightLeft, AlertTriangle, Copy, Check, FileCode, RefreshCw } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
              Bi-Directional Tool Schema Converter
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Instantly map between OpenAI `{`{ type: "function", function: ... }`}` and Anthropic `{`{ name, description, input_schema }`}` tool specifications.
            </p>
          </div>

          {/* Load Prebuilt Samples */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Load Tool Sample:</span>
            {PREBUILT_TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => loadSample(t.id)}
                className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Direction Switcher Banner */}
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              direction === 'openai-to-anthropic' ? 'badge-openai' : 'badge-anthropic'
            }`}>
              {direction === 'openai-to-anthropic' ? 'Source: OpenAI Function Spec' : 'Source: Anthropic Tool Spec'}
            </span>

            <button
              onClick={handleSwapDirection}
              className="btn-secondary text-xs py-1 px-3 flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Swap Direction
            </button>

            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              direction === 'openai-to-anthropic' ? 'badge-anthropic' : 'badge-openai'
            }`}>
              {direction === 'openai-to-anthropic' ? 'Target: Anthropic Tool Spec' : 'Target: OpenAI Function Spec'}
            </span>
          </div>

          <button
            onClick={handleConvert}
            className="btn-primary text-xs py-2 px-4"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Convert Schema
          </button>
        </div>
      </div>

      {/* Converter Dual Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Input Schema Editor */}
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-2 font-mono">
              <FileCode className="w-4 h-4 text-indigo-400" />
              INPUT ({direction === 'openai-to-anthropic' ? 'OpenAI' : 'Anthropic'})
            </label>

            <button
              onClick={() => setInputJson(safeFormatJson(inputJson))}
              className="text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded bg-white/5 border border-white/5"
            >
              Prettify JSON
            </button>
          </div>

          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            rows={18}
            className="w-full bg-slate-950 font-mono text-xs text-indigo-200 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
            placeholder="Paste source JSON schema here..."
          />
        </div>

        {/* Right Panel: Output Schema Panel */}
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-2 font-mono">
              <FileCode className="w-4 h-4 text-emerald-400" />
              OUTPUT ({direction === 'openai-to-anthropic' ? 'Anthropic' : 'OpenAI'})
            </label>

            {outputJson && (
              <button
                onClick={handleCopyOutput}
                className="text-[11px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Result'}
              </button>
            )}
          </div>

          {error ? (
            <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4" />
                Conversion Error
              </div>
              <p className="text-xs text-red-300 font-mono">{error}</p>
            </div>
          ) : (
            <div className="relative">
              <textarea
                readOnly
                value={outputJson || 'Click "Convert Schema" above or edit input to generate converted schema.'}
                rows={18}
                className="w-full bg-slate-950 font-mono text-xs text-emerald-200 border border-white/10 rounded-xl p-4 focus:outline-none transition-all resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Warnings List */}
          {warnings.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                Schema Normalization Warnings ({warnings.length})
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-200/80 space-y-1">
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
