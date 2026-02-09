/**
 * Tests for the Theme Zustand store.
 *
 * The theme store uses Zustand with the `persist` middleware to save the
 * user's theme preference to localStorage. It also listens to the system
 * `prefers-color-scheme` media query so it can follow OS-level dark mode.
 *
 * Testing approach:
 * - We reset the store and localStorage between tests.
 * - We verify that `setTheme` updates both the store and the DOM.
 * - We check that the "system" theme resolves to light/dark correctly.
 *
 * Why test DOM side effects (classList)?
 * The store intentionally manages `document.documentElement.classList` —
 * that IS the feature. If it stops applying classes, the whole theme breaks.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useThemeStore } from "@/stores/themeStore";

describe("themeStore", () => {
  beforeEach(() => {
    // Clean up DOM classes added by previous tests
    document.documentElement.classList.remove("light", "dark", "dim");

    // Reset the store state directly
    useThemeStore.setState({
      theme: "system",
      actualTheme: "light",
    });

    // Clear persisted data
    localStorage.removeItem("theme-storage");
  });

  describe("initial state", () => {
    it("should have 'system' as default theme", () => {
      expect(useThemeStore.getState().theme).toBe("system");
    });
  });

  describe("setTheme", () => {
    it("should update the theme to 'dark'", () => {
      useThemeStore.getState().setTheme("dark");

      const { theme, actualTheme } = useThemeStore.getState();
      expect(theme).toBe("dark");
      expect(actualTheme).toBe("dark");
    });

    it("should update the theme to 'light'", () => {
      useThemeStore.getState().setTheme("light");

      const { theme, actualTheme } = useThemeStore.getState();
      expect(theme).toBe("light");
      expect(actualTheme).toBe("light");
    });

    it("should update the theme to 'dim'", () => {
      useThemeStore.getState().setTheme("dim");

      const { theme, actualTheme } = useThemeStore.getState();
      expect(theme).toBe("dim");
      expect(actualTheme).toBe("dim");
    });

    it("should add the correct class to the document element", () => {
      useThemeStore.getState().setTheme("dark");

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    it("should remove previous theme class when switching", () => {
      useThemeStore.getState().setTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      useThemeStore.getState().setTheme("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(document.documentElement.classList.contains("light")).toBe(true);
    });
  });

  describe("initializeTheme", () => {
    it("should resolve 'system' theme based on media query", () => {
      // The global mock in setup.ts returns `matches: false` by default,
      // which means "prefers-color-scheme: dark" is false → light mode.
      useThemeStore.setState({ theme: "system" });
      useThemeStore.getState().initializeTheme();

      expect(useThemeStore.getState().actualTheme).toBe("light");
    });

    it("should resolve 'system' to 'dark' when media query matches", () => {
      // Override matchMedia to say user prefers dark
      vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      useThemeStore.setState({ theme: "system" });
      useThemeStore.getState().initializeTheme();

      expect(useThemeStore.getState().actualTheme).toBe("dark");

      vi.restoreAllMocks();
    });
  });
});
