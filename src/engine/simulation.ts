import { TrainRecord, Platform, SimulationState, TrainStatus } from '@/types/railway';
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  addMinutesToTimeString,
} from '@/utils/timeUtils';
import { calculateDeparturePriorities, applyPrioritiesToTrains } from './prioritization';
import { detectCorridorConflicts } from './conflictEngine';

export const INITIAL_SIMULATED_TIME = '02:30 AM';

/**
 * Steps the simulation forward by deltaMinutes
 */
export function stepSimulationTime(
  currentTimeStr: string,
  deltaMinutes: number,
  trains: TrainRecord[],
  platforms: Platform[]
): {
  newTimeStr: string;
  updatedTrains: TrainRecord[];
  updatedPlatforms: Platform[];
} {
  const currentMins = parseTimeToMinutes(currentTimeStr);
  const nextMins = (currentMins + deltaMinutes) % 1440;
  const newTimeStr = formatMinutesToTime(nextMins);

  // 1. Advance Train Positions and Statuses
  const updatedTrains = trains.map((t) => {
    // If completed or departed, leave as is unless wrapped
    if (t.status === 'COMPLETED') return t;

    const schedDepMins = parseTimeToMinutes(t.scheduledDepartureDaund);
    const estArrMins = parseTimeToMinutes(t.estimatedArrivalPune);
    const turnaround = t.turnaroundDurationMins || 25;
    const estDepMins = (estArrMins + turnaround) % 1440;

    let newStatus: TrainStatus = t.status;
    let distKm = t.simulatedDistanceKm || 0;

    // Transition from SCHEDULED to APPROACHING
    if (t.status === 'SCHEDULED') {
      // If simulated time is within 45 mins before departure or after departure
      const diffToDep = (nextMins - schedDepMins + 1440) % 1440;
      if (diffToDep >= 0 && diffToDep < 180) {
        newStatus = 'APPROACHING';
        // Compute progress based on time elapsed
        const totalTripDuration = (estArrMins - schedDepMins + 1440) % 1440 || 90;
        const progress = Math.min(1, Math.max(0, diffToDep / totalTripDuration));
        distKm = Math.round(progress * 76);
      }
    } else if (t.status === 'APPROACHING') {
      const diffToDep = (nextMins - schedDepMins + 1440) % 1440;
      const totalTripDuration = (estArrMins - schedDepMins + 1440) % 1440 || 90;
      const progress = Math.min(1, Math.max(0, diffToDep / totalTripDuration));
      distKm = Math.round(progress * 76);

      // Check if arrived at Pune
      const diffToArr = (nextMins - estArrMins + 1440) % 1440;
      if (diffToArr >= 0 && diffToArr < 720) {
        distKm = 76;
        if (t.assignedPlatform !== null) {
          newStatus = 'AT_PLATFORM';
        } else {
          newStatus = 'WAITING_PLATFORM';
        }
      }
    } else if (t.status === 'WAITING_PLATFORM') {
      distKm = 76;
      if (t.assignedPlatform !== null) {
        newStatus = 'AT_PLATFORM';
      }
    } else if (t.status === 'AT_PLATFORM') {
      distKm = 76;
      // Check if turnaround duration passed
      const diffFromArr = (nextMins - estArrMins + 1440) % 1440;
      if (diffFromArr >= turnaround) {
        newStatus = 'WAITING_DEPARTURE';
      }
    } else if (t.status === 'WAITING_DEPARTURE') {
      distKm = 76;
      // If priority rank #1 and controller cleared or high delay, departs after 15 mins
      const diffFromDepReady = (nextMins - estDepMins + 1440) % 1440;
      if (diffFromDepReady >= 15 && t.departurePriorityRank === 1) {
        newStatus = 'DEPARTED';
      }
    } else if (t.status === 'DEPARTED') {
      const diffFromDepReady = (nextMins - estDepMins + 1440) % 1440;
      if (diffFromDepReady >= 35) {
        newStatus = 'COMPLETED';
      }
    }

    return {
      ...t,
      status: newStatus,
      simulatedDistanceKm: distKm,
      lastUpdated: newTimeStr,
    };
  });

  // 2. Synchronize Platform Occupancy
  const updatedPlatforms = platforms.map((p) => {
    if (p.isUnderMaintenance) return p;

    // Find train currently at this platform or waiting departure at this platform
    const berthedTrain = updatedTrains.find(
      (t) =>
        t.assignedPlatform === p.platformNumber &&
        (t.status === 'AT_PLATFORM' || t.status === 'WAITING_DEPARTURE')
    );

    if (berthedTrain) {
      const startTime = berthedTrain.estimatedArrivalPune;
      const endTime = addMinutesToTimeString(startTime, berthedTrain.turnaroundDurationMins);
      return {
        ...p,
        status: 'OCCUPIED' as const,
        occupyingTrainNumber: berthedTrain.trainNumber,
        occupancyStartTime: startTime,
        occupancyEndTime: endTime,
        nextAvailableTime: endTime,
      };
    }

    // Check if platform is reserved for an approaching train
    const approachingTrain = updatedTrains.find(
      (t) =>
        t.assignedPlatform === p.platformNumber &&
        (t.status === 'APPROACHING' || t.status === 'WAITING_PLATFORM')
    );

    if (approachingTrain) {
      return {
        ...p,
        status: 'RESERVED' as const,
        occupyingTrainNumber: null,
        occupancyStartTime: approachingTrain.estimatedArrivalPune,
        occupancyEndTime: addMinutesToTimeString(
          approachingTrain.estimatedArrivalPune,
          approachingTrain.turnaroundDurationMins
        ),
        nextAvailableTime: addMinutesToTimeString(
          approachingTrain.estimatedArrivalPune,
          approachingTrain.turnaroundDurationMins
        ),
      };
    }

    // Otherwise platform is available
    return {
      ...p,
      status: 'AVAILABLE' as const,
      occupyingTrainNumber: null,
      occupancyStartTime: null,
      occupancyEndTime: null,
      nextAvailableTime: newTimeStr,
    };
  });

  // 3. Recalculate Priorities
  const priorityQueue = calculateDeparturePriorities(updatedTrains);
  const prioritizedTrains = applyPrioritiesToTrains(updatedTrains, priorityQueue);

  return {
    newTimeStr,
    updatedTrains: prioritizedTrains,
    updatedPlatforms,
  };
}

/**
 * Generates an intentional random demo delay on an active or approaching train
 */
export function injectDemoRandomDelay(
  trains: TrainRecord[]
): { updatedTrains: TrainRecord[]; injectedTrain: TrainRecord; addedDelay: number } | null {
  // Target active or approaching trains first
  const candidates = trains.filter(
    (t) => t.status === 'APPROACHING' || t.status === 'WAITING_DEPARTURE' || t.status === 'AT_PLATFORM' || t.status === 'SCHEDULED'
  );

  if (candidates.length === 0) return null;

  // Pick one deterministically or semi-randomly
  const targetIndex = Math.floor(Math.random() * candidates.length);
  const target = candidates[targetIndex];

  // Random delay between 15 and 45 minutes (increments of 5)
  const delayOptions = [15, 20, 25, 30, 35, 45];
  const addedDelay = delayOptions[Math.floor(Math.random() * delayOptions.length)];
  const newDelay = target.delayMinutes + addedDelay;

  const updatedEstimatedArrival = addMinutesToTimeString(target.scheduledArrivalPune, newDelay);

  const updatedTrains = trains.map((t) => {
    if (t.trainNumber === target.trainNumber) {
      return {
        ...t,
        delayMinutes: newDelay,
        estimatedArrivalPune: updatedEstimatedArrival,
        priorityScore: newDelay,
        priorityReason: `Simulated delay spike (+${addedDelay}m) injected for controller response testing.`,
        lastUpdated: new Date().toISOString(),
      };
    }
    return t;
  });

  // Re-prioritize
  const priorityQueue = calculateDeparturePriorities(updatedTrains);
  const rePrioritized = applyPrioritiesToTrains(updatedTrains, priorityQueue);

  const updatedTarget = rePrioritized.find((t) => t.trainNumber === target.trainNumber)!;

  return {
    updatedTrains: rePrioritized,
    injectedTrain: updatedTarget,
    addedDelay,
  };
}

/**
 * Calculates current simulation summary statistics
 */
export function computeSimulationMetrics(
  trains: TrainRecord[],
  platforms: Platform[],
  currentTimeStr: string,
  isRunning: boolean
): SimulationState {
  const totalTrains = trains.length;
  const delayedTrains = trains.filter((t) => t.delayMinutes > 0);
  const totalDelayed = delayedTrains.length;
  const totalDelayMinutes = delayedTrains.reduce((sum, t) => sum + t.delayMinutes, 0);
  const averageDelayMinutes = totalDelayed > 0 ? Math.round(totalDelayMinutes / totalDelayed) : 0;

  const approachingCount = trains.filter((t) => t.status === 'APPROACHING').length;
  const waitingPlatformCount = trains.filter((t) => t.status === 'WAITING_PLATFORM').length;
  const platformsOccupiedCount = platforms.filter((p) => p.status === 'OCCUPIED').length;

  const conflicts = detectCorridorConflicts(trains, platforms);

  return {
    isRunning,
    simulatedTime: currentTimeStr,
    speedMultiplier: 1,
    stepMinutes: 5,
    totalTrains,
    totalDelayed,
    averageDelayMinutes,
    approachingCount,
    waitingPlatformCount,
    platformsOccupiedCount,
    activeConflictsCount: conflicts.length,
  };
}
