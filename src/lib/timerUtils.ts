import type { Timer, FocusThresholds, IntervalType, TimelineSegment } from "./types";
import { DEFAULT_THRESHOLDS } from "./types";

export function formatTime(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function computeIntervalPoints(
  elapsedMs: number,
  thresholds: FocusThresholds = DEFAULT_THRESHOLDS
): number {
  const baseMs = thresholds.lightMinutes * 60 * 1000;
  if (elapsedMs < baseMs) return 0;
  return Math.floor(Math.pow(elapsedMs / baseMs, 1.9));
}

export function sumFocusPoints(timers: Timer[]): number {
  return timers.reduce((sum, timer) => sum + timer.focusPoints, 0);
}

export function classifyInterval(
  elapsedMs: number,
  thresholds: FocusThresholds = DEFAULT_THRESHOLDS
): IntervalType | null {
  const minutes = elapsedMs / (1000 * 60);
  if (minutes >= thresholds.deepWorkMinutes) return "deep-work";
  if (minutes >= thresholds.focusMinutes) return "focus";
  if (minutes >= thresholds.lightMinutes) return "light-focus";
  return null;
}

export function recalculateSegmentCounts(
  timer: Timer,
  thresholds: FocusThresholds = DEFAULT_THRESHOLDS
): void {
  timer.lightCount = 0;
  timer.focusCount = 0;
  timer.deepWorkCount = 0;
  for (const interval of timer.intervals) {
    const type = classifyInterval(interval.elapsed, thresholds);
    interval.type = type;
    if (type === "light-focus") timer.lightCount++;
    else if (type === "focus") timer.focusCount++;
    else if (type === "deep-work") timer.deepWorkCount++;
  }
}

export function addTimeToTimer(timer: Timer, ms: number): void {
  if (timer.intervals.length > 0) {
    const last = timer.intervals[timer.intervals.length - 1];
    last.elapsed += ms;
    last.type = classifyInterval(last.elapsed);
  } else {
    const now = new Date();
    timer.intervals.push({ start: now, end: now, elapsed: ms, type: classifyInterval(ms) });
  }
  timer.totalElapsed = timer.intervals.reduce((sum, i) => sum + i.elapsed, 0);
}

export function subtractTimeFromTimer(timer: Timer, ms: number): void {
  if (timer.intervals.length === 0) return;
  const last = timer.intervals[timer.intervals.length - 1];
  const actual = Math.min(ms, last.elapsed);
  last.elapsed -= actual;
  last.type = classifyInterval(last.elapsed);
  timer.totalElapsed = timer.intervals.reduce((sum, i) => sum + i.elapsed, 0);
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
    lightCount: 0,
    focusCount: 0,
    deepWorkCount: 0,
  };
}

export function longestInterval(timer: Timer): number {
  if (timer.intervals.length === 0) return 0;
  return Math.max(...timer.intervals.map((i) => i.elapsed));
}

export function isTypingInInput(target: EventTarget | null): boolean {
  if (!target) return false;
  const tag = (target as HTMLElement).tagName;
  return tag === "INPUT" || tag === "TEXTAREA";
}

export function buildTimelineSegments(timers: Timer[], now: Date): TimelineSegment[] {
  type RawInterval = {
    start: Date;
    end: Date;
    type: IntervalType | null;
    isActive: boolean;
  };

  const allIntervals: RawInterval[] = [];

  for (const timer of timers) {
    for (const interval of timer.intervals) {
      allIntervals.push({
        start: interval.start,
        end: interval.end,
        type: interval.type,
        isActive: false,
      });
    }

    if (timer.isRunning && timer.currentStartTime) {
      let start = timer.currentStartTime;
      const lastInterval = timer.intervals[timer.intervals.length - 1];
      if (lastInterval && start < lastInterval.end) {
        start = lastInterval.end;
      }
      const elapsed = now.getTime() - start.getTime();
      allIntervals.push({
        start,
        end: now,
        type: classifyInterval(elapsed),
        isActive: true,
      });
    }
  }

  if (allIntervals.length === 0) return [];

  allIntervals.sort((a, b) => a.start.getTime() - b.start.getTime());

  const segments: TimelineSegment[] = [];

  for (let i = 0; i < allIntervals.length; i++) {
    if (i > 0) {
      const prevEnd = allIntervals[i - 1].end;
      const gapMs = allIntervals[i].start.getTime() - prevEnd.getTime();
      if (gapMs >= 60 * 1000) {
        segments.push({
          start: prevEnd,
          end: allIntervals[i].start,
          durationMs: gapMs,
          type: null,
          isGap: true,
          isActive: false,
        });
      }
    }

    const interval = allIntervals[i];
    const durationMs = interval.end.getTime() - interval.start.getTime();
    segments.push({
      start: interval.start,
      end: interval.end,
      durationMs,
      type: interval.type,
      isGap: false,
      isActive: interval.isActive,
    });
  }

  return segments;
}

export function deserializeTimers(raw: unknown): Timer[] {
  if (!raw || !Array.isArray(raw)) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (raw as any[]).map((timer) => ({
    ...timer,
    lightCount: timer.lightCount ?? 0,
    focusCount: timer.focusCount ?? 0,
    deepWorkCount: timer.deepWorkCount ?? 0,
    currentStartTime: timer.currentStartTime
      ? new Date(timer.currentStartTime)
      : null,
    intervals: (timer.intervals ?? []).map(
      (interval: { start: string; end: string; elapsed: number; type?: string }) => ({
        ...interval,
        start: new Date(interval.start),
        end: new Date(interval.end),
        type: interval.type ?? classifyInterval(interval.elapsed),
      })
    ),
  })) as Timer[];
}
