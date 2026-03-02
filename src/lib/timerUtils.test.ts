import { describe, it, expect } from "vitest";
import {
  formatTime,
  computeFocusPoints,
  sumFocusPoints,
  createTimer,
  deserializeTimers,
} from "./timerUtils";
import type { Timer } from "./types";

describe("formatTime", () => {
  it("returns '0m' for 0ms", () => {
    expect(formatTime(0)).toBe("0m");
  });

  it("returns minutes only for durations under 1 hour", () => {
    expect(formatTime(45 * 60 * 1000)).toBe("45m");
  });

  it("returns '1h 0m' for exactly 60 minutes", () => {
    expect(formatTime(60 * 60 * 1000)).toBe("1h 0m");
  });

  it("returns '1h 30m' for 90 minutes", () => {
    expect(formatTime(90 * 60 * 1000)).toBe("1h 30m");
  });

  it("returns '2h 5m' for 125 minutes", () => {
    expect(formatTime(125 * 60 * 1000)).toBe("2h 5m");
  });

  it("floors partial minutes", () => {
    expect(formatTime(90 * 60 * 1000 + 59 * 1000)).toBe("1h 30m");
  });
});

describe("computeFocusPoints", () => {
  const CHUNK_MS = 30 * 60 * 1000; // 30 minutes

  it("returns 0 for less than one chunk", () => {
    expect(computeFocusPoints(29 * 60 * 1000, CHUNK_MS)).toBe(0);
  });

  it("returns 1 for exactly one chunk", () => {
    expect(computeFocusPoints(CHUNK_MS, CHUNK_MS)).toBe(1);
  });

  it("does not round up (floors)", () => {
    expect(computeFocusPoints(59 * 60 * 1000, CHUNK_MS)).toBe(1);
  });

  it("returns 2 for 60 minutes", () => {
    expect(computeFocusPoints(60 * 60 * 1000, CHUNK_MS)).toBe(2);
  });

  it("uses the provided chunk size", () => {
    const customChunk = 15 * 60 * 1000;
    expect(computeFocusPoints(45 * 60 * 1000, customChunk)).toBe(3);
  });

  it("returns 0 for 0ms", () => {
    expect(computeFocusPoints(0, CHUNK_MS)).toBe(0);
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
});
