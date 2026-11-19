'use client';

import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  RotateCcw,
  Plus,
  Download,
  Train,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { useRailway } from '@/context/RailwayContext';
import { TrainRecord, TrainType } from '@/types/railway';

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    resetSimulation,
    addTrain,
    platforms,
    trains,
    updatePlatformMaintenance,
  } = useRailway();

  const [isAddTrainOpen, setIsAddTrainOpen] = useState(false);
  const [newTrainNo, setNewTrainNo] = useState('');
  const [newTrainName, setNewTrainName] = useState('');
  const [newOrigin, setNewOrigin] = useState('Daund Jn');
  const [newDest, setNewDest] = useState('Pune Jn');
  const [newType, setNewType] = useState<TrainType>('EXPRESS');
  const [newLength, setNewLength] = useState(22);
  const [newDepDaund, setNewDepDaund] = useState('06:00 AM');
  const [newArrPune, setNewArrPune] = useState('07:15 AM');

  const handleSaveNewTrain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainNo.trim()) return;

    const newTrain: TrainRecord = {
      id: `train-${newTrainNo.trim()}`,
      trainNumber: newTrainNo.trim(),
      trainName: newTrainName.trim() || `Train ${newTrainNo.trim()}`,
      origin: newOrigin.trim(),
      destination: newDest.trim(),
      trainType: newType,
      rakeLength: newLength,
      scheduledDepartureDaund: newDepDaund,
      scheduledArrivalPune: newArrPune,
      intermediateStops: [],
      delayMinutes: 0,
      estimatedArrivalPune: newArrPune,
      status: 'SCHEDULED',
      assignedPlatform: null,
      allocationStatus: 'WAITING',
      departurePriorityRank: null,
      priorityScore: 0,
      turnaroundDurationMins: 25,
      lastUpdated: new Date().toISOString(),
      simulatedDistanceKm: 0,
    };

    addTrain(newTrain);
    setIsAddTrainOpen(false);
    setNewTrainNo('');
    setNewTrainName('');
  };

  const handleExportJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      settings,
      trains,
      platforms,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `railway_daund_pune_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-xl bg-[#091122] border border-slate-800 p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-400/30">
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Timetable Configuration & Simulation Parameters
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800">
              OPERATIONAL TUNING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Configure platform clearance safety margins, priority tie-breaker rules, and corridor train records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddTrainOpen(true)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Train to Timetable</span>
          </button>
          <button
            onClick={resetSimulation}
            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restore Factory Timetable</span>
          </button>
        </div>
      </div>

      {/* Grid: Parameters & Platform Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulation Parameters */}
        <div className="bg-[#091122] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="h-4 w-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Algorithm Scoring Parameters
            </h3>
          </div>

          {/* Safety Buffer Minutes */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="text-slate-300 font-semibold">
                Platform Clearance Safety Buffer
              </label>
              <span className="font-mono text-sky-400 font-bold">
                {settings.safetyBufferMinutes} minutes
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Minimum headway buffer required between departure of preceding train and berthing of next train on the same platform.
            </p>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={settings.safetyBufferMinutes}
              onChange={(e) => updateSettings({ safetyBufferMinutes: parseInt(e.target.value, 10) })}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Secondary Priority Criterion */}
          <div className="pt-3 border-t border-slate-800">
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Delay Tie-Breaker Rule (Departure Priority Engine)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Criterion used to order trains with identical accumulated delay minutes in the departure queue.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSettings({ secondaryPriorityRule: 'SCHEDULED_DEPARTURE' })}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition ${
                  settings.secondaryPriorityRule === 'SCHEDULED_DEPARTURE'
                    ? 'bg-sky-950/60 text-sky-300 border-sky-600'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-white">Earlier Sched. Departure</div>
                <div className="text-[10px] text-slate-400 mt-0.5">FIFO by timetable order</div>
              </button>
              <button
                onClick={() => updateSettings({ secondaryPriorityRule: 'TRAIN_NUMBER' })}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition ${
                  settings.secondaryPriorityRule === 'TRAIN_NUMBER'
                    ? 'bg-sky-950/60 text-sky-300 border-sky-600'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-white">Stable Train Number</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Deterministic numerical</div>
              </button>
            </div>
          </div>

          {/* Data Backup & Export */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300 font-semibold block">Export Corridor Dataset</span>
              <span className="text-[10px] text-slate-400">Download current session JSON backup</span>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Pune Junction Platform Config */}
        <div className="bg-[#091122] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers className="h-4 w-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Pune Junction Platform Specifications
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Platform capacities and maintenance states can be adjusted to verify dynamic auto-reallocation.
          </p>

          <div className="space-y-2.5">
            {platforms.map((p) => (
              <div
                key={p.platformNumber}
                className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">Platform {p.platformNumber}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      Capacity: {p.lengthCapacityCoaches} Coaches
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Status: <strong className={p.isUnderMaintenance ? 'text-rose-400' : 'text-emerald-400'}>{p.status}</strong>
                  </div>
                </div>

                <button
                  onClick={() => updatePlatformMaintenance(p.platformNumber, !p.isUnderMaintenance)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition ${
                    p.isUnderMaintenance
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/40'
                  }`}
                >
                  {p.isUnderMaintenance ? 'Re-open Track' : 'Simulate Track Closure'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* College Project Academic Credits Card */}
      <div className="bg-[#091122] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <GraduationCap className="h-5 w-5 text-sky-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Academic Project Attribution & Context
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Project Title</span>
            <span className="font-bold text-white">Intelligent Train Traffic & Platform Management</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Group ID & Institution</span>
            <span className="font-bold text-white">TYBDCE106 • MIT School of Computing, MIT-WPU</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Faculty Guide</span>
            <span className="font-bold text-sky-400">Prof. Amol Dande</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Student Team</span>
            <span className="font-bold text-slate-200">Krish Jha, Divyansh Thite, Riya Chavan, Kshitij Dogra</span>
          </div>
        </div>
      </div>

      {/* Add Train Modal */}
      {isAddTrainOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1426] border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Train className="h-4 w-4 text-sky-400" />
                <span>Add Train to Corridor Timetable</span>
              </h3>
              <button
                onClick={() => setIsAddTrainOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewTrain} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Train Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12128"
                    value={newTrainNo}
                    onChange={(e) => setNewTrainNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Coach Length</label>
                  <input
                    type="number"
                    min="8"
                    max="26"
                    value={newLength}
                    onChange={(e) => setNewLength(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Train Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Intercity Express"
                  value={newTrainName}
                  onChange={(e) => setNewTrainName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sched Daund Dep</label>
                  <input
                    type="text"
                    placeholder="06:00 AM"
                    value={newDepDaund}
                    onChange={(e) => setNewDepDaund(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sched Pune Arr</label>
                  <input
                    type="text"
                    placeholder="07:15 AM"
                    value={newArrPune}
                    onChange={(e) => setNewArrPune(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Train Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as TrainType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  <option value="SUPERFAST">SUPERFAST</option>
                  <option value="EXPRESS">EXPRESS</option>
                  <option value="VANDE_BHARAT">VANDE BHARAT</option>
                  <option value="DURONTO">DURONTO</option>
                  <option value="PASSENGER">PASSENGER</option>
                  <option value="SPECIAL">SPECIAL</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTrainOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                >
                  Save Train
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
