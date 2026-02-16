/**
 * Tests for the ThemeContext / ThemeProvider.
 *
 * ThemeContext is the React Context approach to theming (the app also has the
 * Zustand `themeStore` — the context is the original implementation).
 *
 * What we test:
 * - The `useTheme` hook throws when used outside a ThemeProvider (defensive).
 * - The provider supplies the correct default theme.
 * - `setTheme()` updates the theme and persists to localStorage.
 * - The "system" theme resolves to light or dark based on `prefers-color-scheme`.
 *
 * Why test Context and Store separately?
 * They're two independent implementations. The ThemeContext is the React way
 * (prop drilling / context). The themeStore is the Zustand way (global store).
 * Both exist in the codebase, so both need tests.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

/** Wrapper that provides ThemeProvider for hook tests. */
function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe("ThemeContext", () => {
  describe("useTheme hook", () => {
    it("should throw when used outside ThemeProvider", () => {
      // Suppress the expected console.error from React
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow("useTheme must be used within a ThemeProvider");

      spy.mockRestore();
    });

    it("should return the default theme values inside a provider", () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Default theme is "system", which resolves to "light" when
      // matchMedia returns matches: false (our global mock).
      expect(result.current.theme).toBe("system");
      expect(result.current.actualTheme).toBe("light");
      expect(typeof result.current.setTheme).toBe("function");
    });
  });

  describe("ThemeProvider", () => {
    it("should render children correctly", () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Hello</div>
        </ThemeProvider>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should apply the resolved theme class to documentElement", () => {
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>,
      );

      // Default "system" + matches:false → "light"
      expect(document.documentElement.classList.contains("light")).toBe(true);
    });
  });

  describe("setTheme", () => {
    /** Test component that exposes theme controls. */
    function ThemeTester() {
      const { theme, actualTheme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="actual">{actualTheme}</span>
          <button onClick={() => setTheme("dark")}>Set Dark</button>
          <button onClick={() => setTheme("dim")}>Set Dim</button>
        </div>
      );
    }

    it("should update theme when setTheme is called", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTester />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("system");

      await user.click(screen.getByText("Set Dark"));

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("actual")).toHaveTextContent("dark");
    });

    it("should persist the theme to localStorage", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTester />
        </ThemeProvider>,
      );

      await user.click(screen.getByText("Set Dark"));

      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("should switch to dim theme", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTester />
        </ThemeProvider>,
      );

      await user.click(screen.getByText("Set Dim"));

      expect(screen.getByTestId("actual")).toHaveTextContent("dim");
      expect(document.documentElement.classList.contains("dim")).toBe(true);
    });
  });
});
