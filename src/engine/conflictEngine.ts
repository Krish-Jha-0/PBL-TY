import {
  TrainRecord,
  Platform,
  AllocationConflict,
} from '@/types/railway';
import {
  addMinutesToTimeString,
  doWindowsOverlap,
  parseTimeToMinutes,
} from '@/utils/timeUtils';

/**
 * Intelligent Conflict Detection & Sequencing Engine
 * Audits all train assignments and operational schedules for bottlenecks, collisions,
 * and capacity violations.
 */
export function detectCorridorConflicts(
  trains: TrainRecord[],
  platforms: Platform[],
  bufferMinutes = 10,
  nowStr = '02:30 AM'
): AllocationConflict[] {
  const conflicts: AllocationConflict[] = [];

  // 1. Check for Overlapping Occupancy on the Same Platform
  const activeTrainsWithPlatform = trains.filter(
    (t) =>
      t.assignedPlatform !== null &&
      t.status !== 'COMPLETED' &&
      t.status !== 'DEPARTED'
  );

  const platformGroups = new Map<number, TrainRecord[]>();
  activeTrainsWithPlatform.forEach((t) => {
    const pf = t.assignedPlatform!;
    if (!platformGroups.has(pf)) {
      platformGroups.set(pf, []);
    }
    platformGroups.get(pf)!.push(t);
  });

  platformGroups.forEach((trainsOnPf, platformNumber) => {
    for (let i = 0; i < trainsOnPf.length; i++) {
      for (let j = i + 1; j < trainsOnPf.length; j++) {
        const t1 = trainsOnPf[i];
        const t2 = trainsOnPf[j];

        const t1Arr = t1.estimatedArrivalPune;
        const t1Dep = addMinutesToTimeString(t1Arr, t1.turnaroundDurationMins);

        const t2Arr = t2.estimatedArrivalPune;
        const t2Dep = addMinutesToTimeString(t2Arr, t2.turnaroundDurationMins);

        if (doWindowsOverlap(t1Arr, t1Dep, t2Arr, t2Dep, bufferMinutes)) {
          // Find alternative platform for t2
          const availableAlt = platforms.find(
            (p) =>
              p.platformNumber !== platformNumber &&
              !p.isUnderMaintenance &&
              p.lengthCapacityCoaches >= t2.rakeLength &&
              !platformGroups.get(p.platformNumber)?.some((other) =>
                doWindowsOverlap(
                  t2Arr,
                  t2Dep,
                  other.estimatedArrivalPune,
                  addMinutesToTimeString(other.estimatedArrivalPune, other.turnaroundDurationMins),
                  bufferMinutes
                )
              )
          );

          conflicts.push({
            id: `conflict-overlap-${t1.trainNumber}-${t2.trainNumber}-pf${platformNumber}`,
            severity: 'CRITICAL',
            type: 'OVERLAPPING_OCCUPANCY',
            platformNumber,
            affectedTrainNumbers: [t1.trainNumber, t2.trainNumber],
            description: `Simultaneous platform berthing clash on Platform ${platformNumber}: Train ${t1.trainNumber} (${t1.trainName}, est. ${t1Arr}-${t1Dep}) overlaps with Train ${t2.trainNumber} (${t2.trainName}, est. ${t2Arr}-${t2Dep}) within ${bufferMinutes}m safety clearance buffer.`,
            suggestedResolution: availableAlt
              ? `Reallocate Train ${t2.trainNumber} to idle Platform ${availableAlt.platformNumber} (${availableAlt.lengthCapacityCoaches}c capacity).`
              : `Hold Train ${t2.trainNumber} in outer approach track or delay berthing by ${bufferMinutes + 15} minutes until Platform ${platformNumber} clears.`,
            timestamp: nowStr,
          });
        }
      }
    }
  });

  // 2. Check for Platform Assigned to an Under-Maintenance / Closed Platform
  trains.forEach((t) => {
    if (t.assignedPlatform !== null && t.status !== 'COMPLETED' && t.status !== 'DEPARTED') {
      const pfObj = platforms.find((p) => p.platformNumber === t.assignedPlatform);
      if (pfObj && (pfObj.isUnderMaintenance || pfObj.status === 'MAINTENANCE')) {
        conflicts.push({
          id: `conflict-maint-${t.trainNumber}-pf${t.assignedPlatform}`,
          severity: 'CRITICAL',
          type: 'PLATFORM_UNAVAILABLE',
          platformNumber: t.assignedPlatform,
          affectedTrainNumbers: [t.trainNumber],
          description: `Train ${t.trainNumber} is assigned to Platform ${t.assignedPlatform}, which is currently under active track/catenary maintenance.`,
          suggestedResolution: `Reassign Train ${t.trainNumber} to an operational platform immediately before arrival.`,
          timestamp: nowStr,
        });
      }
    }
  });

  // 3. Check for Incompatible Platform Length / Type Combinations
  trains.forEach((t) => {
    if (t.assignedPlatform !== null && t.status !== 'COMPLETED' && t.status !== 'DEPARTED') {
      const pfObj = platforms.find((p) => p.platformNumber === t.assignedPlatform);
      if (pfObj) {
        if (t.rakeLength > pfObj.lengthCapacityCoaches) {
          conflicts.push({
            id: `conflict-incompat-len-${t.trainNumber}-pf${t.assignedPlatform}`,
            severity: 'CRITICAL',
            type: 'INCOMPATIBLE_RAKE',
            platformNumber: t.assignedPlatform,
            affectedTrainNumbers: [t.trainNumber],
            description: `Capacity hazard: Train ${t.trainNumber} rake length (${t.rakeLength} coaches) exceeds Platform ${t.assignedPlatform} berth limit (${pfObj.lengthCapacityCoaches} coaches). Rear coaches will overhang active mainline switches.`,
            suggestedResolution: `Move Train ${t.trainNumber} to Platform 1 or Platform 2/4 (24-26 coach capacity).`,
            timestamp: nowStr,
          });
        }
        if (!pfObj.compatibleTypes.includes(t.trainType)) {
          conflicts.push({
            id: `conflict-incompat-type-${t.trainNumber}-pf${t.assignedPlatform}`,
            severity: 'WARNING',
            type: 'INCOMPATIBLE_RAKE',
            platformNumber: t.assignedPlatform,
            affectedTrainNumbers: [t.trainNumber],
            description: `Operational limitation: Train ${t.trainNumber} (${t.trainType}) is not flagged compatible with Platform ${t.assignedPlatform} routing specs.`,
            suggestedResolution: `Reassign to a compatible express mainline platform.`,
            timestamp: nowStr,
          });
        }
      }
    }
  });

  // 4. Check for Approaching Trains Without Any Platform Assignment
  trains.forEach((t) => {
    if ((t.status === 'APPROACHING' || t.status === 'WAITING_PLATFORM') && t.assignedPlatform === null) {
      conflicts.push({
        id: `conflict-no-platform-${t.trainNumber}`,
        severity: 'WARNING',
        type: 'NO_PLATFORM_ASSIGNED',
        affectedTrainNumbers: [t.trainNumber],
        description: `Train ${t.trainNumber} (${t.trainName}) is approaching Pune Junction (estimated arrival ${t.estimatedArrivalPune}) without any approved or allocated platform berth.`,
        suggestedResolution: `Execute intelligent platform allocation or assign a free platform manually.`,
        timestamp: nowStr,
      });
    }
  });

  // 5. Sequencing Inconsistencies: Headway and Overtaking along Corridor
  // Check active trains travelling on the corridor
  const activeEnRoute = trains
    .filter((t) => t.status === 'APPROACHING')
    .sort((a, b) => (b.simulatedDistanceKm || 0) - (a.simulatedDistanceKm || 0));

  for (let k = 0; k < activeEnRoute.length - 1; k++) {
    const lead = activeEnRoute[k];
    const follower = activeEnRoute[k + 1];

    const leadArr = parseTimeToMinutes(lead.estimatedArrivalPune);
    const followerArr = parseTimeToMinutes(follower.estimatedArrivalPune);

    // If follower train is estimated to arrive EARLIER than lead train, but lead train is physically ahead
    // and neither has an intermediate siding loop, sequencing inversion exists!
    if (followerArr < leadArr && (lead.simulatedDistanceKm || 0) > (follower.simulatedDistanceKm || 0)) {
      conflicts.push({
        id: `conflict-seq-${lead.trainNumber}-${follower.trainNumber}`,
        severity: 'INFO',
        type: 'SEQUENCING_INCONSISTENCY',
        affectedTrainNumbers: [lead.trainNumber, follower.trainNumber],
        description: `Track headway / sequencing inversion: Faster train ${follower.trainNumber} (${follower.trainName}, est. ${follower.estimatedArrivalPune}) is following slower train ${lead.trainNumber} (${lead.trainName}, est. ${lead.estimatedArrivalPune}) without scheduled loop overtake.`,
        suggestedResolution: `Schedule overtake at Kedgaon or Uruli loop line, or regulate follower train speed to preserve 5-minute block section headway.`,
        timestamp: nowStr,
      });
    }
  }

  return conflicts;
}
