/**
 * Tests for the ThemeSwitcher component.
 *
 * ThemeSwitcher is a dropdown that lets users pick a theme (Light, Dark, Dim,
 * System). It reads and writes the theme via the Zustand `useThemeStore`.
 *
 * Testing approach:
 * - Click the toggle button to open/close the dropdown.
 * - Verify all four theme options are listed.
 * - Click a theme option and verify the store updates.
 * - Click the backdrop to close the dropdown.
 *
 * Key concept: This component uses a Zustand store directly (not React Context).
 * In tests we interact with the store via `useThemeStore.getState()` to verify
 * state changes. We don't mock the store — we test against the real one for
 * realistic coverage.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useThemeStore } from "@/stores/themeStore";

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    // Reset theme store to a known state before each test
    useThemeStore.setState({ theme: "system", actualTheme: "light" });
  });

  it("should render the toggle button", () => {
    render(<ThemeSwitcher />);

    // The button's title contains the current theme name
    expect(screen.getByTitle(/theme:/i)).toBeInTheDocument();
  });

  it("should not show the dropdown menu initially", () => {
    render(<ThemeSwitcher />);

    expect(screen.queryByText("Light")).not.toBeInTheDocument();
    expect(screen.queryByText("Dark")).not.toBeInTheDocument();
  });

  it("should open the dropdown when the button is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    await user.click(screen.getByTitle(/theme:/i));

    // All four theme options should be visible
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("Dim")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("should switch to dark theme when Dark option is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    await user.click(screen.getByTitle(/theme:/i));
    await user.click(screen.getByText("Dark"));

    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("should switch to light theme when Light option is clicked", async () => {
    const user = userEvent.setup();
    // Start with dark so we can verify switching to light
    useThemeStore.setState({ theme: "dark", actualTheme: "dark" });

    render(<ThemeSwitcher />);

    await user.click(screen.getByTitle(/theme:/i));
    await user.click(screen.getByText("Light"));

    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("should switch to dim theme when Dim option is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    await user.click(screen.getByTitle(/theme:/i));
    await user.click(screen.getByText("Dim"));

    expect(useThemeStore.getState().theme).toBe("dim");
  });

  it("should close the dropdown after selecting a theme", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    await user.click(screen.getByTitle(/theme:/i));
    await user.click(screen.getByText("Dark"));

    // Dropdown should be closed — options should not be visible
    expect(screen.queryByText("Light")).not.toBeInTheDocument();
  });

  it("should close the dropdown when clicking the backdrop", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    // Open the dropdown
    await user.click(screen.getByTitle(/theme:/i));
    expect(screen.getByText("Dark")).toBeInTheDocument();

    // The backdrop is a fixed div covering the entire screen
    // It appears when isOpen is true, so we click somewhere on it.
    // The backdrop is the element with class "fixed inset-0 z-40".
    const backdrop = document.querySelector(".fixed.inset-0.z-40");
    expect(backdrop).toBeTruthy();

    await user.click(backdrop!);

    // Dropdown should be closed
    expect(screen.queryByText("Dark")).not.toBeInTheDocument();
  });
});
