import React from 'react';
import { Terminal, Cpu, ArrowRightLeft, BookOpen, Code2, Trophy, Key, Scale, Sparkles, Wrench } from 'lucide-react';

export type TabType = 'simulator' | 'compare' | 'converter' | 'builder' | 'guide' | 'codegen' | 'challenges';

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
    { id: 'builder', label: 'Tool Builder', icon: Wrench, badge: 'OpenAPI' },
    { id: 'converter', label: 'Converter', icon: ArrowRightLeft },
    { id: 'guide', label: 'Protocol Specs', icon: BookOpen },
    { id: 'codegen', label: 'Code Gen', icon: Code2 },
    { id: 'challenges', label: 'Challenges', icon: Trophy }
  ];

  return (
    <header className="sticky top-0 z-50 mb-10 bg-slate-900/85 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          
          {/* Logo & Studio Branding */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-60 blur-md group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-indigo-400">
                <Terminal className="w-6 h-6" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  Tool Calling Lab
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Studio v2
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 hidden xl:block mt-0.5">
                OpenAI • Anthropic • Gemini • DeepSeek • Ollama
              </p>
            </div>
          </div>

          {/* Nav Tabs Toolbar */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/80 p-2 rounded-2xl border border-slate-800/90 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/35 border border-indigo-400/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* API Keys Settings Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenKeyModal}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-md cursor-pointer ${
                configuredProvidersCount > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/20 glow-openai'
                  : 'bg-slate-800/70 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4 text-emerald-400" />
              <span>
                {configuredProvidersCount > 0
                  ? `Provider Keys (${configuredProvidersCount})`
                  : 'Configure API Keys'}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${configuredProvidersCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Scrollbar Bar */}
        <div className="flex md:hidden overflow-x-auto gap-2 py-2.5 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 bg-slate-900/80 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
