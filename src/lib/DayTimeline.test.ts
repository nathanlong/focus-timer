import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import DayTimeline from "./DayTimeline.svelte";
import { timers } from "./stores";
import { createTimer, buildTimelineSegments } from "./timerUtils";

const MIN = 60 * 1000;

beforeEach(() => {
  timers.set([]);
});

describe("DayTimeline", () => {
  it("renders empty-state message when no intervals exist across all timers", () => {
    timers.set([createTimer("Work"), createTimer("Study")]);
    render(DayTimeline);
    expect(screen.getByText(/no focus sessions recorded today/i)).toBeTruthy();
  });

  it("renders empty-state message when timers array is empty", () => {
    render(DayTimeline);
    expect(screen.getByText(/no focus sessions recorded today/i)).toBeTruthy();
  });

  it("renders timeline-segment elements matching buildTimelineSegments output length", () => {
    const timer = createTimer("Work");
    const t1start = new Date("2024-01-01T10:00:00");
    const t1end = new Date("2024-01-01T10:45:00");
    const t2start = new Date("2024-01-01T11:00:00"); // 15-min gap
    const t2end = new Date("2024-01-01T11:30:00");
    timer.intervals = [
      { start: t1start, end: t1end, elapsed: 45 * MIN, type: "deep-work" },
      { start: t2start, end: t2end, elapsed: 30 * MIN, type: "focus" },
    ];
    timers.set([timer]);

    const expectedSegments = buildTimelineSegments([timer], new Date());
    const { container } = render(DayTimeline);
    const renderedSegments = container.querySelectorAll(".timeline-segment");
    expect(renderedSegments.length).toBe(expectedSegments.length);
  });

  it("gap segments have the segment-gap class", () => {
    const timer = createTimer("Work");
    const t1start = new Date("2024-01-01T10:00:00");
    const t1end = new Date("2024-01-01T10:45:00");
    const t2start = new Date("2024-01-01T11:00:00"); // 15-min gap
    const t2end = new Date("2024-01-01T11:30:00");
    timer.intervals = [
      { start: t1start, end: t1end, elapsed: 45 * MIN, type: "deep-work" },
      { start: t2start, end: t2end, elapsed: 30 * MIN, type: "focus" },
    ];
    timers.set([timer]);

    const { container } = render(DayTimeline);
    const gapSegments = container.querySelectorAll(".segment-gap");
    expect(gapSegments.length).toBe(1);
  });

  it("active segment has the segment-active class", () => {
    const timer = createTimer("Work");
    timer.isRunning = true;
    timer.currentStartTime = new Date(Date.now() - 20 * MIN);
    timers.set([timer]);

    const { container } = render(DayTimeline);
    const activeSegments = container.querySelectorAll(".segment-active");
    expect(activeSegments.length).toBe(1);
  });
});
