export type TrainStatus =
  | 'SCHEDULED'
  | 'APPROACHING'
  | 'WAITING_PLATFORM'
  | 'AT_PLATFORM'
  | 'WAITING_DEPARTURE'
  | 'DEPARTED'
  | 'COMPLETED';

export type PlatformStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'MAINTENANCE';

export type AllocationStatus =
  | 'RECOMMENDED'
  | 'APPROVED'
  | 'WAITING'
  | 'CONFLICT'
  | 'UNAVAILABLE'
  | 'MANUAL';

export type TrainType =
  | 'SUPERFAST'
  | 'EXPRESS'
  | 'MAIL'
  | 'VANDE_BHARAT'
  | 'DURONTO'
  | 'PASSENGER'
  | 'SPECIAL';

export interface IntermediateStop {
  station: 'Kedgaon' | 'Uruli' | 'Hadapsar';
  scheduledArrival?: string;
  scheduledDeparture?: string;
  stopDurationMins?: number;
}

export interface TrainRecord {
  id: string;
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  trainType: TrainType;
  rakeLength: number; // coaches, e.g., 16, 22, 24
  scheduledDepartureDaund: string; // e.g., "12:10 AM"
  scheduledArrivalPune: string; // e.g., "01:20 AM"
  intermediateStops: IntermediateStop[];
  delayMinutes: number;
  estimatedArrivalPune: string;
  status: TrainStatus;
  assignedPlatform: number | null;
  allocationStatus: AllocationStatus;
  departurePriorityRank: number | null;
  priorityScore: number;
  priorityReason?: string;
  lastUpdated: string;
  crossesMidnight?: boolean;
  turnaroundDurationMins: number; // Duration train stays at platform (default 25-35 mins)
  simulatedDistanceKm?: number; // 0km = Daund, 76km = Pune
}

export interface Platform {
  platformNumber: number;
  status: PlatformStatus;
  lengthCapacityCoaches: number; // Max coaches platform can handle (e.g. 24, 26)
  compatibleTypes: TrainType[];
  occupyingTrainNumber: string | null;
  occupancyStartTime: string | null; // Simulated time
  occupancyEndTime: string | null; // Simulated time
  nextAvailableTime: string | null;
  isUnderMaintenance: boolean;
  notes?: string;
}

export interface AlternativePlatformOption {
  platformNumber: number;
  score: number;
  reason: string;
}

export interface AllocationRecommendation {
  trainNumber: string;
  recommendedPlatform: number | null;
  score: number;
  reasons: string[];
  alternativePlatforms: AlternativePlatformOption[];
  conflictDetected: boolean;
  conflictReason?: string;
}

export type ConflictSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type ConflictType =
  | 'OVERLAPPING_OCCUPANCY'
  | 'PLATFORM_UNAVAILABLE'
  | 'INCOMPATIBLE_RAKE'
  | 'NO_PLATFORM_ASSIGNED'
  | 'SEQUENCING_INCONSISTENCY';

export interface AllocationConflict {
  id: string;
  severity: ConflictSeverity;
  type: ConflictType;
  platformNumber?: number;
  affectedTrainNumbers: string[];
  description: string;
  suggestedResolution: string;
  timestamp: string;
}

export interface DeparturePriorityItem {
  rank: number;
  trainNumber: string;
  trainName: string;
  delayMinutes: number;
  scheduledDepartureDaund: string;
  status: TrainStatus;
  platformNumber: number | null;
  reasoning: string;
  isApproved: boolean;
}

export type DecisionActionType =
  | 'APPROVE_ALLOCATION'
  | 'REJECT_ALLOCATION'
  | 'MANUAL_PLATFORM_CHANGE'
  | 'CHANGE_DELAY'
  | 'CHANGE_STATUS'
  | 'RECALCULATE_PRIORITIES'
  | 'RESOLVE_CONFLICT'
  | 'RESET_SIMULATION';

export interface ControllerDecision {
  id: string;
  timestamp: string;
  trainNumber?: string;
  platformNumber?: number;
  actionType: DecisionActionType;
  previousValue: string;
  newValue: string;
  notes: string;
}

export interface SimulationState {
  isRunning: boolean;
  simulatedTime: string; // e.g. "02:30 AM"
  speedMultiplier: number;
  stepMinutes: number;
  totalTrains: number;
  totalDelayed: number;
  averageDelayMinutes: number;
  approachingCount: number;
  waitingPlatformCount: number;
  platformsOccupiedCount: number;
  activeConflictsCount: number;
}
