'use client';

import React, { useState } from 'react';
import {
  X,
  Train,
  Clock,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';
import { TrainRecord, TrainStatus } from '@/types/railway';

export function TrainInspectorDrawer({
  train,
  onClose,
}: {
  train: TrainRecord | null;
  onClose: () => void;
}) {
  const ctx = useRailway();
  const [delayInput, setDelayInput] = useState<number>(train ? train.delayMinutes : 0);
  const [selectedStatus, setSelectedStatus] = useState<TrainStatus>(train ? train.status : 'SCHEDULED');

  if (!train) return null;

  const recommendation = ctx.recommendations.get(train.trainNumber);

  const handleApplyDelay = () => {
    ctx.updateTrainDelay(train.trainNumber, delayInput, `Manual inspector adjustment to +${delayInput}m`);
  };

  const handleApplyStatus = (status: TrainStatus) => {
    setSelectedStatus(status);
    ctx.updateTrainStatus(train.trainNumber, status);
  };

  const handleApplyPlatform = (pf: number | null) => {
    ctx.assignPlatformManually(train.trainNumber, pf);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#070e1e]/95 backdrop-blur-2xl border-l border-cyan-500/30 shadow-2xl z-50 flex flex-col font-sans overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4.5 border-b border-white/[0.08] bg-gradient-to-r from-slate-900 via-[#0d1a38] to-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-500/20">
            <Train className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span className="font-mono text-cyan-400 tracking-wider">#{train.trainNumber}</span>
              <span>{train.trainName}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {train.origin} ➔ {train.destination}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/[0.08] transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Drawer Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
        {/* Core Specs Badge Bar */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 bg-slate-900/90 rounded-xl border border-white/[0.08] text-slate-300 font-mono text-[10px] font-bold">
            {train.rakeLength} Coaches
          </span>
          <span className="px-2.5 py-1 bg-cyan-950/60 rounded-xl border border-cyan-700/60 text-cyan-300 font-mono text-[10px] font-bold">
            {train.trainType}
          </span>
          <span
            className={`px-2.5 py-1 rounded-xl border text-[10px] font-mono font-black ${
              train.delayMinutes > 0
                ? 'bg-amber-950/70 border-amber-600/70 text-amber-300 shadow-xs'
                : 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300'
            }`}
          >
            {train.delayMinutes > 0 ? `🚨 +${train.delayMinutes}m Delay` : '✨ On Schedule'}
          </span>
          <span className="px-2.5 py-1 bg-slate-900/90 rounded-xl border border-white/[0.08] text-slate-300 font-mono text-[10px] font-bold">
            {train.status}
          </span>
        </div>

        {/* Timetable Schedule Card */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/80 to-[#0c162e]/80 border border-white/[0.08] p-4 space-y-2.5 shadow-md">
          <div className="text-[11px] font-black text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Corridor Schedule & Timing</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-sans">Sched Daund Dep</span>
              <span className="text-white font-bold">{train.scheduledDepartureDaund}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-sans">Sched Pune Arr</span>
              <span className="text-white font-bold">{train.scheduledArrivalPune}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-sans">Est Pune Arr (Live)</span>
              <span className="text-amber-300 font-black text-sm">{train.estimatedArrivalPune}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-sans">Platform Berth Window</span>
              <span className="text-cyan-300 font-bold">{train.turnaroundDurationMins} mins</span>
            </div>
          </div>

          {/* Intermediate Stops */}
          {train.intermediateStops && train.intermediateStops.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-white/[0.08]">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase font-mono">
                Intermediate Stoppages:
              </span>
              <div className="space-y-1">
                {train.intermediateStops.map((stop, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950/90 rounded-lg text-[10px] font-mono text-slate-300 border border-white/[0.06]"
                  >
                    <span className="text-cyan-300 font-bold">{stop.station}</span>
                    <span>
                      {stop.scheduledArrival || '--'} ➔ {stop.scheduledDeparture || '--'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Platform Allocation & Recommendation Card */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/80 to-[#0c162e]/80 border border-white/[0.08] p-4 space-y-3 shadow-md">
          <div className="text-[11px] font-black text-slate-200 uppercase tracking-wider font-mono flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>Platform Allocation</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-black ${
                train.allocationStatus === 'APPROVED'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80'
                  : train.allocationStatus === 'RECOMMENDED'
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600/80'
                  : train.allocationStatus === 'CONFLICT'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600/80 animate-pulse'
                  : 'bg-amber-950/80 text-amber-300 border-amber-600/80'
              }`}
            >
              {train.allocationStatus}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-white/[0.06]">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Current Assignment</span>
              <span className="text-sm font-black font-mono text-white">
                {train.assignedPlatform ? `Platform ${train.assignedPlatform}` : 'Pending Allocation'}
              </span>
            </div>
            {recommendation && recommendation.recommendedPlatform !== null && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-sans">AI Recommendation</span>
                <span className="text-sm font-black font-mono text-cyan-300">
                  PF {recommendation.recommendedPlatform} (Score: {recommendation.score})
                </span>
              </div>
            )}
          </div>

          {/* Recommendation Reasons */}
          {recommendation && (
            <div className="text-[10px] text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-white/[0.06]">
              <span className="font-bold text-slate-300 block">Engine Scoring Factors:</span>
              {recommendation.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Platform Actions */}
          <div className="flex gap-2 pt-1">
            {recommendation && recommendation.recommendedPlatform !== null && (
              <button
                onClick={() => ctx.approvePlatformRecommendation(train.trainNumber)}
                className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve PF {recommendation.recommendedPlatform}</span>
              </button>
            )}
            <button
              onClick={() => ctx.rejectPlatformRecommendation(train.trainNumber)}
              className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/[0.08] flex items-center justify-center gap-1 transition"
            >
              <XCircle className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>

          {/* Manual Platform Assignment */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-semibold">Manual Override:</span>
            <select
              value={train.assignedPlatform || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                handleApplyPlatform(val);
              }}
              className="flex-1 bg-slate-950 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-hidden focus:border-cyan-400"
            >
              <option value="">No Platform</option>
              {ctx.platforms.map((p) => (
                <option key={p.platformNumber} value={p.platformNumber}>
                  Platform {p.platformNumber} ({p.lengthCapacityCoaches}c{' '}
                  {p.isUnderMaintenance ? '- CLOSED' : ''})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Departure Priority Queue Status */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/80 to-[#0c162e]/80 border border-purple-500/30 p-4 space-y-2.5 shadow-md">
          <div className="text-[11px] font-black text-slate-200 uppercase tracking-wider font-mono flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-purple-400" />
              <span>Departure Priority Status</span>
            </div>
            {train.departurePriorityRank !== null ? (
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                Rank #{train.departurePriorityRank}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">Not queued</span>
            )}
          </div>

          <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-white/[0.06]">
            {train.priorityReason || (
              <span className="text-slate-500 italic">
                Train is currently {train.status}. It will enter the Higher-Delay-First departure queue when ready for dispatch at Pune platform.
              </span>
            )}
          </div>
        </div>

        {/* Controller Demonstration Controls */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/80 to-[#0c162e]/80 border border-amber-500/30 p-4 space-y-3.5 shadow-md">
          <div className="text-[11px] font-black text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Interactive Simulator Controls</span>
          </div>

          {/* Change Delay Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-slate-400 font-bold font-mono">
                SIMULATE DELAY:
              </label>
              <span className="font-mono font-black text-amber-300 text-xs">
                +{delayInput} mins
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={delayInput}
                onChange={(e) => setDelayInput(parseInt(e.target.value, 10))}
                className="flex-1 accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <button
                onClick={handleApplyDelay}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/40 text-[10px] font-bold transition transform hover:scale-105"
              >
                Set Delay
              </button>
            </div>
          </div>

          {/* Change Status Buttons */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold font-mono block mb-1.5">
              SET DISPATCH STATUS:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { status: 'APPROACHING' as TrainStatus, label: 'Approaching' },
                { status: 'AT_PLATFORM' as TrainStatus, label: 'At Platform' },
                { status: 'WAITING_DEPARTURE' as TrainStatus, label: 'Waiting Dep.' },
                { status: 'COMPLETED' as TrainStatus, label: 'Completed' },
              ].map((s) => (
                <button
                  key={s.status}
                  onClick={() => handleApplyStatus(s.status)}
                  className={`py-1.5 px-2.5 rounded-xl text-[10px] font-mono border transition-all ${
                    train.status === s.status
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/30'
                      : 'bg-slate-950/80 text-slate-300 border-white/[0.08] hover:bg-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
