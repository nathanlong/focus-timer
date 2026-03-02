import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import TimerList from "./TimerList.svelte";
import { createTimer } from "./timerUtils";
import type { Timer } from "./types";

function makeTimer(name: string, overrides: Partial<Timer> = {}): Timer {
  return { ...createTimer(name), ...overrides };
}

describe("TimerList", () => {
  describe("rendering", () => {
    it("shows empty state message when timers array is empty", () => {
      render(TimerList, { props: { timers: [], activeTimerId: null } });
      expect(screen.getByText(/no timers yet/i)).toBeTruthy();
    });

    it("does not show empty state when timers exist", () => {
      const timers = [makeTimer("Work")];
      render(TimerList, { props: { timers, activeTimerId: null } });
      expect(screen.queryByText(/no timers yet/i)).toBeNull();
    });

    it("shows timer count in heading", () => {
      const timers = [makeTimer("A"), makeTimer("B"), makeTimer("C")];
      render(TimerList, { props: { timers, activeTimerId: null } });
      expect(screen.getByText(/your timers \(3\)/i)).toBeTruthy();
    });

    it("renders a card for each timer by name", () => {
      const timers = [makeTimer("Alpha"), makeTimer("Beta")];
      render(TimerList, { props: { timers, activeTimerId: null } });
      expect(screen.getByText("Alpha")).toBeTruthy();
      expect(screen.getByText("Beta")).toBeTruthy();
    });
  });

  describe("event forwarding", () => {
    it("forwards 'start' event with the correct timer id", async () => {
      const timer = makeTimer("Work");
      const events: string[] = [];
      render(TimerList, {
        props: { timers: [timer], activeTimerId: null },
        events: { start: (e: CustomEvent<string>) => events.push(e.detail) },
      });

      await fireEvent.click(screen.getByRole("button", { name: /start/i }));
      expect(events).toEqual([timer.id]);
    });

    it("forwards 'stop' event with the correct timer id", async () => {
      const timer = makeTimer("Work", { isRunning: true });
      const events: string[] = [];
      render(TimerList, {
        props: { timers: [timer], activeTimerId: timer.id },
        events: { stop: (e: CustomEvent<string>) => events.push(e.detail) },
      });

      await fireEvent.click(screen.getByRole("button", { name: /stop/i }));
      expect(events).toEqual([timer.id]);
    });

    it("forwards 'delete' event with the correct timer id", async () => {
      const timer = makeTimer("Work");
      const events: string[] = [];
      render(TimerList, {
        props: { timers: [timer], activeTimerId: null },
        events: { delete: (e: CustomEvent<string>) => events.push(e.detail) },
      });

      const originalConfirm = window.confirm;
      window.confirm = () => true;
      await fireEvent.click(screen.getByTitle(/delete timer/i));
      window.confirm = originalConfirm;

      expect(events).toEqual([timer.id]);
    });

    it("forwards 'subtract' event with id and minutes", async () => {
      const timer = makeTimer("Work");
      const events: { id: string; minutes: number }[] = [];
      render(TimerList, {
        props: { timers: [timer], activeTimerId: null },
        events: {
          subtract: (e: CustomEvent<{ id: string; minutes: number }>) =>
            events.push(e.detail),
        },
      });

      await fireEvent.click(screen.getByTitle(/subtract time/i));
      const input = screen.getByPlaceholderText(/minutes to subtract/i);
      await fireEvent.input(input, { target: { value: "15" } });
      await fireEvent.click(
        screen.getByRole("button", { name: /^subtract$/i })
      );

      expect(events).toEqual([{ id: timer.id, minutes: 15 }]);
    });

    it("forwards 'add' event with id and minutes", async () => {
      const timer = makeTimer("Work");
      const events: { id: string; minutes: number }[] = [];
      render(TimerList, {
        props: { timers: [timer], activeTimerId: null },
        events: {
          add: (e: CustomEvent<{ id: string; minutes: number }>) =>
            events.push(e.detail),
        },
      });

      await fireEvent.click(screen.getByTitle(/add time/i));
      const input = screen.getByPlaceholderText(/minutes to add/i);
      await fireEvent.input(input, { target: { value: "10" } });
      await fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

      expect(events).toEqual([{ id: timer.id, minutes: 10 }]);
    });
  });
});
