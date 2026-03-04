import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import CreateTimer from "./CreateTimer.svelte";

describe("CreateTimer", () => {
  describe("rendering", () => {
    it("renders a text input", () => {
      render(CreateTimer);
      expect(screen.getByRole("textbox")).toBeTruthy();
    });

    it("renders a Create Timer button", () => {
      render(CreateTimer);
      expect(
        screen.getByRole("button", { name: /create timer/i })
      ).toBeTruthy();
    });

    it("button is disabled when input is empty", () => {
      render(CreateTimer);
      expect(
        screen.getByRole("button", { name: /create timer/i })
      ).toBeDisabled();
    });

    it("button is enabled when input has non-whitespace text", async () => {
      render(CreateTimer);
      const input = screen.getByRole("textbox");
      await fireEvent.input(input, { target: { value: "Work" } });
      expect(
        screen.getByRole("button", { name: /create timer/i })
      ).not.toBeDisabled();
    });

    it("button is disabled when input is only whitespace", async () => {
      render(CreateTimer);
      const input = screen.getByRole("textbox");
      await fireEvent.input(input, { target: { value: "   " } });
      expect(
        screen.getByRole("button", { name: /create timer/i })
      ).toBeDisabled();
    });
  });

  describe("user interaction", () => {
    it("dispatches 'create' event with trimmed name on button click", async () => {
      const events: string[] = [];
      render(CreateTimer, { events: { create: (e: CustomEvent<string>) => events.push(e.detail) } });

      const input = screen.getByRole("textbox");
      await fireEvent.input(input, { target: { value: "  Deep Work  " } });
      await fireEvent.click(
        screen.getByRole("button", { name: /create timer/i })
      );

      expect(events).toEqual(["Deep Work"]);
    });

    it("dispatches 'create' event on Enter key", async () => {
      const events: string[] = [];
      render(CreateTimer, { events: { create: (e: CustomEvent<string>) => events.push(e.detail) } });

      const input = screen.getByRole("textbox");
      await fireEvent.input(input, { target: { value: "Focus" } });
      await fireEvent.keyDown(input, { key: "Enter" });

      expect(events).toEqual(["Focus"]);
    });

    it("does not dispatch 'create' for whitespace-only input", async () => {
      const events: string[] = [];
      render(CreateTimer, { events: { create: (e: CustomEvent<string>) => events.push(e.detail) } });

      const input = screen.getByRole("textbox");
      await fireEvent.input(input, { target: { value: "   " } });
      await fireEvent.keyDown(input, { key: "Enter" });

      expect(events).toHaveLength(0);
    });

    it("clears the input after successful creation", async () => {
      render(CreateTimer);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "Work" } });
      await fireEvent.click(
        screen.getByRole("button", { name: /create timer/i })
      );

      expect(input.value).toBe("");
    });

    it("does not dispatch event when button is disabled", async () => {
      const events: string[] = [];
      render(CreateTimer, { events: { create: (e: CustomEvent<string>) => events.push(e.detail) } });

      // Button is disabled with empty input
      await fireEvent.click(
        screen.getByRole("button", { name: /create timer/i })
      );
      expect(events).toHaveLength(0);
    });

    it("does not react to non-Enter keys", async () => {
      const events: string[] = [];
      render(CreateTimer, { events: { create: (e: CustomEvent<string>) => events.push(e.detail) } });

      const input = screen.getByRole("textbox");
      await fireEvent.input(input, { target: { value: "Work" } });
      await fireEvent.keyDown(input, { key: "Escape" });

      expect(events).toHaveLength(0);
    });

    it("Escape blurs the input", async () => {
      render(CreateTimer);
      const input = screen.getByRole("textbox");
      input.focus();
      expect(document.activeElement).toBe(input);
      await fireEvent.keyDown(input, { key: "Escape" });
      expect(document.activeElement).not.toBe(input);
    });
  });
});
