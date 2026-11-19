import { Platform, TrainType } from '@/types/railway';

export const ALL_TRAIN_TYPES: TrainType[] = [
  'SUPERFAST',
  'EXPRESS',
  'MAIL',
  'VANDE_BHARAT',
  'DURONTO',
  'PASSENGER',
  'SPECIAL',
];

/**
 * Demo Pune Junction Platform Specifications
 * Default: 6 platforms (configurable from 4 to 8 in settings)
 * Simulation assumptions for academic decision support demo.
 */
export const INITIAL_PLATFORMS: Platform[] = [
  {
    platformNumber: 1,
    status: 'AVAILABLE',
    lengthCapacityCoaches: 26,
    compatibleTypes: ALL_TRAIN_TYPES,
    occupyingTrainNumber: null,
    occupancyStartTime: null,
    occupancyEndTime: null,
    nextAvailableTime: '02:00 AM',
    isUnderMaintenance: false,
    notes: 'Main line terminal platform. 26-coach capacity, electrified, dual loop connection.',
  },
  {
    platformNumber: 2,
    status: 'OCCUPIED',
    lengthCapacityCoaches: 24,
    compatibleTypes: ALL_TRAIN_TYPES,
    occupyingTrainNumber: '11042',
    occupancyStartTime: '02:15 AM',
    occupancyEndTime: '02:50 AM',
    nextAvailableTime: '02:50 AM',
    isUnderMaintenance: false,
    notes: 'Primary express platform. Currently berthed: 11042 Shirdi-Dadar Exp (Waiting Departure).',
  },
  {
    platformNumber: 3,
    status: 'RESERVED',
    lengthCapacityCoaches: 24,
    compatibleTypes: ALL_TRAIN_TYPES,
    occupyingTrainNumber: null,
    occupancyStartTime: '04:00 AM',
    occupancyEndTime: '04:30 AM',
    nextAvailableTime: '04:00 AM',
    isUnderMaintenance: false,
    notes: 'Reserved for incoming Nandigram Express (11402). High turnover passenger line.',
  },
  {
    platformNumber: 4,
    status: 'OCCUPIED',
    lengthCapacityCoaches: 24,
    compatibleTypes: ALL_TRAIN_TYPES,
    occupyingTrainNumber: '12116',
    occupancyStartTime: '02:45 AM',
    occupancyEndTime: '03:15 AM',
    nextAvailableTime: '03:15 AM',
    isUnderMaintenance: false,
    notes: 'Superfast rake platform. Currently berthed: 12116 Siddheshwar Exp (Waiting Departure).',
  },
  {
    platformNumber: 5,
    status: 'OCCUPIED',
    lengthCapacityCoaches: 24,
    compatibleTypes: ALL_TRAIN_TYPES,
    occupyingTrainNumber: '11040',
    occupancyStartTime: '03:25 AM',
    occupancyEndTime: '04:00 AM',
    nextAvailableTime: '04:00 AM',
    isUnderMaintenance: false,
    notes: 'Maharashtra Express (11040) currently at platform undergoing crew transition.',
  },
  {
    platformNumber: 6,
    status: 'AVAILABLE',
    lengthCapacityCoaches: 20,
    compatibleTypes: ['EXPRESS', 'PASSENGER', 'SPECIAL', 'VANDE_BHARAT'],
    occupyingTrainNumber: null,
    occupancyStartTime: null,
    occupancyEndTime: null,
    nextAvailableTime: '02:00 AM',
    isUnderMaintenance: false,
    notes: 'Short bay platform (20-coach limit). Suitable for rakes <= 20 coaches or Vande Bharat.',
  },
];

export function getInitialPlatforms(): Platform[] {
  return JSON.parse(JSON.stringify(INITIAL_PLATFORMS));
}
