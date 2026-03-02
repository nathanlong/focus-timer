import type { Timer } from "./types";

export function formatTime(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function computeFocusPoints(
  elapsedMs: number,
  chunkMs: number
): number {
  return Math.floor(elapsedMs / chunkMs);
}

export function sumFocusPoints(timers: Timer[]): number {
  return timers.reduce((sum, timer) => sum + timer.focusPoints, 0);
}

export function createTimer(name: string): Timer {
  return {
    id: crypto.randomUUID(),
    name,
    intervals: [],
    totalElapsed: 0,
    focusPoints: 0,
    isRunning: false,
    currentStartTime: null,
    currentElapsed: 0,
  };
}

export function deserializeTimers(raw: unknown): Timer[] {
  if (!raw || !Array.isArray(raw)) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (raw as any[]).map((timer) => ({
    ...timer,
    currentStartTime: timer.currentStartTime
      ? new Date(timer.currentStartTime)
      : null,
    intervals: (timer.intervals ?? []).map(
      (interval: { start: string; end: string; elapsed: number }) => ({
        ...interval,
        start: new Date(interval.start),
        end: new Date(interval.end),
      })
    ),
  })) as Timer[];
}
