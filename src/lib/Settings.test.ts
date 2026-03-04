import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import Settings from "./Settings.svelte";
import { settings } from "./stores";
import { DEFAULT_THRESHOLDS } from "./types";

beforeEach(() => {
  settings.set({ ...DEFAULT_THRESHOLDS });
});

describe("Settings", () => {
  it("renders three inputs with default values", () => {
    render(Settings);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(3);
    expect(inputs[0]).toHaveValue(15);
    expect(inputs[1]).toHaveValue(30);
    expect(inputs[2]).toHaveValue(45);
  });

  it("changing a valid value updates $settings", async () => {
    render(Settings);
    const inputs = screen.getAllByRole("spinbutton");
    await fireEvent.change(inputs[0], { target: { value: "20" } });
    let current: typeof DEFAULT_THRESHOLDS | undefined;
    settings.subscribe((s) => (current = s))();
    expect(current?.lightMinutes).toBe(20);
  });

  it("shows error and reverts when lightMinutes >= focusMinutes", async () => {
    render(Settings);
    const inputs = screen.getAllByRole("spinbutton");
    await fireEvent.change(inputs[0], { target: { value: "30" } });
    expect(screen.getByText(/light focus threshold must be less than focus/i)).toBeTruthy();
    let current: typeof DEFAULT_THRESHOLDS | undefined;
    settings.subscribe((s) => (current = s))();
    expect(current?.lightMinutes).toBe(15);
  });

  it("shows error and reverts when focusMinutes >= deepWorkMinutes", async () => {
    render(Settings);
    const inputs = screen.getAllByRole("spinbutton");
    await fireEvent.change(inputs[1], { target: { value: "45" } });
    expect(screen.getByText(/focus threshold must be less than deep work/i)).toBeTruthy();
    let current: typeof DEFAULT_THRESHOLDS | undefined;
    settings.subscribe((s) => (current = s))();
    expect(current?.focusMinutes).toBe(30);
  });

  it("rejects values outside 1-120 range", async () => {
    render(Settings);
    const inputs = screen.getAllByRole("spinbutton");
    await fireEvent.change(inputs[0], { target: { value: "200" } });
    expect(screen.getByText(/whole numbers between 1 and 120/i)).toBeTruthy();
    let current: typeof DEFAULT_THRESHOLDS | undefined;
    settings.subscribe((s) => (current = s))();
    expect(current?.lightMinutes).toBe(15);
  });

  it("rejects a value of 0", async () => {
    render(Settings);
    const inputs = screen.getAllByRole("spinbutton");
    await fireEvent.change(inputs[2], { target: { value: "0" } });
    expect(screen.getByText(/whole numbers between 1 and 120/i)).toBeTruthy();
    let current: typeof DEFAULT_THRESHOLDS | undefined;
    settings.subscribe((s) => (current = s))();
    expect(current?.deepWorkMinutes).toBe(45);
  });
});
