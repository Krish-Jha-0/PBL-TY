import { TrainRecord, DeparturePriorityItem } from '@/types/railway';
import { parseTimeToMinutes } from '@/utils/timeUtils';

export interface PrioritizationOptions {
  secondarySortCriterion?: 'SCHEDULED_DEPARTURE' | 'TRAIN_NUMBER';
}

/**
 * Intelligent Train Prioritization Engine
 * Core Rule: Among trains waiting for departure, the train with the higher current delay
 * receives higher departure priority.
 *
 * Prototype Policy Notice:
 * This algorithm is an academic demonstration prioritization heuristic (Higher-Delay-First)
 * designed to minimize cumulative delay escalation across congested terminal bottleneck tracks.
 * It is not an official Indian Railways dispatch rule.
 */
export function calculateDeparturePriorities(
  trains: TrainRecord[],
  options: PrioritizationOptions = {}
): DeparturePriorityItem[] {
  const { secondarySortCriterion = 'SCHEDULED_DEPARTURE' } = options;

  // Filter trains eligible for departure:
  // Must be marked as WAITING_DEPARTURE or AT_PLATFORM with turnaround completed
  const eligibleTrains = trains.filter(
    (t) => t.status === 'WAITING_DEPARTURE' || (t.status === 'AT_PLATFORM' && t.assignedPlatform !== null)
  );

  // Sort strictly by Current Delay in descending order (higher delay first)
  const sorted = [...eligibleTrains].sort((a, b) => {
    // Primary criterion: Delay descending
    if (b.delayMinutes !== a.delayMinutes) {
      return b.delayMinutes - a.delayMinutes;
    }

    // Secondary criterion: Scheduled departure from Daund or arrival time
    if (secondarySortCriterion === 'SCHEDULED_DEPARTURE') {
      const aSchedMins = parseTimeToMinutes(a.scheduledDepartureDaund);
      const bSchedMins = parseTimeToMinutes(b.scheduledDepartureDaund);
      if (aSchedMins !== bSchedMins) {
        return aSchedMins - bSchedMins; // Earlier scheduled departs first in a tie
      }
    }

    // Tertiary stable criterion: Train number alphabetical/numerical
    return a.trainNumber.localeCompare(b.trainNumber);
  });

  // Assign ranks and generate explanation reasoning
  return sorted.map((train, index) => {
    const rank = index + 1;
    let reasoning = `Rank #${rank}: Current delay ${train.delayMinutes} mins. `;

    if (index === 0) {
      reasoning += `Highest delay among ready trains (${train.delayMinutes}m). Dispatched first to prevent cumulative delay compounding.`;
    } else {
      const prevTrain = sorted[index - 1];
      if (train.delayMinutes === prevTrain.delayMinutes) {
        reasoning += `Tied delay (${train.delayMinutes}m) resolved via earlier scheduled run (${train.scheduledDepartureDaund}) vs Train ${prevTrain.trainNumber}.`;
      } else {
        reasoning += `Subordinate to Rank #${index} (Train ${prevTrain.trainNumber}, delay ${prevTrain.delayMinutes}m) under Higher-Delay-First policy.`;
      }
    }

    return {
      rank,
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      delayMinutes: train.delayMinutes,
      scheduledDepartureDaund: train.scheduledDepartureDaund,
      status: train.status,
      platformNumber: train.assignedPlatform,
      reasoning,
      isApproved: train.departurePriorityRank === rank,
    };
  });
}

/**
 * Updates train records with calculated priority ranks
 */
export function applyPrioritiesToTrains(
  trains: TrainRecord[],
  priorityQueue: DeparturePriorityItem[]
): TrainRecord[] {
  const rankMap = new Map<string, number>();
  const reasonMap = new Map<string, string>();

  priorityQueue.forEach((item) => {
    rankMap.set(item.trainNumber, item.rank);
    reasonMap.set(item.trainNumber, item.reasoning);
  });

  return trains.map((t) => {
    const rank = rankMap.get(t.trainNumber) ?? null;
    const priorityReason = reasonMap.get(t.trainNumber) ?? t.priorityReason;

    return {
      ...t,
      departurePriorityRank: rank,
      priorityReason: rank ? priorityReason : (t.status === 'WAITING_DEPARTURE' ? t.priorityReason : undefined),
    };
  });
}
