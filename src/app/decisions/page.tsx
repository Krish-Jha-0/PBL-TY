'use client';

import React from 'react';
import {
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';

export default function ControllerDecisionsPage() {
  const {
    decisions,
    recommendations,
    trains,
    approvePlatformRecommendation,
    resetSimulation,
  } = useRailway();

  // Find trains with unapproved recommendations
  const pendingApprovals = trains.filter(
    (t) =>
      t.allocationStatus === 'RECOMMENDED' &&
      recommendations.get(t.trainNumber)?.recommendedPlatform !== null
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Controller Decisions & Audit Workflow
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              AUDIT TRAIL LOG
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Advisory action log, platform allocations, delay overrides, and dispatcher approval history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingApprovals.length > 0 && (
            <button
              onClick={() => {
                pendingApprovals.forEach((t) => approvePlatformRecommendation(t.trainNumber));
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve All Pending ({pendingApprovals.length})</span>
            </button>
          )}
          <button
            onClick={resetSimulation}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo History</span>
          </button>
        </div>
      </div>

      {/* Advisory Legal Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
        <UserCheck className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Advisory Operations Role:</strong> The Intelligent Train Traffic & Platform Management System functions purely as a decision-support advisory system. It provides real-time algorithmic recommendations to human railway dispatchers. Final authority over train clearances and route setting remains with the station section controller.
        </div>
      </div>

      {/* Pending Approvals Review Section */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Pending Controller Approvals ({pendingApprovals.length})
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Awaiting dispatcher sign-off
          </span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-mono">
            No platform recommendations currently awaiting approval. All active berths are signed off.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingApprovals.map((train) => {
              const rec = recommendations.get(train.trainNumber);
              return (
                <div
                  key={train.trainNumber}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-400 text-xs">
                        #{train.trainNumber}
                      </span>
                      <span className="text-white text-xs font-semibold">{train.trainName}</span>
                      <span className="text-[10px] text-slate-400">({train.rakeLength}c)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Est Arrival: {train.estimatedArrivalPune} ➔ Algorithm Suggests:{' '}
                      <strong className="text-sky-300">Platform {rec?.recommendedPlatform}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => approvePlatformRecommendation(train.trainNumber)}
                    className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve PF {rec?.recommendedPlatform}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete Audit History Trail */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Controller Audit Trail & Action Log ({decisions.length})
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Chronological session actions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Train / Target</th>
                <th className="py-2.5 px-3">Previous Value</th>
                <th className="py-2.5 px-3">New Value</th>
                <th className="py-2.5 px-3">Action Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {decisions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No decisions logged in current session.
                  </td>
                </tr>
              ) : (
                decisions.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 text-slate-400">{d.timestamp}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {d.actionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-sky-400 font-bold">
                      {d.trainNumber ? `Train #${d.trainNumber}` : d.platformNumber ? `PF ${d.platformNumber}` : 'Global'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{d.previousValue}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{d.newValue}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">{d.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
