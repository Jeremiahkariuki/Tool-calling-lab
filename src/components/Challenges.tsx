import React, { useState } from 'react';
import { MASTERY_CHALLENGES } from '../utils/sampleData';
import type { Challenge } from '../utils/sampleData';
import { Trophy, CheckCircle, AlertTriangle, HelpCircle, Eye, Sparkles } from 'lucide-react';

export const Challenges: React.FC = () => {
  const [activeChallengeId, setActiveChallengeId] = useState<string>(MASTERY_CHALLENGES[0].id);
  const [userCode, setUserCode] = useState<string>(MASTERY_CHALLENGES[0].initialCode);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [validationState, setValidationState] = useState<{
    status: 'idle' | 'success' | 'fail';
    message: string;
  }>({ status: 'idle', message: '' });

  const activeChallenge = MASTERY_CHALLENGES.find(c => c.id === activeChallengeId) || MASTERY_CHALLENGES[0];

  const handleSelectChallenge = (c: Challenge) => {
    setActiveChallengeId(c.id);
    setUserCode(c.initialCode);
    setShowHint(false);
    setShowSolution(false);
    setValidationState({ status: 'idle', message: '' });
  };

  const handleVerify = () => {
    try {
      const parsed = JSON.parse(userCode);

      // Helper to evaluate nested key existence
      const getNested = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => {
          if (part.includes('[')) {
            const [key, idxStr] = part.split(/\[|\]/).filter(Boolean);
            return acc && acc[key] ? acc[key][parseInt(idxStr, 10)] : undefined;
          }
          return acc ? acc[part] : undefined;
        }, obj);
      };

      const targetVal = getNested(parsed, activeChallenge.expectedOutputKey);

      if (targetVal !== undefined) {
        setValidationState({
          status: 'success',
          message: `Great job! Validated key "${activeChallenge.expectedOutputKey}" matches the target specification requirement!`
        });
      } else {
        setValidationState({
          status: 'fail',
          message: `Key "${activeChallenge.expectedOutputKey}" was missing or invalid. Check the instructions and try again.`
        });
      }
    } catch (err: any) {
      setValidationState({
        status: 'fail',
        message: `JSON Syntax Error: ${err.message}`
      });
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5 text-amber-400" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Tool Calling Mastery Challenges
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Solve interactive schema challenges to master Anthropic Tool Use and OpenAI Function Calling specifications.
            </p>
          </div>
        </div>

        {/* Challenge Tabs */}
        <div className="flex overflow-x-auto gap-2 pt-4 border-t border-slate-800 no-scrollbar">
          {MASTERY_CHALLENGES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectChallenge(c)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeChallengeId === c.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                c.difficulty === 'Beginner' ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span>{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Challenge Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Challenge Instructions */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
              {activeChallenge.difficulty}
            </span>
            <span className="text-xs font-mono text-slate-500">ID: {activeChallenge.id}</span>
          </div>

          <h3 className="text-base font-bold text-slate-100">{activeChallenge.title}</h3>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {activeChallenge.description}
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Objective Instructions:</h4>
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
              {activeChallenge.instructions}
            </p>
          </div>

          {/* Action Buttons: Hint & Solution */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
            </button>

            <button
              onClick={() => setShowSolution(!showSolution)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>{showSolution ? 'Hide Solution' : 'Reveal Solution'}</span>
            </button>
          </div>

          {showHint && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 text-xs text-indigo-200 space-y-1">
              <strong className="font-bold flex items-center gap-1 text-indigo-300">💡 Hint:</strong>
              <p className="leading-relaxed">{activeChallenge.hint}</p>
            </div>
          )}

          {showSolution && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 text-xs space-y-2 font-mono">
              <strong className="font-bold text-amber-400 block">Solution Reference:</strong>
              <pre className="text-amber-200 text-[11px] bg-slate-950 p-3.5 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
                {activeChallenge.solution}
              </pre>
            </div>
          )}
        </div>

        {/* Workspace Code Editor */}
        <div className="lg:col-span-7 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              JSON Challenge Editor
            </span>
            <button
              onClick={handleVerify}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verify Challenge</span>
            </button>
          </div>

          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            rows={14}
            className="w-full bg-slate-950 font-mono text-xs text-indigo-200 border border-slate-800 rounded-xl p-4 focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
          />

          {/* Validation Feedback */}
          {validationState.status !== 'idle' && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
              validationState.status === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/40 border-red-500/50 text-red-300'
            }`}>
              {validationState.status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span>{validationState.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
