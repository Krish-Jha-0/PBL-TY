'use client';

import React, { useState } from 'react';
import {
  Train,
  ArrowUpDown,
  Layers,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Shuffle,
} from 'lucide-react';
import Link from 'next/link';
import { useRailway } from '@/context/RailwayContext';
import { OperationalKPIs } from '@/components/dashboard/OperationalKPIs';
import { CorridorTrackMap } from '@/components/dashboard/CorridorTrackMap';
import { RechartsPanels } from '@/components/dashboard/RechartsPanels';
import { PlatformGanttTimeline } from '@/components/platforms/PlatformGanttTimeline';
import { TrainInspectorDrawer } from '@/components/trains/TrainInspectorDrawer';
import { TrainRecord } from '@/types/railway';

export default function OverviewPage() {
  const {
    trains,
    platforms,
    priorityQueue,
    recommendations,
    conflicts,
    approvePlatformRecommendation,
    recalculateAllocations,
    injectRandomDelay,
  } = useRailway();

  const [selectedTrain, setSelectedTrain] = useState<TrainRecord | null>(null);

  // Next expected arrivals (trains approaching Pune or scheduled)
  const incomingTrains = trains
    .filter(
      (t) =>
        t.status === 'APPROACHING' ||
        t.status === 'WAITING_PLATFORM' ||
        (t.status === 'SCHEDULED' && (t.simulatedDistanceKm || 0) > 0)
    )
    .sort((a, b) => a.estimatedArrivalPune.localeCompare(b.estimatedArrivalPune))
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Status Header */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Central Traffic Control Dashboard
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800">
              SOLAPUR DIVISION • CENTRAL RAILWAY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time platform allocation, headway monitoring, and delay-based departure prioritization along the 76 km Daund Junction to Pune Junction corridor.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={injectRandomDelay}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg text-xs font-medium border border-amber-500/30 flex items-center gap-1.5 transition"
            title="Simulate random delay disturbance"
          >
            <Shuffle className="h-3.5 w-3.5 text-amber-400" />
            <span>Inject Delay</span>
          </button>

          <button
            onClick={recalculateAllocations}
            className="px-3.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 rounded-lg text-xs font-medium border border-sky-500/30 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-sky-400" />
            <span>Recalculate Allocations</span>
          </button>

          <Link
            href="/trains"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
          >
            <span>Train Monitor</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Operational KPIs */}
      <OperationalKPIs />

      {/* Corridor Track Schematic Diagram */}
      <CorridorTrackMap onSelectTrain={(t) => setSelectedTrain(t)} />

      {/* Two Column Operational Priorities & Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departure Priority Queue Card (Higher-Delay-First Rule) */}
        <div className="rounded-xl bg-[#091122] border border-slate-800 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Departure Priority Queue
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Core Algorithm: Higher Current Delay First Policy
              </p>
            </div>
            <Link
              href="/priorities"
              className="text-[11px] text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-mono font-semibold"
            >
              <span>Full Queue ({priorityQueue.length})</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-2">
            {priorityQueue.length === 0 ? (
              <div className="h-44 rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                <span>No trains currently awaiting departure.</span>
                <span className="text-[10px] text-slate-600 mt-1">
                  Trains berthed at Pune Junction enter this queue automatically after turnaround.
                </span>
              </div>
            ) : (
              priorityQueue.slice(0, 4).map((item, idx) => (
                <div
                  key={item.trainNumber}
                  onClick={() => {
                    const match = trains.find((t) => t.trainNumber === item.trainNumber);
                    if (match) setSelectedTrain(match);
                  }}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs border ${idx === 0
                        ? 'bg-purple-900/40 text-purple-200 border-purple-700'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                    >
                      #{item.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">
                          {item.trainNumber}
                        </span>
                        <span className="text-slate-300 text-xs font-medium">{item.trainName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.reasoning}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-300 block">
                      +{item.delayMinutes}m delay
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.platformNumber ? `PF ${item.platformNumber}` : 'Outer track'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Next Expected Arrivals Card */}
        <div className="rounded-xl bg-[#091122] border border-slate-800 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Next Expected Arrivals at Pune Junction
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Approaching corridor traffic and platform allocations
              </p>
            </div>
            <Link
              href="/trains"
              className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 font-mono font-semibold"
            >
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-2">
            {incomingTrains.length === 0 ? (
              <div className="h-44 rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs">
                <span>No incoming trains currently approaching.</span>
              </div>
            ) : (
              incomingTrains.map((train) => {
                const rec = recommendations.get(train.trainNumber);
                return (
                  <div
                    key={train.trainNumber}
                    onClick={() => setSelectedTrain(train)}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-300 text-xs">
                          {train.trainNumber}
                        </span>
                        <span className="text-white text-xs font-semibold">{train.trainName}</span>
                        {train.delayMinutes > 0 ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            +{train.delayMinutes}m
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            On Time
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        Sched: {train.scheduledArrivalPune} ➔ Est:{' '}
                        <span className="text-white font-semibold">{train.estimatedArrivalPune}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {train.assignedPlatform ? (
                        <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-semibold">
                          PF {train.assignedPlatform}
                        </span>
                      ) : rec && rec.recommendedPlatform ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/80 font-mono text-xs">
                            Rec: PF {rec.recommendedPlatform}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              approvePlatformRecommendation(train.trainNumber);
                            }}
                            className="p-1 rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/40 transition"
                            title="Approve recommended platform"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 font-mono text-[10px]">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Platform Occupancy Matrix (6 Platforms) */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Pune Junction Platform Berthing Status
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live status and train occupancy across Platforms 1 to 6
            </p>
          </div>
          <Link
            href="/platforms"
            className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-mono font-semibold"
          >
            <span>Platform Allocator</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {platforms.map((pf) => {
            const isMaint = pf.isUnderMaintenance || pf.status === 'MAINTENANCE';
            const berthedTrain = pf.occupyingTrainNumber
              ? trains.find((t) => t.trainNumber === pf.occupyingTrainNumber)
              : null;

            return (
              <div
                key={pf.platformNumber}
                className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${isMaint
                  ? 'bg-rose-950/20 border-rose-900/60'
                  : pf.status === 'OCCUPIED'
                    ? 'bg-amber-950/20 border-amber-800/60'
                    : pf.status === 'RESERVED'
                      ? 'bg-sky-950/20 border-sky-800/60'
                      : 'bg-emerald-950/15 border-emerald-800/40'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-white">
                      Platform {pf.platformNumber}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${isMaint
                        ? 'bg-rose-500'
                        : pf.status === 'OCCUPIED'
                          ? 'bg-amber-400 animate-pulse'
                          : pf.status === 'RESERVED'
                            ? 'bg-sky-400'
                            : 'bg-emerald-400'
                        }`}
                    ></span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-slate-400">
                    Max: {pf.lengthCapacityCoaches} Coaches
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  {berthedTrain ? (
                    <div
                      onClick={() => setSelectedTrain(berthedTrain)}
                      className="cursor-pointer group"
                    >
                      <div className="font-mono font-bold text-xs text-amber-300 group-hover:underline">
                        #{berthedTrain.trainNumber}
                      </div>
                      <div className="text-[10px] text-slate-200 truncate">
                        {berthedTrain.trainName}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        Until {pf.occupancyEndTime || 'TBD'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono font-semibold">
                      {isMaint ? (
                        <span className="text-rose-400">MAINTENANCE</span>
                      ) : pf.status === 'RESERVED' ? (
                        <span className="text-sky-400">RESERVED</span>
                      ) : (
                        <span className="text-emerald-400">AVAILABLE</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Gantt Timeline */}
      <PlatformGanttTimeline onSelectTrain={(t) => setSelectedTrain(t)} />

      {/* Recharts Analytics Panels */}
      <RechartsPanels />

      {/* Train Inspector Slide-over Drawer */}
      <TrainInspectorDrawer
        train={selectedTrain}
        onClose={() => setSelectedTrain(null)}
      />
    </div>
  );
}
