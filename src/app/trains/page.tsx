'use client';

import React, { useState, useMemo } from 'react';
import {
  Train,
  Search,
  Clock,
  Layers,
  ArrowUpDown,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';
import { TrainRecord, TrainStatus } from '@/types/railway';
import { TrainInspectorDrawer } from '@/components/trains/TrainInspectorDrawer';

type FilterCategory = 'ALL' | 'ON_TIME' | 'DELAYED' | 'APPROACHING' | 'AWAITING_PLATFORM' | 'CONFLICT';

export default function TrainMonitorPage() {
  const {
    trains,
    conflicts,
    recommendations,
  } = useRailway();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [selectedTrain, setSelectedTrain] = useState<TrainRecord | null>(null);

  // Set of train numbers with active conflicts
  const conflictTrainNumbers = useMemo(() => {
    const set = new Set<string>();
    conflicts.forEach((c) => c.affectedTrainNumbers.forEach((tn) => set.add(tn)));
    return set;
  }, [conflicts]);

  // Filtered and searched trains
  const filteredTrains = useMemo(() => {
    return trains.filter((t) => {
      // Search
      const matchesSearch =
        t.trainNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.trainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter
      switch (activeFilter) {
        case 'ON_TIME':
          return t.delayMinutes === 0;
        case 'DELAYED':
          return t.delayMinutes > 0;
        case 'APPROACHING':
          return t.status === 'APPROACHING';
        case 'AWAITING_PLATFORM':
          return t.assignedPlatform === null || t.status === 'WAITING_PLATFORM';
        case 'CONFLICT':
          return conflictTrainNumbers.has(t.trainNumber) || t.allocationStatus === 'CONFLICT';
        case 'ALL':
        default:
          return true;
      }
    });
  }, [trains, searchQuery, activeFilter, conflictTrainNumbers]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-400/30">
              <Train className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Daund–Pune Corridor Train Monitor
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800">
              {trains.length} TIMETABLE RUNS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time track positions, coach capacities, intermediate stops, simulated delays, and platform berthing state.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search train no, name, origin, dest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 font-mono transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL' as FilterCategory, label: 'All Trains', count: trains.length },
            {
              id: 'ON_TIME' as FilterCategory,
              label: 'On Time',
              count: trains.filter((t) => t.delayMinutes === 0).length,
            },
            {
              id: 'DELAYED' as FilterCategory,
              label: 'Delayed',
              count: trains.filter((t) => t.delayMinutes > 0).length,
            },
            {
              id: 'APPROACHING' as FilterCategory,
              label: 'Approaching',
              count: trains.filter((t) => t.status === 'APPROACHING').length,
            },
            {
              id: 'AWAITING_PLATFORM' as FilterCategory,
              label: 'Awaiting PF',
              count: trains.filter((t) => !t.assignedPlatform).length,
            },
            {
              id: 'CONFLICT' as FilterCategory,
              label: 'Conflicts',
              count: conflictTrainNumbers.size,
            },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${activeFilter === pill.id
                ? 'bg-sky-600 text-white border border-sky-400 shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              <span>{pill.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${activeFilter === pill.id
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-800 text-slate-400'
                  }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Train Table */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Train No. & Name</th>
                <th className="py-3 px-4">Corridor Route</th>
                <th className="py-3 px-4">Sched Daund</th>
                <th className="py-3 px-4">Est Pune Arr</th>
                <th className="py-3 px-4">Delay</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Platform Berth</th>
                <th className="py-3 px-4 text-center">Departure Rank</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {filteredTrains.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    No train records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTrains.map((train) => {
                  const hasConflict = conflictTrainNumbers.has(train.trainNumber);
                  const isDelayed = train.delayMinutes > 0;
                  const rec = recommendations.get(train.trainNumber);

                  return (
                    <tr
                      key={train.trainNumber}
                      onClick={() => setSelectedTrain(train)}
                      className={`hover:bg-slate-850 hover:bg-slate-800/50 transition cursor-pointer ${hasConflict ? 'bg-rose-950/20' : ''
                        }`}
                    >
                      {/* Train Number & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-400 text-xs">
                            #{train.trainNumber}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {train.rakeLength}c
                          </span>
                        </div>
                        <div className="text-white font-medium text-xs mt-0.5 max-w-[200px] truncate">
                          {train.trainName}
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-3 px-4 text-slate-300 text-xs">
                        <div className="truncate max-w-[180px] font-medium">
                          {train.origin} ➔ {train.destination}
                        </div>
                        {train.intermediateStops.length > 0 && (
                          <div className="text-[10px] text-sky-400/80 font-mono mt-0.5">
                            Via {train.intermediateStops.map((s) => s.station).join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Scheduled Daund Departure */}
                      <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                        {train.scheduledDepartureDaund}
                      </td>

                      {/* Estimated Pune Arrival */}
                      <td className="py-3 px-4 font-mono text-xs">
                        <span className={isDelayed ? 'text-amber-300 font-bold' : 'text-slate-200'}>
                          {train.estimatedArrivalPune}
                        </span>
                        {isDelayed && (
                          <span className="block text-[10px] text-slate-500 font-sans">
                            Sched: {train.scheduledArrivalPune}
                          </span>
                        )}
                      </td>

                      {/* Delay in Minutes */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${isDelayed
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                        >
                          {isDelayed ? `+${train.delayMinutes}m` : '0m'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${train.status === 'AT_PLATFORM'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : train.status === 'WAITING_DEPARTURE'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : train.status === 'APPROACHING'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                : train.status === 'WAITING_PLATFORM'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                        >
                          {train.status}
                        </span>
                      </td>

                      {/* Platform */}
                      <td className="py-3 px-4 font-mono">
                        {train.assignedPlatform ? (
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold">
                            PF {train.assignedPlatform}
                          </span>
                        ) : rec && rec.recommendedPlatform ? (
                          <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/80 text-[10px]">
                            Rec: PF {rec.recommendedPlatform}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Departure Priority */}
                      <td className="py-3 px-4 text-center font-mono">
                        {train.departurePriorityRank ? (
                          <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold text-xs">
                            #{train.departurePriorityRank}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrain(train);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Train Inspector Slide-over Drawer */}
      <TrainInspectorDrawer
        train={selectedTrain}
        onClose={() => setSelectedTrain(null)}
      />
    </div>
  );
}
