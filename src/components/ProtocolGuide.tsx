import { PROTOCOL_COMPARISON } from '../utils/sampleData';
import { BookOpen, Layers, Code } from 'lucide-react';

export const ProtocolGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Intro Banner */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Anthropic vs OpenAI Tool Protocol Deep-Dive</h2>
            <p className="text-sm text-gray-400">Comprehensive comparative analysis of schema definitions, response structures, and tool execution turns.</p>
          </div>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="glass-panel p-6 overflow-x-auto">
        <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Protocol Feature Matrix
        </h3>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="py-3 px-4 font-semibold w-1/5">Feature</th>
              <th className="py-3 px-4 font-semibold w-2/5">
                <span className="text-emerald-400 font-mono">OpenAI Function Spec</span>
              </th>
              <th className="py-3 px-4 font-semibold w-2/5">
                <span className="text-amber-400 font-mono">Anthropic Tool Spec</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {PROTOCOL_COMPARISON.map((item, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-4 font-medium text-white">
                  {item.feature}
                  <p className="text-[11px] text-gray-500 font-normal mt-1 leading-snug">{item.explanation}</p>
                </td>
                <td className="py-4 px-4 font-mono text-emerald-200/90 bg-emerald-950/10 rounded-lg">
                  {item.openai}
                </td>
                <td className="py-4 px-4 font-mono text-amber-200/90 bg-amber-950/10 rounded-lg">
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
        <div className="glass-panel p-6 space-y-4 border-emerald-500/20">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-2">
              <Code className="w-4 h-4" />
              OpenAI Function Call Payload Structure
            </h3>
            <span className="badge-openai text-[10px] px-2 py-0.5 rounded">gpt-4o</span>
          </div>

          <div className="space-y-3 text-xs text-gray-300">
            <p className="leading-relaxed">
              OpenAI requires tools to be defined under a <code className="text-emerald-300 bg-emerald-950/50 px-1 py-0.5 rounded">tools</code> array with <code className="text-emerald-300">type: "function"</code>.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-white/10 font-mono text-[11px] text-emerald-200 leading-relaxed overflow-x-auto">
{`// OpenAI Tool Registration
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

// Assistant Response with Tool Call
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

// Client Tool Result Response
{
  "role": "tool",
  "tool_call_id": "call_xyz123",
  "content": "{\\"temperature\\": \\"22C\\"}"
}`}
            </div>
          </div>
        </div>

        {/* Anthropic Payload Card */}
        <div className="glass-panel p-6 space-y-4 border-amber-500/20">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-amber-400 font-mono flex items-center gap-2">
              <Code className="w-4 h-4" />
              Anthropic Tool Use Payload Structure
            </h3>
            <span className="badge-anthropic text-[10px] px-2 py-0.5 rounded">claude-3-5-sonnet</span>
          </div>

          <div className="space-y-3 text-xs text-gray-300">
            <p className="leading-relaxed">
              Anthropic defines tools directly using top-level <code className="text-amber-300 bg-amber-950/50 px-1 py-0.5 rounded">input_schema</code> and returns structured content blocks.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-white/10 font-mono text-[11px] text-amber-200 leading-relaxed overflow-x-auto">
{`// Anthropic Tool Registration
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

// Assistant Response with Tool Use Block
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

// Client Tool Result Response Block
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
