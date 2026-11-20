'use client';

import React from 'react';
import { Train, Radio, ArrowRight } from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';
import { CORRIDOR_STATIONS } from '@/data/trainTimetable';
import { TrainRecord } from '@/types/railway';

export function CorridorTrackMap({ onSelectTrain }: { onSelectTrain: (train: TrainRecord) => void }) {
  const { trains, simulatedTime } = useRailway();

  // Find trains currently en route or in transit along the corridor
  const activeTrains = trains.filter(
    (t) => t.status === 'APPROACHING' || t.status === 'WAITING_PLATFORM' || t.status === 'AT_PLATFORM'
  );

  return (
    <div className="rounded-xl bg-[#091122] border border-slate-800 p-5 shadow-sm">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-sky-400 animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Corridor Track Schematic & Movement Monitor
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time block section positions between Daund Jn (0.0 km) and Pune Jn (76.0 km)
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Clear Block</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300">
            <Train className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-semibold">{activeTrains.length} Active Trains</span>
          </div>
        </div>
      </div>

      {/* Track Schematic Visualizer */}
      <div className="relative py-10 px-4 overflow-x-auto min-w-[740px] select-none">
        {/* Main Double Electric Track Lines */}
        <div className="relative h-14 flex items-center">
          {/* Track Line */}
          <div className="absolute top-4 left-0 right-0 h-1.5 bg-slate-700 rounded-full">
            {/* Railroad sleepers effect */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,#334155_8px,#334155_12px)] opacity-60 rounded-full"></div>
          </div>

          {/* Catenary Wire Guide */}
          <div className="absolute top-9 left-0 right-0 h-[1px] bg-sky-900/40 border-b border-dashed border-sky-800/40"></div>

          {/* Station Markers */}
          {CORRIDOR_STATIONS.map((station) => {
            const percentage = (station.distanceKm / 76) * 100;
            const isTerminal = station.code === 'DD' || station.code === 'PUNE';

            return (
              <div
                key={station.code}
                className="absolute transform -translate-x-1/2 flex flex-col items-center z-10"
                style={{ left: `${percentage}%` }}
              >
                {/* Station Lamp Signal */}
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${isTerminal
                    ? 'bg-sky-500 border-sky-300 shadow-md shadow-sky-500/40'
                    : 'bg-slate-900 border-slate-500 shadow-xs'
                    }`}
                >
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${isTerminal ? 'bg-white' : 'bg-emerald-400'
                      }`}
                  ></div>
                </div>

                {/* Station Pillar */}
                <div className="h-5 w-0.5 bg-slate-600 mt-0.5"></div>

                {/* Station Label & Distance */}
                <div className="mt-1 text-center bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                  <span
                    className={`text-[11px] font-bold block ${isTerminal ? 'text-white' : 'text-slate-300'
                      }`}
                  >
                    {station.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {station.distanceKm.toFixed(1)} km
                  </span>
                </div>
              </div>
            );
          })}

          {/* Dynamic Active Trains Moving on Track */}
          {activeTrains.map((train) => {
            const distance = Math.min(76, Math.max(0, train.simulatedDistanceKm || 0));
            const percentage = (distance / 76) * 100;
            const isDelayed = train.delayMinutes > 0;

            return (
              <div
                key={train.trainNumber}
                onClick={() => onSelectTrain(train)}
                className="absolute top-[-16px] transform -translate-x-1/2 cursor-pointer group z-20 transition-all duration-200 hover:scale-110 hover:z-30"
                style={{ left: `${percentage}%` }}
              >
                {/* Train Badge */}
                <div
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg border transition-all ${isDelayed
                    ? 'bg-amber-950/90 text-amber-200 border-amber-500/70 shadow-amber-950'
                    : 'bg-sky-950/90 text-sky-200 border-sky-400/70 shadow-sky-950'
                    } group-hover:border-white`}
                >
                  <Train className="h-3 w-3" />
                  <span>#{train.trainNumber}</span>
                  {isDelayed ? (
                    <span className="text-[9px] px-1 bg-amber-500/30 rounded text-amber-300">
                      +{train.delayMinutes}m
                    </span>
                  ) : (
                    <span className="text-[9px] px-1 bg-emerald-500/20 rounded text-emerald-300">
                      On Time
                    </span>
                  )}
                </div>

                {/* Triangle Pointing to Track */}
                <div className="flex justify-center -mt-0.5">
                  <div
                    className={`h-2 w-2 transform rotate-45 ${isDelayed ? 'bg-amber-500' : 'bg-sky-400'
                      }`}
                  ></div>
                </div>

                {/* Hover Tooltip Card */}
                <div className="hidden group-hover:block absolute bottom-12 left-1/2 transform -translate-x-1/2 w-48 p-2.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-[11px] text-slate-200 z-30 pointer-events-none">
                  <div className="font-bold text-white text-xs">{train.trainName}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    {train.origin} ➔ {train.destination}
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800 space-y-0.5 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Position:</span>
                      <span className="text-sky-300 font-semibold">{distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-slate-200 font-semibold">{train.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Est Pune Arr:</span>
                      <span className="text-amber-300 font-semibold">{train.estimatedArrivalPune}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Platform:</span>
                      <span className="text-white font-semibold">
                        {train.assignedPlatform ? `Platform ${train.assignedPlatform}` : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Corridor Footer Metadata */}
        <div className="mt-14 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">Dispatch Direction:</span>
            <span className="text-sky-300 font-semibold flex items-center gap-1 font-mono text-xs">
              Westbound Corridor (Daund Junction ➔ Pune Junction)
              <ArrowRight className="h-3 w-3 text-sky-400" />
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span>Simulated Clock:</span>
            <span className="text-slate-200 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {simulatedTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
