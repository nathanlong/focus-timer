import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import KeyboardShortcuts from "./KeyboardShortcuts.svelte";

describe("KeyboardShortcuts", () => {
  it("dialog element exists and is initially closed", () => {
    const { container } = render(KeyboardShortcuts);
    const dialog = container.querySelector("dialog");
    expect(dialog).toBeTruthy();
    expect(dialog?.hasAttribute("open")).toBe(false);
  });

  it("exported showModal() calls dialog.showModal", () => {
    const { component, container } = render(KeyboardShortcuts);
    const dialogEl = container.querySelector("dialog") as HTMLDialogElement;
    const mockShowModal = vi.fn();
    dialogEl.showModal = mockShowModal;
    (component as unknown as { showModal(): void }).showModal();
    expect(mockShowModal).toHaveBeenCalledOnce();
  });

  it("renders all 7 shortcut rows", () => {
    const { container } = render(KeyboardShortcuts);
    const rows = container.querySelectorAll("tr");
    expect(rows.length).toBe(7);
  });

  it("clicking the dialog element (backdrop) calls dialog.close", async () => {
    const { container } = render(KeyboardShortcuts);
    const dialogEl = container.querySelector("dialog") as HTMLDialogElement;
    const mockClose = vi.fn();
    dialogEl.close = mockClose;
    await fireEvent.click(dialogEl);
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it("clicking inside .shortcuts-content does NOT call dialog.close", async () => {
    const { container } = render(KeyboardShortcuts);
    const dialogEl = container.querySelector("dialog") as HTMLDialogElement;
    const content = container.querySelector(".shortcuts-content") as HTMLElement;
    const mockClose = vi.fn();
    dialogEl.close = mockClose;
    await fireEvent.click(content);
    expect(mockClose).not.toHaveBeenCalled();
  });
});
