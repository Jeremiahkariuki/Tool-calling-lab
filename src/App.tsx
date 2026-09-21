import React, { useState } from 'react';
import { Header } from './components/Header';
import type { TabType } from './components/Header';
import { Simulator } from './components/Simulator';
import { SideBySideCompare } from './components/SideBySideCompare';
import { SchemaConverter } from './components/SchemaConverter';
import { ProtocolGuide } from './components/ProtocolGuide';
import { CodeGenerator } from './components/CodeGenerator';
import { Challenges } from './components/Challenges';
import { LiveApiModal } from './components/LiveApiModal';
import { loadProviderConfigs, saveProviderConfigs } from './utils/apiKeys';
import type { AllProviderConfigs } from './utils/apiKeys';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('simulator');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [providerConfigs, setProviderConfigs] = useState<AllProviderConfigs>(loadProviderConfigs);

  const handleSaveConfigs = (newConfigs: AllProviderConfigs) => {
    setProviderConfigs(newConfigs);
    saveProviderConfigs(newConfigs);
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'simulator' && <Simulator configs={providerConfigs} />}
        {activeTab === 'compare' && <SideBySideCompare configs={providerConfigs} />}
        {activeTab === 'converter' && <SchemaConverter />}
        {activeTab === 'guide' && <ProtocolGuide />}
        {activeTab === 'codegen' && <CodeGenerator />}
        {activeTab === 'challenges' && <Challenges />}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
        <p>Multi-Provider AI Tool Calling Interactive Learning Lab • Built for Developers</p>
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
