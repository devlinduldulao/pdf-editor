/**
 * Tests for the SignaturePad component.
 *
 * This component supports two signature modes:
 * 1. **Draw** — freehand drawing on a canvas
 * 2. **Type** — typed text rendered in a signature-style font
 *
 * In addition, it manages saved signatures in localStorage.
 *
 * Testing strategy:
 * - **Canvas drawing** is hard to test in jsdom (no real rendering), so we
 *   verify the events are handled (mouseDown/mouseUp update the `hasDrawing`
 *   state, which enables/disables the Apply button).
 * - **Type mode** is straightforward to test: type text → select font → apply.
 * - **Apply/Save** callbacks and **localStorage** interactions are verified.
 *
 * Why not test actual canvas pixels?
 * jsdom doesn't support canvas rendering (getContext("2d") returns a stub).
 * We trust that `canvas.toDataURL` produces valid output when the browser
 * runs the code. In tests, we verify the *behaviour* (button enabled/disabled,
 * callbacks fired, etc.) rather than the pixel output.
 */
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignaturePad from "@/components/SignaturePad";

/**
 * jsdom doesn't implement HTMLCanvasElement.getContext("2d").
 * The SignaturePad component relies on it for both drawing and generating
 * typed signatures. We mock it globally for these tests.
 *
 * The mock returns a *stub* context with the methods the component calls
 * (beginPath, moveTo, lineTo, stroke, fillRect, fillText, toDataURL).
 * We don't assert pixel output — just that the component enables/disables
 * buttons and fires callbacks correctly.
 */
const createMockContext = () => ({
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
  lineCap: "butt",
  lineJoin: "miter",
  font: "",
  textBaseline: "alphabetic",
  textAlign: "start",
});

// Override getContext on the prototype so all <canvas> elements use our mock
const originalGetContext = HTMLCanvasElement.prototype.getContext;
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => createMockContext()) as any;
  // Make toDataURL return a recognisable base64 string
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,MOCK");
});

// Restore after all tests in this file
afterAll(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

describe("SignaturePad", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onApply: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onApply = vi.fn();
    // Clear saved signatures
    localStorage.removeItem("pdf-editor-saved-signatures");
  });

  const renderPad = (overrides = {}) =>
    render(
      <SignaturePad
        isOpen={true}
        onClose={onClose}
        onApply={onApply}
        {...overrides}
      />,
    );

  // ── Visibility ──────────────────────────────────────────────

  it("should render nothing when isOpen is false", () => {
    const { container } = renderPad({ isOpen: false });
    expect(container.innerHTML).toBe("");
  });

  it("should render the modal title", () => {
    renderPad();
    expect(screen.getByText("Signature")).toBeInTheDocument();
  });

  // ── Mode tabs ───────────────────────────────────────────────

  it("should default to Draw mode with a canvas", () => {
    renderPad();

    expect(screen.getByText("Draw")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    // Canvas is rendered in draw mode
    expect(document.querySelector("canvas")).toBeInTheDocument();
  });

  it("should switch to Type mode when Type tab is clicked", async () => {
    const user = userEvent.setup();
    renderPad();

    await user.click(screen.getByText("Type"));

    expect(
      screen.getByPlaceholderText("Type your name..."),
    ).toBeInTheDocument();
  });

  // ── Draw mode ───────────────────────────────────────────────

  it("should have Apply button disabled initially in draw mode (no drawing)", () => {
    renderPad();

    const applyButton = screen.getByText("Apply").closest("button")!;
    expect(applyButton).toBeDisabled();
  });

  it("should enable Apply after drawing on canvas", () => {
    renderPad();

    const canvas = document.querySelector("canvas")!;

    // Simulate a drawing stroke
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    const applyButton = screen.getByText("Apply").closest("button")!;
    expect(applyButton).not.toBeDisabled();
  });

  it("should disable Apply after clearing the canvas", async () => {
    const user = userEvent.setup();
    renderPad();

    const canvas = document.querySelector("canvas")!;

    // Draw something
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas);

    // Clear
    await user.click(screen.getByText("Clear"));

    const applyButton = screen.getByText("Apply").closest("button")!;
    expect(applyButton).toBeDisabled();
  });

  // ── Type mode ───────────────────────────────────────────────

  it("should have Apply disabled when type input is empty", async () => {
    const user = userEvent.setup();
    renderPad();

    await user.click(screen.getByText("Type"));

    const applyButton = screen.getByText("Apply").closest("button")!;
    expect(applyButton).toBeDisabled();
  });

  it("should enable Apply when text is typed", async () => {
    const user = userEvent.setup();
    renderPad();

    await user.click(screen.getByText("Type"));
    await user.type(
      screen.getByPlaceholderText("Type your name..."),
      "John Doe",
    );

    const applyButton = screen.getByText("Apply").closest("button")!;
    expect(applyButton).not.toBeDisabled();
  });

  it("should display font style options in type mode", async () => {
    const user = userEvent.setup();
    renderPad();

    await user.click(screen.getByText("Type"));

    expect(screen.getByText("Cursive")).toBeInTheDocument();
    expect(screen.getByText("Script")).toBeInTheDocument();
    expect(screen.getByText("Elegant")).toBeInTheDocument();
    expect(screen.getByText("Classic")).toBeInTheDocument();
  });

  it("should call onApply with signature data in type mode", async () => {
    const user = userEvent.setup();
    renderPad();

    await user.click(screen.getByText("Type"));
    await user.type(
      screen.getByPlaceholderText("Type your name..."),
      "Jane Smith",
    );
    await user.click(screen.getByText("Apply"));

    expect(onApply).toHaveBeenCalledOnce();
    // The signature data should be a base64 PNG
    const signatureData = onApply.mock.calls[0][0];
    expect(signatureData).toContain("data:image/png");
  });

  // ── Close ───────────────────────────────────────────────────

  it("should call onClose when X button is clicked", async () => {
    const user = userEvent.setup();
    renderPad();

    // The close button is the ghost icon button in the header
    const buttons = screen.getAllByRole("button");
    const closeButton = buttons.find((btn) =>
      btn.querySelector("svg.lucide-x"),
    )!;
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });

  // ── Saved signatures ────────────────────────────────────────

  it("should not show Saved Signatures section when none are saved", () => {
    renderPad();
    expect(screen.queryByText("Saved Signatures")).not.toBeInTheDocument();
  });

  it("should display saved signatures from localStorage", () => {
    // Pre-populate localStorage
    const saved = [
      {
        id: "sig_1",
        name: "My Signature",
        imageData: "data:image/png;base64,abc123",
        createdAt: Date.now(),
      },
    ];
    localStorage.setItem(
      "pdf-editor-saved-signatures",
      JSON.stringify(saved),
    );

    renderPad();

    expect(screen.getByText("Saved Signatures")).toBeInTheDocument();
    expect(screen.getByText("My Signature")).toBeInTheDocument();
  });
});
