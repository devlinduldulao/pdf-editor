/**
 * Test utilities — re-exports everything from @testing-library/react and
 * provides a custom `renderWithProviders` helper that wraps components in
 * all the context providers the app uses (Theme, etc.).
 *
 * Why a custom render?
 * Many components depend on React context (ThemeProvider, etc.). If you
 * render them without those providers, they crash or behave incorrectly.
 * `renderWithProviders` wraps the component under test in all necessary
 * providers so each test gets a realistic environment.
 */
import { render, type RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { ReactElement, ReactNode } from "react";

/**
 * Creates a wrapper component that includes all application providers.
 * This is used by both `renderWithProviders` and `renderHook`.
 */
function AllProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

/**
 * Custom render that wraps the component in all necessary providers.
 *
 * Usage:
 * ```tsx
 * import { renderWithProviders, screen } from "@/testing/test-utils";
 *
 * renderWithProviders(<MyComponent />);
 * expect(screen.getByText("Hello")).toBeInTheDocument();
 * ```
 */
function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library so tests only need one import
export * from "@testing-library/react";
export { renderWithProviders };
