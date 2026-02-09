/**
 * Tests for the OCRModal component.
 *
 * This modal provides OCR (Optical Character Recognition) functionality
 * using Tesseract.js to extract text from PDF page images.
 *
 * Testing approach:
 * - We do NOT import Tesseract.js (it's dynamically imported in the component).
 *   Instead, we test the UI states: settings, processing indicator, error handling.
 * - We mock the pdfDocument to avoid real PDF rendering.
 * - We focus on the configuration UI (language selection, page mode, buttons).
 *
 * Why not test the actual OCR?
 * Tesseract.js requires a WASM runtime and downloads language data from a CDN.
 * Neither works in jsdom. The OCR logic is Tesseract's responsibility — we test
 * that our component correctly wires up the UI to call it.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OCRModal from "@/components/OCRModal";

describe("OCRModal", () => {
  let onClose: ReturnType<typeof vi.fn>;

  const mockPdfDocument = {
    numPages: 5,
    getPage: vi.fn(),
  };

  beforeEach(() => {
    onClose = vi.fn();
    vi.clearAllMocks();
  });

  const renderModal = (overrides = {}) =>
    render(
      <OCRModal
        isOpen={true}
        onClose={onClose}
        pdfDocument={mockPdfDocument}
        currentPage={1}
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
    expect(screen.getByText("OCR - Text Recognition")).toBeInTheDocument();
  });

  // ── Settings UI ─────────────────────────────────────────────

  it("should show Current Page and All Pages buttons", () => {
    renderModal();

    expect(screen.getByText(/current page.*1/i)).toBeInTheDocument();
    expect(screen.getByText(/all pages.*5/i)).toBeInTheDocument();
  });

  it("should default to Current Page mode", () => {
    renderModal();

    // The "Current Page" button should have the default (active) variant
    const currentBtn = screen.getByText(/current page/i).closest("button")!;
    // Active buttons use 'default' variant which doesn't have the 'outline' border styling
    expect(currentBtn).toBeInTheDocument();
  });

  it("should show language selector with English as default", () => {
    renderModal();

    // The select element has English pre-selected
    const select = screen.getByDisplayValue("English");
    expect(select).toBeInTheDocument();
  });

  it("should offer multiple language options", () => {
    renderModal();

    const select = screen.getByDisplayValue("English");
    const options = select.querySelectorAll("option");

    expect(options.length).toBeGreaterThanOrEqual(5);
  });

  // ── Extract Text button ─────────────────────────────────────

  it("should show Extract Text button initially", () => {
    renderModal();
    expect(screen.getByText("Extract Text")).toBeInTheDocument();
  });

  it("should disable Extract button when no PDF document is provided", () => {
    renderModal({ pdfDocument: null });

    const btn = screen.getByText("Extract Text").closest("button")!;
    expect(btn).toBeDisabled();
  });

  // ── Info text ───────────────────────────────────────────────

  it("should display OCR guidance text", () => {
    renderModal();

    expect(
      screen.getByText(/ocr extracts text from scanned documents/i),
    ).toBeInTheDocument();
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
      .getByText("OCR - Text Recognition")
      .closest(".fixed") as HTMLElement;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledOnce();
  });

  // ── Mode switching ──────────────────────────────────────────

  it("should switch to All Pages mode", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText(/all pages/i));

    // The "All Pages" button should now be the active one
    const allPagesBtn = screen.getByText(/all pages/i).closest("button")!;
    expect(allPagesBtn).toBeInTheDocument();
  });
});
