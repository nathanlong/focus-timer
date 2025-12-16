export interface TimeInterval {
  start: Date;
  end: Date;
  elapsed: number; // milliseconds
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
}
