/**
 * Tests for the HeaderFooterModal component.
 *
 * This modal configures headers and footers for PDF pages:
 * - Header fields (left / center / right text)
 * - Footer fields (left / center / right text)
 * - Page number format presets
 * - Date format presets
 * - Font size and margin sliders
 * - Token replacement preview ({page}, {total}, {date})
 *
 * Testing strategy:
 * 1. Visibility gating.
 * 2. Default state: footer enabled with "page-of-total" format.
 * 3. Adding page numbers to footer via the preset button.
 * 4. Validation: alert when no header/footer content is provided.
 * 5. Successful apply passes full config to `onApply`.
 * 6. Reset returns to initial defaults.
 * 7. Token help section is visible.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HeaderFooterModal from "@/components/HeaderFooterModal";

describe("HeaderFooterModal", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onApply: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onApply = vi.fn();
  });

  const renderModal = (overrides = {}) =>
    render(
      <HeaderFooterModal
        isOpen={true}
        onClose={onClose}
        onApply={onApply}
        totalPages={10}
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
    expect(screen.getByText("Header & Footer")).toBeInTheDocument();
  });

  // ── Default state ───────────────────────────────────────────

  it("should have empty header and footer fields by default", () => {
    renderModal();

    const inputs = screen.getAllByRole("textbox");
    // 6 text inputs: header (left, center, right) + footer (left, center, right)
    expect(inputs.length).toBe(6);
    for (const input of inputs) {
      expect(input).toHaveValue("");
    }
  });

  // ── Add page numbers preset ─────────────────────────────────

  it("should populate footer center with page format when 'Add to Footer' is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    // The first "Add to Footer" button adds page numbers
    const addButtons = screen.getAllByText("Add to Footer");
    await user.click(addButtons[0]);

    // Two "Centered..." inputs exist (header + footer).
    // After clicking "Add to Footer", one of them has a value containing "{page}".
    const inputs = screen.getAllByPlaceholderText("Centered...");
    const footerInput = inputs.find(
      (input) => (input as HTMLInputElement).value !== "",
    );

    expect(footerInput).toBeDefined();
    expect((footerInput as HTMLInputElement).value).toContain("{page}");
  });

  // ── Validation ──────────────────────────────────────────────

  it("should alert when applying with no content", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    renderModal();

    await user.click(screen.getByText("Apply to All Pages"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Please add at least one header or footer item",
    );
    expect(onApply).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  // ── Successful apply ────────────────────────────────────────

  it("should call onApply with config when footer has content", async () => {
    const user = userEvent.setup();
    renderModal();

    // Type into footer center.
    // NOTE: userEvent.type treats {curly} as special key modifiers,
    // so we use fireEvent.change to set the exact value we need.
    const inputs = screen.getAllByPlaceholderText("Centered...");
    // Footer's centered input is the second one
    fireEvent.change(inputs[1], {
      target: { value: "Page {page} of {total}" },
    });

    await user.click(screen.getByText("Apply to All Pages"));

    expect(onApply).toHaveBeenCalledOnce();
    const config = onApply.mock.calls[0][0];
    expect(config.footer.center).toBe("Page {page} of {total}");
    expect(config.footer.enabled).toBe(true);
  });

  it("should call onClose after successful apply", async () => {
    const user = userEvent.setup();
    renderModal();

    // Add some footer content
    const inputs = screen.getAllByPlaceholderText("Left aligned...");
    await user.type(inputs[1], "Copyright 2025");

    await user.click(screen.getByText("Apply to All Pages"));

    expect(onClose).toHaveBeenCalledOnce();
  });

  // ── Reset ───────────────────────────────────────────────────

  it("should reset all fields when Reset is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    // Add some content
    const inputs = screen.getAllByPlaceholderText("Centered...");
    await user.type(inputs[1], "Some footer text");

    // Reset
    await user.click(screen.getByText("Reset"));

    // All inputs should be empty again
    const allInputs = screen.getAllByRole("textbox");
    for (const input of allInputs) {
      expect(input).toHaveValue("");
    }
  });

  // ── Tokens help ─────────────────────────────────────────────

  it("should display available token documentation", () => {
    renderModal();

    expect(screen.getByText("{page}")).toBeInTheDocument();
    expect(screen.getByText("{total}")).toBeInTheDocument();
    expect(screen.getByText("{date}")).toBeInTheDocument();
  });

  // ── Preview section ─────────────────────────────────────────

  it("should show preview section with total pages", () => {
    renderModal();

    expect(screen.getByText(/preview.*page 1 of 10/i)).toBeInTheDocument();
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
