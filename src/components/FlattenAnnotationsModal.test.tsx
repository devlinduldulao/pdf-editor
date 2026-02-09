/**
 * Tests for the FlattenAnnotationsModal component.
 *
 * This modal flattens PDF annotations (form fields, signatures, comments)
 * into the page content, making them permanent and non-editable.
 *
 * Testing strategy:
 * - Mock `pdfEditorService` for the flatten + save calls.
 * - Verify states: initial info → processing → success (download) / error.
 * - Verify the info/warning text is displayed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/services/pdfEditor", () => ({
  pdfEditorService: {
    flattenAnnotations: vi.fn(),
    savePDF: vi.fn(),
  },
}));

import FlattenAnnotationsModal from "@/components/FlattenAnnotationsModal";
import { pdfEditorService } from "@/services/pdfEditor";

describe("FlattenAnnotationsModal", () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    vi.clearAllMocks();

    vi.mocked(pdfEditorService.flattenAnnotations).mockResolvedValue(undefined);
    vi.mocked(pdfEditorService.savePDF).mockResolvedValue(
      new Uint8Array(1000),
    );
  });

  const renderModal = (overrides = {}) =>
    render(
      <FlattenAnnotationsModal
        isOpen={true}
        onClose={onClose}
        fileName="document.pdf"
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
    expect(screen.getByText("Flatten Annotations")).toBeInTheDocument();
  });

  // ── Info display ────────────────────────────────────────────

  it("should display the file name", () => {
    renderModal();
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });

  it("should explain what flattening means", () => {
    renderModal();
    expect(screen.getByText("What is flattening?")).toBeInTheDocument();
  });

  it("should show the irreversibility warning", () => {
    renderModal();
    expect(
      screen.getByText(/this action is irreversible/i),
    ).toBeInTheDocument();
  });

  it("should list common use cases", () => {
    renderModal();
    expect(
      screen.getByText(/submitting filled forms/i),
    ).toBeInTheDocument();
  });

  // ── Flatten success ─────────────────────────────────────────

  it("should show success state after flattening", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Flatten"));

    await waitFor(() => {
      expect(screen.getByText("Annotations Flattened!")).toBeInTheDocument();
    });
  });

  it("should show Download button after successful flatten", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Flatten"));

    await waitFor(() => {
      expect(
        screen.getByText("Download Flattened PDF"),
      ).toBeInTheDocument();
    });
  });

  it("should call service methods during flatten", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Flatten"));

    await waitFor(() => {
      expect(pdfEditorService.flattenAnnotations).toHaveBeenCalledOnce();
      expect(pdfEditorService.savePDF).toHaveBeenCalledOnce();
    });
  });

  // ── Error handling ──────────────────────────────────────────

  it("should display error when flatten fails", async () => {
    vi.mocked(pdfEditorService.flattenAnnotations).mockRejectedValueOnce(
      new Error("No annotations to flatten"),
    );

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Flatten"));

    await waitFor(() => {
      expect(
        screen.getByText("No annotations to flatten"),
      ).toBeInTheDocument();
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
      .getByText("Flatten Annotations")
      .closest(".fixed") as HTMLElement;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
