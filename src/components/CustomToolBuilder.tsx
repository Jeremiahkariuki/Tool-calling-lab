import React, { useState } from 'react';
import { parseOpenApiSpec } from '../utils/openapiParser';
import type { ToolDefinition } from '../utils/openapiParser';
import { Upload, Plus, Trash2, CheckCircle2, AlertTriangle, FileCode, Wrench, RefreshCw } from 'lucide-react';

interface CustomToolBuilderProps {
  customTools: ToolDefinition[];
  onAddTools: (tools: ToolDefinition[]) => void;
  onDeleteTool: (id: string) => void;
  onClearAll: () => void;
}

export const CustomToolBuilder: React.FC<CustomToolBuilderProps> = ({
  customTools,
  onAddTools,
  onDeleteTool,
  onClearAll
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'importer' | 'builder'>('importer');
  const [specInput, setSpecInput] = useState<string>('');
  const [parsedTools, setParsedTools] = useState<ToolDefinition[]>([]);
  const [selectedParsedIds, setSelectedParsedIds] = useState<string[]>([]);
  const [parseInfo, setParseInfo] = useState<{ title?: string; serverUrl?: string; warnings: string[] }>({ warnings: [] });
  const [parseError, setParseError] = useState<string | null>(null);

  // Manual Form State
  const [formName, setFormName] = useState('search_customer_orders');
  const [formDesc, setFormDesc] = useState('Retrieve customer orders by email address and order status');
  const [formMethod, setFormMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
  const [formWebhook, setFormWebhook] = useState('https://api.myclient.com/v1/orders/search');
  const [formParamsJson, setFormParamsJson] = useState(
    JSON.stringify(
      {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Customer email address' },
          status: { type: 'string', enum: ['pending', 'shipped', 'delivered'] }
        },
        required: ['email']
      },
      null,
      2
    )
  );
  const [formError, setFormError] = useState<string | null>(null);

  const sampleSpecs = [
    {
      name: 'Petstore OpenAPI 3.0',
      json: {
        openapi: '3.0.0',
        info: { title: 'Petstore API', version: '1.0.0' },
        servers: [{ url: 'https://petstore.swagger.io/v2' }],
        paths: {
          '/pets': {
            get: {
              summary: 'List all pets',
              operationId: 'listPets',
              parameters: [
                { name: 'limit', in: 'query', description: 'How many items to return', required: false, schema: { type: 'integer' } }
              ]
            },
            post: {
              summary: 'Create a pet',
              operationId: 'createPets',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        tag: { type: 'string' }
                      },
                      required: ['name']
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      name: 'Weather REST Spec',
      json: {
        openapi: '3.0.0',
        info: { title: 'Weather Service API', version: '2.1.0' },
        servers: [{ url: 'https://api.weatherservice.com/v1' }],
        paths: {
          '/forecast': {
            get: {
              summary: 'Fetch weather forecast for location',
              operationId: 'getForecast',
              parameters: [
                { name: 'city', in: 'query', required: true, schema: { type: 'string' } },
                { name: 'units', in: 'query', schema: { type: 'string', enum: ['celsius', 'fahrenheit'] } }
              ]
            }
          }
        }
      }
    }
  ];

  const handleParseSpec = (content: string) => {
    setParseError(null);
    const res = parseOpenApiSpec(content);
    if (res.success) {
      setParsedTools(res.tools);
      setSelectedParsedIds(res.tools.map(t => t.id));
      setParseInfo({
        title: res.apiTitle,
        serverUrl: res.serverUrl,
        warnings: res.warnings
      });
    } else {
      setParsedTools([]);
      setSelectedParsedIds([]);
      setParseError(res.error || 'Failed to parse spec.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setSpecInput(content);
        handleParseSpec(content);
      };
      reader.readAsText(file);
    }
  };

  const toggleSelectParsedTool = (id: string) => {
    setSelectedParsedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmImport = () => {
    const toAdd = parsedTools.filter(t => selectedParsedIds.includes(t.id));
    if (toAdd.length > 0) {
      onAddTools(toAdd);
      setParsedTools([]);
      setSelectedParsedIds([]);
      setSpecInput('');
    }
  };

  const handleSaveManualTool = () => {
    setFormError(null);
    try {
      const parsedParams = JSON.parse(formParamsJson);
      const cleanName = formName.trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

      if (!cleanName) {
        setFormError('Tool name is required.');
        return;
      }

      const newTool: ToolDefinition = {
        id: `custom_${cleanName}_${Date.now()}`,
        name: cleanName,
        description: formDesc.trim(),
        category: 'custom',
        isCustom: true,
        source: 'manual',
        webhookUrl: formWebhook.trim(),
        httpMethod: formMethod,
        parameters: parsedParams,
        openaiSchema: {
          type: 'function',
          function: {
            name: cleanName,
            description: formDesc.trim(),
            parameters: parsedParams
          }
        },
        anthropicSchema: {
          name: cleanName,
          description: formDesc.trim(),
          input_schema: parsedParams
        },
        mockHandler: (args: any) => ({
          status: 200,
          customToolName: cleanName,
          executedArgs: args,
          timestamp: new Date().toISOString()
        })
      };

      onAddTools([newTool]);
      setFormName('');
      setFormDesc('');
      setFormWebhook('');
    } catch (err: any) {
      setFormError(`JSON Schema Syntax Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Header Panel */}
      <div className="glass-card p-6 md:p-10 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <Wrench className="w-6 h-6" />
              </span>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                Custom Tool Builder & OpenAPI Importer
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Import OpenAPI 3.0 / Swagger REST documentation or visually build custom AI tools for your models. All saved tools seamlessly integrate into the Execution Simulator and Comparison Studio.
            </p>
          </div>

          {/* Sub Tab Switcher */}
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-inner shrink-0 self-start lg:self-auto">
            <button
              onClick={() => setActiveSubTab('importer')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'importer'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>OpenAPI / Swagger Importer</span>
            </button>

            <button
              onClick={() => setActiveSubTab('builder')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'builder'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Custom Tool Builder</span>
            </button>
          </div>
        </div>

        {/* Tab Content: OpenAPI Importer */}
        {activeSubTab === 'importer' && (
          <div className="space-y-8">
            
            {/* Sample Spec Buttons & Drag Drop Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* File Upload Box */}
              <div className="lg:col-span-5 space-y-4">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Upload OpenAPI 3.0 / Swagger (.json)
                </label>

                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 text-center bg-slate-950/60 transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer relative group">
                  <input
                    type="file"
                    accept=".json,.yaml,.yml"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-200 block">Click to upload or drag & drop</span>
                    <span className="text-xs text-slate-500 mt-1 block font-mono">Supports OpenAPI 3.0 JSON / Swagger 2.0</span>
                  </div>
                </div>

                {/* Sample Presets */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400">Load Sample API Specs:</span>
                  <div className="flex flex-wrap gap-2">
                    {sampleSpecs.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const str = JSON.stringify(s.json, null, 2);
                          setSpecInput(str);
                          handleParseSpec(str);
                        }}
                        className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500/60 hover:text-indigo-200 transition-all font-mono cursor-pointer"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Paste JSON Textarea */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Or Paste OpenAPI Specification Content
                  </label>
                  {specInput && (
                    <button
                      onClick={() => handleParseSpec(specInput)}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Parse Content</span>
                    </button>
                  )}
                </div>

                <textarea
                  value={specInput}
                  onChange={(e) => {
                    setSpecInput(e.target.value);
                    if (e.target.value.trim()) handleParseSpec(e.target.value);
                  }}
                  rows={8}
                  placeholder='Paste OpenAPI JSON: { "openapi": "3.0.0", "paths": { ... } }'
                  className="glass-input w-full p-4 text-xs font-mono text-indigo-200 placeholder-slate-600 resize-none leading-relaxed min-h-[180px]"
                />
              </div>
            </div>

            {/* Parse Error Display */}
            {parseError && (
              <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 font-medium flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-red-200 text-sm block">Parser Error</strong>
                  <p className="mt-1 leading-relaxed font-mono">{parseError}</p>
                </div>
              </div>
            )}

            {/* Parsed Tools Preview Table */}
            {parsedTools.length > 0 && (
              <div className="glass-card p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block font-mono">
                      {parseInfo.title} • Server: {parseInfo.serverUrl || 'Local Webhook'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 mt-1">
                      Parsed AI Tools ({selectedParsedIds.length}/{parsedTools.length} selected)
                    </h3>
                  </div>

                  <button
                    onClick={handleConfirmImport}
                    disabled={selectedParsedIds.length === 0}
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import Selected Tools ({selectedParsedIds.length})</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {parsedTools.map((tool) => {
                    const isChecked = selectedParsedIds.includes(tool.id);
                    return (
                      <div
                        key={tool.id}
                        onClick={() => toggleSelectParsedTool(tool.id)}
                        className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-950/40 border-indigo-500/60 text-slate-200'
                            : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer mt-0.5 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-slate-100">{tool.name}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 uppercase">
                                  {tool.httpMethod || 'POST'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{tool.description}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-mono text-slate-500 block truncate max-w-xs">
                              {tool.webhookUrl}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Custom Builder Form */}
        {activeSubTab === 'builder' && (
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">Create Custom AI Tool</h3>
              <p className="text-xs text-slate-400 mt-1">Define tool parameters, description, and target REST webhook endpoint.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Tool Details */}
              <div className="lg:col-span-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Tool Function Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. search_customer_orders"
                    className="glass-input w-full px-4 py-3 text-xs sm:text-sm font-mono text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Function Description (Read by LLM)
                  </label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe what this function does for the AI model..."
                    className="glass-input w-full p-4 text-xs sm:text-sm text-slate-100 resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      HTTP Method
                    </label>
                    <select
                      value={formMethod}
                      onChange={(e) => setFormMethod(e.target.value as any)}
                      className="glass-input w-full px-3 py-3 text-xs text-slate-100 font-mono font-bold"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Webhook Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={formWebhook}
                      onChange={(e) => setFormWebhook(e.target.value)}
                      placeholder="https://api.myclient.com/v1/orders/search"
                      className="glass-input w-full px-4 py-3 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Parameters JSON Schema */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    Parameters JSON Schema (`type: "object"`)
                  </label>
                </div>

                <textarea
                  value={formParamsJson}
                  onChange={(e) => setFormParamsJson(e.target.value)}
                  rows={9}
                  className="w-full bg-slate-950 font-mono text-xs text-indigo-200 border border-slate-800 rounded-2xl p-4 focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed min-h-[220px]"
                />
              </div>
            </div>

            {formError && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 font-mono">
                {formError}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveManualTool}
                className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Custom Tool to Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Saved Custom Tools Management Section */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
              Active Workspace Storage
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-1">
              Custom & Imported Tools ({customTools.length})
            </h3>
          </div>

          {customTools.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Custom Tools</span>
            </button>
          )}
        </div>

        {customTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customTools.map((tool) => (
              <div
                key={tool.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-100">{tool.name}</span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 uppercase">
                      {tool.source || 'custom'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{tool.description}</p>

                  {tool.webhookUrl && (
                    <span className="text-[11px] font-mono text-slate-500 block truncate">
                      {tool.httpMethod || 'POST'} {tool.webhookUrl}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    {Object.keys(tool.parameters.properties || {}).length} params
                  </span>

                  <button
                    onClick={() => onDeleteTool(tool.id)}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-sm">
            No custom or imported OpenAPI tools saved yet. Upload a spec above or create your first tool!
          </div>
        )}
      </div>
    </div>
  );
};
