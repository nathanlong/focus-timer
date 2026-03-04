export type IntervalType = 'light-focus' | 'focus' | 'deep-work'

export interface FocusThresholds {
  lightMinutes: number;    // default 15
  focusMinutes: number;    // default 30
  deepWorkMinutes: number; // default 45
}

export const DEFAULT_THRESHOLDS: FocusThresholds = {
  lightMinutes: 15,
  focusMinutes: 30,
  deepWorkMinutes: 45,
}

export interface TimeInterval {
  start: Date;
  end: Date;
  elapsed: number; // milliseconds
  type: IntervalType | null;
}

export interface Timer {
  id: string;
  name: string;
  intervals: TimeInterval[];
  totalElapsed: number; // total milliseconds
  focusPoints: number;
  isRunning: boolean;
  currentStartTime: Date | null;
  currentElapsed: number;
  lightCount: number;
  focusCount: number;
  deepWorkCount: number;
}

export interface TimelineSegment {
  start: Date;
  end: Date;
  durationMs: number;
  type: IntervalType | null;
  isGap: boolean;
  isActive: boolean;
}
