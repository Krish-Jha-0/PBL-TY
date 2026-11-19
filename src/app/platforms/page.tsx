'use client';

import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Wrench,
  Check,
} from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';
import { PlatformGanttTimeline } from '@/components/platforms/PlatformGanttTimeline';
import { TrainInspectorDrawer } from '@/components/trains/TrainInspectorDrawer';
import { TrainRecord } from '@/types/railway';

export default function PlatformAllocationPage() {
  const {
    platforms,
    trains,
    recommendations,
    conflicts,
    approvePlatformRecommendation,
    rejectPlatformRecommendation,
    assignPlatformManually,
    recalculateAllocations,
    updatePlatformMaintenance,
  } = useRailway();

  const [selectedTrain, setSelectedTrain] = useState<TrainRecord | null>(null);

  // Trains requiring platform decision (Approaching or Waiting Platform)
  const pendingTrains = trains.filter(
    (t) =>
      t.status === 'APPROACHING' ||
      t.status === 'WAITING_PLATFORM' ||
      (t.status === 'SCHEDULED' && t.allocationStatus === 'WAITING')
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-400/30">
              <Layers className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Pune Junction Platform Allocation Engine
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800">
              6 ACTIVE PLATFORMS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Multi-factor scoring algorithm matching coach rake lengths, safety buffer windows, and platform availability.
          </p>
        </div>

        <button
          onClick={recalculateAllocations}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-xs transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Recalculate All Allocations</span>
        </button>
      </div>

      {/* Pune Junction 6-Platform Operational Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const isMaint = platform.isUnderMaintenance || platform.status === 'MAINTENANCE';
          const berthedTrain = platform.occupyingTrainNumber
            ? trains.find((t) => t.trainNumber === platform.occupyingTrainNumber)
            : null;

          return (
            <div
              key={platform.platformNumber}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${isMaint
                ? 'bg-rose-950/20 border-rose-900/60'
                : platform.status === 'OCCUPIED'
                  ? 'bg-[#091122] border-amber-500/40'
                  : platform.status === 'RESERVED'
                    ? 'bg-[#091122] border-sky-500/40'
                    : 'bg-[#091122] border-slate-800'
                }`}
            >
              <div>
                {/* Platform Card Top Bar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-white">
                      Platform {platform.platformNumber}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {platform.lengthCapacityCoaches} Coaches Max
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${isMaint
                      ? 'bg-rose-900/40 text-rose-300 border border-rose-800/60'
                      : platform.status === 'OCCUPIED'
                        ? 'bg-amber-900/40 text-amber-300 border border-amber-800/60'
                        : platform.status === 'RESERVED'
                          ? 'bg-sky-900/40 text-sky-300 border border-sky-800/60'
                          : 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/60'
                      }`}
                  >
                    {isMaint ? 'CLOSED (MAINT)' : platform.status}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-3 space-y-2 text-xs">
                  {berthedTrain ? (
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">Berthed Train:</span>
                        <span className="font-mono text-[10px] text-amber-300 font-semibold">
                          +{berthedTrain.delayMinutes}m delay
                        </span>
                      </div>
                      <div
                        onClick={() => setSelectedTrain(berthedTrain)}
                        className="font-mono font-bold text-sky-300 text-xs mt-1 cursor-pointer hover:underline"
                      >
                        #{berthedTrain.trainNumber} - {berthedTrain.trainName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono flex justify-between">
                        <span>Window: {platform.occupancyStartTime} ➔ {platform.occupancyEndTime}</span>
                        <span>{berthedTrain.rakeLength}c</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 text-slate-400 text-[11px] font-mono">
                      {isMaint ? (
                        <span className="text-rose-400 font-medium">
                          Track closure active. Disqualified from allocation algorithms.
                        </span>
                      ) : (
                        <span>Idle & Available. Next available: <strong className="text-slate-200">{platform.nextAvailableTime || 'Immediate'}</strong></span>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {platform.notes}
                  </p>
                </div>
              </div>

              {/* Maintenance Toggle Footer Button */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Types: {platform.compatibleTypes.slice(0, 3).join(', ')}...
                </span>
                <button
                  onClick={() => updatePlatformMaintenance(platform.platformNumber, !isMaint)}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium border transition ${isMaint
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                >
                  <Wrench className="h-3 w-3" />
                  <span>{isMaint ? 'Re-open Track' : 'Close for Maintenance'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform Gantt Timeline */}
      <PlatformGanttTimeline onSelectTrain={(t) => setSelectedTrain(t)} />

      {/* Allocation Recommendation Review Queue */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4.5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Approaching Trains & Allocation Recommendations
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Review, approve, or manually override algorithm suggestions before arrival at Pune Junction
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {pendingTrains.length} pending review
          </span>
        </div>

        <div className="space-y-3">
          {pendingTrains.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs font-mono">
              No trains currently pending platform allocation.
            </div>
          ) : (
            pendingTrains.map((train) => {
              const rec = recommendations.get(train.trainNumber);

              return (
                <div
                  key={train.trainNumber}
                  className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Train Identity & Timing */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-400 text-xs">
                        #{train.trainNumber}
                      </span>
                      <span className="font-semibold text-white text-xs">
                        {train.trainName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {train.rakeLength}c ({train.trainType})
                      </span>
                      {train.delayMinutes > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          +{train.delayMinutes}m delay
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Estimated Arrival: <strong className="text-white">{train.estimatedArrivalPune}</strong> (Sched: {train.scheduledArrivalPune})
                    </div>
                  </div>

                  {/* Recommendation Details */}
                  <div className="flex-1 max-w-md bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                    {rec && rec.recommendedPlatform ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sky-300">
                            Recommended: Platform {rec.recommendedPlatform} (Score: {rec.score})
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            Conflict-Free
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 space-y-0.5">
                          {rec.reasons.slice(0, 2).map((r, i) => (
                            <div key={i} className="truncate">• {r}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>No eligible platform available without conflict!</span>
                      </div>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2">
                    {train.allocationStatus === 'APPROVED' ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-semibold flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        <span>Approved PF {train.assignedPlatform}</span>
                      </span>
                    ) : rec && rec.recommendedPlatform ? (
                      <button
                        onClick={() => approvePlatformRecommendation(train.trainNumber)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve PF {rec.recommendedPlatform}</span>
                      </button>
                    ) : null}

                    {/* Manual override platform select */}
                    <select
                      value={train.assignedPlatform || ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value, 10) : null;
                        assignPlatformManually(train.trainNumber, val);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                    >
                      <option value="">Manual Override</option>
                      {platforms.map((p) => (
                        <option key={p.platformNumber} value={p.platformNumber}>
                          PF {p.platformNumber} ({p.lengthCapacityCoaches}c)
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setSelectedTrain(train)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Train Inspector Drawer */}
      <TrainInspectorDrawer
        train={selectedTrain}
        onClose={() => setSelectedTrain(null)}
      />
    </div>
  );
}
