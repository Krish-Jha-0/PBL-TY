'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useRailway } from '@/context/RailwayContext';
import { parseTimeToMinutes } from '@/utils/timeUtils';
import { BarChart3, PieChart as PieIcon, TrendingUp, Layers } from 'lucide-react';

export function RechartsPanels() {
  const { trains, platforms } = useRailway();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Hourly Arrival Distribution (6 4-hour slots across 24h)
  const hourlyData = useMemo(() => {
    const slots = [
      { slot: '00-04h', count: 0 },
      { slot: '04-08h', count: 0 },
      { slot: '08-12h', count: 0 },
      { slot: '12-16h', count: 0 },
      { slot: '16-20h', count: 0 },
      { slot: '20-24h', count: 0 },
    ];

    trains.forEach((t) => {
      const mins = parseTimeToMinutes(t.estimatedArrivalPune);
      const hour = Math.floor(mins / 60);
      const slotIndex = Math.min(5, Math.floor(hour / 4));
      slots[slotIndex].count += 1;
    });

    return slots;
  }, [trains]);

  // 2. Delay Distribution Categories
  const delayData = useMemo(() => {
    const buckets = [
      { name: 'On Time (0m)', count: 0, color: '#10b981' },
      { name: 'Minor (1-15m)', count: 0, color: '#06b6d4' },
      { name: 'Moderate (16-30m)', count: 0, color: '#f59e0b' },
      { name: 'Heavy (31-60m)', count: 0, color: '#f97316' },
      { name: 'Critical (>60m)', count: 0, color: '#f43f5e' },
    ];

    trains.forEach((t) => {
      const d = t.delayMinutes;
      if (d === 0) buckets[0].count += 1;
      else if (d <= 15) buckets[1].count += 1;
      else if (d <= 30) buckets[2].count += 1;
      else if (d <= 60) buckets[3].count += 1;
      else buckets[4].count += 1;
    });

    return buckets;
  }, [trains]);

  // 3. Platform Status Occupancy
  const platformData = useMemo(() => {
    return platforms.map((p) => {
      let statusScore = 0;
      if (p.isUnderMaintenance || p.status === 'MAINTENANCE') statusScore = 1;
      else if (p.status === 'AVAILABLE') statusScore = 2;
      else if (p.status === 'RESERVED') statusScore = 3;
      else if (p.status === 'OCCUPIED') statusScore = 4;

      return {
        platform: `PF ${p.platformNumber}`,
        capacity: p.lengthCapacityCoaches,
        train: p.occupyingTrainNumber || 'Free',
        status: p.status,
        statusScore,
      };
    });
  }, [platforms]);

  // 4. Train Status Breakdown
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      SCHEDULED: 0,
      APPROACHING: 0,
      AT_PLATFORM: 0,
      WAITING_DEPARTURE: 0,
      COMPLETED: 0,
    };

    trains.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status] += 1;
      } else {
        counts['APPROACHING'] += 1;
      }
    });

    return [
      { name: 'Scheduled (DD)', value: counts['SCHEDULED'], color: '#64748b' },
      { name: 'Approaching Pune', value: counts['APPROACHING'], color: '#06b6d4' },
      { name: 'At Platform', value: counts['AT_PLATFORM'], color: '#818cf8' },
      { name: 'Waiting Departure', value: counts['WAITING_DEPARTURE'], color: '#f59e0b' },
      { name: 'Completed / Clear', value: counts['COMPLETED'], color: '#10b981' },
    ].filter((item) => item.value > 0);
  }, [trains]);

  if (!isMounted) {
    return (
      <div className="h-64 rounded-2xl bg-[#0a1226]/80 border border-white/[0.08] flex items-center justify-center text-slate-400 text-xs">
        Loading operational telemetry analytics...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Hourly Arrival Volume */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0a1226]/90 to-[#060b18]/90 border border-white/[0.08] shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Train Arrivals by Time Window
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Scheduled & estimated Pune Junction arrivals</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-700/60 shadow-xs">
            {trains.length} total runs
          </span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="slot" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a1226',
                  borderColor: 'rgba(56,189,248,0.4)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Bar dataKey="count" fill="#00f0ff" radius={[6, 6, 0, 0]} name="Trains Arriving" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Delay Distribution */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0a1226]/90 to-[#060b18]/90 border border-white/[0.08] shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Corridor Delay Severity Breakdown
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Delay classification across active traffic</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-700/60 shadow-xs">
            {delayData[0].count} on time
          </span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={delayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a1226',
                  borderColor: 'rgba(245,158,11,0.4)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Train Count">
                {delayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Pune Platform Capacity & Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0a1226]/90 to-[#060b18]/90 border border-white/[0.08] shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Platform Capacity & Length Limit
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Max coach rake capacity ratings (PF 1 to 6)</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-700/60 shadow-xs">
            6 Platforms
          </span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="platform" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 30]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a1226',
                  borderColor: 'rgba(99,102,241,0.4)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                }}
                formatter={(val, name, item) => [`${val} coaches (${item.payload.status})`, 'Max Length']}
              />
              <Bar dataKey="capacity" fill="#818cf8" radius={[6, 6, 0, 0]} name="Coach Limit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Train Status Breakdown */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0a1226]/90 to-[#060b18]/90 border border-white/[0.08] shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <PieIcon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Corridor Dispatch Phase Proportions
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time status breakdown</p>
            </div>
          </div>
        </div>
        <div className="h-56 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a1226',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                }}
                formatter={(val, name) => [`${val} trains`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3 text-[10px] text-slate-300">
          {statusData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 font-mono font-medium">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span>
                {item.name}: <strong className="text-white">{item.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
