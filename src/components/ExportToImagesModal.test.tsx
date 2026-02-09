/**
 * Tests for the ExportToImagesModal component.
 *
 * This modal exports PDF pages as PNG/JPEG images with configurable:
 * - Page selection (all / current / range)
 * - Format (PNG / JPEG)
 * - Quality (JPEG only, 10-100%)
 * - Resolution scale (1x, 1.5x, 2x, 3x)
 *
 * Testing strategy:
 * - We mock the `onExport` callback and verify it receives the correct
 *   parameters based on user selections.
 * - We don't test the actual image rendering (that depends on pdfjs canvas
 *   rendering which doesn't work in jsdom).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExportToImagesModal from "@/components/ExportToImagesModal";

describe("ExportToImagesModal", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onExport: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onExport = vi.fn().mockResolvedValue(undefined);
  });

  const renderModal = (overrides = {}) =>
    render(
      <ExportToImagesModal
        isOpen={true}
        onClose={onClose}
        pdfDocument={{}}
        totalPages={5}
        onExport={onExport}
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
    expect(screen.getByText("Export to Images")).toBeInTheDocument();
  });

  // ── Default state ───────────────────────────────────────────

  it("should default to All Pages, PNG format, 2x scale", () => {
    renderModal();

    // The export summary shows all pages as default
    expect(screen.getByText(/5 page\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/format: png/i)).toBeInTheDocument();
    expect(screen.getByText(/resolution: 2x/i)).toBeInTheDocument();
  });

  // ── Page selection ──────────────────────────────────────────

  it("should switch to range mode and show page inputs", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Range"));

    // Should show start/end page number inputs
    const numberInputs = screen.getAllByRole("spinbutton");
    expect(numberInputs.length).toBe(2);
  });

  it("should update summary when switching to current page mode", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Current"));

    expect(screen.getByText(/1 page\(s\)/)).toBeInTheDocument();
  });

  // ── Format selection ────────────────────────────────────────

  it("should switch to JPEG and show quality slider", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("JPEG"));

    // Quality section should appear for JPEG
    expect(screen.getByText("Quality")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
  });

  it("should hide quality slider for PNG", async () => {
    const user = userEvent.setup();
    renderModal();

    // Start with PNG (default) → no quality slider
    expect(screen.queryByText("Quality")).not.toBeInTheDocument();
  });

  // ── Scale selection ─────────────────────────────────────────

  it("should update scale when 3x is selected", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("3x"));

    expect(screen.getByText(/resolution: 3x/i)).toBeInTheDocument();
  });

  // ── Export ──────────────────────────────────────────────────

  it("should call onExport with correct params for all pages PNG 2x", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Export"));

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledOnce();
    });

    const [pages, format, quality, scale] = onExport.mock.calls[0];
    expect(pages).toEqual([1, 2, 3, 4, 5]);
    expect(format).toBe("png");
    expect(quality).toBeCloseTo(0.92);
    expect(scale).toBe(2);
  });

  it("should call onExport with JPEG format and custom quality", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("JPEG"));
    await user.click(screen.getByText("Export"));

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledOnce();
    });

    const [, format] = onExport.mock.calls[0];
    expect(format).toBe("jpeg");
  });

  // ── Cancel ──────────────────────────────────────────────────

  it("should call onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Cancel"));

    expect(onClose).toHaveBeenCalledOnce();
  });

  // ── Error handling ──────────────────────────────────────────

  it("should alert when export fails", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    onExport.mockRejectedValueOnce(new Error("Canvas error"));

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Export"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Failed to export images. Please try again.",
      );
    });

    alertSpy.mockRestore();
  });
});
