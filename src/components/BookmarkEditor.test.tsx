/**
 * Tests for the BookmarkEditor component.
 *
 * This component manages PDF bookmarks (a.k.a. table of contents):
 * - Display existing bookmarks as a tree
 * - Add new bookmarks with title + page number
 * - Edit bookmark titles inline
 * - Delete bookmarks
 * - Navigate to a bookmark's page
 * - Empty state when no bookmarks exist
 *
 * Testing strategy:
 * - Provide bookmarks via props and assert rendering.
 * - Simulate add / edit / delete workflows via the form.
 * - Verify `onBookmarksChange` is called with the correct new array.
 * - Verify `onNavigateToPage` is called when clicking a bookmark.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookmarkEditor from "@/components/BookmarkEditor";
import type { BookmarkItem } from "@/components/BookmarkEditor";

describe("BookmarkEditor", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onBookmarksChange: ReturnType<typeof vi.fn>;
  let onNavigateToPage: ReturnType<typeof vi.fn>;

  const sampleBookmarks: BookmarkItem[] = [
    {
      id: "bm1",
      title: "Introduction",
      pageIndex: 0,
      children: [],
      isExpanded: false,
    },
    {
      id: "bm2",
      title: "Chapter 1",
      pageIndex: 4,
      children: [
        {
          id: "bm2-1",
          title: "Section 1.1",
          pageIndex: 5,
          children: [],
          isExpanded: false,
        },
      ],
      isExpanded: true,
    },
  ];

  beforeEach(() => {
    onClose = vi.fn();
    onBookmarksChange = vi.fn();
    onNavigateToPage = vi.fn();
  });

  const renderEditor = (overrides = {}) =>
    render(
      <BookmarkEditor
        isOpen={true}
        onClose={onClose}
        bookmarks={sampleBookmarks}
        currentPage={1}
        totalPages={20}
        onBookmarksChange={onBookmarksChange}
        onNavigateToPage={onNavigateToPage}
        {...overrides}
      />,
    );

  // ── Visibility ──────────────────────────────────────────────

  it("should render nothing when isOpen is false", () => {
    const { container } = renderEditor({ isOpen: false });
    expect(container.innerHTML).toBe("");
  });

  it("should render the title", () => {
    renderEditor();
    expect(screen.getByText("Bookmarks")).toBeInTheDocument();
  });

  // ── Empty state ─────────────────────────────────────────────

  it("should show empty state when no bookmarks exist", () => {
    renderEditor({ bookmarks: [] });

    expect(screen.getByText("No bookmarks yet")).toBeInTheDocument();
    expect(
      screen.getByText(/add bookmarks to quickly navigate/i),
    ).toBeInTheDocument();
  });

  // ── Display bookmarks ──────────────────────────────────────

  it("should display bookmark titles", () => {
    renderEditor();

    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
  });

  it("should display child bookmarks when parent is expanded", () => {
    renderEditor();

    // Chapter 1 is expanded → Section 1.1 should be visible
    expect(screen.getByText("Section 1.1")).toBeInTheDocument();
  });

  it("should show page numbers for bookmarks", () => {
    renderEditor();

    expect(screen.getByText("p.1")).toBeInTheDocument(); // Introduction
    expect(screen.getByText("p.5")).toBeInTheDocument(); // Chapter 1
  });

  // ── Navigation ──────────────────────────────────────────────

  it("should call onNavigateToPage when a bookmark is clicked", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByText("Introduction"));

    expect(onNavigateToPage).toHaveBeenCalledWith(1); // pageIndex 0 → page 1
  });

  it("should navigate to child bookmark page", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByText("Section 1.1"));

    expect(onNavigateToPage).toHaveBeenCalledWith(6); // pageIndex 5 → page 6
  });

  // ── Add bookmark ────────────────────────────────────────────

  it("should show add form when Add Bookmark is clicked", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByText("Add Bookmark"));

    expect(screen.getByPlaceholderText("Bookmark title...")).toBeInTheDocument();
  });

  it("should add new bookmark with title and page", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByText("Add Bookmark"));

    await user.type(
      screen.getByPlaceholderText("Bookmark title..."),
      "Conclusion",
    );

    // The "Add" button in the form (not the "Add Bookmark" footer button)
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onBookmarksChange).toHaveBeenCalledOnce();
    const newBookmarks = onBookmarksChange.mock.calls[0][0];
    expect(newBookmarks.length).toBe(3); // 2 original + 1 new
    expect(newBookmarks[2].title).toBe("Conclusion");
  });

  it("should not add bookmark with empty title", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByText("Add Bookmark"));
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onBookmarksChange).not.toHaveBeenCalled();
  });

  // ── Delete bookmark ─────────────────────────────────────────

  it("should delete a bookmark when its delete button is clicked", async () => {
    const user = userEvent.setup();
    renderEditor();

    // Hover over "Introduction" to reveal action buttons
    const deleteButtons = screen.getAllByTitle("Delete");
    await user.click(deleteButtons[0]);

    expect(onBookmarksChange).toHaveBeenCalledOnce();
    const updated = onBookmarksChange.mock.calls[0][0];
    // "Introduction" (bm1) should be removed
    expect(updated.find((b: BookmarkItem) => b.id === "bm1")).toBeUndefined();
  });

  // ── Close ───────────────────────────────────────────────────

  it("should call onClose when X button is clicked", async () => {
    const user = userEvent.setup();
    renderEditor();

    // The close button contains the X icon; find it by querying all buttons
    // in the header bar (the parent div of "Bookmarks").
    const headerBar = screen.getByText("Bookmarks").closest(
      ".flex.items-center.justify-between",
    ) as HTMLElement;
    const closeButton = within(headerBar).getByRole("button");
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should call onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    renderEditor();

    const backdrop = screen
      .getByText("Bookmarks")
      .closest(".fixed") as HTMLElement;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
