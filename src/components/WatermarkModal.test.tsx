/**
 * Tests for the WatermarkModal component.
 *
 * This modal lets users configure a text or image watermark:
 * - Switch between text / image mode
 * - Configure text, font size, color, opacity, rotation, position
 * - Preview updates live
 * - Validate before applying
 *
 * What we test:
 * 1. Visibility gating (isOpen false → nothing rendered).
 * 2. Default state: text mode selected, "CONFIDENTIAL" pre-filled.
 * 3. Switching to image mode shows the image upload button.
 * 4. Applying with empty text shows an alert (validation).
 * 5. Applying with valid text calls onApply with config object.
 * 6. Position buttons update the selected position.
 * 7. Reset restores defaults.
 * 8. Close button / Cancel calls onClose.
 *
 * Why mock `alert`?
 * The component calls `window.alert` for validation errors. In tests we
 * spy on it to verify the validation path without triggering a real dialog.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WatermarkModal from "@/components/WatermarkModal";
import type { WatermarkConfig } from "@/components/WatermarkModal";

describe("WatermarkModal", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onApply: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onApply = vi.fn();
  });

  const renderModal = (overrides = {}) =>
    render(
      <WatermarkModal
        isOpen={true}
        onClose={onClose}
        onApply={onApply}
        {...overrides}
      />,
    );

  // ── Visibility ──────────────────────────────────────────────

  it("should render nothing when isOpen is false", () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.innerHTML).toBe("");
  });

  it("should render the modal title", () => {
    renderModal();
    expect(screen.getByText("Add Watermark")).toBeInTheDocument();
  });

  // ── Default state ───────────────────────────────────────────

  it("should start in text mode with CONFIDENTIAL pre-filled", () => {
    renderModal();

    const input = screen.getByPlaceholderText("Enter watermark text...");
    expect(input).toHaveValue("CONFIDENTIAL");
  });

  // ── Mode switching ──────────────────────────────────────────

  it("should switch to image mode when Image tab is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Image"));

    // Image mode shows an upload button
    expect(
      screen.getByText("Click to upload image"),
    ).toBeInTheDocument();
  });

  it("should switch back to text mode", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Image"));
    await user.click(screen.getByText("Text"));

    expect(
      screen.getByPlaceholderText("Enter watermark text..."),
    ).toBeInTheDocument();
  });

  // ── Validation ──────────────────────────────────────────────

  it("should alert when applying empty text watermark", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    renderModal();

    // Clear the default text
    const input = screen.getByPlaceholderText("Enter watermark text...");
    await user.clear(input);

    // Apply
    await user.click(screen.getByText("Apply to All Pages"));

    expect(alertSpy).toHaveBeenCalledWith("Please enter watermark text");
    expect(onApply).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  // ── Successful apply ────────────────────────────────────────

  it("should call onApply with config when valid text is provided", async () => {
    const user = userEvent.setup();
    renderModal();

    // Defaults are valid — just click Apply
    await user.click(screen.getByText("Apply to All Pages"));

    expect(onApply).toHaveBeenCalledOnce();

    const config: WatermarkConfig = onApply.mock.calls[0][0];
    expect(config.type).toBe("text");
    expect(config.text).toBe("CONFIDENTIAL");
    expect(config.position).toBe("center");
    expect(config.opacity).toBe(30);
    expect(config.rotation).toBe(-45);
  });

  it("should call onClose after successful apply", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Apply to All Pages"));

    expect(onClose).toHaveBeenCalledOnce();
  });

  // ── Position selection ──────────────────────────────────────

  it("should change position when a position button is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    // Click "↗ Top Right"
    await user.click(screen.getByText("↗ Top Right"));

    // Now apply and check the config
    await user.click(screen.getByText("Apply to All Pages"));

    const config: WatermarkConfig = onApply.mock.calls[0][0];
    expect(config.position).toBe("top-right");
  });

  // ── Color selection ─────────────────────────────────────────

  it("should change color when a color button is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    // Click the Red color swatch (title="Red")
    await user.click(screen.getByTitle("Red"));

    await user.click(screen.getByText("Apply to All Pages"));

    const config: WatermarkConfig = onApply.mock.calls[0][0];
    expect(config.color).toBe("#DC2626");
  });

  // ── Reset ───────────────────────────────────────────────────

  it("should reset config to defaults when Reset is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    // Change text
    const input = screen.getByPlaceholderText("Enter watermark text...");
    await user.clear(input);
    await user.type(input, "DRAFT");

    // Click Reset
    await user.click(screen.getByText("Reset"));

    // Text should be back to default
    expect(
      screen.getByPlaceholderText("Enter watermark text..."),
    ).toHaveValue("CONFIDENTIAL");
  });

  // ── Cancel ──────────────────────────────────────────────────

  it("should call onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Cancel"));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onApply).not.toHaveBeenCalled();
  });
});
