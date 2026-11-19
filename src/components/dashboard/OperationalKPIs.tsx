'use client';

import React from 'react';
import {
  Train,
  Clock,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';

export function OperationalKPIs() {
  const { metrics, priorityQueue, conflicts } = useRailway();

  const cards = [
    {
      title: 'Corridor Trains',
      value: metrics.totalTrains,
      subtitle: 'Daund ➔ Pune timetable',
      icon: Train,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/15',
      borderColor: 'border-slate-800 hover:border-sky-500/40',
    },
    {
      title: 'Approaching Pune',
      value: metrics.approachingCount,
      subtitle: 'Active in corridor blocks',
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
      borderColor: 'border-slate-800 hover:border-blue-500/40',
    },
    {
      title: 'Delayed Trains',
      value: metrics.totalDelayed,
      subtitle:
        metrics.totalDelayed > 0
          ? `Avg delay: ${metrics.averageDelayMinutes} mins`
          : 'All trains on schedule',
      icon: Clock,
      color: metrics.totalDelayed > 0 ? 'text-amber-400' : 'text-emerald-400',
      bgColor: metrics.totalDelayed > 0 ? 'bg-amber-500/15' : 'bg-emerald-500/15',
      borderColor:
        metrics.totalDelayed > 0
          ? 'border-amber-500/30 hover:border-amber-500/50'
          : 'border-slate-800 hover:border-emerald-500/40',
    },
    {
      title: 'Platforms Occupied',
      value: `${metrics.platformsOccupiedCount} / 6`,
      subtitle: `${6 - metrics.platformsOccupiedCount} platforms available`,
      icon: Layers,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/15',
      borderColor: 'border-slate-800 hover:border-indigo-500/40',
    },
    {
      title: 'Departure Queue',
      value: priorityQueue.length,
      subtitle:
        priorityQueue.length > 0
          ? `Lead: #${priorityQueue[0]?.trainNumber} (+${priorityQueue[0]?.delayMinutes}m)`
          : 'Queue idle',
      icon: ArrowUpDown,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/15',
      borderColor: 'border-slate-800 hover:border-purple-500/40',
    },
    {
      title: 'Active Conflicts',
      value: conflicts.length,
      subtitle:
        conflicts.length > 0
          ? 'Action required in Conflict tab'
          : 'Safety buffer compliant',
      icon: conflicts.length > 0 ? AlertTriangle : ShieldCheck,
      color: conflicts.length > 0 ? 'text-rose-400' : 'text-emerald-400',
      bgColor: conflicts.length > 0 ? 'bg-rose-500/15' : 'bg-emerald-500/15',
      borderColor:
        conflicts.length > 0
          ? 'border-rose-500/40'
          : 'border-slate-800 hover:border-emerald-500/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-xl bg-[#091122] border ${card.borderColor} transition-all duration-200 hover:-translate-y-0.5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-1">
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                {card.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                {card.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
