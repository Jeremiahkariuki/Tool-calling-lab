import React, { useState } from 'react';
import type { ToolDefinition } from '../utils/openapiParser';
import type { AllProviderConfigs } from '../utils/apiKeys';
import { PREBUILT_TOOLS } from '../utils/sampleData';
import { 
  WORKFLOW_TEMPLATES, 
  loadSavedWorkflows, 
  executeWorkflowDAG 
} from '../utils/workflowRunner';
import type { 
  WorkflowTemplate, 
  WorkflowNode, 
  WorkflowStepResult,
  WorkflowExecutionResult 
} from '../utils/workflowRunner';
import { 
  GitFork, Play, Plus, Trash2, ArrowDown, Sparkles, CheckCircle2, 
  XCircle, Code, FileJson, Download, Zap, ChevronRight, Settings
} from 'lucide-react';

interface AgentWorkflowStudioProps {
  configs: AllProviderConfigs;
  customTools?: ToolDefinition[];
}

export const AgentWorkflowStudio: React.FC<AgentWorkflowStudioProps> = ({ configs, customTools = [] }) => {
  // Combine prebuilt and user custom OpenAPI tools
  const availableTools: ToolDefinition[] = [...(PREBUILT_TOOLS as any[]), ...customTools];

  const [workflows] = useState<WorkflowTemplate[]>(loadSavedWorkflows);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowTemplate>(workflows[0] || WORKFLOW_TEMPLATES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<WorkflowExecutionResult | null>(null);
  const [activeStepResults, setActiveStepResults] = useState<Record<string, WorkflowStepResult>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Editable workflow state
  const [prompt, setPrompt] = useState(activeWorkflow.initialPrompt);

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setActiveWorkflow(template);
    setPrompt(template.initialPrompt);
    setExecutionResult(null);
    setActiveStepResults({});
    setSelectedNodeId(null);
  };

  const handleAddNode = () => {
    const nextIdx = activeWorkflow.nodes.length + 1;
    const newNode: WorkflowNode = {
      id: `step_${Date.now()}`,
      name: `Step ${nextIdx}: Custom Action`,
      toolId: availableTools[0]?.id || 'get_current_weather',
      description: 'Execute custom tool in agent DAG chain.',
      inputMapping: { city: 'San Francisco' }
    };

    const updatedNodes = [...activeWorkflow.nodes, newNode];
    const updatedWorkflow = { ...activeWorkflow, nodes: updatedNodes };
    setActiveWorkflow(updatedWorkflow);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (activeWorkflow.nodes.length <= 1) return;
    const updatedNodes = activeWorkflow.nodes.filter(n => n.id !== nodeId);
    const updatedWorkflow = { ...activeWorkflow, nodes: updatedNodes };
    setActiveWorkflow(updatedWorkflow);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleUpdateNodeTool = (nodeId: string, toolId: string) => {
    const tool = availableTools.find(t => t.id === toolId);
    const updatedNodes = activeWorkflow.nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          toolId,
          name: tool ? `Call ${tool.name}` : node.name
        };
      }
      return node;
    });
    setActiveWorkflow({ ...activeWorkflow, nodes: updatedNodes });
  };

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    setActiveStepResults({});

    const currentWorkflowToRun = {
      ...activeWorkflow,
      initialPrompt: prompt
    };

    const res = await executeWorkflowDAG(
      currentWorkflowToRun,
      availableTools,
      configs,
      (stepRes) => {
        setActiveStepResults(prev => ({
          ...prev,
          [stepRes.nodeId]: stepRes
        }));
      }
    );

    setExecutionResult(res);
    setIsRunning(false);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeWorkflow, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeWorkflow.id}_workflow.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8">
      
      {/* Header Studio Card */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/40">
                <GitFork className="w-5 h-5 text-purple-400" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Multi-Step Agentic Workflow & Tool Chaining Studio
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              Build, chain, and execute multi-tool agentic DAGs. Pass state across sequential tool nodes and inspect live execution payloads.
            </p>
          </div>

          {/* Preset Template Buttons & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Export DAG</span>
            </button>

            <button
              onClick={handleRunWorkflow}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-amber-300 fill-amber-300" />
                  <span>Executing DAG ({activeWorkflow.nodes.length} Steps)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Agent Workflow DAG</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workflow Template Switcher Pills */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Select Workflow Template:
          </label>
          <div className="flex flex-wrap gap-2.5">
            {workflows.map((tmpl) => {
              const isActive = activeWorkflow.id === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/60 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span>{tmpl.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 font-mono">
                    {tmpl.nodes.length} Nodes
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Left Visual Node Flow DAG | Right Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Visual Node Flow Canvas */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Start Node: User Prompt Input */}
          <div className="glass-card p-6 border-indigo-500/40 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                START NODE: Trigger User Prompt
              </span>
              <span className="text-[11px] font-mono text-slate-500">Root Node</span>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="glass-input w-full p-4 text-xs sm:text-sm text-white font-sans leading-relaxed resize-none"
              placeholder="Enter initial prompt or trigger payload..."
            />
          </div>

          {/* Flow Connector Arrow */}
          <div className="flex justify-center my-2">
            <div className="p-2 rounded-full bg-slate-900 border border-slate-700 text-indigo-400 shadow-md animate-bounce">
              <ArrowDown className="w-4 h-4" />
            </div>
          </div>

          {/* Sequential Tool Nodes Canvas */}
          <div className="space-y-6">
            {activeWorkflow.nodes.map((node, index) => {
              const stepRes = activeStepResults[node.id];
              const isSelected = selectedNodeId === node.id;

              return (
                <React.Fragment key={node.id}>
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`glass-card p-6 relative cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-purple-500 shadow-2xl shadow-purple-500/20 ring-1 ring-purple-500'
                        : stepRes?.status === 'success'
                        ? 'border-emerald-500/60 bg-emerald-950/10'
                        : stepRes?.status === 'failed'
                        ? 'border-red-500/60 bg-red-950/10'
                        : stepRes?.status === 'running'
                        ? 'border-amber-500/60 bg-amber-950/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Node Header Bar */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-purple-600/30 text-purple-300 font-mono font-extrabold text-xs flex items-center justify-center border border-purple-500/40">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            {node.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{node.description}</span>
                        </div>
                      </div>

                      {/* Execution Status Badge */}
                      <div className="flex items-center gap-2">
                        {stepRes && (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 ${
                            stepRes.status === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                            stepRes.status === 'failed' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {stepRes.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            {stepRes.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                            {stepRes.status === 'running' && <Zap className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                            {stepRes.status} ({stepRes.latencyMs}ms)
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Delete Node"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tool Selection Dropdown */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Assigned Function / Webhook Target:
                      </label>
                      <select
                        value={node.toolId}
                        onChange={(e) => handleUpdateNodeTool(node.id, e.target.value)}
                        className="glass-input w-full p-3 text-xs sm:text-sm font-mono text-indigo-300 font-bold bg-slate-900 border-slate-700"
                      >
                        {availableTools.map((t) => (
                          <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                            {t.name} ({t.category}) {t.webhookUrl ? '• [Webhook Endpoint]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Input Parameter Mapping Summary */}
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Mapped Inputs: {Object.keys(node.inputMapping).length} keys</span>
                      <span className="text-purple-400 font-bold flex items-center gap-1">
                        Inspect Node Specs <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Flow Connector Arrow between nodes */}
                  {index < activeWorkflow.nodes.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="p-2 rounded-full bg-slate-900 border border-slate-700 text-purple-400 shadow-md">
                        <ArrowDown className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Add New Node Button */}
          <button
            onClick={handleAddNode}
            className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500/60 bg-slate-900/40 hover:bg-purple-950/20 text-slate-300 hover:text-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>Add Step Node to Agent Flow</span>
          </button>

          {/* Flow Connector to End Node */}
          <div className="flex justify-center my-2">
            <div className="p-2 rounded-full bg-slate-900 border border-slate-700 text-emerald-400 shadow-md">
              <ArrowDown className="w-4 h-4" />
            </div>
          </div>

          {/* End Node Card */}
          <div className="glass-card p-6 border-emerald-500/40 bg-emerald-950/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                END NODE: Agent Synthesis Output
              </span>
              <span className="text-[11px] font-mono text-slate-500">Terminal Node</span>
            </div>

            {executionResult ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {executionResult.finalSynthesis}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-4">
                Run the Agent Workflow DAG to generate synthesized multi-turn decision output.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Node Inspector Drawer & Execution Logs */}
        <div className="lg:col-span-5">
          <div className="glass-card p-6 md:p-8 sticky top-28 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" />
                Node Inspector & Live Payloads
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {selectedNodeId ? selectedNodeId : 'Select Node'}
              </span>
            </div>

            {selectedNodeId ? (
              (() => {
                const node = activeWorkflow.nodes.find(n => n.id === selectedNodeId);
                const stepRes = activeStepResults[selectedNodeId];
                if (!node) return null;

                return (
                  <div className="space-y-5">
                    <div>
                      <span className="text-xs font-mono text-purple-400 font-bold block uppercase tracking-wider">
                        Configured Step
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{node.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{node.description}</p>
                    </div>

                    {/* Input Parameters Mapping */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-purple-400" />
                        Input Parameter Mapping
                      </label>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <pre className="text-xs text-indigo-300 font-mono leading-relaxed">
                          {JSON.stringify(node.inputMapping, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Step Execution Output Payload */}
                    {stepRes && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
                          <span>Output Execution Payload</span>
                          <span className="text-emerald-400 font-mono">{stepRes.latencyMs}ms</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[300px] overflow-y-auto">
                          <pre className="text-xs text-emerald-300 font-mono leading-relaxed">
                            {JSON.stringify(stepRes.outputPayload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                <FileJson className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-bold text-slate-400">No Node Selected</p>
                <p className="max-w-xs mx-auto">Click any Step Node in the left canvas to inspect or configure its parameter mappings and execution outputs.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
