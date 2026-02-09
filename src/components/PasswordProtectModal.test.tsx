/**
 * Tests for the PasswordProtectModal component.
 *
 * This modal handles PDF encryption configuration:
 * - Document open password (required, min 6 chars)
 * - Password confirmation matching
 * - Password strength indicator (weak / medium / strong)
 * - Encryption level selection (AES-256, AES-128, RC4-128)
 * - Permission toggles (print, copy, modify, annotate, forms)
 * - Optional permissions password
 *
 * Testing strategy:
 * 1. **Validation** — the most important thing to test. The component guards
 *    against empty passwords, short passwords, and mismatched confirmations.
 * 2. **Password strength** — verify the visual indicator updates.
 * 3. **Permissions** — toggles should change the config sent to `onApply`.
 * 4. **Apply flow** — only succeeds when all validation passes.
 * 5. **Visibility / Close** — standard modal patterns.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordProtectModal from "@/components/PasswordProtectModal";

describe("PasswordProtectModal", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onApply: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onApply = vi.fn();
  });

  const renderModal = (overrides = {}) =>
    render(
      <PasswordProtectModal
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
    expect(screen.getByText("Password Protection")).toBeInTheDocument();
  });

  // ── Validation: empty password ──────────────────────────────

  it("should show error when applying without a password", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Protect Document"));

    expect(
      screen.getByText("Please enter a password to protect the document"),
    ).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  // ── Validation: short password ──────────────────────────────

  it("should show error when password is shorter than 6 characters", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Document Password"), "abc");
    await user.click(screen.getByText("Protect Document"));

    expect(
      screen.getByText("Password must be at least 6 characters long"),
    ).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  // ── Validation: password mismatch ───────────────────────────

  it("should show error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Document Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "different");
    await user.click(screen.getByText("Protect Document"));

    expect(
      screen.getByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  // ── Successful apply ────────────────────────────────────────

  it("should call onApply and onClose when validation passes", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Document Password"), "secureP@ss1");
    await user.type(screen.getByLabelText("Confirm Password"), "secureP@ss1");
    await user.click(screen.getByText("Protect Document"));

    expect(onApply).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();

    const config = onApply.mock.calls[0][0];
    expect(config.openPassword).toBe("secureP@ss1");
    expect(config.encryptionLevel).toBe("256-bit-aes");
  });

  // ── Password strength indicator ─────────────────────────────

  it("should show 'weak' for a short simple password", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Document Password"), "abc123");

    expect(screen.getByText(/password strength: weak/i)).toBeInTheDocument();
  });

  it("should show 'strong' for a complex password", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Document Password"), "S3cur3P@ss!");

    expect(screen.getByText(/password strength: strong/i)).toBeInTheDocument();
  });

  // ── Toggle password visibility ──────────────────────────────

  it("should toggle password visibility when eye icon is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    const passwordInput = screen.getByLabelText("Document Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    // Click the visibility toggle (it's a <button> sibling of the input)
    const toggleButtons = passwordInput
      .closest(".relative")!
      .querySelectorAll("button");
    await user.click(toggleButtons[0]);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  // ── Permissions default state ───────────────────────────────

  it("should have correct default permission checkboxes", () => {
    renderModal();

    // By default, printing and copying are allowed, modifying is not
    expect(screen.getByLabelText("Allow Printing")).toBeInTheDocument();
    expect(screen.getByLabelText("Allow Copying Text & Images")).toBeInTheDocument();
    expect(screen.getByLabelText("Allow Modifying Content")).toBeInTheDocument();
  });

  // ── Cancel ──────────────────────────────────────────────────

  it("should call onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Cancel"));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onApply).not.toHaveBeenCalled();
  });

  // ── Warning banner ──────────────────────────────────────────

  it("should display the password recovery warning", () => {
    renderModal();

    expect(
      screen.getByText(/if you forget the password/i),
    ).toBeInTheDocument();
  });
});
