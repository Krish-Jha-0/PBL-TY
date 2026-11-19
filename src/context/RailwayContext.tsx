'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrainRecord,
  Platform,
  ControllerDecision,
  AllocationConflict,
  DeparturePriorityItem,
  AllocationRecommendation,
  SimulationState,
  TrainStatus,
} from '@/types/railway';
import { StorageAdapter, AppSettings, DEFAULT_SETTINGS } from '@/persistence/storageAdapter';
import {
  stepSimulationTime,
  injectDemoRandomDelay,
  computeSimulationMetrics,
  INITIAL_SIMULATED_TIME,
} from '@/engine/simulation';
import { calculateDeparturePriorities, applyPrioritiesToTrains } from '@/engine/prioritization';
import { generatePlatformRecommendations } from '@/engine/platformAllocation';
import { detectCorridorConflicts } from '@/engine/conflictEngine';
import { addMinutesToTimeString } from '@/utils/timeUtils';

interface RailwayContextType {
  trains: TrainRecord[];
  platforms: Platform[];
  simulatedTime: string;
  isSimulationRunning: boolean;
  decisions: ControllerDecision[];
  settings: AppSettings;
  selectedTrain: TrainRecord | null;
  conflicts: AllocationConflict[];
  priorityQueue: DeparturePriorityItem[];
  recommendations: Map<string, AllocationRecommendation>;
  metrics: SimulationState;
  notification: { message: string; type: 'success' | 'warning' | 'info' } | null;
  
  // Actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  toggleSimulation: () => void;
  stepSimulation: (minutes: number) => void;
  resetSimulation: () => void;
  injectRandomDelay: () => void;
  updateTrainDelay: (trainNumber: string, delayMinutes: number, reason?: string) => void;
  updateTrainStatus: (trainNumber: string, status: TrainStatus) => void;
  assignPlatformManually: (trainNumber: string, platformNumber: number | null) => void;
  approvePlatformRecommendation: (trainNumber: string) => void;
  rejectPlatformRecommendation: (trainNumber: string) => void;
  recalculateAllocations: () => void;
  recalculatePriorities: () => void;
  resolveConflictWithSuggestion: (conflictId: string) => void;
  updatePlatformMaintenance: (platformNumber: number, isMaintenance: boolean) => void;
  setSelectedTrain: (train: TrainRecord | null) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addTrain: (train: TrainRecord) => void;
  editTrainSchedule: (trainNumber: string, updates: Partial<TrainRecord>) => void;
  deleteTrain: (trainNumber: string) => void;
  dismissNotification: () => void;
}

const RailwayContext = createContext<RailwayContextType | undefined>(undefined);

export function RailwayProvider({ children }: { children: React.ReactNode }) {
  const [trains, setTrains] = useState<TrainRecord[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [simulatedTime, setSimulatedTime] = useState<string>(INITIAL_SIMULATED_TIME);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [decisions, setDecisions] = useState<ControllerDecision[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedTrain, setSelectedTrain] = useState<TrainRecord | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const showNotification = useCallback((message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setNotification({ message, type });
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Hydrate on client mount from local persistence
  useEffect(() => {
    const loadedTrains = StorageAdapter.loadTrains();
    const loadedPlatforms = StorageAdapter.loadPlatforms();
    const loadedTime = StorageAdapter.loadSimulatedTime();
    const loadedDecisions = StorageAdapter.loadDecisions();
    const loadedSettings = StorageAdapter.loadSettings();

    // Initial prioritization & ranks
    const initialPriorities = calculateDeparturePriorities(loadedTrains, {
      secondarySortCriterion: loadedSettings.secondaryPriorityRule,
    });
    const prioritizedTrains = applyPrioritiesToTrains(loadedTrains, initialPriorities);

    setTrains(prioritizedTrains);
    setPlatforms(loadedPlatforms);
    setSimulatedTime(loadedTime);
    setDecisions(loadedDecisions);
    setSettings(loadedSettings);
    setIsHydrated(true);
  }, []);

  // Save changes to persistence whenever state updates
  useEffect(() => {
    if (!isHydrated) return;
    StorageAdapter.saveTrains(trains);
    StorageAdapter.savePlatforms(platforms);
    StorageAdapter.saveSimulatedTime(simulatedTime);
    StorageAdapter.saveDecisions(decisions);
    StorageAdapter.saveSettings(settings);
  }, [trains, platforms, simulatedTime, decisions, settings, isHydrated]);

  // Derived calculations
  const priorityQueue = useMemo(() => {
    return calculateDeparturePriorities(trains, {
      secondarySortCriterion: settings.secondaryPriorityRule,
    });
  }, [trains, settings.secondaryPriorityRule]);

  const recommendations = useMemo(() => {
    return generatePlatformRecommendations(trains, platforms, {
      bufferMinutes: settings.safetyBufferMinutes,
    });
  }, [trains, platforms, settings.safetyBufferMinutes]);

  const conflicts = useMemo(() => {
    return detectCorridorConflicts(trains, platforms, settings.safetyBufferMinutes);
  }, [trains, platforms, settings.safetyBufferMinutes]);

  const metrics = useMemo(() => {
    return computeSimulationMetrics(trains, platforms, simulatedTime, isSimulationRunning);
  }, [trains, platforms, simulatedTime, isSimulationRunning]);

  // Record an audit decision
  const logDecision = useCallback(
    (actionType: ControllerDecision['actionType'], previousValue: string, newValue: string, notes: string, trainNumber?: string, platformNumber?: number) => {
      const decision: ControllerDecision = {
        id: `decision-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        trainNumber,
        platformNumber,
        actionType,
        previousValue,
        newValue,
        notes,
      };
      setDecisions((prev) => [decision, ...prev]);
    },
    []
  );

  // Simulation Controls
  const stepSimulation = useCallback(
    (minutes: number) => {
      setSimulatedTime((prevTime) => {
        const result = stepSimulationTime(prevTime, minutes, trains, platforms);
        setTrains(result.updatedTrains);
        setPlatforms(result.updatedPlatforms);
        return result.newTimeStr;
      });
      showNotification(`Simulation advanced by ${minutes} minutes.`, 'info');
    },
    [trains, platforms, showNotification]
  );

  const startSimulation = useCallback(() => {
    setIsSimulationRunning(true);
    showNotification('Live simulation running.', 'success');
  }, [showNotification]);

  const pauseSimulation = useCallback(() => {
    setIsSimulationRunning(false);
    showNotification('Simulation paused.', 'warning');
  }, [showNotification]);

  const toggleSimulation = useCallback(() => {
    setIsSimulationRunning((prev) => {
      const next = !prev;
      showNotification(next ? 'Live simulation started.' : 'Simulation paused.', next ? 'success' : 'warning');
      return next;
    });
  }, [showNotification]);

  // Interval timer for running simulation
  useEffect(() => {
    if (!isSimulationRunning) return;
    const interval = setInterval(() => {
      stepSimulation(5);
    }, 4000); // Step 5 simulated minutes every 4 seconds
    return () => clearInterval(interval);
  }, [isSimulationRunning, stepSimulation]);

  const resetSimulation = useCallback(() => {
    const defaults = StorageAdapter.resetToDefaults();
    const priorities = calculateDeparturePriorities(defaults.trains, {
      secondarySortCriterion: defaults.settings.secondaryPriorityRule,
    });
    const prioritized = applyPrioritiesToTrains(defaults.trains, priorities);

    setTrains(prioritized);
    setPlatforms(defaults.platforms);
    setSimulatedTime(defaults.simulatedTime);
    setDecisions(defaults.decisions);
    setSettings(defaults.settings);
    setIsSimulationRunning(false);
    setSelectedTrain(null);
    logDecision('RESET_SIMULATION', 'Modified State', 'Reference Factory State', 'Simulation restored to default Daund-Pune schedule.');
    showNotification('Simulation reset to default corridor timetable.', 'info');
  }, [logDecision, showNotification]);

  const injectRandomDelay = useCallback(() => {
    const result = injectDemoRandomDelay(trains);
    if (!result) {
      showNotification('No active trains available to inject delay.', 'warning');
      return;
    }
    setTrains(result.updatedTrains);
    logDecision(
      'CHANGE_DELAY',
      `${result.injectedTrain.delayMinutes - result.addedDelay}m`,
      `${result.injectedTrain.delayMinutes}m`,
      `Injected random demo delay of +${result.addedDelay} mins into Train ${result.injectedTrain.trainNumber} (${result.injectedTrain.trainName}).`,
      result.injectedTrain.trainNumber
    );
    showNotification(
      `Injected +${result.addedDelay}m delay into Train ${result.injectedTrain.trainNumber} (${result.injectedTrain.trainName}). Priorities recalculated!`,
      'warning'
    );
  }, [trains, logDecision, showNotification]);

  const updateTrainDelay = useCallback(
    (trainNumber: string, newDelayMinutes: number, reason?: string) => {
      setTrains((prev) => {
        const target = prev.find((t) => t.trainNumber === trainNumber);
        if (!target) return prev;

        const prevDelay = target.delayMinutes;
        const newEstimatedArrival = addMinutesToTimeString(target.scheduledArrivalPune, newDelayMinutes);

        const updated = prev.map((t) => {
          if (t.trainNumber === trainNumber) {
            return {
              ...t,
              delayMinutes: newDelayMinutes,
              estimatedArrivalPune: newEstimatedArrival,
              priorityScore: newDelayMinutes,
              priorityReason: reason || `Delay updated by controller to ${newDelayMinutes} mins.`,
              lastUpdated: new Date().toISOString(),
            };
          }
          return t;
        });

        const pq = calculateDeparturePriorities(updated, { secondarySortCriterion: settings.secondaryPriorityRule });
        const finalized = applyPrioritiesToTrains(updated, pq);

        logDecision(
          'CHANGE_DELAY',
          `${prevDelay}m`,
          `${newDelayMinutes}m`,
          reason || `Controller manual delay adjustment for Train ${trainNumber}`,
          trainNumber
        );

        return finalized;
      });
      showNotification(`Train ${trainNumber} delay updated to ${newDelayMinutes}m.`, 'success');
    },
    [settings.secondaryPriorityRule, logDecision, showNotification]
  );

  const updateTrainStatus = useCallback(
    (trainNumber: string, status: TrainStatus) => {
      setTrains((prev) => {
        const target = prev.find((t) => t.trainNumber === trainNumber);
        if (!target) return prev;

        const prevStatus = target.status;
        const updated = prev.map((t) => (t.trainNumber === trainNumber ? { ...t, status, lastUpdated: new Date().toISOString() } : t));
        const pq = calculateDeparturePriorities(updated, { secondarySortCriterion: settings.secondaryPriorityRule });
        const finalized = applyPrioritiesToTrains(updated, pq);

        logDecision('CHANGE_STATUS', prevStatus, status, `Controller marked Train ${trainNumber} as ${status}.`, trainNumber);
        return finalized;
      });
      showNotification(`Train ${trainNumber} status set to ${status}.`, 'info');
    },
    [settings.secondaryPriorityRule, logDecision, showNotification]
  );

  const assignPlatformManually = useCallback(
    (trainNumber: string, platformNumber: number | null) => {
      setTrains((prev) => {
        const target = prev.find((t) => t.trainNumber === trainNumber);
        if (!target) return prev;

        const prevPf = target.assignedPlatform ? `Platform ${target.assignedPlatform}` : 'None';
        const newPf = platformNumber ? `Platform ${platformNumber}` : 'None';

        const updated = prev.map((t) =>
          t.trainNumber === trainNumber
            ? {
                ...t,
                assignedPlatform: platformNumber,
                allocationStatus: platformNumber ? ('MANUAL' as const) : ('WAITING' as const),
                lastUpdated: new Date().toISOString(),
              }
            : t
        );

        logDecision(
          'MANUAL_PLATFORM_CHANGE',
          prevPf,
          newPf,
          `Controller manually assigned ${newPf} to Train ${trainNumber}.`,
          trainNumber,
          platformNumber || undefined
        );

        return updated;
      });
      showNotification(`Train ${trainNumber} platform set to ${platformNumber ? `Platform ${platformNumber}` : 'Unassigned'}.`, 'success');
    },
    [logDecision, showNotification]
  );

  const approvePlatformRecommendation = useCallback(
    (trainNumber: string) => {
      const rec = recommendations.get(trainNumber);
      if (!rec || rec.recommendedPlatform === null) {
        showNotification(`No valid recommendation available for Train ${trainNumber}.`, 'warning');
        return;
      }

      setTrains((prev) => {
        const target = prev.find((t) => t.trainNumber === trainNumber);
        if (!target) return prev;

        const prevPf = target.assignedPlatform ? `Platform ${target.assignedPlatform}` : 'None';
        const newPf = `Platform ${rec.recommendedPlatform}`;

        const updated = prev.map((t) =>
          t.trainNumber === trainNumber
            ? {
                ...t,
                assignedPlatform: rec.recommendedPlatform,
                allocationStatus: 'APPROVED' as const,
                lastUpdated: new Date().toISOString(),
              }
            : t
        );

        logDecision(
          'APPROVE_ALLOCATION',
          prevPf,
          newPf,
          `Controller approved algorithm recommendation: ${newPf} (Score: ${rec.score}).`,
          trainNumber,
          rec.recommendedPlatform ?? undefined
        );

        return updated;
      });
      showNotification(`Approved Platform ${rec.recommendedPlatform} for Train ${trainNumber}.`, 'success');
    },
    [recommendations, logDecision, showNotification]
  );

  const rejectPlatformRecommendation = useCallback(
    (trainNumber: string) => {
      setTrains((prev) => {
        const target = prev.find((t) => t.trainNumber === trainNumber);
        if (!target) return prev;

        const prevStatus = target.allocationStatus;
        const updated = prev.map((t) =>
          t.trainNumber === trainNumber
            ? {
                ...t,
                assignedPlatform: null,
                allocationStatus: 'WAITING' as const,
                lastUpdated: new Date().toISOString(),
              }
            : t
        );

        logDecision(
          'REJECT_ALLOCATION',
          prevStatus,
          'WAITING',
          `Controller rejected recommendation for Train ${trainNumber}. Platform cleared.`,
          trainNumber
        );

        return updated;
      });
      showNotification(`Rejected recommendation for Train ${trainNumber}.`, 'info');
    },
    [logDecision, showNotification]
  );

  const recalculateAllocations = useCallback(() => {
    // Re-evaluates recommendations and assigns recommended platforms to trains with 'RECOMMENDED' or 'WAITING'
    const newRecs = generatePlatformRecommendations(trains, platforms, { bufferMinutes: settings.safetyBufferMinutes });
    setTrains((prev) => {
      return prev.map((t) => {
        // Do not silently overwrite controller-APPROVED or MANUAL allocations!
        if (t.allocationStatus === 'APPROVED' || t.allocationStatus === 'MANUAL') {
          return t;
        }
        const rec = newRecs.get(t.trainNumber);
        if (rec && rec.recommendedPlatform !== null) {
          return {
            ...t,
            assignedPlatform: rec.recommendedPlatform,
            allocationStatus: 'RECOMMENDED' as const,
            lastUpdated: new Date().toISOString(),
          };
        }
        return t;
      });
    });
    logDecision('RECALCULATE_PRIORITIES', 'Old Matrix', 'New Matrix', 'Platform allocation algorithm re-executed across corridor.');
    showNotification('Recalculated platform allocations across all active trains.', 'success');
  }, [trains, platforms, settings.safetyBufferMinutes, logDecision, showNotification]);

  const recalculatePriorities = useCallback(() => {
    const pq = calculateDeparturePriorities(trains, { secondarySortCriterion: settings.secondaryPriorityRule });
    const prioritized = applyPrioritiesToTrains(trains, pq);
    setTrains(prioritized);
    logDecision('RECALCULATE_PRIORITIES', 'Queue Refreshed', 'Sorted Queue', 'Recalculated delay-based priority queue.');
    showNotification('Departure priority queue refreshed.', 'success');
  }, [trains, settings.secondaryPriorityRule, logDecision, showNotification]);

  const resolveConflictWithSuggestion = useCallback(
    (conflictId: string) => {
      const conflict = conflicts.find((c) => c.id === conflictId);
      if (!conflict) return;

      if (conflict.type === 'OVERLAPPING_OCCUPANCY' && conflict.affectedTrainNumbers.length >= 2) {
        const trainToMove = conflict.affectedTrainNumbers[1];
        const rec = recommendations.get(trainToMove);
        if (rec && rec.recommendedPlatform !== null && rec.recommendedPlatform !== conflict.platformNumber) {
          assignPlatformManually(trainToMove, rec.recommendedPlatform);
          logDecision(
            'RESOLVE_CONFLICT',
            `Overlap on PF ${conflict.platformNumber}`,
            `PF ${rec.recommendedPlatform}`,
            `Resolved collision: Train ${trainToMove} moved to PF ${rec.recommendedPlatform}.`,
            trainToMove
          );
          showNotification(`Resolved conflict: Moved Train ${trainToMove} to Platform ${rec.recommendedPlatform}.`, 'success');
          return;
        }
      }

      if (conflict.type === 'NO_PLATFORM_ASSIGNED' && conflict.affectedTrainNumbers.length >= 1) {
        const trainNum = conflict.affectedTrainNumbers[0];
        const rec = recommendations.get(trainNum);
        if (rec && rec.recommendedPlatform !== null) {
          approvePlatformRecommendation(trainNum);
          return;
        }
      }

      showNotification('Executing global reallocation to resolve conflict...', 'info');
      recalculateAllocations();
    },
    [conflicts, recommendations, assignPlatformManually, approvePlatformRecommendation, recalculateAllocations, logDecision, showNotification]
  );

  const updatePlatformMaintenance = useCallback(
    (platformNumber: number, isMaintenance: boolean) => {
      setPlatforms((prev) => {
        return prev.map((p) => {
          if (p.platformNumber === platformNumber) {
            return {
              ...p,
              isUnderMaintenance: isMaintenance,
              status: isMaintenance ? 'MAINTENANCE' : 'AVAILABLE',
              occupyingTrainNumber: isMaintenance ? null : p.occupyingTrainNumber,
            };
          }
          return p;
        });
      });
      logDecision(
        'MANUAL_PLATFORM_CHANGE',
        isMaintenance ? 'OPERATIONAL' : 'MAINTENANCE',
        isMaintenance ? 'MAINTENANCE' : 'OPERATIONAL',
        `Platform ${platformNumber} maintenance status toggled to ${isMaintenance ? 'CLOSED' : 'OPEN'}.`,
        undefined,
        platformNumber
      );
      showNotification(`Platform ${platformNumber} is now ${isMaintenance ? 'under maintenance (CLOSED)' : 'operational'}.`, 'warning');
    },
    [logDecision, showNotification]
  );

  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
      showNotification('System parameters updated.', 'success');
    },
    [showNotification]
  );

  const addTrain = useCallback(
    (train: TrainRecord) => {
      setTrains((prev) => {
        const updated = [...prev, train];
        const pq = calculateDeparturePriorities(updated, { secondarySortCriterion: settings.secondaryPriorityRule });
        return applyPrioritiesToTrains(updated, pq);
      });
      logDecision('CHANGE_STATUS', 'NEW', train.status, `Added Train ${train.trainNumber} (${train.trainName}) to corridor.`, train.trainNumber);
      showNotification(`Train ${train.trainNumber} added successfully.`, 'success');
    },
    [settings.secondaryPriorityRule, logDecision, showNotification]
  );

  const editTrainSchedule = useCallback(
    (trainNumber: string, updates: Partial<TrainRecord>) => {
      setTrains((prev) => {
        const updated = prev.map((t) => (t.trainNumber === trainNumber ? { ...t, ...updates, lastUpdated: new Date().toISOString() } : t));
        const pq = calculateDeparturePriorities(updated, { secondarySortCriterion: settings.secondaryPriorityRule });
        return applyPrioritiesToTrains(updated, pq);
      });
      logDecision('CHANGE_STATUS', 'UPDATED', 'SAVED', `Updated schedule/specs for Train ${trainNumber}.`, trainNumber);
      showNotification(`Schedule updated for Train ${trainNumber}.`, 'success');
    },
    [settings.secondaryPriorityRule, logDecision, showNotification]
  );

  const deleteTrain = useCallback(
    (trainNumber: string) => {
      setTrains((prev) => prev.filter((t) => t.trainNumber !== trainNumber));
      logDecision('CHANGE_STATUS', 'DELETED', 'REMOVED', `Removed Train ${trainNumber} from timetable.`, trainNumber);
      showNotification(`Train ${trainNumber} removed from timetable.`, 'info');
    },
    [logDecision, showNotification]
  );

  return (
    <RailwayContext.Provider
      value={{
        trains,
        platforms,
        simulatedTime,
        isSimulationRunning,
        decisions,
        settings,
        selectedTrain,
        conflicts,
        priorityQueue,
        recommendations,
        metrics,
        notification,
        startSimulation,
        pauseSimulation,
        toggleSimulation,
        stepSimulation,
        resetSimulation,
        injectRandomDelay,
        updateTrainDelay,
        updateTrainStatus,
        assignPlatformManually,
        approvePlatformRecommendation,
        rejectPlatformRecommendation,
        recalculateAllocations,
        recalculatePriorities,
        resolveConflictWithSuggestion,
        updatePlatformMaintenance,
        setSelectedTrain,
        updateSettings,
        addTrain,
        editTrainSchedule,
        deleteTrain,
        dismissNotification,
      }}
    >
      {children}
    </RailwayContext.Provider>
  );
}

export function useRailway() {
  const context = useContext(RailwayContext);
  if (!context) {
    throw new Error('useRailway must be used within a RailwayProvider');
  }
  return context;
}
