import React from 'react';
import { Terminal, Cpu, ArrowRightLeft, BookOpen, Code2, Trophy, Key, Scale } from 'lucide-react';

export type TabType = 'simulator' | 'compare' | 'converter' | 'guide' | 'codegen' | 'challenges';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenKeyModal: () => void;
  configuredProvidersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenKeyModal,
  configuredProvidersCount
}) => {
  const tabs = [
    { id: 'simulator', label: 'Execution Simulator', icon: Cpu },
    { id: 'compare', label: 'Side-by-Side Compare', icon: Scale },
    { id: 'converter', label: 'Schema Converter', icon: ArrowRightLeft },
    { id: 'guide', label: 'Protocol Deep-Dive', icon: BookOpen },
    { id: 'codegen', label: 'Code Generator', icon: Code2 },
    { id: 'challenges', label: 'Mastery Challenges', icon: Trophy }
  ];

  return (
    <header className="glass-panel border-b border-white/10 sticky top-0 z-50 mb-8 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Tool Calling Lab</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  Multi-Provider Studio
                </span>
              </div>
              <p className="text-xs text-gray-400">OpenAI • Anthropic • Gemini • DeepSeek • Ollama</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-black/30 p-1.5 rounded-xl border border-white/5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* API Key / Provider Settings Modal Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenKeyModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                configuredProvidersCount > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>
                {configuredProvidersCount > 0
                  ? `Provider Keys (${configuredProvidersCount})`
                  : 'Set API Keys'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex lg:hidden overflow-x-auto gap-2 py-2 border-t border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
