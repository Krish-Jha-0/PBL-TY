import { calculateDeparturePriorities } from '../engine/prioritization';
import { evaluatePlatformForTrain, generatePlatformRecommendations } from '../engine/platformAllocation';
import { detectCorridorConflicts } from '../engine/conflictEngine';
import { parseTimeToMinutes, formatMinutesToTime, doWindowsOverlap, addMinutesToTimeString } from '../utils/timeUtils';
import { TrainRecord, Platform } from '../types/railway';
import { INITIAL_PLATFORMS } from '../data/platforms';

export function runRailwayVerificationTests() {
  console.log('=== RUNNING RAILWAY SYSTEM VERIFICATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: Time Utilities & Midnight Crossing
  const t1 = parseTimeToMinutes('10:25 PM'); // 22 * 60 + 25 = 1345
  const t2 = parseTimeToMinutes('12:10 AM'); // 0 * 60 + 10 = 10
  assert(t1 === 1345, 'parseTimeToMinutes("10:25 PM") returns 1345');
  assert(t2 === 10, 'parseTimeToMinutes("12:10 AM") returns 10');
  assert(formatMinutesToTime(10) === '12:10 AM', 'formatMinutesToTime(10) returns "12:10 AM"');

  const addedTime = addMinutesToTimeString('11:50 PM', 25);
  assert(addedTime === '12:15 AM', 'addMinutesToTimeString crossing midnight: 11:50 PM + 25m = 12:15 AM');

  // TEST 2: Overlapping Window Detection
  const overlaps1 = doWindowsOverlap('02:00 AM', '02:30 AM', '02:20 AM', '02:50 AM', 5);
  const overlaps2 = doWindowsOverlap('02:00 AM', '02:30 AM', '03:00 AM', '03:30 AM', 5);
  assert(overlaps1 === true, 'doWindowsOverlap detects overlapping windows (02:00-02:30 vs 02:20-02:50)');
  assert(overlaps2 === false, 'doWindowsOverlap confirms non-overlapping windows (02:00-02:30 vs 03:00-03:30)');

  // TEST 3: Core Rule: Higher Delay First Prioritization
  const mockTrains: TrainRecord[] = [
    {
      id: 't-1',
      trainNumber: '11042',
      trainName: 'Shirdi Exp',
      origin: 'Shirdi',
      destination: 'Dadar',
      trainType: 'EXPRESS',
      rakeLength: 20,
      scheduledDepartureDaund: '12:55 AM',
      scheduledArrivalPune: '02:15 AM',
      intermediateStops: [],
      delayMinutes: 20,
      estimatedArrivalPune: '02:35 AM',
      status: 'WAITING_DEPARTURE',
      assignedPlatform: 2,
      allocationStatus: 'APPROVED',
      departurePriorityRank: null,
      priorityScore: 20,
      turnaroundDurationMins: 25,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 't-2',
      trainNumber: '12116',
      trainName: 'Siddheshwar Exp',
      origin: 'Solapur',
      destination: 'CSMT',
      trainType: 'SUPERFAST',
      rakeLength: 24,
      scheduledDepartureDaund: '01:30 AM',
      scheduledArrivalPune: '02:45 AM',
      intermediateStops: [],
      delayMinutes: 35,
      estimatedArrivalPune: '03:20 AM',
      status: 'WAITING_DEPARTURE',
      assignedPlatform: 4,
      allocationStatus: 'APPROVED',
      departurePriorityRank: null,
      priorityScore: 35,
      turnaroundDurationMins: 25,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 't-3',
      trainNumber: '11040',
      trainName: 'Maharashtra Exp',
      origin: 'Gondia',
      destination: 'Kolhapur',
      trainType: 'EXPRESS',
      rakeLength: 22,
      scheduledDepartureDaund: '01:40 AM',
      scheduledArrivalPune: '03:25 AM',
      intermediateStops: [],
      delayMinutes: 8,
      estimatedArrivalPune: '03:33 AM',
      status: 'WAITING_DEPARTURE',
      assignedPlatform: 5,
      allocationStatus: 'APPROVED',
      departurePriorityRank: null,
      priorityScore: 8,
      turnaroundDurationMins: 25,
      lastUpdated: new Date().toISOString(),
    },
  ];

  const priorities = calculateDeparturePriorities(mockTrains);
  assert(priorities.length === 3, 'Prioritizes all 3 eligible waiting trains');
  assert(priorities[0].trainNumber === '12116' && priorities[0].rank === 1, 'Rank 1 is Train 12116 (Highest delay: 35m)');
  assert(priorities[1].trainNumber === '11042' && priorities[1].rank === 2, 'Rank 2 is Train 11042 (Middle delay: 20m)');
  assert(priorities[2].trainNumber === '11040' && priorities[2].rank === 3, 'Rank 3 is Train 11040 (Lowest delay: 8m)');

  // TEST 4: Platform Compatibility & Length Rejection
  const longTrain: TrainRecord = {
    ...mockTrains[0],
    rakeLength: 26, // 26 coaches
    trainNumber: '99999',
  };
  const shortPlatform: Platform = {
    ...INITIAL_PLATFORMS[5], // PF 6 has 20 coach capacity
    platformNumber: 6,
    lengthCapacityCoaches: 20,
  };
  const evalResult = evaluatePlatformForTrain(longTrain, shortPlatform, mockTrains);
  assert(evalResult.isEligible === false, 'Disqualifies train with length 26 coaches on 20-coach platform');

  // TEST 5: Maintenance Platform Disqualification
  const maintPlatform: Platform = {
    ...INITIAL_PLATFORMS[0],
    isUnderMaintenance: true,
  };
  const evalMaint = evaluatePlatformForTrain(mockTrains[0], maintPlatform, mockTrains);
  assert(evalMaint.isEligible === false, 'Disqualifies platform under active track maintenance');

  // TEST 6: Conflict Detection Engine
  const conflictingTrainPair: TrainRecord[] = [
    {
      ...mockTrains[0],
      assignedPlatform: 1,
      estimatedArrivalPune: '02:00 AM',
      turnaroundDurationMins: 30,
      status: 'AT_PLATFORM',
    },
    {
      ...mockTrains[1],
      assignedPlatform: 1, // Same platform 1!
      estimatedArrivalPune: '02:15 AM', // Overlaps with 02:00 - 02:30!
      turnaroundDurationMins: 30,
      status: 'APPROACHING',
    },
  ];

  const detectedConflicts = detectCorridorConflicts(conflictingTrainPair, INITIAL_PLATFORMS);
  assert(detectedConflicts.length >= 1, 'Detects critical overlapping occupancy conflict on Platform 1');
  assert(detectedConflicts[0].type === 'OVERLAPPING_OCCUPANCY', 'Conflict type identified as OVERLAPPING_OCCUPANCY');

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed };
}

// Self-run if executed directly via node/tsx
if (typeof require !== 'undefined' && require.main === module) {
  runRailwayVerificationTests();
}
