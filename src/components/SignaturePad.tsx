import React, { useRef, useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pen,
  Type,
  X,
  Save,
  Trash2,
  Check,
  Download,
} from "lucide-react";

/**
 * SignaturePad Component
 *
 * This component provides signature creation and management functionality:
 * - Draw signature with mouse/touch
 * - Type-to-sign (generates signature from typed text using a signature font)
 * - Save signatures for reuse (stored in localStorage)
 * - Apply saved signatures to PDF
 *
 * How signatures work:
 * 1. User draws or types their signature
 * 2. Signature is converted to PNG base64 data
 * 3. Can be saved to localStorage for future use
 * 4. Applied to PDF as an image annotation
 *
 * @example
 * <SignaturePad
 *   isOpen={isSignatureModalOpen}
 *   onClose={() => setIsSignatureModalOpen(false)}
 *   onApply={handleApplySignature}
 * />
 */

export interface SavedSignature {
  id: string;
  name: string;
  imageData: string; // Base64 PNG data
  createdAt: number;
}

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (signatureData: string) => void;
}

type SignatureMode = "draw" | "type";

// Signature font styles for type-to-sign
const SIGNATURE_FONTS = [
  { name: "Cursive", fontFamily: "'Brush Script MT', cursive" },
  { name: "Script", fontFamily: "'Lucida Handwriting', cursive" },
  { name: "Elegant", fontFamily: "'Segoe Script', cursive" },
  { name: "Classic", fontFamily: "'Monotype Corsiva', cursive" },
];

const STORAGE_KEY = "pdf-editor-saved-signatures";

/**
 * Loads saved signatures from localStorage.
 * Returns an empty array if no signatures are saved.
 */
function loadSavedSignatures(): SavedSignature[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading saved signatures:", error);
    return [];
  }
}

/**
 * Saves signatures to localStorage.
 */
function saveSignatures(signatures: SavedSignature[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signatures));
  } catch (error) {
    console.error("Error saving signatures:", error);
  }
}

const SignaturePad: React.FC<SignaturePadProps> = memo(({
  isOpen,
  onClose,
  onApply,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SignatureMode>("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
  // Lazy initialization to avoid setState in effect
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>(() => loadSavedSignatures());
  const [hasDrawing, setHasDrawing] = useState(false);
  // Track previous isOpen/mode to detect changes
  const prevIsOpenRef = useRef(isOpen);
  const prevModeRef = useRef(mode);

  /**
   * Clears the drawing canvas.
   */
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  }, []);

  // Clear canvas when mode changes to draw or modal opens
  // Using refs to detect changes and clear on interaction
  const shouldClearCanvas = useCallback(() => {
    const wasOpen = prevIsOpenRef.current;
    const wasMode = prevModeRef.current;
    prevIsOpenRef.current = isOpen;
    prevModeRef.current = mode;

    // Clear if modal just opened or mode changed to draw
    if (mode === "draw" && (isOpen && !wasOpen || mode !== wasMode)) {
      return true;
    }
    return false;
  }, [isOpen, mode]);

  // Effect to initialize canvas when it becomes visible
  useEffect(() => {
    if (isOpen && mode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx && shouldClearCanvas()) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isOpen, mode, shouldClearCanvas]);

  /**
   * Gets the pointer position relative to the canvas.
   * Handles both mouse and touch events.
   */
  const getPointerPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  /**
   * Starts drawing on the canvas.
   */
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== "draw") return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawing(true);

    const pos = getPointerPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [mode, getPointerPosition]);

  /**
   * Continues drawing on the canvas.
   */
  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== "draw") return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const pos = getPointerPosition(e);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [isDrawing, mode, getPointerPosition]);

  /**
   * Stops drawing on the canvas.
   */
  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  /**
   * Generates a signature image from typed text.
   * Creates a canvas, draws the text with the selected font,
   * and returns the base64 PNG data.
   */
  const generateTypedSignature = useCallback((): string | null => {
    if (!typedText.trim()) return null;

    // Create a temporary canvas for the typed signature
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 400;
    tempCanvas.height = 100;

    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return null;

    // White background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the text
    ctx.fillStyle = "#000000";
    ctx.font = `48px ${selectedFont.fontFamily}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(typedText, tempCanvas.width / 2, tempCanvas.height / 2);

    return tempCanvas.toDataURL("image/png");
  }, [typedText, selectedFont]);

  /**
   * Gets the current signature as base64 PNG data.
   * Returns drawn signature or typed signature based on mode.
   */
  const getCurrentSignature = useCallback((): string | null => {
    if (mode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawing) return null;
      return canvas.toDataURL("image/png");
    } else {
      return generateTypedSignature();
    }
  }, [mode, hasDrawing, generateTypedSignature]);

  /**
   * Applies the current signature to the PDF.
   */
  const handleApply = useCallback(() => {
    const signatureData = getCurrentSignature();
    if (signatureData) {
      onApply(signatureData);
      onClose();
    }
  }, [getCurrentSignature, onApply, onClose]);

  /**
   * Saves the current signature to localStorage for future use.
   */
  const handleSaveSignature = useCallback(() => {
    const signatureData = getCurrentSignature();
    if (!signatureData) return;

    const name = prompt("Enter a name for this signature:", `Signature ${savedSignatures.length + 1}`);
    if (!name) return;

    const newSignature: SavedSignature = {
      id: `sig_${Date.now()}`,
      name,
      imageData: signatureData,
      createdAt: Date.now(),
    };

    const updated = [...savedSignatures, newSignature];
    setSavedSignatures(updated);
    saveSignatures(updated);
  }, [getCurrentSignature, savedSignatures]);

  /**
   * Deletes a saved signature from localStorage.
   */
  const handleDeleteSignature = useCallback((id: string) => {
    const updated = savedSignatures.filter((s) => s.id !== id);
    setSavedSignatures(updated);
    saveSignatures(updated);
  }, [savedSignatures]);

  /**
   * Applies a saved signature to the PDF.
   */
  const handleApplySaved = useCallback((signature: SavedSignature) => {
    onApply(signature.imageData);
    onClose();
  }, [onApply, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <h2 className="text-lg font-semibold">Signature</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-border">
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === "draw"
                ? "bg-background text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            onClick={() => setMode("draw")}
          >
            <Pen className="w-4 h-4" />
            Draw
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === "type"
                ? "bg-background text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            onClick={() => setMode("type")}
          >
            <Type className="w-4 h-4" />
            Type
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {mode === "draw" ? (
            <>
              {/* Drawing Canvas */}
              <div className="border border-border rounded-lg bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full h-36 cursor-crosshair touch-none"
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
                <p className="text-xs text-muted-foreground self-center">
                  Draw your signature above
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Type Input */}
              <Input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type your name..."
                className="text-lg"
                autoFocus
              />

              {/* Font Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Select Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SIGNATURE_FONTS.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => setSelectedFont(font)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        selectedFont.name === font.name
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span
                        className="text-2xl block truncate"
                        style={{ fontFamily: font.fontFamily }}
                      >
                        {typedText || "Your Name"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {font.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Saved Signatures */}
          {savedSignatures.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Download className="w-4 h-4" />
                Saved Signatures
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {savedSignatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="group relative border border-border rounded-lg p-2 bg-white hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => handleApplySaved(sig)}
                  >
                    <img
                      src={sig.imageData}
                      alt={sig.name}
                      className="w-full h-12 object-contain"
                    />
                    <span className="text-xs text-muted-foreground truncate block mt-1">
                      {sig.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSignature(sig.id);
                      }}
                      className="absolute top-1 right-1 p-1 bg-destructive/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveSignature}
            disabled={mode === "draw" ? !hasDrawing : !typedText.trim()}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save for later
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={mode === "draw" ? !hasDrawing : !typedText.trim()}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
