import React, { useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

/**
 * SearchBar Component
 *
 * This component provides PDF text search functionality with the following features:
 * - Text search within PDF using PDF.js text layer extraction
 * - Highlight search results on the canvas
 * - Navigate between matches (previous/next)
 * - Keyboard shortcut support (Ctrl+F to open, Enter to navigate, Escape to close)
 *
 * @example
 * <SearchBar
 *   pdfDocument={pdfDocument}
 *   currentPage={currentPage}
 *   scale={scale}
 *   onNavigateToPage={setCurrentPage}
 *   onHighlightsChange={setSearchHighlights}
 * />
 */

export interface SearchMatch {
  pageNumber: number;
  matchIndex: number;
  text: string;
  rects: DOMRect[];
}

// PDF.js document type (simplified for our needs)
interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{ items: Array<{ str?: string; transform?: number[]; width?: number; height?: number }> }>;
    getViewport(params: { scale: number }): { height: number; width: number };
  }>;
}

interface SearchBarProps {
  pdfDocument: PDFDocumentProxy | null;
  currentPage: number;
  scale: number;
  onNavigateToPage: (page: number) => void;
  onHighlightsChange: (highlights: SearchHighlight[]) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SearchHighlight {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isCurrent: boolean;
}

/**
 * SearchBar provides a search interface for finding text within PDFs.
 *
 * How it works:
 * 1. User enters search text
 * 2. Component extracts text content from each PDF page using PDF.js
 * 3. Finds all matches and their positions on the page
 * 4. Reports highlights to parent component for rendering
 * 5. Allows navigation between matches
 */
const SearchBar: React.FC<SearchBarProps> = memo(({
  pdfDocument,
  currentPage,
  scale: _scale, // Reserved for future zoom-aware features
  onNavigateToPage,
  onHighlightsChange,
  isOpen,
  onOpenChange,
}) => {
  // Suppress unused variable warning
  void _scale;

  const [searchText, setSearchText] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  /**
   * Updates the highlight rectangles that will be rendered on the PDF.
   *
   * @param allMatches - All search matches found
   * @param currentIndex - The index of the currently selected match
   */
  const updateHighlights = useCallback((allMatches: SearchMatch[], currentIndex: number) => {
    const highlights: SearchHighlight[] = [];

    allMatches.forEach((match, idx) => {
      match.rects.forEach((rect) => {
        highlights.push({
          pageNumber: match.pageNumber,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          isCurrent: idx === currentIndex,
        });
      });
    });

    onHighlightsChange(highlights);
  }, [onHighlightsChange]);

  /**
   * Searches for text across all pages in the PDF document.
   *
   * This function:
   * 1. Gets the text content from each page using PDF.js
   * 2. Finds all occurrences of the search term
   * 3. Stores the positions for highlighting
   *
   * Note: PDF.js provides text items with transform matrices that
   * tell us where the text is positioned on the page.
   */
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !pdfDocument) {
      setMatches([]);
      onHighlightsChange([]);
      return;
    }

    setIsSearching(true);
    const foundMatches: SearchMatch[] = [];
    const queryLower = query.toLowerCase();

    try {
      // Search through all pages
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 }); // Use scale=1 for PDF coordinates

        // Combine all text items into a single string for searching
        let pageText = "";
        const textItems: Array<{ str: string; transform: number[]; width: number; height: number }> = [];

        for (const item of textContent.items) {
          if ("str" in item) {
            const textItem = item as { str: string; transform: number[]; width: number; height: number };
            textItems.push(textItem);
            pageText += textItem.str;
          }
        }

        // Find all matches in this page's text
        const pageTextLower = pageText.toLowerCase();
        let searchIndex = 0;
        let charIndex = 0;

        while ((searchIndex = pageTextLower.indexOf(queryLower, charIndex)) !== -1) {
          // Find which text item(s) contain this match
          let currentCharIndex = 0;
          const matchRects: DOMRect[] = [];

          for (const item of textItems) {
            const itemEndIndex = currentCharIndex + item.str.length;

            // Check if this item overlaps with our match
            if (
              currentCharIndex < searchIndex + query.length &&
              itemEndIndex > searchIndex
            ) {
              // Calculate the position of this text item
              // The transform matrix is [scaleX, skewX, skewY, scaleY, translateX, translateY]
              const transform = item.transform;
              const x = transform[4];
              const y = viewport.height - transform[5]; // Flip Y coordinate
              const width = item.width || 50;
              const height = Math.abs(transform[0]) || 12; // Font size approximation

              matchRects.push(new DOMRect(x, y - height, width, height));
            }

            currentCharIndex = itemEndIndex;
          }

          if (matchRects.length > 0) {
            foundMatches.push({
              pageNumber: pageNum,
              matchIndex: foundMatches.length,
              text: pageText.substring(searchIndex, searchIndex + query.length),
              rects: matchRects,
            });
          }

          charIndex = searchIndex + 1;
        }
      }

      setMatches(foundMatches);
      setCurrentMatchIndex(0);

      // Update highlights
      updateHighlights(foundMatches, 0);
    } catch (error) {
      console.error("Error searching PDF:", error);
    }

    setIsSearching(false);
  }, [pdfDocument, onHighlightsChange, updateHighlights]);

  /**
   * Navigates to the next search result.
   * Wraps around to the first result when reaching the end.
   */
  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;

    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    updateHighlights(matches, nextIndex);

    // Navigate to the page containing the match
    const match = matches[nextIndex];
    if (match.pageNumber !== currentPage) {
      onNavigateToPage(match.pageNumber);
    }
  }, [matches, currentMatchIndex, currentPage, onNavigateToPage, updateHighlights]);

  /**
   * Navigates to the previous search result.
   * Wraps around to the last result when reaching the beginning.
   */
  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;

    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIndex);
    updateHighlights(matches, prevIndex);

    // Navigate to the page containing the match
    const match = matches[prevIndex];
    if (match.pageNumber !== currentPage) {
      onNavigateToPage(match.pageNumber);
    }
  }, [matches, currentMatchIndex, currentPage, onNavigateToPage, updateHighlights]);

  /**
   * Handles search input changes.
   * Debounces the search to avoid excessive API calls.
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchText);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchText, performSearch]);

  /**
   * Clears the search and closes the search bar.
   */
  const handleClose = useCallback(() => {
    setSearchText("");
    setMatches([]);
    setCurrentMatchIndex(0);
    onHighlightsChange([]);
    onOpenChange(false);
  }, [onHighlightsChange, onOpenChange]);

  /**
   * Keyboard event handler for search navigation.
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        goToPrevMatch();
      } else {
        goToNextMatch();
      }
    } else if (e.key === "Escape") {
      handleClose();
    }
  }, [goToNextMatch, goToPrevMatch, handleClose]);

  // Global keyboard shortcut (Ctrl+F)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onOpenChange]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-2 right-2 z-50 flex items-center gap-2 bg-card border border-border rounded-lg shadow-lg p-2 animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder="Search in document..."
          className="pl-8 pr-2 h-8 w-48 md:w-64 text-sm"
          autoFocus
        />
      </div>

      {/* Match count display */}
      <div className="text-xs text-muted-foreground min-w-16 text-center">
        {isSearching ? (
          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        ) : matches.length > 0 ? (
          <span className="tabular-nums">
            {currentMatchIndex + 1} / {matches.length}
          </span>
        ) : searchText.trim() ? (
          <span>No results</span>
        ) : null}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevMatch}
          disabled={matches.length === 0}
          className="h-7 w-7"
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMatch}
          disabled={matches.length === 0}
          className="h-7 w-7"
          title="Next match (Enter)"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        title="Close (Escape)"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
});

SearchBar.displayName = "SearchBar";

/**
 * SearchHighlightsOverlay Component
 *
 * Renders the highlight rectangles on top of the PDF canvas.
 * Each highlight is a semi-transparent colored rectangle that shows
 * where search matches are found.
 *
 * The current match (the one you're navigated to) is shown in a
 * different color to distinguish it from other matches.
 */
interface SearchHighlightsOverlayProps {
  highlights: SearchHighlight[];
  currentPage: number;
  scale: number;
}

export const SearchHighlightsOverlay: React.FC<SearchHighlightsOverlayProps> = memo(({
  highlights,
  currentPage,
  scale,
}) => {
  // Filter highlights for current page only
  const pageHighlights = highlights.filter((h) => h.pageNumber === currentPage);

  return (
    <>
      {pageHighlights.map((highlight, index) => (
        <div
          key={`highlight-${index}`}
          className={`absolute pointer-events-none transition-colors ${
            highlight.isCurrent
              ? "bg-primary/40 ring-2 ring-primary"
              : "bg-yellow-400/40"
          }`}
          style={{
            left: highlight.x * scale,
            top: highlight.y * scale,
            width: highlight.width * scale,
            height: highlight.height * scale,
          }}
        />
      ))}
    </>
  );
});

SearchHighlightsOverlay.displayName = "SearchHighlightsOverlay";

export default SearchBar;
