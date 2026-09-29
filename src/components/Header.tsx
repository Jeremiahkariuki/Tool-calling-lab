import React, { useState } from 'react';
import { 
  Terminal, Cpu, ArrowRightLeft, BookOpen, Code2, 
  Trophy, Key, Scale, Sparkles, Wrench, Globe, ChevronDown, Layers,
  Sun, Moon, GitFork
} from 'lucide-react';

export type TabType = 'simulator' | 'compare' | 'builder' | 'webhook' | 'workflow' | 'converter' | 'guide' | 'codegen' | 'challenges';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenKeyModal: () => void;
  configuredProvidersCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenKeyModal,
  configuredProvidersCount,
  theme,
  onToggleTheme
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs = [
    { id: 'simulator', label: 'Simulator', icon: Cpu, badge: 'LIVE', color: 'indigo' },
    { id: 'compare', label: 'Compare', icon: Scale, color: 'blue' },
    { id: 'workflow', label: 'Workflows', icon: GitFork, badge: 'DAG', color: 'purple' },
    { id: 'builder', label: 'Tool Builder', icon: Wrench, badge: 'OPENAPI', color: 'emerald' },
    { id: 'webhook', label: 'Webhook Tester', icon: Globe, badge: 'REST', color: 'cyan' },
  ];

  const toolsTabs = [
    { id: 'converter', label: 'Schema Converter', icon: ArrowRightLeft, desc: 'Convert JSON Schema <-> Anthropic Spec' },
    { id: 'guide', label: 'Protocol Specs', icon: BookOpen, desc: 'Cheatsheet for multi-provider specs' },
    { id: 'codegen', label: 'Code Generator', icon: Code2, desc: 'Export TypeScript & Python SDK snippets' },
    { id: 'challenges', label: 'Lab Challenges', icon: Trophy, desc: 'Interactive tool calling puzzles' }
  ];

  const isMoreActive = toolsTabs.some(t => t.id === activeTab);

  return (
    <header className="sticky top-0 z-50 mb-8 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl transition-colors duration-300">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Studio Branding */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab('simulator')}>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-60 blur-md group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-indigo-400">
                <Terminal className="w-6 h-6" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 
                  onClick={() => setActiveTab('simulator')}
                  className="text-lg sm:text-xl font-extrabold tracking-tight cursor-pointer hover:text-indigo-400 transition-colors"
                >
                  Tool Calling Lab
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Studio v3.0
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 hidden xl:block mt-0.5">
                Multi-Provider AI Tool Calling & Agentic DAG Studio
              </p>
            </div>
          </div>

          {/* Nav Tabs Toolbar */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/90 shadow-inner">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold uppercase tracking-wider ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Developer Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isMoreActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Dev Utilities</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMoreOpen(false)} />
                  <div className="absolute right-0 mt-3 w-64 p-2 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                    {toolsTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as TabType);
                            setIsMoreOpen(false);
                          }}
                          className={`flex items-start gap-3 w-full p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs font-bold">{tab.label}</div>
                            <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">{tab.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Action Buttons: Theme Toggle & API Keys */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light (B&W) Theme' : 'Switch to Dark Theme'}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border shadow-sm cursor-pointer bg-slate-900/80 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:text-white"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* API Keys Settings Button */}
            <button
              onClick={onOpenKeyModal}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all border shadow-lg cursor-pointer ${
                configuredProvidersCount > 0
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 glow-openai'
                  : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30 glow-indigo'
              }`}
            >
              <Key className="w-4 h-4 text-emerald-400" />
              <span>
                {configuredProvidersCount > 0
                  ? `API Keys Ready (${configuredProvidersCount})`
                  : 'Configure API Keys'}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${configuredProvidersCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            </button>
          </div>
        </div>

        {/* Responsive / Mobile Sub-navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto gap-2 py-3 border-t border-slate-800/80 no-scrollbar">
          {[...mainTabs, ...toolsTabs].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 bg-slate-900/90 border border-slate-800'
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
