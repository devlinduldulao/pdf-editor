/**
 * Tests for the Button UI component.
 *
 * The Button wraps Base UI's `ButtonPrimitive` and adds variant/size styling
 * via `class-variance-authority` (CVA). CVA generates the correct Tailwind
 * classes based on the `variant` and `size` props.
 *
 * What we test:
 * - It renders children text
 * - onClick fires correctly
 * - The disabled state is applied
 * - The `data-slot="button"` attribute is set (used by other shadcn components)
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("should render children text", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click</Button>);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should be disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>,
    );

    await user.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should have data-slot='button' attribute", () => {
    render(<Button>Test</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button");
  });

  it("should apply custom className alongside variant classes", () => {
    render(<Button className="my-extra-class">Styled</Button>);

    expect(screen.getByRole("button").className).toContain("my-extra-class");
  });
});
