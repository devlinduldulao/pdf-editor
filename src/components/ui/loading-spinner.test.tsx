/**
 * Tests for the LoadingSpinner UI component.
 *
 * LoadingSpinner is a simple presentational component that renders a spinning
 * circle. It accepts a `size` prop that controls how big the spinner is.
 *
 * Why test a simple spinner?
 * 1. It has a `sr-only` "Loading..." text for screen readers — we want to make
 *    sure that accessibility feature stays.
 * 2. The size variants apply different CSS classes — we verify each one works.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

describe("LoadingSpinner", () => {
  it("should render with screen-reader text", () => {
    render(<LoadingSpinner />);

    // The "Loading..." text is inside a `sr-only` span for accessibility.
    // Even though sighted users can't see it, screen readers can.
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should apply the default size classes", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.firstChild as HTMLElement;

    // Default size uses w-8 h-8
    expect(spinner.className).toContain("w-8");
    expect(spinner.className).toContain("h-8");
  });

  it("should apply sm size classes", () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner.className).toContain("w-4");
    expect(spinner.className).toContain("h-4");
  });

  it("should apply lg size classes", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner.className).toContain("w-12");
    expect(spinner.className).toContain("h-12");
  });

  it("should apply xl size classes", () => {
    const { container } = render(<LoadingSpinner size="xl" />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner.className).toContain("w-16");
    expect(spinner.className).toContain("h-16");
  });

  it("should merge custom className", () => {
    const { container } = render(<LoadingSpinner className="my-custom-class" />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner.className).toContain("my-custom-class");
  });

  it("should have the animate-spin class for the spinning animation", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner.className).toContain("animate-spin");
  });
});
