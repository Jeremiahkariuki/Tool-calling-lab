import React from 'react';
import { Terminal, Cpu, ArrowRightLeft, BookOpen, Code2, Trophy, Key, Scale, Sparkles } from 'lucide-react';

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
    { id: 'simulator', label: 'Simulator', icon: Cpu, badge: 'Live' },
    { id: 'compare', label: 'Compare', icon: Scale },
    { id: 'converter', label: 'Converter', icon: ArrowRightLeft },
    { id: 'guide', label: 'Protocol Specs', icon: BookOpen },
    { id: 'codegen', label: 'Code Gen', icon: Code2 },
    { id: 'challenges', label: 'Challenges', icon: Trophy }
  ];

  return (
    <header className="sticky top-0 z-50 mb-8 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Studio Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-60 blur-sm group-hover:opacity-100 transition-opacity" />
              <div className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-indigo-400">
                <Terminal className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                  Tool Calling Lab
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Studio v2
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 hidden sm:block">
                OpenAI • Anthropic • Gemini • DeepSeek • Ollama
              </p>
            </div>
          </div>

          {/* Nav Tabs Pill Toolbar */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* API Keys Settings Modal Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenKeyModal}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                configuredProvidersCount > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 glow-openai'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {configuredProvidersCount > 0
                  ? `Provider Keys (${configuredProvidersCount})`
                  : 'Configure API Keys'}
              </span>
              <span className={`w-2 h-2 rounded-full ${configuredProvidersCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Scrollbar Bar */}
        <div className="flex md:hidden overflow-x-auto gap-1.5 py-2 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 bg-slate-900/60 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
