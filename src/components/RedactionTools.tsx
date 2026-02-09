import React, { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { EyeOff, Trash2 } from "lucide-react";

/**
 * RedactionTools Component
 *
 * This component provides redaction functionality for PDFs:
 * - Black out sensitive content by drawing rectangles
 * - Preview redactions before applying (semi-transparent)
 * - Permanent redaction on save (filled black rectangles in PDF)
 *
 * How redaction works:
 * 1. User activates redaction mode
 * 2. User draws rectangles over sensitive content
 * 3. Rectangles are shown in semi-transparent red (preview mode)
 * 4. When applying changes, rectangles become solid black in the PDF
 * 5. The redacted content is permanently removed from the PDF
 *
 * Important: Redaction is permanent and cannot be undone after saving.
 * The original content beneath the redaction box is destroyed.
 *
 * @example
 * <RedactionTools
 *   isActive={isRedactionMode}
 *   onToggle={() => setIsRedactionMode(prev => !prev)}
 *   redactions={redactions}
 *   onAddRedaction={handleAddRedaction}
 *   onRemoveRedaction={handleRemoveRedaction}
 *   onClearRedactions={handleClearRedactions}
 * />
 */

export interface Redaction {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RedactionToolbarProps {
  isActive: boolean;
  onToggle: () => void;
  redactionCount: number;
  onClearAll: () => void;
}

/**
 * RedactionToolbar - The toolbar button and controls for redaction mode.
 */
export const RedactionToolbar: React.FC<RedactionToolbarProps> = memo(({
  isActive,
  onToggle,
  redactionCount,
  onClearAll,
}) => {
  if (!isActive) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-8 px-2 md:px-3 gap-2 border-0 bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
        title="Redaction Tool - Black out sensitive content"
      >
        <EyeOff className="w-4 h-4" />
        <span className="text-xs hidden md:inline">Redact</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-destructive/10 p-1 rounded-lg border border-destructive/20">
      <div className="flex items-center gap-1 px-2">
        <EyeOff className="w-4 h-4 text-destructive" />
        <span className="text-xs font-medium text-destructive">Redaction Mode</span>
      </div>

      {redactionCount > 0 && (
        <>
          <div className="w-px h-4 bg-destructive/20" />
          <span className="text-xs text-destructive/70 px-1">
            {redactionCount} area{redactionCount > 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearAll}
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            title="Clear all redactions"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </>
      )}

      <div className="w-px h-4 bg-destructive/20" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-7 px-2 text-destructive hover:bg-destructive/10"
      >
        Done
      </Button>
    </div>
  );
});

RedactionToolbar.displayName = "RedactionToolbar";

interface RedactionCanvasProps {
  width: number;
  height: number;
  redactions: Redaction[];
  onAddRedaction: (redaction: Redaction) => void;
  onRemoveRedaction: (id: string) => void;
  pageNumber: number;
  scale: number;
  isActive: boolean;
}

/**
 * RedactionCanvas - The overlay canvas for drawing and displaying redaction boxes.
 *
 * When in redaction mode:
 * - User can click and drag to draw a redaction rectangle
 * - Existing redactions are shown as semi-transparent red boxes
 * - Clicking on a redaction allows deleting it
 * - On save, these become solid black boxes in the PDF
 */
export const RedactionCanvas: React.FC<RedactionCanvasProps> = memo(({
  width,
  height,
  redactions,
  onAddRedaction,
  onRemoveRedaction,
  pageNumber,
  scale,
  isActive,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);

  /**
   * Gets the pointer position relative to the canvas element.
   */
  const getPointerPosition = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  /**
   * Starts drawing a new redaction rectangle.
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive) return;

    const pos = getPointerPosition(e);
    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentPoint(pos);
  }, [isActive, getPointerPosition]);

  /**
   * Updates the redaction rectangle as the user drags.
   */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !isActive) return;

    const pos = getPointerPosition(e);
    setCurrentPoint(pos);
  }, [isDrawing, isActive, getPointerPosition]);

  /**
   * Finishes drawing the redaction rectangle.
   * Creates a new redaction if the rectangle is large enough.
   */
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !startPoint || !currentPoint || !isActive) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
      return;
    }

    // Calculate the rectangle dimensions
    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const rectWidth = Math.abs(currentPoint.x - startPoint.x);
    const rectHeight = Math.abs(currentPoint.y - startPoint.y);

    // Only create redaction if rectangle is at least 10x10 pixels
    if (rectWidth >= 10 && rectHeight >= 10) {
      const newRedaction: Redaction = {
        id: `redact_${Date.now()}`,
        pageNumber,
        // Store coordinates in PDF space (unscaled)
        x: x / scale,
        y: y / scale,
        width: rectWidth / scale,
        height: rectHeight / scale,
      };
      onAddRedaction(newRedaction);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, [isDrawing, startPoint, currentPoint, isActive, pageNumber, scale, onAddRedaction]);

  // Filter redactions for current page
  const pageRedactions = redactions.filter((r) => r.pageNumber === pageNumber);

  if (!isActive && pageRedactions.length === 0) return null;

  return (
    <div
      className={`absolute top-0 left-0 ${isActive ? "z-30 cursor-crosshair" : "z-15 pointer-events-none"}`}
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Existing redaction boxes */}
      {pageRedactions.map((redaction) => (
        <div
          key={redaction.id}
          className={`absolute group ${isActive ? "cursor-pointer" : "pointer-events-none"}`}
          style={{
            left: redaction.x * scale,
            top: redaction.y * scale,
            width: redaction.width * scale,
            height: redaction.height * scale,
            backgroundColor: "rgba(220, 38, 38, 0.5)",
            border: "2px solid rgba(220, 38, 38, 0.8)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isActive) {
              onRemoveRedaction(redaction.id);
            }
          }}
          title={isActive ? "Click to remove" : "Redacted area"}
        >
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-5 h-5 text-white drop-shadow-lg" />
            </div>
          )}
        </div>
      ))}

      {/* Current drawing preview */}
      {isDrawing && startPoint && currentPoint && (
        <div
          className="absolute border-2 border-dashed border-destructive bg-destructive/20 pointer-events-none"
          style={{
            left: Math.min(startPoint.x, currentPoint.x),
            top: Math.min(startPoint.y, currentPoint.y),
            width: Math.abs(currentPoint.x - startPoint.x),
            height: Math.abs(currentPoint.y - startPoint.y),
          }}
        />
      )}

      {/* Instructions overlay when active */}
      {isActive && pageRedactions.length === 0 && !isDrawing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-destructive/90 text-white px-4 py-2 rounded-lg text-sm animate-pulse">
            Click and drag to redact content
          </div>
        </div>
      )}
    </div>
  );
});

RedactionCanvas.displayName = "RedactionCanvas";

export default RedactionToolbar;
