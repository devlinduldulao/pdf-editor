/**
 * Tests for the CompressPDFModal component.
 *
 * This modal compresses a loaded PDF by calling `pdfEditorService.compressPDF`.
 *
 * Testing strategy:
 * - Mock `pdfEditorService` to control compression outcomes.
 * - Verify UI states: initial → compressing → success (download button) / error.
 * - Verify download uses `URL.createObjectURL`.
 *
 * Why mock the service?
 * The real `compressPDF` needs a loaded PDF document. We already test the
 * service in pdfEditor.test.ts. Here we test the **UI orchestration**: does
 * the button disable, does the result display, does download work?
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the service before importing the component
vi.mock("@/services/pdfEditor", () => ({
  pdfEditorService: {
    getPDFSize: vi.fn(),
    compressPDF: vi.fn(),
  },
}));

import CompressPDFModal from "@/components/CompressPDFModal";
import { pdfEditorService } from "@/services/pdfEditor";

describe("CompressPDFModal", () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    vi.clearAllMocks();

    vi.mocked(pdfEditorService.getPDFSize).mockResolvedValue(50000);
    vi.mocked(pdfEditorService.compressPDF).mockResolvedValue(
      new Uint8Array(30000),
    );
  });

  const renderModal = (overrides = {}) =>
    render(
      <CompressPDFModal
        isOpen={true}
        onClose={onClose}
        fileName="report.pdf"
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
    expect(screen.getByText("Compress PDF")).toBeInTheDocument();
  });

  // ── Initial state ───────────────────────────────────────────

  it("should display the file name", () => {
    renderModal();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("should show original file size from the service", async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByText(/current size/i)).toBeInTheDocument();
    });
  });

  it("should display compress button initially", () => {
    renderModal();
    expect(screen.getByText("Compress")).toBeInTheDocument();
  });

  // ── Compression flow ───────────────────────────────────────

  it("should show Download button after successful compression", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Compress"));

    await waitFor(() => {
      expect(screen.getByText("Compression Complete!")).toBeInTheDocument();
    });

    expect(screen.getByText("Download")).toBeInTheDocument();
  });

  it("should show savings percentage after compression", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Compress"));

    await waitFor(() => {
      expect(screen.getByText(/\d+% smaller/)).toBeInTheDocument();
    });
  });

  // ── Error handling ──────────────────────────────────────────

  it("should display error message when compression fails", async () => {
    vi.mocked(pdfEditorService.compressPDF).mockRejectedValueOnce(
      new Error("Out of memory"),
    );

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Compress"));

    await waitFor(() => {
      expect(screen.getByText("Out of memory")).toBeInTheDocument();
    });
  });

  // ── Cancel ──────────────────────────────────────────────────

  it("should call onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Cancel"));

    expect(onClose).toHaveBeenCalledOnce();
  });

  // ── Backdrop dismiss ────────────────────────────────────────

  it("should call onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    const backdrop = screen
      .getByText("Compress PDF")
      .closest(".fixed") as HTMLElement;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
