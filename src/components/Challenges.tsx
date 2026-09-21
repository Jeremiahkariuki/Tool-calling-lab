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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tool Calling Mastery Challenges</h2>
            <p className="text-sm text-gray-400">Test your understanding by solving real-world schema and payload challenges.</p>
          </div>
        </div>

        {/* Challenge Tabs */}
        <div className="flex overflow-x-auto gap-2 pt-6 border-t border-white/10 mt-4">
          {MASTERY_CHALLENGES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectChallenge(c)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeChallengeId === c.id
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-600/10'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                c.difficulty === 'Beginner' ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Challenge Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Challenge Instructions */}
        <div className="lg:col-span-5 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
              {activeChallenge.difficulty}
            </span>
            <span className="text-xs font-mono text-gray-500">ID: {activeChallenge.id}</span>
          </div>

          <h3 className="text-lg font-bold text-white">{activeChallenge.title}</h3>

          <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/5">
            {activeChallenge.description}
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-200">Objective Instructions:</h4>
            <p className="text-xs text-gray-400 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5 font-mono">
              {activeChallenge.instructions}
            </p>
          </div>

          {/* Actions: Hint & Solution */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setShowHint(!showHint)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>

            <button
              onClick={() => setShowSolution(!showSolution)}
              className="btn-secondary text-xs py-1.5 px-3 text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
            >
              <Eye className="w-3.5 h-3.5" />
              {showSolution ? 'Hide Solution' : 'Reveal Solution'}
            </button>
          </div>

          {showHint && (
            <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300 space-y-1">
              <span className="font-bold flex items-center gap-1 text-blue-400">💡 Hint:</span>
              <p>{activeChallenge.hint}</p>
            </div>
          )}

          {showSolution && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs space-y-2 font-mono">
              <span className="font-bold text-amber-400 block">Solution Reference:</span>
              <pre className="text-amber-200 text-[11px] bg-black/50 p-3 rounded-lg overflow-x-auto">
                {activeChallenge.solution}
              </pre>
            </div>
          )}
        </div>

        {/* Workspace Code Editor */}
        <div className="lg:col-span-7 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-2">
              JSON Challenge Editor
            </span>
            <button
              onClick={handleVerify}
              className="btn-primary text-xs py-1.5 px-4"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Verify Challenge Solution
            </button>
          </div>

          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            rows={14}
            className="w-full bg-slate-950 font-mono text-xs text-indigo-200 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
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
