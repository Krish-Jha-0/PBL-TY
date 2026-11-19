'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Train,
  Layers,
  ArrowUpDown,
  AlertTriangle,
  ClipboardList,
  Settings,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Shuffle,
  RefreshCw,
  Clock,
  Radio,
  CheckCircle2,
  Info,
  X,
  Edit3,
  SlidersHorizontal,
} from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';
import { TrainRecord, TrainStatus } from '@/types/railway';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: (ctx: ReturnType<typeof useRailway>) => number | string | null;
  badgeColor?: (ctx: ReturnType<typeof useRailway>) => string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Overview',
    href: '/',
    icon: Activity,
    badge: (ctx) => `${ctx.trains.length}`,
    badgeColor: () => 'bg-slate-800 text-slate-300 border border-slate-700',
  },
  {
    name: 'Train Monitor',
    href: '/trains',
    icon: Train,
    badge: (ctx) => (ctx.metrics.totalDelayed > 0 ? `${ctx.metrics.totalDelayed} delayed` : 'On Time'),
    badgeColor: (ctx) =>
      ctx.metrics.totalDelayed > 0
        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  },
  {
    name: 'Platform Allocation',
    href: '/platforms',
    icon: Layers,
    badge: (ctx) => `${ctx.metrics.platformsOccupiedCount}/6 PF`,
    badgeColor: () => 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  },
  {
    name: 'Priority Queue',
    href: '/priorities',
    icon: ArrowUpDown,
    badge: (ctx) => (ctx.priorityQueue.length > 0 ? `${ctx.priorityQueue.length} queued` : null),
    badgeColor: () => 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  },
  {
    name: 'Conflict Management',
    href: '/conflicts',
    icon: AlertTriangle,
    badge: (ctx) => (ctx.conflicts.length > 0 ? `${ctx.conflicts.length}` : '0'),
    badgeColor: (ctx) =>
      ctx.conflicts.length > 0
        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
        : 'bg-slate-800 text-slate-400 border border-slate-700',
  },
  {
    name: 'Controller Decisions',
    href: '/decisions',
    icon: ClipboardList,
    badge: (ctx) => ctx.decisions.length,
    badgeColor: () => 'bg-slate-800 text-slate-300 border border-slate-700',
  },
  {
    name: 'Timetable & Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function RailwayShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ctx = useRailway();
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [modalTrain, setModalTrain] = useState<TrainRecord | null>(null);
  const [editDelay, setEditDelay] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<TrainStatus>('SCHEDULED');

  const openTrainEditor = (train: TrainRecord) => {
    setModalTrain(train);
    setEditDelay(train.delayMinutes);
    setEditStatus(train.status);
    setIsDelayModalOpen(true);
  };

  const saveTrainEdits = () => {
    if (!modalTrain) return;
    if (editDelay !== modalTrain.delayMinutes) {
      ctx.updateTrainDelay(modalTrain.trainNumber, editDelay, 'Manual delay adjustment via inspector modal');
    }
    if (editStatus !== modalTrain.status) {
      ctx.updateTrainStatus(modalTrain.trainNumber, editStatus);
    }
    setIsDelayModalOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#050914] text-slate-100 overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#080e1c] border-r border-slate-800/80 flex flex-col z-20">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-md shadow-sky-500/20 border border-sky-400/30">
              <Train className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
                  RailTraffic <span className="text-sky-400 font-mono text-xs">OS</span>
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Daund–Pune Corridor</p>
            </div>
          </div>

          <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 flex items-center justify-between">
            <span className="font-semibold text-slate-300">Group TYBDCE106</span>
            <span className="text-sky-400 font-mono">MIT-WPU CSE</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const badgeVal = item.badge ? item.badge(ctx) : null;
            const badgeStyle = item.badgeColor ? item.badgeColor(ctx) : 'bg-slate-800 text-slate-300';
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {badgeVal !== null && badgeVal !== undefined && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${badgeStyle}`}>
                    {badgeVal}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Active Corridor Card */}
        <div className="p-3.5 m-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-sky-400" />
              <span>Corridor Route</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Double Track Electric</span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                DD (Daund Jn)
              </span>
              <span className="text-slate-500 text-[10px]">0.0 km</span>
            </div>
            <div className="pl-3 border-l border-slate-700/80 ml-1.5 space-y-1 text-slate-400 text-[10px]">
              <div className="flex justify-between">
                <span>Kedgaon</span>
                <span className="text-slate-500">21.0 km</span>
              </div>
              <div className="flex justify-between">
                <span>Uruli</span>
                <span className="text-slate-500">47.0 km</span>
              </div>
              <div className="flex justify-between">
                <span>Hadapsar</span>
                <span className="text-slate-500">70.0 km</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sky-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                PUNE (Pune Jn)
              </span>
              <span className="text-sky-400">76.0 km</span>
            </div>
          </div>
        </div>

        {/* System Disclaimer Footer */}
        <div className="p-2.5 border-t border-slate-800/80 text-[10px] text-slate-500 text-center bg-slate-950">
          Advisory Decision Support System
          <div className="text-[9px] text-slate-600 mt-0.5">Automated Platform & Priority Allocation</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#080e1c] border-b border-slate-800/80 px-5 flex items-center justify-between flex-shrink-0 z-10">
          {/* Left: Corridor & Route Title */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Intelligent Train Traffic & Platform Management
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-950 text-sky-300 border border-sky-800/60">
                  Daund Jn ➔ Pune Jn
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Automated Platform Allocation & Delay-Based Sequencing</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-mono">Central Railway • Solapur Division</span>
              </div>
            </div>
          </div>

          {/* Right: Simulation Controls Toolbar */}
          <div className="flex items-center gap-3">
            {/* Simulation Clock Display */}
            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-xs">
              <Clock className="h-4 w-4 text-sky-400" />
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 leading-none font-semibold">
                  Simulated Time
                </div>
                <div className="text-sm font-bold font-mono text-sky-300 leading-tight mt-0.5">
                  {ctx.simulatedTime}
                </div>
              </div>
              <div className="ml-1 pl-2 border-l border-slate-700">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                    ctx.isSimulationRunning
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      ctx.isSimulationRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  ></span>
                  {ctx.isSimulationRunning ? 'RUNNING' : 'PAUSED'}
                </span>
              </div>
            </div>

            {/* Simulation Action Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
              {/* Play / Pause Toggle */}
              <button
                onClick={ctx.toggleSimulation}
                className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                  ctx.isSimulationRunning
                    ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/40 border border-amber-500/30'
                    : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/30'
                }`}
                title={ctx.isSimulationRunning ? 'Pause simulation clock' : 'Start simulation clock'}
              >
                {ctx.isSimulationRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span className="hidden xl:inline text-[11px] font-mono">
                  {ctx.isSimulationRunning ? 'Pause' : 'Start'}
                </span>
              </button>

              {/* Step +5m */}
              <button
                onClick={() => ctx.stepSimulation(5)}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 border border-slate-700/60 transition"
                title="Advance simulation by 5 minutes"
              >
                <FastForward className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-[11px]">+5m</span>
              </button>

              {/* Step +15m */}
              <button
                onClick={() => ctx.stepSimulation(15)}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 border border-slate-700/60 transition"
                title="Advance simulation by 15 minutes"
              >
                <FastForward className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-[11px]">+15m</span>
              </button>

              {/* Inject Delay */}
              <button
                onClick={ctx.injectRandomDelay}
                className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded text-xs font-medium flex items-center gap-1.5 border border-amber-500/30 transition"
                title="Simulate random delay disturbance on an active train"
              >
                <Shuffle className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden xl:inline text-[11px]">Inject Delay</span>
              </button>

              {/* Recalculate */}
              <button
                onClick={ctx.recalculateAllocations}
                className="px-2.5 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 rounded text-xs font-medium flex items-center gap-1.5 border border-sky-500/30 transition"
                title="Recalculate platform allocation algorithm across corridor"
              >
                <RefreshCw className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden xl:inline text-[11px]">Recalculate</span>
              </button>

              {/* Reset */}
              <button
                onClick={ctx.resetSimulation}
                className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded border border-slate-700/60 transition"
                title="Reset simulation to reference timetable"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Global Notification Banner */}
        {ctx.notification && (
          <div
            className={`px-5 py-2.5 flex items-center justify-between text-xs font-medium border-b transition-all ${
              ctx.notification.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
                : ctx.notification.type === 'warning'
                ? 'bg-amber-950/90 text-amber-300 border-amber-800'
                : 'bg-sky-950/90 text-sky-300 border-sky-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {ctx.notification.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              {ctx.notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
              {ctx.notification.type === 'info' && <Info className="h-4 w-4 text-sky-400" />}
              <span>{ctx.notification.message}</span>
            </div>
            <button
              onClick={ctx.dismissNotification}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Main Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-[#050914]">
          {children}
        </main>
      </div>

      {/* Train Detail / Edit Modal */}
      {isDelayModalOpen && modalTrain && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a1122] border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="font-mono text-sky-400">#{modalTrain.trainNumber}</span>
                  <span>{modalTrain.trainName}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {modalTrain.origin} ➔ {modalTrain.destination} • {modalTrain.rakeLength} Coaches ({modalTrain.trainType})
                </p>
              </div>
              <button
                onClick={() => setIsDelayModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Schedule Stats */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans">Sched Daund Dep</span>
                  <span className="text-slate-200 font-semibold">{modalTrain.scheduledDepartureDaund}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans">Sched Pune Arr</span>
                  <span className="text-slate-200 font-semibold">{modalTrain.scheduledArrivalPune}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans">Est Pune Arrival</span>
                  <span className="text-amber-300 font-bold">{modalTrain.estimatedArrivalPune}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans">Assigned Platform</span>
                  <span className="text-sky-300 font-semibold">
                    {modalTrain.assignedPlatform ? `Platform ${modalTrain.assignedPlatform}` : 'None Assigned'}
                  </span>
                </div>
              </div>

              {/* Edit Simulated Delay */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400" />
                    Simulated Delay
                  </label>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    +{editDelay} mins
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="5"
                  value={editDelay}
                  onChange={(e) => setEditDelay(parseInt(e.target.value, 10))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <div className="flex gap-1.5 mt-2.5">
                  {[0, 10, 20, 35, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => setEditDelay(d)}
                      className={`flex-1 py-1 rounded text-[10px] font-mono border transition ${
                        editDelay === d
                          ? 'bg-sky-600 text-white border-sky-400 font-semibold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {d === 0 ? 'On Time' : `+${d}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Simulated Status */}
              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Train Operational Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TrainStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-hidden focus:border-sky-500"
                >
                  <option value="SCHEDULED">SCHEDULED (At Daund Jn)</option>
                  <option value="APPROACHING">APPROACHING (En route)</option>
                  <option value="WAITING_PLATFORM">WAITING_PLATFORM (Outer signal)</option>
                  <option value="AT_PLATFORM">AT_PLATFORM (Berthed)</option>
                  <option value="WAITING_DEPARTURE">WAITING_DEPARTURE (Ready to dispatch)</option>
                  <option value="DEPARTED">DEPARTED (Left station)</option>
                  <option value="COMPLETED">COMPLETED (Journey finished)</option>
                </select>
              </div>

              {/* Priority Notice */}
              <div className="bg-sky-950/40 border border-sky-800/60 p-3 rounded-lg text-[11px] text-sky-300/90 leading-relaxed">
                <span className="font-semibold text-sky-200">Delay-Prioritization Rule:</span> If this train is marked &quot;Waiting Departure&quot;, higher delay will automatically rank it higher in the departure sequence.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDelayModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveTrainEdits}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
