import {
  TrainRecord,
  Platform,
  AllocationRecommendation,
  AlternativePlatformOption,
} from '@/types/railway';
import {
  addMinutesToTimeString,
  parseTimeToMinutes,
  doWindowsOverlap,
} from '@/utils/timeUtils';

export interface AllocationEngineOptions {
  bufferMinutes?: number; // Safety buffer between train occupancies (default 10 min)
}

/**
 * Platform Allocation Engine for Pune Junction
 * Deterministic multi-factor scoring algorithm to select the optimal, conflict-free platform.
 */
export function evaluatePlatformForTrain(
  train: TrainRecord,
  platform: Platform,
  allTrains: TrainRecord[],
  options: AllocationEngineOptions = {}
): { isEligible: boolean; score: number; disqualificationReason?: string; scoreBreakdown: string[] } {
  const { bufferMinutes = 10 } = options;
  const reasons: string[] = [];
  let score = 0;

  // 1. Maintenance Check
  if (platform.isUnderMaintenance || platform.status === 'MAINTENANCE') {
    return {
      isEligible: false,
      score: 0,
      disqualificationReason: `Platform ${platform.platformNumber} is closed for track/catenary maintenance.`,
      scoreBreakdown: [],
    };
  }

  // 2. Train Length vs Platform Length Compatibility
  if (train.rakeLength > platform.lengthCapacityCoaches) {
    return {
      isEligible: false,
      score: 0,
      disqualificationReason: `Rake length (${train.rakeLength} coaches) exceeds platform capacity (${platform.lengthCapacityCoaches} coaches).`,
      scoreBreakdown: [],
    };
  }
  // Length fit score: perfect fit gets bonus, excessive waste penalized slightly
  const excessCapacity = platform.lengthCapacityCoaches - train.rakeLength;
  if (excessCapacity === 0 || excessCapacity <= 2) {
    score += 25;
    reasons.push(`Optimal rake length match (${train.rakeLength}c on ${platform.lengthCapacityCoaches}c platform) [+25 pts]`);
  } else if (excessCapacity <= 4) {
    score += 20;
    reasons.push(`Good rake capacity fit (${excessCapacity} coach buffer) [+20 pts]`);
  } else {
    score += 15;
    reasons.push(`Platform accommodates rake with ${excessCapacity} coach extra length [+15 pts]`);
  }

  // 3. Train Type Compatibility
  if (!platform.compatibleTypes.includes(train.trainType)) {
    return {
      isEligible: false,
      score: 0,
      disqualificationReason: `Train type ${train.trainType} is not cleared for Platform ${platform.platformNumber}.`,
      scoreBreakdown: [],
    };
  }
  score += 15;
  reasons.push(`Type ${train.trainType} permitted on platform [+15 pts]`);

  // 4. Time Window Overlap Check
  // Train's window: estimatedArrivalPune to estimatedArrivalPune + turnaroundDurationMins
  const trainArrival = train.estimatedArrivalPune;
  const trainDeparture = addMinutesToTimeString(trainArrival, train.turnaroundDurationMins);

  // Check against other trains assigned or occupying this platform
  const conflictingTrains = allTrains.filter((other) => {
    if (other.trainNumber === train.trainNumber) return false;
    if (other.status === 'COMPLETED' || other.status === 'DEPARTED') return false;
    if (other.assignedPlatform !== platform.platformNumber) return false;

    // Other train's active window
    const otherArrival = other.estimatedArrivalPune;
    const otherDeparture = addMinutesToTimeString(otherArrival, other.turnaroundDurationMins);

    return doWindowsOverlap(
      trainArrival,
      trainDeparture,
      otherArrival,
      otherDeparture,
      bufferMinutes
    );
  });

  if (conflictingTrains.length > 0) {
    const conflictNames = conflictingTrains.map((t) => `${t.trainNumber} (${t.estimatedArrivalPune})`).join(', ');
    return {
      isEligible: false,
      score: 0,
      disqualificationReason: `Occupancy window overlap with Train(s) ${conflictNames} within ${bufferMinutes}m buffer.`,
      scoreBreakdown: [],
    };
  }

  // Check if platform is currently occupied right now by another train
  if (platform.occupyingTrainNumber && platform.occupyingTrainNumber !== train.trainNumber) {
    if (platform.occupancyEndTime) {
      const trainArrMins = parseTimeToMinutes(trainArrival);
      const pfClearMins = parseTimeToMinutes(platform.occupancyEndTime) + bufferMinutes;
      // If train arrives before platform clears
      if (trainArrMins < pfClearMins) {
        return {
          isEligible: false,
          score: 0,
          disqualificationReason: `Platform occupied by Train ${platform.occupyingTrainNumber} until ${platform.occupancyEndTime}.`,
          scoreBreakdown: [],
        };
      }
      score += 20;
      reasons.push(`Platform frees up at ${platform.occupancyEndTime} before train arrival [+20 pts]`);
    } else {
      return {
        isEligible: false,
        score: 0,
        disqualificationReason: `Platform currently occupied by Train ${platform.occupyingTrainNumber}.`,
        scoreBreakdown: [],
      };
    }
  } else {
    // Platform is currently available
    score += 35;
    reasons.push(`Platform is currently idle/available [+35 pts]`);
  }

  // 5. Terminal Convenience Bonus (Mainline Platforms 1-3 get slight preference for Superfast/Express)
  if (platform.platformNumber <= 3 && (train.trainType === 'SUPERFAST' || train.trainType === 'VANDE_BHARAT')) {
    score += 15;
    reasons.push(`Mainline passenger concourse proximity bonus [+15 pts]`);
  }

  return {
    isEligible: true,
    score,
    scoreBreakdown: reasons,
  };
}

/**
 * Computes recommendations for all trains or a single target train
 */
export function generatePlatformRecommendations(
  trains: TrainRecord[],
  platforms: Platform[],
  options: AllocationEngineOptions = {}
): Map<string, AllocationRecommendation> {
  const recommendations = new Map<string, AllocationRecommendation>();

  // Filter trains that need an active platform assignment
  // APPROACHING, WAITING_PLATFORM, SCHEDULED
  trains.forEach((train) => {
    const alternativeOptions: AlternativePlatformOption[] = [];
    let bestPlatform: number | null = null;
    let highestScore = -1;
    let bestReasons: string[] = [];

    platforms.forEach((platform) => {
      const evaluation = evaluatePlatformForTrain(train, platform, trains, options);
      if (evaluation.isEligible) {
        alternativeOptions.push({
          platformNumber: platform.platformNumber,
          score: evaluation.score,
          reason: evaluation.scoreBreakdown.join('; '),
        });

        if (evaluation.score > highestScore) {
          highestScore = evaluation.score;
          bestPlatform = platform.platformNumber;
          bestReasons = evaluation.scoreBreakdown;
        }
      }
    });

    // Sort alternatives by score descending
    alternativeOptions.sort((a, b) => b.score - a.score);

    const hasConflict = bestPlatform === null;
    const conflictReason = hasConflict
      ? `No conflict-free platform available for ${train.rakeLength}-coach ${train.trainType} around ${train.estimatedArrivalPune}. All platforms occupied, under maintenance, or incompatible.`
      : undefined;

    recommendations.set(train.trainNumber, {
      trainNumber: train.trainNumber,
      recommendedPlatform: bestPlatform,
      score: highestScore > 0 ? highestScore : 0,
      reasons: bestReasons.length > 0 ? bestReasons : ['No platform meets conflict-free time window and rake specifications.'],
      alternativePlatforms: alternativeOptions,
      conflictDetected: hasConflict,
      conflictReason,
    });
  });

  return recommendations;
}
