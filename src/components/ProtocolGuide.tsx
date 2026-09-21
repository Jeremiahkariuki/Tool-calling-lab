import React from 'react';
import { PROTOCOL_COMPARISON } from '../utils/sampleData';
import { Layers, Code, Sparkles } from 'lucide-react';

export const ProtocolGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      
      {/* Intro Header */}
      <div className="glass-card p-6 md:p-8 space-y-3">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Anthropic vs OpenAI Tool Protocol Deep-Dive
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative specification reference for schema structures, response roles, argument types, and multi-turn tool loops.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Matrix Table */}
      <div className="glass-card p-6 md:p-8 space-y-6 overflow-x-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-indigo-400" />
            Protocol Feature Comparison Matrix
          </h3>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
              <th className="py-3 px-4 w-1/4">Specification Feature</th>
              <th className="py-3 px-4 w-3/8">
                <span className="text-emerald-400 font-mono font-bold">OpenAI Spec</span>
              </th>
              <th className="py-3 px-4 w-3/8">
                <span className="text-amber-400 font-mono font-bold">Anthropic Spec</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {PROTOCOL_COMPARISON.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-4 px-4 font-semibold text-slate-200">
                  {item.feature}
                  <p className="text-[11px] text-slate-400 font-normal mt-1 leading-relaxed">{item.explanation}</p>
                </td>
                <td className="py-4 px-4 font-mono text-emerald-300 bg-slate-950/80 rounded-xl border border-slate-800">
                  {item.openai}
                </td>
                <td className="py-4 px-4 font-mono text-amber-300 bg-slate-950/80 rounded-xl border border-slate-800">
                  {item.anthropic}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deep-Dive Side-by-Side Payload Anatomy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* OpenAI Payload Card */}
        <div className="glass-card p-6 space-y-4 border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-2 uppercase tracking-wider">
              <Code className="w-4 h-4 text-emerald-400" />
              OpenAI Function Calling Spec
            </h3>
            <span className="badge-openai text-[10px] px-2.5 py-0.5 rounded-full font-bold">gpt-4o</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              OpenAI tools are wrapped in a <code className="text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono">tools</code> array with <code className="text-emerald-300 font-mono">type: "function"</code>. Function arguments in model responses are stringified JSON strings.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-200 leading-relaxed overflow-x-auto">
{`// OpenAI Tool Definition
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get current weather",
    "parameters": {
      "type": "object",
      "properties": {
        "location": { "type": "string" }
      },
      "required": ["location"]
    }
  }
}

// Assistant Tool Call Response
{
  "role": "assistant",
  "tool_calls": [
    {
      "id": "call_xyz123",
      "type": "function",
      "function": {
        "name": "get_weather",
        "arguments": "{\\"location\\": \\"Tokyo\\"}" // Stringified JSON
      }
    }
  ]
}

// Tool Result Submission
{
  "role": "tool",
  "tool_call_id": "call_xyz123",
  "content": "{\\"temperature\\": \\"22C\\"}"
}`}
            </div>
          </div>
        </div>

        {/* Anthropic Payload Card */}
        <div className="glass-card p-6 space-y-4 border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-amber-400 font-mono flex items-center gap-2 uppercase tracking-wider">
              <Code className="w-4 h-4 text-amber-400" />
              Anthropic Tool Use Spec
            </h3>
            <span className="badge-anthropic text-[10px] px-2.5 py-0.5 rounded-full font-bold">claude-3-5-sonnet</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              Anthropic tools use top-level <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono">input_schema</code>. The assistant returns structured content blocks of type <code className="text-amber-300 font-mono">tool_use</code> with direct JSON object inputs.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-200 leading-relaxed overflow-x-auto">
{`// Anthropic Tool Definition
{
  "name": "get_weather",
  "description": "Get current weather",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": { "type": "string" }
    },
    "required": ["location"]
  }
}

// Assistant Tool Use Response
{
  "role": "assistant",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_abc987",
      "name": "get_weather",
      "input": { "location": "Tokyo" } // Direct Object
    }
  ]
}

// Tool Result Submission
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_abc987",
      "content": "{\\"temperature\\": \\"22C\\"}",
      "is_error": false
    }
  ]
}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
