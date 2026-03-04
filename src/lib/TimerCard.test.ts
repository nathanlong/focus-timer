import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import TimerCard from "./TimerCard.svelte";
import { createTimer } from "./timerUtils";
import type { Timer } from "./types";

function makeTimer(overrides: Partial<Timer> = {}): Timer {
  return { ...createTimer("Test Timer"), ...overrides };
}

describe("TimerCard", () => {
  describe("rendering - basic states", () => {
    it("renders the timer name", () => {
      render(TimerCard, {
        props: { timer: makeTimer({ name: "My Work" }), isActive: false },
      });
      expect(screen.getByText("My Work")).toBeTruthy();
    });

    it("shows 'Running' status and a Stop button when timer is running", () => {
      render(TimerCard, {
        props: { timer: makeTimer({ isRunning: true }), isActive: true },
      });
      expect(screen.getByText(/running/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /stop/i })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /^start$/i })).toBeNull();
    });

    it("shows 'Stopped' status and a Start button when timer is not running", () => {
      render(TimerCard, {
        props: { timer: makeTimer({ isRunning: false }), isActive: false },
      });
      expect(screen.getByText(/stopped/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /^start$/i })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /stop/i })).toBeNull();
    });

    it("displays formatted total time", () => {
      render(TimerCard, {
        props: {
          timer: makeTimer({ currentElapsed: 90 * 60 * 1000 }),
          isActive: false,
        },
      });
      expect(screen.getByText("01:30")).toBeTruthy();
    });

    it("shows '00:00' for Session when there are no intervals and timer is stopped", () => {
      render(TimerCard, {
        props: { timer: makeTimer({ isRunning: false, intervals: [] }), isActive: false },
      });
      expect(screen.getByText("Session")).toBeTruthy();
      // 00:00 appears for both Total and Session
      expect(screen.getAllByText("00:00").length).toBeGreaterThanOrEqual(2);
    });

    it("shows the last interval's elapsed when stopped with intervals", () => {
      const d = new Date();
      const timer = makeTimer({
        isRunning: false,
        intervals: [
          { start: d, end: d, elapsed: 45 * 60 * 1000, type: "deep-work" },
          { start: d, end: d, elapsed: 30 * 60 * 1000, type: "focus" },
        ],
        totalElapsed: 75 * 60 * 1000,
        currentElapsed: 75 * 60 * 1000,
      });
      render(TimerCard, { props: { timer, isActive: false } });
      // last interval = 30m; total = 1h 15m
      expect(screen.getByText("00:30")).toBeTruthy();
      expect(screen.getByText("01:15")).toBeTruthy();
    });

    it("shows the live session elapsed when running (currentElapsed - totalElapsed)", () => {
      const timer = makeTimer({
        isRunning: true,
        currentStartTime: new Date(),
        totalElapsed: 30 * 60 * 1000,
        currentElapsed: 45 * 60 * 1000, // 15m into current session
      });
      render(TimerCard, { props: { timer, isActive: true } });
      expect(screen.getByText("00:15")).toBeTruthy();
    });

    it("displays segment counts", () => {
      render(TimerCard, {
        props: {
          timer: makeTimer({ lightCount: 1, focusCount: 2, deepWorkCount: 3 }),
          isActive: false,
        },
      });
      expect(screen.getByText("Light")).toBeTruthy();
      expect(screen.getByText("Focus")).toBeTruthy();
      expect(screen.getByText("Deep")).toBeTruthy();
      expect(screen.getByText("1")).toBeTruthy();
      expect(screen.getByText("2")).toBeTruthy();
      expect(screen.getByText("3")).toBeTruthy();
    });

    it("applies 'active' CSS class when isActive is true", () => {
      const { container } = render(TimerCard, {
        props: { timer: makeTimer(), isActive: true },
      });
      expect(container.querySelector(".timer-card.active")).toBeTruthy();
    });

    it("does not apply 'active' class when isActive is false", () => {
      const { container } = render(TimerCard, {
        props: { timer: makeTimer(), isActive: false },
      });
      expect(container.querySelector(".timer-card.active")).toBeNull();
    });
  });

  describe("rendering - add/subtract panels", () => {
    it("add time panel is hidden by default", () => {
      render(TimerCard, {
        props: { timer: makeTimer(), isActive: false },
      });
      expect(screen.queryByPlaceholderText(/minutes to add/i)).toBeNull();
    });

    it("subtract time panel is hidden by default", () => {
      render(TimerCard, {
        props: { timer: makeTimer(), isActive: false },
      });
      expect(
        screen.queryByPlaceholderText(/minutes to subtract/i)
      ).toBeNull();
    });

    it("clicking ⏰+ shows the add panel", async () => {
      render(TimerCard, {
        props: { timer: makeTimer(), isActive: false },
      });
      await fireEvent.click(screen.getByTitle(/add time/i));
      expect(screen.getByPlaceholderText(/minutes to add/i)).toBeTruthy();
    });

    it("clicking ⏰- shows the subtract panel", async () => {
      render(TimerCard, {
        props: { timer: makeTimer(), isActive: false },
      });
      await fireEvent.click(screen.getByTitle(/subtract time/i));
      expect(
        screen.getByPlaceholderText(/minutes to subtract/i)
      ).toBeTruthy();
    });

    it("clicking Cancel in add panel hides it", async () => {
      render(TimerCard, {
        props: { timer: makeTimer(), isActive: false },
      });
      await fireEvent.click(screen.getByTitle(/add time/i));
      await fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByPlaceholderText(/minutes to add/i)).toBeNull();
    });

    it("clicking Cancel in subtract panel hides it", async () => {
      render(TimerCard, {
        props: { timer: makeTimer(), isActive: false },
      });
      await fireEvent.click(screen.getByTitle(/subtract time/i));
      await fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(
        screen.queryByPlaceholderText(/minutes to subtract/i)
      ).toBeNull();
    });

    it("⏰+ button is disabled while timer is running", () => {
      render(TimerCard, {
        props: { timer: makeTimer({ isRunning: true }), isActive: true },
      });
      expect(screen.getByTitle(/add time/i)).toBeDisabled();
    });

    it("⏰- button is disabled while timer is running", () => {
      render(TimerCard, {
        props: { timer: makeTimer({ isRunning: true }), isActive: true },
      });
      expect(screen.getByTitle(/subtract time/i)).toBeDisabled();
    });
  });

  describe("user interaction - dispatched events", () => {
    it("dispatches 'start' event when Start button is clicked", async () => {
      let fired = false;
      render(TimerCard, {
        props: { timer: makeTimer({ isRunning: false }), isActive: false },
        events: { start: () => (fired = true) },
      });

      await fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
      expect(fired).toBe(true);
    });

    it("dispatches 'stop' event when Stop button is clicked", async () => {
      let fired = false;
      render(TimerCard, {
        props: { timer: makeTimer({ isRunning: true }), isActive: true },
        events: { stop: () => (fired = true) },
      });

      await fireEvent.click(screen.getByRole("button", { name: /stop/i }));
      expect(fired).toBe(true);
    });

    it("dispatches 'add' event with correct id and minutes", async () => {
      const timer = makeTimer();
      const events: { id: string; minutes: number }[] = [];
      render(TimerCard, {
        props: { timer, isActive: false },
        events: {
          add: (e: CustomEvent<{ id: string; minutes: number }>) =>
            events.push(e.detail),
        },
      });

      await fireEvent.click(screen.getByTitle(/add time/i));
      const input = screen.getByPlaceholderText(/minutes to add/i);
      await fireEvent.input(input, { target: { value: "20" } });
      await fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

      expect(events).toEqual([{ id: timer.id, minutes: 20 }]);
    });

    it("dispatches 'subtract' event with correct id and minutes", async () => {
      const timer = makeTimer();
      const events: { id: string; minutes: number }[] = [];
      render(TimerCard, {
        props: { timer, isActive: false },
        events: {
          subtract: (e: CustomEvent<{ id: string; minutes: number }>) =>
            events.push(e.detail),
        },
      });

      await fireEvent.click(screen.getByTitle(/subtract time/i));
      const input = screen.getByPlaceholderText(/minutes to subtract/i);
      await fireEvent.input(input, { target: { value: "5" } });
      await fireEvent.click(
        screen.getByRole("button", { name: /^subtract$/i })
      );

      expect(events).toEqual([{ id: timer.id, minutes: 5 }]);
    });

    it("does not dispatch 'add' for a non-positive minute value", async () => {
      const events: unknown[] = [];
      render(TimerCard, {
        props: { timer: makeTimer(), isActive: false },
        events: { add: (e: CustomEvent<unknown>) => events.push(e.detail) },
      });

      await fireEvent.click(screen.getByTitle(/add time/i));
      const input = screen.getByPlaceholderText(/minutes to add/i);
      await fireEvent.input(input, { target: { value: "0" } });
      await fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

      expect(events).toHaveLength(0);
    });

    describe("rename", () => {
      it("double-clicking the timer name shows a pre-filled input", async () => {
        render(TimerCard, {
          props: { timer: makeTimer({ name: "My Timer" }), isActive: false },
        });
        await fireEvent.dblClick(screen.getByText("My Timer"));
        expect(screen.getByDisplayValue("My Timer")).toBeTruthy();
      });

      it("pressing Enter dispatches 'rename' with the trimmed new name", async () => {
        const timer = makeTimer({ name: "Old Name" });
        const events: { id: string; newName: string }[] = [];
        render(TimerCard, {
          props: { timer, isActive: false },
          events: {
            rename: (e: CustomEvent<{ id: string; newName: string }>) =>
              events.push(e.detail),
          },
        });

        await fireEvent.dblClick(screen.getByText("Old Name"));
        const input = screen.getByDisplayValue("Old Name");
        await fireEvent.input(input, { target: { value: "  New Name  " } });
        await fireEvent.keyDown(input, { key: "Enter" });
        expect(events).toEqual([{ id: timer.id, newName: "New Name" }]);
      });

      it("pressing Escape cancels renaming without dispatching", async () => {
        const events: unknown[] = [];
        render(TimerCard, {
          props: { timer: makeTimer({ name: "My Timer" }), isActive: false },
          events: { rename: (e: CustomEvent<unknown>) => events.push(e.detail) },
        });

        await fireEvent.dblClick(screen.getByText("My Timer"));
        const input = screen.getByDisplayValue("My Timer");
        await fireEvent.keyDown(input, { key: "Escape" });

        expect(events).toHaveLength(0);
        expect(screen.queryByDisplayValue("My Timer")).toBeNull();
        expect(screen.getByText("My Timer")).toBeTruthy();
      });

      it("blur dispatches 'rename' with the current value", async () => {
        const timer = makeTimer({ name: "Old Name" });
        const events: { id: string; newName: string }[] = [];
        render(TimerCard, {
          props: { timer, isActive: false },
          events: {
            rename: (e: CustomEvent<{ id: string; newName: string }>) =>
              events.push(e.detail),
          },
        });

        await fireEvent.dblClick(screen.getByText("Old Name"));
        const input = screen.getByDisplayValue("Old Name");
        await fireEvent.input(input, { target: { value: "New Name" } });
        await fireEvent.blur(input);
        expect(events).toEqual([{ id: timer.id, newName: "New Name" }]);
      });

      it("does not dispatch 'rename' when the name is whitespace-only", async () => {
        const events: unknown[] = [];
        render(TimerCard, {
          props: { timer: makeTimer({ name: "My Timer" }), isActive: false },
          events: { rename: (e: CustomEvent<unknown>) => events.push(e.detail) },
        });

        await fireEvent.dblClick(screen.getByText("My Timer"));
        const input = screen.getByDisplayValue("My Timer");
        await fireEvent.input(input, { target: { value: "   " } });
        await fireEvent.keyDown(input, { key: "Enter" });
        expect(events).toHaveLength(0);
      });
    });

    describe("delete", () => {
      let originalConfirm: typeof window.confirm;
      beforeEach(() => {
        originalConfirm = window.confirm;
      });
      afterEach(() => {
        window.confirm = originalConfirm;
      });

      it("dispatches 'delete' event when confirm returns true", async () => {
        window.confirm = () => true;
        let fired = false;
        render(TimerCard, {
          props: { timer: makeTimer(), isActive: false },
          events: { delete: () => (fired = true) },
        });

        await fireEvent.click(screen.getByTitle(/delete timer/i));
        expect(fired).toBe(true);
      });

      it("does not dispatch 'delete' when confirm returns false", async () => {
        window.confirm = () => false;
        let fired = false;
        render(TimerCard, {
          props: { timer: makeTimer(), isActive: false },
          events: { delete: () => (fired = true) },
        });

        await fireEvent.click(screen.getByTitle(/delete timer/i));
        expect(fired).toBe(false);
      });
    });
  });
});
