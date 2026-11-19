'use client';

import React, { useMemo } from 'react';
import { Layers, AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';
import { parseTimeToMinutes, formatMinutesToTime, addMinutesToTimeString } from '@/utils/timeUtils';
import { TrainRecord } from '@/types/railway';

interface GanttBar {
  train: TrainRecord;
  startMinutes: number;
  durationMinutes: number;
  platformNumber: number;
  startTimeStr: string;
  endTimeStr: string;
  hasOverlap: boolean;
}

export function PlatformGanttTimeline({ onSelectTrain }: { onSelectTrain: (train: TrainRecord) => void }) {
  const { platforms, trains, simulatedTime, conflicts } = useRailway();

  const currentSimMins = parseTimeToMinutes(simulatedTime);
  // Window: 2 hours before simulated time to 4 hours after simulated time (6 hours total = 360 mins)
  const windowStartMins = (currentSimMins - 120 + 1440) % 1440;
  const windowDurationMins = 360;

  // Build Gantt bars for trains assigned to platforms
  const ganttBars = useMemo(() => {
    const bars: GanttBar[] = [];

    // Find conflicting train numbers
    const conflictingTrainSet = new Set<string>();
    conflicts.forEach((c) => {
      c.affectedTrainNumbers.forEach((tn) => conflictingTrainSet.add(tn));
    });

    trains.forEach((t) => {
      if (t.assignedPlatform === null) return;
      if (t.status === 'COMPLETED' || t.status === 'DEPARTED') return;

      const startMins = parseTimeToMinutes(t.estimatedArrivalPune);
      const duration = t.turnaroundDurationMins || 25;
      const endMins = (startMins + duration) % 1440;

      bars.push({
        train: t,
        startMinutes: startMins,
        durationMinutes: duration,
        platformNumber: t.assignedPlatform,
        startTimeStr: t.estimatedArrivalPune,
        endTimeStr: addMinutesToTimeString(t.estimatedArrivalPune, duration),
        hasOverlap: conflictingTrainSet.has(t.trainNumber),
      });
    });

    return bars;
  }, [trains, conflicts]);

  // Hourly markers across 6 hours window
  const timeMarkers = useMemo(() => {
    const markers: { timeStr: string; minuteOffset: number }[] = [];
    for (let i = 0; i <= windowDurationMins; i += 60) {
      const markerMins = (windowStartMins + i) % 1440;
      markers.push({
        timeStr: formatMinutesToTime(markerMins),
        minuteOffset: i,
      });
    }
    return markers;
  }, [windowStartMins]);

  // Helper to calculate X percentage position inside the 6h window
  const getXPercentage = (startMins: number) => {
    let diff = startMins - windowStartMins;
    if (diff < 0) diff += 1440;
    if (diff > windowDurationMins + 120) diff -= 1440; // in case of wrap
    return (diff / windowDurationMins) * 100;
  };

  const getWidthPercentage = (durationMins: number) => {
    return Math.max(3, (durationMins / windowDurationMins) * 100);
  };

  const currentTimeMarkerX = getXPercentage(currentSimMins);

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0a1226]/90 to-[#060b18]/90 border border-white/[0.08] p-5 shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-white/[0.08] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
              Pune Junction Platform Gantt Timeline
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Operational berth occupancy windows and clearances across Platforms 1 to 6
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span>Normal Berth</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span>
            <span>Collision Overlap</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            <Clock className="h-3.5 w-3.5" />
            <span>Clock: {simulatedTime}</span>
          </div>
        </div>
      </div>

      {/* Gantt Matrix Chart */}
      <div className="relative overflow-x-auto min-w-[750px]">
        {/* Time Header Scale */}
        <div className="grid grid-cols-12 gap-0 border-b border-white/[0.08] pb-2 mb-3 pl-24 text-[10px] font-mono text-slate-400 font-bold">
          {timeMarkers.map((m, idx) => (
            <div key={idx} className="relative">
              <span className="block transform -translate-x-1/2">{m.timeStr}</span>
            </div>
          ))}
        </div>

        {/* Platform Rows */}
        <div className="space-y-2.5 relative">
          {/* Vertical Current Simulated Time Indicator Line */}
          {currentTimeMarkerX >= 0 && currentTimeMarkerX <= 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 z-20 pointer-events-none ml-24 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
              style={{ left: `${currentTimeMarkerX}%` }}
            >
              <div className="absolute -top-3.5 -left-9 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-mono text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
                NOW ({simulatedTime})
              </div>
            </div>
          )}

          {platforms.map((platform) => {
            const platformBars = ganttBars.filter((b) => b.platformNumber === platform.platformNumber);
            const isMaint = platform.isUnderMaintenance || platform.status === 'MAINTENANCE';

            return (
              <div
                key={platform.platformNumber}
                className="flex items-center h-12 bg-slate-900/70 rounded-xl border border-white/[0.06] relative overflow-hidden group hover:border-cyan-500/30 transition"
              >
                {/* Platform Label Column */}
                <div className="w-24 px-3 flex-shrink-0 flex items-center justify-between border-r border-white/[0.08] bg-slate-950/90 h-full z-10">
                  <div className="font-mono font-black text-xs text-white">PF {platform.platformNumber}</div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      isMaint
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : platform.status === 'OCCUPIED'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {isMaint ? 'CLOSED' : `${platform.lengthCapacityCoaches}c`}
                  </span>
                </div>

                {/* Timeline Grid Track */}
                <div className="flex-1 h-full relative">
                  {/* Subtle vertical hour grid lines */}
                  <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                    {timeMarkers.map((_, i) => (
                      <div key={i} className="border-r border-slate-600 h-full"></div>
                    ))}
                  </div>

                  {/* Maintenance Shading */}
                  {isMaint && (
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#450a0a,#450a0a_10px,#7f1d1d_10px,#7f1d1d_20px)] opacity-60 flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold text-rose-200 bg-black/80 px-3 py-1 rounded-full border border-rose-600/50">
                        PLATFORM CLOSED FOR TRACK MAINTENANCE
                      </span>
                    </div>
                  )}

                  {/* Render Occupancy Bars for this Platform */}
                  {!isMaint &&
                    platformBars.map((bar) => {
                      const leftPercent = getXPercentage(bar.startMinutes);
                      const widthPercent = getWidthPercentage(bar.durationMinutes);

                      // Only render if within visible window range
                      if (leftPercent < -20 || leftPercent > 120) return null;

                      return (
                        <div
                          key={bar.train.trainNumber}
                          onClick={() => onSelectTrain(bar.train)}
                          className={`absolute top-1.5 bottom-1.5 rounded-xl cursor-pointer flex items-center px-2.5 shadow-lg transition-transform hover:scale-[1.03] z-10 border ${
                            bar.hasOverlap
                              ? 'bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 text-rose-100 border-rose-400 animate-pulse shadow-rose-950'
                              : 'bg-gradient-to-r from-cyan-900/90 via-sky-800/90 to-indigo-900/90 text-cyan-100 border-cyan-400/80 hover:border-white shadow-cyan-950/60'
                          }`}
                          style={{
                            left: `${Math.max(0, leftPercent)}%`,
                            width: `${widthPercent}%`,
                            minWidth: '95px',
                          }}
                          title={`Train ${bar.train.trainNumber}: ${bar.startTimeStr} to ${bar.endTimeStr}`}
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden text-[10px] font-mono font-bold">
                            {bar.hasOverlap && <AlertTriangle className="h-3 w-3 text-rose-300 flex-shrink-0" />}
                            <span className="truncate">{bar.train.trainNumber}</span>
                            <span className="text-[9px] opacity-80 hidden md:inline truncate">
                              ({bar.startTimeStr.split(' ')[0]})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
