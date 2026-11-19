/**
 * Utility functions for railway timetable calculations and midnight handling
 */

/**
 * Parses time string like "12:10 AM", "01:45 PM", "14:30", "01:20" to minutes from 00:00 (0 to 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();

  const is12Hour = clean.includes('AM') || clean.includes('PM');
  if (is12Hour) {
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const withoutSuffix = clean.replace('AM', '').replace('PM', '').trim();
    const parts = withoutSuffix.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] || '0', 10);

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    return (hours * 60 + minutes) % 1440;
  }

  // 24-hour format "HH:MM"
  const parts = clean.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1] || '0', 10) || 0;
  return (hours * 60 + minutes) % 1440;
}

/**
 * Formats minutes (0-1439 or beyond) into 12-hour AM/PM string, e.g. "01:20 AM"
 */
export function formatMinutesToTime(totalMinutes: number): string {
  // Normalize to 0-1439
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;

  const isPM = hours24 >= 12;
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;

  const paddedHours = hours12.toString().padStart(2, '0');
  const paddedMins = mins.toString().padStart(2, '0');
  const suffix = isPM ? 'PM' : 'AM';

  return `${paddedHours}:${paddedMins} ${suffix}`;
}

/**
 * Adds delay/duration in minutes to a time string and returns formatted time
 */
export function addMinutesToTimeString(timeStr: string, minutesToAdd: number): string {
  const currentMinutes = parseTimeToMinutes(timeStr);
  return formatMinutesToTime(currentMinutes + minutesToAdd);
}

/**
 * Computes difference between two times in minutes, handling midnight boundary.
 * If toTime appears before fromTime, assumes next day if nextDayAssumption is true.
 */
export function getTimeDifferenceMinutes(fromTimeStr: string, toTimeStr: string, nextDayAssumption = true): number {
  const fromMins = parseTimeToMinutes(fromTimeStr);
  const toMins = parseTimeToMinutes(toTimeStr);

  let diff = toMins - fromMins;
  if (diff < 0 && nextDayAssumption) {
    diff += 1440; // Crossed midnight
  }
  return diff;
}

/**
 * Checks if a specific time falls within a time window [start, end], handling midnight wraps.
 */
export function isTimeInWindow(
  checkTimeStr: string,
  startTimeStr: string,
  endTimeStr: string
): boolean {
  const check = parseTimeToMinutes(checkTimeStr);
  const start = parseTimeToMinutes(startTimeStr);
  const end = parseTimeToMinutes(endTimeStr);

  if (start <= end) {
    return check >= start && check <= end;
  }
  // Window crosses midnight
  return check >= start || check <= end;
}

/**
 * Checks if two time windows [start1, end1] and [start2, end2] overlap.
 * Includes optional clearance buffer in minutes.
 */
export function doWindowsOverlap(
  start1Str: string,
  end1Str: string,
  start2Str: string,
  end2Str: string,
  bufferMinutes = 5
): boolean {
  const s1 = parseTimeToMinutes(start1Str);
  let e1 = parseTimeToMinutes(end1Str) + bufferMinutes;
  const s2 = parseTimeToMinutes(start2Str);
  let e2 = parseTimeToMinutes(end2Str) + bufferMinutes;

  if (e1 < s1) e1 += 1440;
  if (e2 < s2) e2 += 1440;

  // Check both direct and shifted for cyclic 24hr window
  const directOverlap = Math.max(s1, s2) < Math.min(e1, e2);
  const shiftOverlap1 = Math.max(s1 + 1440, s2) < Math.min(e1 + 1440, e2);
  const shiftOverlap2 = Math.max(s1, s2 + 1440) < Math.min(e1, e2 + 1440);

  return directOverlap || shiftOverlap1 || shiftOverlap2;
}
