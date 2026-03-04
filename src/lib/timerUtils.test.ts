import { describe, it, expect } from "vitest";
import {
  formatTime,
  computeIntervalPoints,
  sumFocusPoints,
  createTimer,
  deserializeTimers,
  classifyInterval,
  recalculateSegmentCounts,
  addTimeToTimer,
  subtractTimeFromTimer,
  longestInterval,
  isTypingInInput,
  buildTimelineSegments,
} from "./timerUtils";
import type { Timer } from "./types";

describe("formatTime", () => {
  it("returns '00:00' for 0ms", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("returns '00:45' for 45 minutes", () => {
    expect(formatTime(45 * 60 * 1000)).toBe("00:45");
  });

  it("returns '01:00' for exactly 60 minutes", () => {
    expect(formatTime(60 * 60 * 1000)).toBe("01:00");
  });

  it("returns '01:30' for 90 minutes", () => {
    expect(formatTime(90 * 60 * 1000)).toBe("01:30");
  });

  it("returns '02:05' for 125 minutes", () => {
    expect(formatTime(125 * 60 * 1000)).toBe("02:05");
  });

  it("floors partial minutes", () => {
    expect(formatTime(90 * 60 * 1000 + 59 * 1000)).toBe("01:30");
  });
});

describe("computeIntervalPoints", () => {
  const MIN = 60 * 1000;

  it("returns 0 for less than 15 minutes", () => {
    expect(computeIntervalPoints(14 * MIN + 59 * 1000)).toBe(0);
  });

  it("returns 1 for exactly 15 minutes", () => {
    expect(computeIntervalPoints(15 * MIN)).toBe(1);
  });

  it("returns 3 for exactly 30 minutes", () => {
    expect(computeIntervalPoints(30 * MIN)).toBe(3);
  });

  it("returns 8 for exactly 45 minutes", () => {
    expect(computeIntervalPoints(45 * MIN)).toBe(8);
  });

  it("returns 13 for exactly 60 minutes", () => {
    expect(computeIntervalPoints(60 * MIN)).toBe(13);
  });

  it("floors correctly for 44 minutes (just below 45 min boundary)", () => {
    expect(computeIntervalPoints(44 * MIN)).toBe(7);
  });

  it("uses custom thresholds (lightMinutes: 10)", () => {
    const thresholds = { lightMinutes: 10, focusMinutes: 20, deepWorkMinutes: 30 };
    expect(computeIntervalPoints(10 * MIN, thresholds)).toBe(1);
    expect(computeIntervalPoints(20 * MIN, thresholds)).toBe(3);
    expect(computeIntervalPoints(30 * MIN, thresholds)).toBe(8);
  });
});

describe("sumFocusPoints", () => {
  it("returns 0 for an empty array", () => {
    expect(sumFocusPoints([])).toBe(0);
  });

  it("returns focusPoints for a single timer", () => {
    const timer = { ...createTimer("test"), focusPoints: 3 };
    expect(sumFocusPoints([timer])).toBe(3);
  });

  it("sums across multiple timers", () => {
    const t1 = { ...createTimer("a"), focusPoints: 2 };
    const t2 = { ...createTimer("b"), focusPoints: 5 };
    const t3 = { ...createTimer("c"), focusPoints: 0 };
    expect(sumFocusPoints([t1, t2, t3])).toBe(7);
  });
});

describe("createTimer", () => {
  it("creates a timer with the given name", () => {
    const timer = createTimer("My Timer");
    expect(timer.name).toBe("My Timer");
  });

  it("creates a timer with zeroed numeric fields", () => {
    const timer = createTimer("test");
    expect(timer.totalElapsed).toBe(0);
    expect(timer.currentElapsed).toBe(0);
    expect(timer.focusPoints).toBe(0);
    expect(timer.lightCount).toBe(0);
    expect(timer.focusCount).toBe(0);
    expect(timer.deepWorkCount).toBe(0);
  });

  it("creates a non-running timer", () => {
    const timer = createTimer("test");
    expect(timer.isRunning).toBe(false);
    expect(timer.currentStartTime).toBeNull();
  });

  it("creates a timer with an empty intervals array", () => {
    const timer = createTimer("test");
    expect(timer.intervals).toEqual([]);
  });

  it("assigns a unique id each time", () => {
    const a = createTimer("a");
    const b = createTimer("b");
    expect(a.id).not.toBe(b.id);
  });
});

describe("deserializeTimers", () => {
  it("returns an empty array for null input", () => {
    expect(deserializeTimers(null)).toEqual([]);
  });

  it("returns an empty array for non-array input", () => {
    expect(deserializeTimers("invalid")).toEqual([]);
    expect(deserializeTimers(42)).toEqual([]);
  });

  it("returns an empty array for an empty array", () => {
    expect(deserializeTimers([])).toEqual([]);
  });

  it("converts interval start/end strings to Date objects", () => {
    const now = new Date();
    const raw = [
      {
        id: "1",
        name: "test",
        intervals: [
          {
            start: now.toISOString(),
            end: now.toISOString(),
            elapsed: 1000,
          },
        ],
        totalElapsed: 1000,
        currentElapsed: 1000,
        focusPoints: 0,
        isRunning: false,
        currentStartTime: null,
      },
    ];
    const result = deserializeTimers(raw);
    expect(result[0].intervals[0].start).toBeInstanceOf(Date);
    expect(result[0].intervals[0].end).toBeInstanceOf(Date);
  });

  it("converts currentStartTime string to a Date object", () => {
    const now = new Date();
    const raw = [
      {
        id: "1",
        name: "test",
        intervals: [],
        totalElapsed: 0,
        currentElapsed: 0,
        focusPoints: 0,
        isRunning: true,
        currentStartTime: now.toISOString(),
      },
    ];
    const result = deserializeTimers(raw);
    expect(result[0].currentStartTime).toBeInstanceOf(Date);
  });

  it("keeps null currentStartTime as null", () => {
    const raw = [
      {
        id: "1",
        name: "test",
        intervals: [],
        totalElapsed: 0,
        currentElapsed: 0,
        focusPoints: 0,
        isRunning: false,
        currentStartTime: null,
      },
    ];
    const result = deserializeTimers(raw);
    expect(result[0].currentStartTime).toBeNull();
  });

  it("handles missing intervals array gracefully", () => {
    const raw = [
      {
        id: "1",
        name: "test",
        totalElapsed: 0,
        currentElapsed: 0,
        focusPoints: 0,
        isRunning: false,
        currentStartTime: null,
      },
    ];
    const result = deserializeTimers(raw);
    expect(result[0].intervals).toEqual([]);
  });

  it("preserves non-date timer fields", () => {
    const raw = [
      {
        id: "abc-123",
        name: "Work",
        intervals: [],
        totalElapsed: 5000,
        currentElapsed: 5000,
        focusPoints: 2,
        isRunning: false,
        currentStartTime: null,
      },
    ];
    const result = deserializeTimers(raw) as Timer[];
    expect(result[0].id).toBe("abc-123");
    expect(result[0].name).toBe("Work");
    expect(result[0].totalElapsed).toBe(5000);
    expect(result[0].focusPoints).toBe(2);
  });

  it("defaults lightCount, focusCount, deepWorkCount for old timer objects", () => {
    const raw = [
      {
        id: "1",
        name: "test",
        intervals: [],
        totalElapsed: 0,
        currentElapsed: 0,
        focusPoints: 0,
        isRunning: false,
        currentStartTime: null,
      },
    ];
    const result = deserializeTimers(raw);
    expect(result[0].lightCount).toBe(0);
    expect(result[0].focusCount).toBe(0);
    expect(result[0].deepWorkCount).toBe(0);
  });

  it("backfills type on old intervals without a type field", () => {
    const now = new Date();
    const raw = [
      {
        id: "1",
        name: "test",
        intervals: [
          { start: now.toISOString(), end: now.toISOString(), elapsed: 45 * 60 * 1000 },
        ],
        totalElapsed: 45 * 60 * 1000,
        currentElapsed: 45 * 60 * 1000,
        focusPoints: 0,
        isRunning: false,
        currentStartTime: null,
      },
    ];
    const result = deserializeTimers(raw);
    expect(result[0].intervals[0].type).toBe("deep-work");
  });

  it("preserves existing type on intervals that already have it", () => {
    const now = new Date();
    const raw = [
      {
        id: "1",
        name: "test",
        intervals: [
          { start: now.toISOString(), end: now.toISOString(), elapsed: 5 * 60 * 1000, type: "focus" },
        ],
        totalElapsed: 5 * 60 * 1000,
        currentElapsed: 5 * 60 * 1000,
        focusPoints: 0,
        isRunning: false,
        currentStartTime: null,
      },
    ];
    const result = deserializeTimers(raw);
    expect(result[0].intervals[0].type).toBe("focus");
  });
});

describe("classifyInterval", () => {
  it("returns null for under 15 minutes", () => {
    expect(classifyInterval(14 * 60 * 1000 + 59 * 1000)).toBeNull();
  });

  it("returns 'light-focus' for exactly 15 minutes", () => {
    expect(classifyInterval(15 * 60 * 1000)).toBe("light-focus");
  });

  it("returns 'light-focus' for 29:59", () => {
    expect(classifyInterval(29 * 60 * 1000 + 59 * 1000)).toBe("light-focus");
  });

  it("returns 'focus' for exactly 30 minutes", () => {
    expect(classifyInterval(30 * 60 * 1000)).toBe("focus");
  });

  it("returns 'focus' for 44:59", () => {
    expect(classifyInterval(44 * 60 * 1000 + 59 * 1000)).toBe("focus");
  });

  it("returns 'deep-work' for exactly 45 minutes", () => {
    expect(classifyInterval(45 * 60 * 1000)).toBe("deep-work");
  });

  it("returns 'deep-work' for durations over 45 minutes", () => {
    expect(classifyInterval(90 * 60 * 1000)).toBe("deep-work");
  });

  it("uses custom thresholds", () => {
    const thresholds = { lightMinutes: 10, focusMinutes: 20, deepWorkMinutes: 30 };
    expect(classifyInterval(9 * 60 * 1000, thresholds)).toBeNull();
    expect(classifyInterval(10 * 60 * 1000, thresholds)).toBe("light-focus");
    expect(classifyInterval(20 * 60 * 1000, thresholds)).toBe("focus");
    expect(classifyInterval(30 * 60 * 1000, thresholds)).toBe("deep-work");
  });
});

describe("recalculateSegmentCounts", () => {
  it("sets all counts to 0 when there are no intervals", () => {
    const timer = createTimer("test");
    recalculateSegmentCounts(timer);
    expect(timer.lightCount).toBe(0);
    expect(timer.focusCount).toBe(0);
    expect(timer.deepWorkCount).toBe(0);
  });

  it("correctly counts mixed intervals", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [
      { start: d, end: d, elapsed: 10 * 60 * 1000, type: null },       // below threshold
      { start: d, end: d, elapsed: 15 * 60 * 1000, type: null },       // light-focus
      { start: d, end: d, elapsed: 30 * 60 * 1000, type: null },       // focus
      { start: d, end: d, elapsed: 45 * 60 * 1000, type: null },       // deep-work
      { start: d, end: d, elapsed: 60 * 60 * 1000, type: null },       // deep-work
    ];
    recalculateSegmentCounts(timer);
    expect(timer.lightCount).toBe(1);
    expect(timer.focusCount).toBe(1);
    expect(timer.deepWorkCount).toBe(2);
  });

  it("recalculates from elapsed, ignoring the stored type field", () => {
    const timer = createTimer("test");
    const d = new Date();
    // elapsed is only 5 min but type field claims deep-work — elapsed wins
    timer.intervals = [
      { start: d, end: d, elapsed: 5 * 60 * 1000, type: "deep-work" as const },
    ];
    recalculateSegmentCounts(timer);
    expect(timer.deepWorkCount).toBe(0);
    expect(timer.lightCount).toBe(0);
    expect(timer.focusCount).toBe(0);
    expect(timer.intervals[0].type).toBe(null);
  });

  it("resets previous counts before recomputing", () => {
    const timer = { ...createTimer("test"), lightCount: 99, focusCount: 99, deepWorkCount: 99 };
    recalculateSegmentCounts(timer);
    expect(timer.lightCount).toBe(0);
    expect(timer.focusCount).toBe(0);
    expect(timer.deepWorkCount).toBe(0);
  });

  it("updates interval.type fields based on elapsed and thresholds", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [
      { start: d, end: d, elapsed: 15 * 60 * 1000, type: null },
      { start: d, end: d, elapsed: 30 * 60 * 1000, type: null },
      { start: d, end: d, elapsed: 45 * 60 * 1000, type: null },
    ];
    recalculateSegmentCounts(timer);
    expect(timer.intervals[0].type).toBe("light-focus");
    expect(timer.intervals[1].type).toBe("focus");
    expect(timer.intervals[2].type).toBe("deep-work");
  });

  it("re-classifies interval.type when thresholds change", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [
      { start: d, end: d, elapsed: 20 * 60 * 1000, type: "light-focus" as const },
    ];
    // With tighter thresholds: 20 min is now "focus"
    recalculateSegmentCounts(timer, { lightMinutes: 10, focusMinutes: 20, deepWorkMinutes: 30 });
    expect(timer.intervals[0].type).toBe("focus");
    expect(timer.focusCount).toBe(1);
    expect(timer.lightCount).toBe(0);
  });

  it("uses custom thresholds when provided", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [
      { start: d, end: d, elapsed: 20 * 60 * 1000, type: null }, // focus under custom thresholds
    ];
    recalculateSegmentCounts(timer, { lightMinutes: 10, focusMinutes: 20, deepWorkMinutes: 30 });
    expect(timer.focusCount).toBe(1);
    expect(timer.lightCount).toBe(0);
  });
});

describe("addTimeToTimer", () => {
  const MIN = 60 * 1000;

  it("creates a synthetic interval when no intervals exist", () => {
    const timer = createTimer("test");
    addTimeToTimer(timer, 30 * MIN);
    expect(timer.intervals).toHaveLength(1);
    expect(timer.intervals[0].elapsed).toBe(30 * MIN);
  });

  it("sets the correct type on the synthetic interval", () => {
    const timer = createTimer("test");
    addTimeToTimer(timer, 30 * MIN);
    expect(timer.intervals[0].type).toBe("focus");
  });

  it("increases the last interval's elapsed when intervals exist", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [{ start: d, end: d, elapsed: 20 * MIN, type: "light-focus" }];
    addTimeToTimer(timer, 10 * MIN);
    expect(timer.intervals[0].elapsed).toBe(30 * MIN);
  });

  it("does not touch older intervals", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [
      { start: d, end: d, elapsed: 45 * MIN, type: "deep-work" },
      { start: d, end: d, elapsed: 20 * MIN, type: "light-focus" },
    ];
    addTimeToTimer(timer, 15 * MIN);
    expect(timer.intervals[0].elapsed).toBe(45 * MIN);
    expect(timer.intervals[1].elapsed).toBe(35 * MIN);
  });

  it("updates the type on the modified interval", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [{ start: d, end: d, elapsed: 20 * MIN, type: "light-focus" }];
    addTimeToTimer(timer, 25 * MIN); // 45 min → deep-work
    expect(timer.intervals[0].type).toBe("deep-work");
  });

  it("sets totalElapsed to the sum of all intervals", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [
      { start: d, end: d, elapsed: 30 * MIN, type: "focus" },
      { start: d, end: d, elapsed: 20 * MIN, type: "light-focus" },
    ];
    addTimeToTimer(timer, 10 * MIN);
    expect(timer.totalElapsed).toBe(60 * MIN);
  });
});

describe("longestInterval", () => {
  const MIN = 60 * 1000;

  it("returns 0 for a timer with no intervals", () => {
    const timer = createTimer("test");
    expect(longestInterval(timer)).toBe(0);
  });

  it("returns the elapsed of a single interval", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [{ start: d, end: d, elapsed: 30 * MIN, type: "focus" }];
    expect(longestInterval(timer)).toBe(30 * MIN);
  });

  it("returns the maximum elapsed across multiple intervals", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [
      { start: d, end: d, elapsed: 30 * MIN, type: "focus" },
      { start: d, end: d, elapsed: 60 * MIN, type: "deep-work" },
      { start: d, end: d, elapsed: 15 * MIN, type: "light-focus" },
    ];
    expect(longestInterval(timer)).toBe(60 * MIN);
  });
});

describe("isTypingInInput", () => {
  it("returns false for null target", () => {
    expect(isTypingInInput(null)).toBe(false);
  });

  it("returns true for an INPUT element", () => {
    const input = document.createElement("input");
    expect(isTypingInInput(input)).toBe(true);
  });

  it("returns true for a TEXTAREA element", () => {
    const textarea = document.createElement("textarea");
    expect(isTypingInInput(textarea)).toBe(true);
  });

  it("returns false for a BUTTON element", () => {
    const button = document.createElement("button");
    expect(isTypingInInput(button)).toBe(false);
  });

  it("returns false for a DIV element", () => {
    const div = document.createElement("div");
    expect(isTypingInInput(div)).toBe(false);
  });
});

describe("buildTimelineSegments", () => {
  const MIN = 60 * 1000;

  it("returns [] for an empty timers array", () => {
    expect(buildTimelineSegments([], new Date())).toEqual([]);
  });

  it("returns [] when all timers have no intervals and none are running", () => {
    const t1 = createTimer("A");
    const t2 = createTimer("B");
    expect(buildTimelineSegments([t1, t2], new Date())).toEqual([]);
  });

  it("returns a single segment for one completed interval", () => {
    const timer = createTimer("Work");
    const start = new Date("2024-01-01T10:00:00");
    const end = new Date("2024-01-01T10:45:00");
    timer.intervals = [{ start, end, elapsed: 45 * MIN, type: "deep-work" }];
    const segments = buildTimelineSegments([timer], end);
    expect(segments).toHaveLength(1);
    expect(segments[0].isGap).toBe(false);
    expect(segments[0].type).toBe("deep-work");
    expect(segments[0].durationMs).toBe(45 * MIN);
  });

  it("inserts a gap segment between two intervals when gap >= 1 minute", () => {
    const timer = createTimer("Work");
    const t1start = new Date("2024-01-01T10:00:00");
    const t1end = new Date("2024-01-01T10:45:00");
    const t2start = new Date("2024-01-01T11:00:00"); // 15-min gap
    const t2end = new Date("2024-01-01T11:30:00");
    timer.intervals = [
      { start: t1start, end: t1end, elapsed: 45 * MIN, type: "deep-work" },
      { start: t2start, end: t2end, elapsed: 30 * MIN, type: "focus" },
    ];
    const segments = buildTimelineSegments([timer], t2end);
    expect(segments).toHaveLength(3);
    expect(segments[0].isGap).toBe(false);
    expect(segments[1].isGap).toBe(true);
    expect(segments[1].durationMs).toBe(15 * MIN);
    expect(segments[2].isGap).toBe(false);
  });

  it("omits gap when gap is less than 1 minute", () => {
    const timer = createTimer("Work");
    const t1start = new Date("2024-01-01T10:00:00");
    const t1end = new Date("2024-01-01T10:45:00");
    const t2start = new Date("2024-01-01T10:45:30"); // 30-second gap
    const t2end = new Date("2024-01-01T11:15:30");
    timer.intervals = [
      { start: t1start, end: t1end, elapsed: 45 * MIN, type: "deep-work" },
      { start: t2start, end: t2end, elapsed: 30 * MIN, type: "focus" },
    ];
    const segments = buildTimelineSegments([timer], t2end);
    expect(segments).toHaveLength(2);
    expect(segments.every((s) => !s.isGap)).toBe(true);
  });

  it("marks active running timer segment with isActive: true", () => {
    const timer = createTimer("Work");
    timer.isRunning = true;
    timer.currentStartTime = new Date("2024-01-01T10:00:00");
    const now = new Date("2024-01-01T10:30:00");
    const segments = buildTimelineSegments([timer], now);
    expect(segments).toHaveLength(1);
    expect(segments[0].isActive).toBe(true);
    expect(segments[0].end.getTime()).toBe(now.getTime());
  });

  it("does not insert a gap when active timer starts exactly at previous interval end", () => {
    const timer = createTimer("Work");
    const intervalStart = new Date("2024-01-01T10:00:00");
    const intervalEnd = new Date("2024-01-01T10:30:00");
    timer.intervals = [{ start: intervalStart, end: intervalEnd, elapsed: 30 * MIN, type: "focus" }];
    timer.isRunning = true;
    timer.currentStartTime = intervalEnd;
    const now = new Date("2024-01-01T11:00:00");
    const segments = buildTimelineSegments([timer], now);
    expect(segments).toHaveLength(2);
    expect(segments.some((s) => s.isGap)).toBe(false);
  });
});

describe("subtractTimeFromTimer", () => {
  const MIN = 60 * 1000;

  it("is a no-op when there are no intervals", () => {
    const timer = createTimer("test");
    timer.totalElapsed = 0;
    subtractTimeFromTimer(timer, 10 * MIN);
    expect(timer.intervals).toHaveLength(0);
    expect(timer.totalElapsed).toBe(0);
  });

  it("subtracts from the last interval when amount is less than its elapsed", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [{ start: d, end: d, elapsed: 45 * MIN, type: "deep-work" }];
    subtractTimeFromTimer(timer, 10 * MIN);
    expect(timer.intervals[0].elapsed).toBe(35 * MIN);
  });

  it("updates the type on the modified interval", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [{ start: d, end: d, elapsed: 45 * MIN, type: "deep-work" }];
    subtractTimeFromTimer(timer, 16 * MIN); // 29 min → below focus → light-focus
    expect(timer.intervals[0].type).toBe("light-focus");
  });

  it("caps last interval at 0 when subtracting more than its elapsed", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [{ start: d, end: d, elapsed: 10 * MIN, type: null }];
    subtractTimeFromTimer(timer, 60 * MIN);
    expect(timer.intervals[0].elapsed).toBe(0);
  });

  it("does not touch older intervals when capping", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [
      { start: d, end: d, elapsed: 45 * MIN, type: "deep-work" },
      { start: d, end: d, elapsed: 10 * MIN, type: null },
    ];
    subtractTimeFromTimer(timer, 60 * MIN);
    expect(timer.intervals[0].elapsed).toBe(45 * MIN);
    expect(timer.intervals[1].elapsed).toBe(0);
  });

  it("sets totalElapsed to the sum of all intervals after subtract", () => {
    const timer = createTimer("test");
    const d = new Date();
    timer.intervals = [
      { start: d, end: d, elapsed: 30 * MIN, type: "focus" },
      { start: d, end: d, elapsed: 20 * MIN, type: "light-focus" },
    ];
    subtractTimeFromTimer(timer, 10 * MIN);
    expect(timer.totalElapsed).toBe(40 * MIN);
  });
});
