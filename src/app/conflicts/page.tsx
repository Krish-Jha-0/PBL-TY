'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';

export default function ConflictManagementPage() {
  const {
    conflicts,
    recalculateAllocations,
    resolveConflictWithSuggestion,
  } = useRailway();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-400/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Operational Conflict & Sequencing Management
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${conflicts.length > 0
                ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
            >
              {conflicts.length} ACTIVE CONFLICTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Automated collision audit, headway monitoring, coach rake length clearance checks, and suggested mitigations.
          </p>
        </div>

        <button
          onClick={recalculateAllocations}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Recalculate & Re-verify Corridor</span>
        </button>
      </div>

      {/* Main Conflict Cards List */}
      <div className="space-y-4">
        {conflicts.length === 0 ? (
          <div className="rounded-xl bg-[#091122] border border-slate-800 p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-white">No Active Platform or Sequencing Conflicts</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
              All train berthing windows at Pune Junction are conflict-free with compliant buffer margins. Track safety and rake clearances are fully verified.
            </p>
          </div>
        ) : (
          conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className={`p-4.5 rounded-xl border shadow-sm transition-all ${conflict.severity === 'CRITICAL'
                ? 'bg-rose-950/20 border-rose-800/80'
                : conflict.severity === 'WARNING'
                  ? 'bg-amber-950/20 border-amber-800/80'
                  : 'bg-sky-950/20 border-sky-800/80'
                }`}
            >
              {/* Conflict Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${conflict.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400'
                      : conflict.severity === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-sky-500/20 text-sky-400'
                      }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      {conflict.type.replace('_', ' ')}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span>
                        Affected Trains:{' '}
                        <strong className="text-white font-mono">
                          {conflict.affectedTrainNumbers.join(', ')}
                        </strong>
                      </span>
                      {conflict.platformNumber && (
                        <span>
                          • Platform:{' '}
                          <strong className="text-sky-300 font-mono">
                            PF {conflict.platformNumber}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold self-start sm:self-auto ${conflict.severity === 'CRITICAL'
                    ? 'bg-rose-900/60 text-rose-200 border border-rose-700'
                    : 'bg-amber-900/60 text-amber-200 border border-amber-700'
                    }`}
                >
                  {conflict.severity}
                </span>
              </div>

              {/* Conflict Detailed Description */}
              <div className="py-3 text-xs text-slate-300 leading-relaxed font-sans">
                {conflict.description}
              </div>

              {/* Suggested Resolution & One-Click Apply */}
              <div className="pt-3 border-t border-slate-800/80 bg-slate-950/60 -mx-4.5 -mb-4.5 p-4 rounded-b-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Recommended System Mitigation:
                  </span>
                  <p className="text-xs text-slate-300 font-sans">
                    {conflict.suggestedResolution}
                  </p>
                </div>

                <button
                  onClick={() => resolveConflictWithSuggestion(conflict.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition flex-shrink-0"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Apply Mitigation</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
