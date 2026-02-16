/**
 * Tests for the SearchBar component.
 *
 * SearchBar provides Ctrl+F-style search within PDF documents. It:
 * - Shows/hides based on `isOpen` prop
 * - Debounces search input (300ms)
 * - Navigates between matches (next/prev)
 * - Supports keyboard shortcuts (Enter, Shift+Enter, Escape)
 *
 * Testing approach:
 * - We pass a mock `pdfDocument` that returns text content from pages.
 * - We test the UI interactions: typing, pressing Enter, clicking buttons.
 * - We use `vi.useFakeTimers()` to control the debounce.
 *
 * Key concept: Debouncing — the search doesn't fire immediately on every
 * keystroke. It waits 300ms after the user stops typing. This prevents
 * hammering the PDF text extraction for every character. In tests, we
 * advance fake timers to trigger the debounced search.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "@/components/SearchBar";

/**
 * Creates a mock PDF document that returns predictable text content.
 * Each page returns "Hello World, this is page N" as its text.
 */
function createMockPDFDocument(numPages = 3) {
  return {
    numPages,
    getPage: vi.fn(async (pageNum: number) => ({
      getTextContent: vi.fn(async () => ({
        items: [
          {
            str: `Hello World, this is page ${pageNum}`,
            transform: [12, 0, 0, 12, 50, 700],
            width: 200,
            height: 12,
          },
        ],
      })),
      getViewport: vi.fn(() => ({ height: 792, width: 612 })),
    })),
  };
}

describe("SearchBar", () => {
  const defaultProps = {
    pdfDocument: null,
    currentPage: 1,
    scale: 1,
    onNavigateToPage: vi.fn(),
    onHighlightsChange: vi.fn(),
    isOpen: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("visibility", () => {
    it("should not render when isOpen is false", () => {
      render(<SearchBar {...defaultProps} isOpen={false} />);

      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    });

    it("should render the search input when isOpen is true", () => {
      render(<SearchBar {...defaultProps} isOpen={true} />);

      expect(screen.getByPlaceholderText(/search in document/i)).toBeInTheDocument();
    });
  });

  describe("search input", () => {
    it("should auto-focus the search input when opened", () => {
      render(<SearchBar {...defaultProps} isOpen={true} />);

      const input = screen.getByPlaceholderText(/search in document/i);
      expect(input).toHaveFocus();
    });

    it("should show 'No results' when search text has no matches", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockDoc = createMockPDFDocument(1);

      render(
        <SearchBar {...defaultProps} pdfDocument={mockDoc} isOpen={true} />,
      );

      await user.type(
        screen.getByPlaceholderText(/search in document/i),
        "nonexistent",
      );

      // Advance past the 300ms debounce
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(await screen.findByText("No results")).toBeInTheDocument();
    });

    it("should show match count when search finds results", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockDoc = createMockPDFDocument(2);

      render(
        <SearchBar {...defaultProps} pdfDocument={mockDoc} isOpen={true} />,
      );

      await user.type(
        screen.getByPlaceholderText(/search in document/i),
        "Hello",
      );

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      // Should show "1 / 2" (first match of 2 total, one on each page)
      expect(await screen.findByText(/1\s*\/\s*2/)).toBeInTheDocument();
    });
  });

  describe("close behaviour", () => {
    it("should call onOpenChange(false) when Close button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onOpenChange = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          isOpen={true}
          onOpenChange={onOpenChange}
        />,
      );

      await user.click(screen.getByTitle("Close (Escape)"));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onOpenChange(false) when Escape is pressed", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onOpenChange = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          isOpen={true}
          onOpenChange={onOpenChange}
        />,
      );

      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should clear highlights when closed", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onHighlightsChange = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          isOpen={true}
          onHighlightsChange={onHighlightsChange}
        />,
      );

      await user.click(screen.getByTitle("Close (Escape)"));

      // The last call should pass an empty array to clear highlights
      const lastCall =
        onHighlightsChange.mock.calls[onHighlightsChange.mock.calls.length - 1];
      expect(lastCall[0]).toEqual([]);
    });
  });

  describe("navigation buttons", () => {
    it("should disable navigation buttons when no matches exist", () => {
      render(<SearchBar {...defaultProps} isOpen={true} />);

      expect(screen.getByTitle(/previous match/i)).toBeDisabled();
      expect(screen.getByTitle(/next match/i)).toBeDisabled();
    });
  });

  describe("keyboard shortcut (Ctrl+F)", () => {
    it("should call onOpenChange(true) when Ctrl+F is pressed globally", async () => {
      const onOpenChange = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          isOpen={false}
          onOpenChange={onOpenChange}
        />,
      );

      // Simulate Ctrl+F
      const event = new KeyboardEvent("keydown", {
        key: "f",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });
});
