import React, { memo, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bookmark,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
  X,
  Edit2,
  Check,
} from "lucide-react";

export interface BookmarkItem {
  id: string;
  title: string;
  pageIndex: number;
  children: BookmarkItem[];
  isExpanded: boolean;
}

interface BookmarkEditorProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  currentPage: number;
  totalPages: number;
  onBookmarksChange: (bookmarks: BookmarkItem[]) => void;
  onNavigateToPage: (page: number) => void;
}

const BookmarkEditor: React.FC<BookmarkEditorProps> = memo(
  ({
    isOpen,
    onClose,
    bookmarks,
    currentPage,
    totalPages,
    onBookmarksChange,
    onNavigateToPage,
  }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newPage, setNewPage] = useState(1);

    useEffect(() => {
      setNewPage(currentPage);
    }, [currentPage]);

    const handleAddBookmark = useCallback(() => {
      if (!newTitle.trim()) return;

      const newBookmark: BookmarkItem = {
        id: `bookmark_${Date.now()}`,
        title: newTitle,
        pageIndex: newPage - 1,
        children: [],
        isExpanded: false,
      };

      onBookmarksChange([...bookmarks, newBookmark]);
      setNewTitle("");
      setNewPage(currentPage);
      setIsAdding(false);
    }, [newTitle, newPage, currentPage, bookmarks, onBookmarksChange]);

    const handleDeleteBookmark = useCallback(
      (id: string) => {
        const deleteRecursive = (items: BookmarkItem[]): BookmarkItem[] => {
          return items
            .filter((item) => item.id !== id)
            .map((item) => ({
              ...item,
              children: deleteRecursive(item.children),
            }));
        };
        onBookmarksChange(deleteRecursive(bookmarks));
      },
      [bookmarks, onBookmarksChange]
    );

    const handleToggleExpand = useCallback(
      (id: string) => {
        const toggleRecursive = (items: BookmarkItem[]): BookmarkItem[] => {
          return items.map((item) => ({
            ...item,
            isExpanded: item.id === id ? !item.isExpanded : item.isExpanded,
            children: toggleRecursive(item.children),
          }));
        };
        onBookmarksChange(toggleRecursive(bookmarks));
      },
      [bookmarks, onBookmarksChange]
    );

    const handleStartEdit = useCallback((bookmark: BookmarkItem) => {
      setEditingId(bookmark.id);
      setEditTitle(bookmark.title);
    }, []);

    const handleSaveEdit = useCallback(
      (id: string) => {
        if (!editTitle.trim()) {
          setEditingId(null);
          return;
        }

        const updateRecursive = (items: BookmarkItem[]): BookmarkItem[] => {
          return items.map((item) => ({
            ...item,
            title: item.id === id ? editTitle : item.title,
            children: updateRecursive(item.children),
          }));
        };
        onBookmarksChange(updateRecursive(bookmarks));
        setEditingId(null);
      },
      [editTitle, bookmarks, onBookmarksChange]
    );

    const renderBookmark = (bookmark: BookmarkItem, depth: number = 0) => {
      const hasChildren = bookmark.children.length > 0;
      const isEditing = editingId === bookmark.id;

      return (
        <div key={bookmark.id}>
          <div
            className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 group transition-colors ${
              bookmark.pageIndex + 1 === currentPage ? "bg-primary/10" : ""
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {/* Expand/collapse button */}
            <button
              className={`w-5 h-5 flex items-center justify-center ${
                hasChildren ? "hover:bg-muted rounded" : "opacity-0"
              }`}
              onClick={() => hasChildren && handleToggleExpand(bookmark.id)}
            >
              {hasChildren &&
                (bookmark.isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                ))}
            </button>

            {/* Bookmark icon */}
            <Bookmark className="w-4 h-4 text-primary shrink-0" />

            {/* Title */}
            {isEditing ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-6 text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(bookmark.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <Button
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleSaveEdit(bookmark.id)}
                >
                  <Check className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <button
                className="flex-1 text-left text-sm truncate hover:text-primary"
                onClick={() => onNavigateToPage(bookmark.pageIndex + 1)}
                title={`Go to page ${bookmark.pageIndex + 1}`}
              >
                {bookmark.title}
              </button>
            )}

            {/* Page number */}
            {!isEditing && (
              <span className="text-xs text-muted-foreground shrink-0">
                p.{bookmark.pageIndex + 1}
              </span>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleStartEdit(bookmark)}
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDeleteBookmark(bookmark.id)}
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Children */}
          {bookmark.isExpanded && bookmark.children.length > 0 && (
            <div>
              {bookmark.children.map((child) => renderBookmark(child, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Bookmarks</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[50vh] overflow-y-auto">
            {bookmarks.length === 0 && !isAdding ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">No bookmarks yet</p>
                <p className="text-muted-foreground/70 text-xs mt-1">
                  Add bookmarks to quickly navigate your document
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {bookmarks.map((bookmark) => renderBookmark(bookmark))}
              </div>
            )}

            {/* Add new bookmark form */}
            {isAdding && (
              <div className="mt-4 p-3 border border-border rounded-lg bg-muted/30 space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Title
                  </label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Bookmark title..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddBookmark();
                      if (e.key === "Escape") setIsAdding(false);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Page
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={newPage}
                    onChange={(e) => setNewPage(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddBookmark}
                    disabled={!newTitle.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/30">
            <Button
              className="w-full gap-2"
              variant="outline"
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
            >
              <Plus className="w-4 h-4" />
              Add Bookmark
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

BookmarkEditor.displayName = "BookmarkEditor";

export default BookmarkEditor;
