import React, { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StickyNote, Plus, Trash2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

export interface StickyNoteAnnotation {
  id: string;
  x: number;
  y: number;
  content: string;
  author: string;
  createdAt: Date;
  color: string;
  pageNumber: number;
  isExpanded: boolean;
  replies: StickyNoteReply[];
}

export interface StickyNoteReply {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

const NOTE_COLORS = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Blue", value: "#93c5fd" },
  { name: "Green", value: "#86efac" },
  { name: "Pink", value: "#f9a8d4" },
  { name: "Orange", value: "#fed7aa" },
  { name: "Purple", value: "#c4b5fd" },
];

interface StickyNotesCanvasProps {
  notes: StickyNoteAnnotation[];
  currentPage: number;
  scale: number;
  canvasHeight?: number;
  isActive: boolean;
  onAddNote: (note: StickyNoteAnnotation) => void;
  onUpdateNote: (id: string, updates: Partial<StickyNoteAnnotation>) => void;
  onDeleteNote: (id: string) => void;
  onAddReply: (noteId: string, reply: StickyNoteReply) => void;
}

const StickyNotesCanvas: React.FC<StickyNotesCanvasProps> = memo(
  ({
    notes,
    currentPage,
    scale,
    canvasHeight: _canvasHeight,
    isActive,
    onAddNote,
    onUpdateNote,
    onDeleteNote,
    onAddReply,
  }) => {
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newNoteColor, setNewNoteColor] = useState("#fef08a");
    const [replyText, setReplyText] = useState<Record<string, string>>({});

    const currentPageNotes = notes.filter((n) => n.pageNumber === currentPage);

    const handleCanvasClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isActive || !isCreating) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        const newNote: StickyNoteAnnotation = {
          id: `note_${Date.now()}`,
          x,
          y,
          content: "",
          author: "User",
          createdAt: new Date(),
          color: newNoteColor,
          pageNumber: currentPage,
          isExpanded: true,
          replies: [],
        };

        onAddNote(newNote);
        setSelectedNoteId(newNote.id);
        setIsCreating(false);
      },
      [isActive, isCreating, scale, currentPage, newNoteColor, onAddNote]
    );

    const handleToggleExpand = useCallback(
      (noteId: string, isExpanded: boolean) => {
        onUpdateNote(noteId, { isExpanded: !isExpanded });
      },
      [onUpdateNote]
    );

    const handleContentChange = useCallback(
      (noteId: string, content: string) => {
        onUpdateNote(noteId, { content });
      },
      [onUpdateNote]
    );

    const handleAddReply = useCallback(
      (noteId: string) => {
        const text = replyText[noteId];
        if (!text?.trim()) return;

        const reply: StickyNoteReply = {
          id: `reply_${Date.now()}`,
          content: text,
          author: "User",
          createdAt: new Date(),
        };

        onAddReply(noteId, reply);
        setReplyText((prev) => ({ ...prev, [noteId]: "" }));
      },
      [replyText, onAddReply]
    );

    const renderNote = (note: StickyNoteAnnotation) => {
      const displayX = note.x * scale;
      const displayY = note.y * scale;
      const isSelected = selectedNoteId === note.id;

      return (
        <div
          key={note.id}
          className={`absolute z-20 ${isSelected ? "z-30" : ""}`}
          style={{
            left: displayX,
            top: displayY,
            transform: "translate(-8px, -8px)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNoteId(note.id);
          }}
        >
          {/* Note Icon */}
          <div
            className={`w-8 h-8 rounded-md shadow-lg cursor-pointer flex items-center justify-center transition-transform hover:scale-110 ${
              isSelected ? "ring-2 ring-primary" : ""
            }`}
            style={{ backgroundColor: note.color }}
          >
            <StickyNote className="w-4 h-4 text-amber-800" />
          </div>

          {/* Expanded Note Content */}
          {note.isExpanded && (
            <div
              className="absolute left-10 top-0 min-w-[250px] max-w-[350px] bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
              style={{ borderTopColor: note.color, borderTopWidth: 4 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {note.author}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleExpand(note.id, note.isExpanded);
                    }}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                <textarea
                  value={note.content}
                  onChange={(e) => handleContentChange(note.id, e.target.value)}
                  placeholder="Add your note..."
                  className="w-full min-h-[60px] text-sm bg-transparent border-none resize-none focus:outline-none focus:ring-0"
                />
              </div>

              {/* Replies */}
              {note.replies.length > 0 && (
                <div className="border-t border-border">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    Replies ({note.replies.length})
                  </div>
                  <div className="max-h-[150px] overflow-y-auto">
                    {note.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="px-3 py-2 border-t border-border/50 text-xs"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{reply.author}</span>
                          <span className="text-muted-foreground/60">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Reply */}
              <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/30">
                <Input
                  value={replyText[note.id] || ""}
                  onChange={(e) =>
                    setReplyText((prev) => ({
                      ...prev,
                      [note.id]: e.target.value,
                    }))
                  }
                  placeholder="Add reply..."
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddReply(note.id);
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddReply(note.id);
                  }}
                >
                  <MessageSquare className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Collapsed indicator */}
          {!note.isExpanded && (
            <button
              className="absolute left-10 top-0 px-2 py-1 bg-card border border-border rounded shadow text-xs text-muted-foreground hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(note.id, note.isExpanded);
              }}
            >
              <ChevronDown className="w-3 h-3 inline mr-1" />
              {note.content.substring(0, 20) || "Empty note"}
              {note.content.length > 20 ? "..." : ""}
            </button>
          )}
        </div>
      );
    };

    if (!isActive) {
      return (
        <div className="absolute inset-0 pointer-events-none">
          {currentPageNotes.map(renderNote)}
        </div>
      );
    }

    return (
      <div
        className={`absolute inset-0 ${isCreating ? "cursor-crosshair" : ""}`}
        onClick={handleCanvasClick}
      >
        {/* Toolbar */}
        <div className="absolute top-2 left-2 z-50 flex items-center gap-2 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg px-3 py-2">
          <Button
            variant={isCreating ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsCreating(!isCreating);
            }}
            className="h-7 gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Note
          </Button>
          
          {isCreating && (
            <div className="flex items-center gap-1 border-l border-border pl-2">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color.value}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                    newNoteColor === color.value
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewNoteColor(color.value);
                  }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Status indicator */}
        {isCreating && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm animate-pulse">
            Click anywhere to add a sticky note
          </div>
        )}

        {/* Render notes */}
        {currentPageNotes.map(renderNote)}
      </div>
    );
  }
);

StickyNotesCanvas.displayName = "StickyNotesCanvas";

export default StickyNotesCanvas;
