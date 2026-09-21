import React, { useState } from 'react';
import { Header } from './components/Header';
import type { TabType } from './components/Header';
import { Simulator } from './components/Simulator';
import { SideBySideCompare } from './components/SideBySideCompare';
import { SchemaConverter } from './components/SchemaConverter';
import { ProtocolGuide } from './components/ProtocolGuide';
import { CodeGenerator } from './components/CodeGenerator';
import { Challenges } from './components/Challenges';
import { CustomToolBuilder } from './components/CustomToolBuilder';
import { LiveApiModal } from './components/LiveApiModal';
import { loadProviderConfigs, saveProviderConfigs } from './utils/apiKeys';
import { loadCustomTools, saveCustomTools } from './utils/customTools';
import type { AllProviderConfigs } from './utils/apiKeys';
import type { ToolDefinition } from './utils/openapiParser';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('simulator');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [providerConfigs, setProviderConfigs] = useState<AllProviderConfigs>(loadProviderConfigs);
  const [customTools, setCustomTools] = useState<ToolDefinition[]>(loadCustomTools);

  const handleSaveConfigs = (newConfigs: AllProviderConfigs) => {
    setProviderConfigs(newConfigs);
    saveProviderConfigs(newConfigs);
  };

  const handleAddCustomTools = (newTools: ToolDefinition[]) => {
    const updated = [...customTools, ...newTools];
    setCustomTools(updated);
    saveCustomTools(updated);
  };

  const handleDeleteCustomTool = (id: string) => {
    const updated = customTools.filter(t => t.id !== id);
    setCustomTools(updated);
    saveCustomTools(updated);
  };

  const handleClearAllCustomTools = () => {
    setCustomTools([]);
    saveCustomTools([]);
  };

  const configuredCount = [
    providerConfigs.openai.apiKey,
    providerConfigs.anthropic.apiKey,
    providerConfigs.gemini.apiKey,
    providerConfigs.deepseek.apiKey,
    providerConfigs.ollama.endpoint,
    providerConfigs.localOpenAI.endpoint
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen pb-16">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        configuredProvidersCount={configuredCount}
      />

      {/* Main Container */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'simulator' && <Simulator configs={providerConfigs} customTools={customTools} />}
        {activeTab === 'compare' && <SideBySideCompare configs={providerConfigs} customTools={customTools} />}
        {activeTab === 'builder' && (
          <CustomToolBuilder
            customTools={customTools}
            onAddTools={handleAddCustomTools}
            onDeleteTool={handleDeleteCustomTool}
            onClearAll={handleClearAllCustomTools}
          />
        )}
        {activeTab === 'converter' && <SchemaConverter customTools={customTools} />}
        {activeTab === 'guide' && <ProtocolGuide />}
        {activeTab === 'codegen' && <CodeGenerator customTools={customTools} />}
        {activeTab === 'challenges' && <Challenges />}
      </main>

      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 font-medium">
        <p>Multi-Provider AI Tool Calling Interactive Learning Lab • OpenAPI 3.0 & Custom Tool Builder Studio</p>
      </footer>

      {/* Multi-Provider API Key Settings Modal */}
      <LiveApiModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        configs={providerConfigs}
        onSaveConfigs={handleSaveConfigs}
      />
    </div>
  );
};

export default App;
