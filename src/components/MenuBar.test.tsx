/**
 * Tests for the MenuBar component.
 *
 * MenuBar is the top header of the app. It contains:
 * - Logo/title
 * - Action buttons: New, Save, Print, Export (Save As)
 * - ThemeSwitcher (tested separately)
 * - GitHub/Bug report links
 *
 * Testing approach:
 * - Verify all buttons render
 * - Verify Save/Print/Export are disabled when `hasDocument` is false
 * - Verify callbacks fire on button click
 * - Verify external links open correctly
 *
 * Key concept: `memo()` — MenuBar is wrapped in `React.memo()` to prevent
 * unnecessary re-renders when parent state changes but the menu bar props
 * haven't changed. We don't test memoization itself (that's React's job),
 * we test the component's behavior.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MenuBar from "@/components/MenuBar";

describe("MenuBar", () => {
  const defaultProps = {
    onSave: vi.fn(),
    onSaveAs: vi.fn(),
    onNew: vi.fn(),
    onPrint: vi.fn(),
    hasDocument: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render the app title", () => {
      render(<MenuBar {...defaultProps} />);

      // The logo says "PDF" + "Editor" (or "E" on mobile)
      expect(screen.getByText("Editor")).toBeInTheDocument();
    });

    it("should render the New button", () => {
      render(<MenuBar {...defaultProps} />);

      expect(screen.getByTitle("New")).toBeInTheDocument();
    });

    it("should render Save, Print, and Export buttons", () => {
      render(<MenuBar {...defaultProps} />);

      expect(screen.getByTitle("Save")).toBeInTheDocument();
      expect(screen.getByTitle("Print PDF")).toBeInTheDocument();
      expect(screen.getByTitle("Export")).toBeInTheDocument();
    });
  });

  describe("disabled state — no document loaded", () => {
    it("should disable Save when hasDocument is false", () => {
      render(<MenuBar {...defaultProps} hasDocument={false} />);

      expect(screen.getByTitle("Save")).toBeDisabled();
    });

    it("should disable Print when hasDocument is false", () => {
      render(<MenuBar {...defaultProps} hasDocument={false} />);

      expect(screen.getByTitle("Print PDF")).toBeDisabled();
    });

    it("should disable Export when hasDocument is false", () => {
      render(<MenuBar {...defaultProps} hasDocument={false} />);

      expect(screen.getByTitle("Export")).toBeDisabled();
    });

    it("should NOT disable the New button when hasDocument is false", () => {
      render(<MenuBar {...defaultProps} hasDocument={false} />);

      expect(screen.getByTitle("New")).not.toBeDisabled();
    });
  });

  describe("enabled state — document loaded", () => {
    it("should enable Save when hasDocument is true", () => {
      render(<MenuBar {...defaultProps} hasDocument={true} />);

      expect(screen.getByTitle("Save")).not.toBeDisabled();
    });

    it("should enable Print when hasDocument is true", () => {
      render(<MenuBar {...defaultProps} hasDocument={true} />);

      expect(screen.getByTitle("Print PDF")).not.toBeDisabled();
    });

    it("should enable Export when hasDocument is true", () => {
      render(<MenuBar {...defaultProps} hasDocument={true} />);

      expect(screen.getByTitle("Export")).not.toBeDisabled();
    });
  });

  describe("callbacks", () => {
    it("should call onNew when New button is clicked", async () => {
      const user = userEvent.setup();
      const onNew = vi.fn();

      render(<MenuBar {...defaultProps} onNew={onNew} />);

      await user.click(screen.getByTitle("New"));

      expect(onNew).toHaveBeenCalledOnce();
    });

    it("should call onSave when Save button is clicked", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(<MenuBar {...defaultProps} onSave={onSave} hasDocument={true} />);

      await user.click(screen.getByTitle("Save"));

      expect(onSave).toHaveBeenCalledOnce();
    });

    it("should call onPrint when Print button is clicked", async () => {
      const user = userEvent.setup();
      const onPrint = vi.fn();

      render(<MenuBar {...defaultProps} onPrint={onPrint} hasDocument={true} />);

      await user.click(screen.getByTitle("Print PDF"));

      expect(onPrint).toHaveBeenCalledOnce();
    });

    it("should call onSaveAs when Export button is clicked", async () => {
      const user = userEvent.setup();
      const onSaveAs = vi.fn();

      render(<MenuBar {...defaultProps} onSaveAs={onSaveAs} hasDocument={true} />);

      await user.click(screen.getByTitle("Export"));

      expect(onSaveAs).toHaveBeenCalledOnce();
    });
  });

  describe("external links", () => {
    it("should have a GitHub link button", () => {
      render(<MenuBar {...defaultProps} />);

      expect(screen.getByTitle("View on GitHub")).toBeInTheDocument();
    });

    it("should have a report issue link button", () => {
      render(<MenuBar {...defaultProps} />);

      expect(screen.getByTitle("Report an issue")).toBeInTheDocument();
    });

    it("should open GitHub page when GitHub button is clicked", async () => {
      const user = userEvent.setup();
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

      render(<MenuBar {...defaultProps} />);

      await user.click(screen.getByTitle("View on GitHub"));

      expect(openSpy).toHaveBeenCalledWith(
        "https://github.com/devlinduldulao/pdf-editor",
        "_blank",
      );

      openSpy.mockRestore();
    });
  });
});
