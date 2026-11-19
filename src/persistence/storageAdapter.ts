import { TrainRecord, Platform, ControllerDecision } from '@/types/railway';
import { getInitialTrainRecords } from '@/data/trainTimetable';
import { getInitialPlatforms } from '@/data/platforms';
import { INITIAL_SIMULATED_TIME } from '@/engine/simulation';

const STORAGE_KEYS = {
  TRAINS: 'railway_corridor_trains_v1',
  PLATFORMS: 'railway_corridor_platforms_v1',
  DECISIONS: 'railway_corridor_decisions_v1',
  SIM_TIME: 'railway_corridor_sim_time_v1',
  SIM_RUNNING: 'railway_corridor_sim_running_v1',
  SETTINGS: 'railway_corridor_settings_v1',
};

export interface AppSettings {
  autoApprovalThresholdMinutes: number;
  safetyBufferMinutes: number;
  platformCount: number;
  secondaryPriorityRule: 'SCHEDULED_DEPARTURE' | 'TRAIN_NUMBER';
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoApprovalThresholdMinutes: 10,
  safetyBufferMinutes: 10,
  platformCount: 6,
  secondaryPriorityRule: 'SCHEDULED_DEPARTURE',
};

export class StorageAdapter {
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  static loadTrains(): TrainRecord[] {
    if (!this.isAvailable()) return getInitialTrainRecords();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRAINS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load trains from localStorage', e);
    }
    return getInitialTrainRecords();
  }

  static saveTrains(trains: TrainRecord[]): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TRAINS, JSON.stringify(trains));
    } catch (e) {
      console.warn('Failed to save trains to localStorage', e);
    }
  }

  static loadPlatforms(): Platform[] {
    if (!this.isAvailable()) return getInitialPlatforms();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLATFORMS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load platforms from localStorage', e);
    }
    return getInitialPlatforms();
  }

  static savePlatforms(platforms: Platform[]): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(platforms));
    } catch (e) {
      console.warn('Failed to save platforms to localStorage', e);
    }
  }

  static loadDecisions(): ControllerDecision[] {
    if (!this.isAvailable()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DECISIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load decisions from localStorage', e);
    }
    return [
      {
        id: 'init-decision-1',
        timestamp: '02:15 AM',
        trainNumber: '12116',
        platformNumber: 4,
        actionType: 'APPROVE_ALLOCATION',
        previousValue: 'Platform 4 (Recommended)',
        newValue: 'Platform 4 (Approved)',
        notes: 'Controller approved priority berth for Siddheshwar Express.',
      },
      {
        id: 'init-decision-2',
        timestamp: '02:25 AM',
        trainNumber: '11042',
        platformNumber: 2,
        actionType: 'APPROVE_ALLOCATION',
        previousValue: 'Platform 2 (Recommended)',
        newValue: 'Platform 2 (Approved)',
        notes: 'Routine berthing approved for Shirdi-Dadar Express.',
      },
    ];
  }

  static saveDecisions(decisions: ControllerDecision[]): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(decisions));
    } catch (e) {
      console.warn('Failed to save decisions to localStorage', e);
    }
  }

  static loadSimulatedTime(): string {
    if (!this.isAvailable()) return INITIAL_SIMULATED_TIME;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SIM_TIME);
      if (data) return data;
    } catch (e) {
      console.warn('Failed to load simulated time', e);
    }
    return INITIAL_SIMULATED_TIME;
  }

  static saveSimulatedTime(time: string): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SIM_TIME, time);
    } catch (e) {
      console.warn('Failed to save simulated time', e);
    }
  }

  static loadSettings(): AppSettings {
    if (!this.isAvailable()) return DEFAULT_SETTINGS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: AppSettings): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  }

  static resetToDefaults(): {
    trains: TrainRecord[];
    platforms: Platform[];
    simulatedTime: string;
    decisions: ControllerDecision[];
    settings: AppSettings;
  } {
    const trains = getInitialTrainRecords();
    const platforms = getInitialPlatforms();
    const simulatedTime = INITIAL_SIMULATED_TIME;
    const decisions: ControllerDecision[] = [];
    const settings = DEFAULT_SETTINGS;

    if (this.isAvailable()) {
      try {
        localStorage.removeItem(STORAGE_KEYS.TRAINS);
        localStorage.removeItem(STORAGE_KEYS.PLATFORMS);
        localStorage.removeItem(STORAGE_KEYS.DECISIONS);
        localStorage.removeItem(STORAGE_KEYS.SIM_TIME);
        localStorage.removeItem(STORAGE_KEYS.SIM_RUNNING);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      } catch (e) {
        console.warn('Failed to clear localStorage', e);
      }
    }

    return { trains, platforms, simulatedTime, decisions, settings };
  }
}
