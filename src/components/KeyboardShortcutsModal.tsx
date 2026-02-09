import React, { memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["Ctrl", "Z"], description: "Undo last action" },
      { keys: ["Ctrl", "Y"], description: "Redo last action" },
      { keys: ["Ctrl", "Shift", "Z"], description: "Redo (alternative)" },
      { keys: ["Ctrl", "S"], description: "Save document" },
      { keys: ["Ctrl", "P"], description: "Print document" },
      { keys: ["Esc"], description: "Cancel current action / Deselect" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["←"], description: "Previous page" },
      { keys: ["→"], description: "Next page" },
      { keys: ["Home"], description: "Go to first page" },
      { keys: ["End"], description: "Go to last page" },
      { keys: ["Ctrl", "G"], description: "Go to page..." },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { keys: ["Ctrl", "+"], description: "Zoom in" },
      { keys: ["Ctrl", "-"], description: "Zoom out" },
      { keys: ["Ctrl", "0"], description: "Reset zoom to 100%" },
      { keys: ["Ctrl", "F"], description: "Open search" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { keys: ["T"], description: "Add text annotation" },
      { keys: ["D"], description: "Toggle drawing mode" },
      { keys: ["R"], description: "Toggle redaction mode" },
      { keys: ["Delete"], description: "Delete selected annotation" },
    ],
  },
];

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = memo(
  ({ isOpen, onClose }) => {
    // Handle escape key to close
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };
      
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Keyboard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                <p className="text-sm text-muted-foreground">
                  Quick reference for all available shortcuts
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              <kbd className="px-2 py-1 text-xs font-medium bg-muted border border-border rounded shadow-sm">
                                {key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-muted-foreground text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">?</kbd> anytime to show this help
            </p>
          </div>
        </div>
      </div>
    );
  }
);

KeyboardShortcutsModal.displayName = "KeyboardShortcutsModal";

export default KeyboardShortcutsModal;
