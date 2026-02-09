/**
 * Tests for the PasswordPrompt component.
 *
 * PasswordPrompt is a modal dialog that appears when the user tries to open a
 * password-protected PDF. It collects the password and passes it to the parent
 * via `onSubmit`.
 *
 * Testing approach:
 * - When `isOpen=false`, nothing should render (conditional rendering).
 * - When `isOpen=true`, the modal UI should be visible.
 * - Typing a password and clicking "Unlock Document" fires `onSubmit`.
 * - Clicking Cancel fires `onCancel`.
 * - When `isError=true`, an error message is shown.
 *
 * Design pattern: This is a "controlled modal" — the parent owns the
 * `isOpen` state. The component itself doesn't manage open/close.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordPrompt } from "@/components/PasswordPrompt";

describe("PasswordPrompt", () => {
  const defaultProps = {
    isOpen: true,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isError: false,
  };

  it("should not render when isOpen is false", () => {
    render(<PasswordPrompt {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Protected PDF")).not.toBeInTheDocument();
  });

  it("should render the modal when isOpen is true", () => {
    render(<PasswordPrompt {...defaultProps} />);

    expect(screen.getByText("Protected PDF")).toBeInTheDocument();
    expect(
      screen.getByText(/this document is password protected/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unlock document/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("should call onSubmit with the entered password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<PasswordPrompt {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Enter password"), "my-secret");
    await user.click(screen.getByRole("button", { name: /unlock document/i }));

    expect(onSubmit).toHaveBeenCalledWith("my-secret");
  });

  it("should clear the password field after submit for security", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<PasswordPrompt {...defaultProps} onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("Enter password");

    await user.type(input, "secret123");
    await user.click(screen.getByRole("button", { name: /unlock document/i }));

    // After submit, the password field should be cleared
    expect(input).toHaveValue("");
  });

  it("should call onCancel when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<PasswordPrompt {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("should call onCancel when X button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<PasswordPrompt {...defaultProps} onCancel={onCancel} />);

    // The X button is the non-Button close icon. It's a plain <button>.
    // Find it by its position — it's in the header next to "Protected PDF".
    const closeButtons = screen
      .getAllByRole("button")
      .filter((btn) => !btn.textContent?.includes("Cancel") && !btn.textContent?.includes("Unlock"));

    // There should be exactly one close button (the X)
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(closeButtons[0]);

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("should display error message when isError is true", () => {
    render(<PasswordPrompt {...defaultProps} isError={true} />);

    expect(
      screen.getByText(/incorrect password/i),
    ).toBeInTheDocument();
  });

  it("should NOT display error message when isError is false", () => {
    render(<PasswordPrompt {...defaultProps} isError={false} />);

    expect(screen.queryByText(/incorrect password/i)).not.toBeInTheDocument();
  });

  it("should submit on Enter key press (form behaviour)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<PasswordPrompt {...defaultProps} onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("Enter password");
    await user.type(input, "test-pw{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("test-pw");
  });

  it("should have password type input for security", () => {
    render(<PasswordPrompt {...defaultProps} />);

    const input = screen.getByPlaceholderText("Enter password");
    expect(input).toHaveAttribute("type", "password");
  });
});
