/**
 * Tests for the KeyboardShortcutsModal component.
 *
 * This is a **presentational modal** — it displays a static list of keyboard
 * shortcuts grouped by category and handles open/close behaviour.
 *
 * What we test:
 * 1. Nothing renders when `isOpen` is false.
 * 2. All shortcut groups (General, Navigation, View, Editing) are displayed.
 * 3. Individual shortcut descriptions appear.
 * 4. Pressing Escape calls `onClose`.
 * 5. Clicking the backdrop (outer overlay) calls `onClose`.
 * 6. Clicking the close (X) button calls `onClose`.
 *
 * Why test a "static" modal?
 * Even though the data is hardcoded, testing ensures that:
 * - The component renders without crashing (regression guard).
 * - The Escape-key listener is wired up correctly.
 * - Overlay dismiss behaviour works as expected.
 * These are behaviour contracts that could break during refactors.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";

describe("KeyboardShortcutsModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  const renderModal = (overrides = {}) =>
    render(<KeyboardShortcutsModal {...defaultProps} {...overrides} />);

  // ── Visibility ──────────────────────────────────────────────

  it("should render nothing when isOpen is false", () => {
    const { container } = renderModal({ isOpen: false });

    expect(container.innerHTML).toBe("");
  });

  it("should render the modal title when isOpen is true", () => {
    renderModal();

    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
  });

  // ── Shortcut groups ─────────────────────────────────────────

  it("should display all shortcut group headings", () => {
    renderModal();

    const groups = ["General", "Navigation", "View", "Editing"];
    for (const group of groups) {
      expect(screen.getByText(group)).toBeInTheDocument();
    }
  });

  it("should display individual shortcut descriptions", () => {
    renderModal();

    // Spot-check a few descriptions from different groups
    expect(screen.getByText("Undo last action")).toBeInTheDocument();
    expect(screen.getByText("Previous page")).toBeInTheDocument();
    expect(screen.getByText("Zoom in")).toBeInTheDocument();
    expect(screen.getByText("Toggle drawing mode")).toBeInTheDocument();
  });

  it("should render kbd elements for shortcut keys", () => {
    renderModal();

    // Each key gets its own <kbd> element
    const kbds = screen.getAllByText("Ctrl");
    expect(kbds.length).toBeGreaterThan(0);
    expect(kbds[0].tagName).toBe("KBD");
  });

  // ── Close behaviour ─────────────────────────────────────────

  it("should call onClose when the X button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ onClose });

    // The close button is the Button with an X icon inside
    const closeButton = screen.getByRole("button");
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should call onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should NOT call onClose on Escape when modal is closed", () => {
    const onClose = vi.fn();
    renderModal({ isOpen: false, onClose });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should call onClose when clicking the backdrop overlay", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ onClose });

    // The outermost div IS the backdrop (fixed inset-0)
    const backdrop = screen.getByText("Keyboard Shortcuts").closest(
      ".fixed",
    ) as HTMLElement;
    // Click the backdrop itself (not a child)
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledOnce();
  });

  // ── Footer hint ─────────────────────────────────────────────

  it("should display the footer hint about pressing ?", () => {
    renderModal();

    expect(
      screen.getByText(/anytime to show this help/i),
    ).toBeInTheDocument();
  });
});
