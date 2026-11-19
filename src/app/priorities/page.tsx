'use client';

import React, { useState } from 'react';
import {
  ArrowUpDown,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Send,
  Train,
} from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';
import { TrainInspectorDrawer } from '@/components/trains/TrainInspectorDrawer';
import { TrainRecord } from '@/types/railway';

export default function PriorityQueuePage() {
  const {
    priorityQueue,
    trains,
    recalculatePriorities,
    updateTrainDelay,
    updateTrainStatus,
  } = useRailway();

  const [selectedTrain, setSelectedTrain] = useState<TrainRecord | null>(null);

  // Dispatch first train in queue
  const handleDispatchTopTrain = () => {
    if (priorityQueue.length === 0) return;
    const top = priorityQueue[0];
    updateTrainStatus(top.trainNumber, 'DEPARTED');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-400/30">
              <ArrowUpDown className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Delay-Based Train Prioritization Queue
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
              HIGHER-DELAY-FIRST DISPATCH RULE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Dynamic sequencing prioritizing waiting trains with higher accumulated delays to minimize station bottleneck compounding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={recalculatePriorities}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Queue</span>
          </button>
          {priorityQueue.length > 0 && (
            <button
              onClick={handleDispatchTopTrain}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Dispatch Rank #1 ({priorityQueue[0].trainNumber})</span>
            </button>
          )}
        </div>
      </div>

      {/* Prototype Policy Notice Banner */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-900/60 flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-purple-200 leading-relaxed">
          <span className="font-bold text-purple-100">Project Evaluation Rule:</span> Among trains berthed at Pune Junction waiting for departure, the train with the <span className="underline font-bold text-purple-300">higher current delay</span> receives higher departure priority (e.g. Delays of 35m, 20m, 8m are sequenced in descending delay order). This policy prevents cascading disruption by expediting severely delayed rakes.
        </div>
      </div>

      {/* Main Priority Queue Table / Cards */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Active Ready-for-Departure Priority Sequence
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {priorityQueue.length} trains ready at platform
          </span>
        </div>

        {priorityQueue.length === 0 ? (
          <div className="py-14 text-center text-slate-500 text-xs font-mono space-y-2">
            <div>No trains are currently marked &quot;Waiting Departure&quot;.</div>
            <div className="text-[11px] text-slate-600">
              Go to the Train Monitor tab and set a train&apos;s status to &quot;WAITING_DEPARTURE&quot; to test the live ranking engine.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {priorityQueue.map((item) => {
              const fullTrain = trains.find((t) => t.trainNumber === item.trainNumber);

              return (
                <div
                  key={item.trainNumber}
                  className={`p-4 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    item.rank === 1
                      ? 'bg-purple-950/20 border-purple-800/80 shadow-md shadow-purple-950/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  {/* Rank Badge & Train Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center font-mono font-bold border ${
                        item.rank === 1
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/40 text-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 text-xs'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-sans">Rank</span>
                      <span>#{item.rank}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {item.trainNumber}
                        </span>
                        <span className="text-slate-200 font-semibold text-xs">
                          {item.trainName}
                        </span>
                        {item.platformNumber && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                            PF {item.platformNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Sched Daund: {item.scheduledDepartureDaund} • Ready for clearance dispatch
                      </div>
                    </div>
                  </div>

                  {/* Delay & Algorithm Reasoning */}
                  <div className="flex-1 max-w-lg bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-400 font-bold">
                        Current Delay: +{item.delayMinutes} mins
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Higher-Delay Rule Applied
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
                      {item.reasoning}
                    </p>
                  </div>

                  {/* Interactive Delay Adjustment & Actions */}
                  <div className="flex items-center gap-2">
                    {/* Quick +/- delay buttons to test live re-ranking */}
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 gap-1">
                      <button
                        onClick={() => updateTrainDelay(item.trainNumber, Math.max(0, item.delayMinutes - 10))}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-xs"
                        title="Reduce delay by 10 mins"
                      >
                        -10m
                      </button>
                      <button
                        onClick={() => updateTrainDelay(item.trainNumber, item.delayMinutes + 15)}
                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-mono text-xs"
                        title="Increase delay by 15 mins (triggers rank recalculation)"
                      >
                        +15m
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (fullTrain) setSelectedTrain(fullTrain);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Train Inspector Drawer */}
      <TrainInspectorDrawer
        train={selectedTrain}
        onClose={() => setSelectedTrain(null)}
      />
    </div>
  );
}
