import React, { useState, useCallback, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets, X, Check, Image as ImageIcon, Type } from "lucide-react";

/**
 * WatermarkModal Component
 *
 * This component provides watermark functionality for PDFs:
 * - Add text watermark to all pages
 * - Add image watermark (logo, stamp, etc.)
 * - Configurable opacity (10% - 100%)
 * - Configurable position (9 positions: top/center/bottom x left/center/right)
 * - Configurable rotation (-180° to 180°)
 *
 * How watermarks work:
 * 1. User selects text or image watermark type
 * 2. Configures text/image, opacity, position, and rotation
 * 3. Preview shows how it will appear
 * 4. On apply, watermark is added to all pages of the PDF
 *
 * Watermarks are commonly used for:
 * - Branding (company logo)
 * - Security (CONFIDENTIAL stamp)
 * - Draft indication (DRAFT watermark)
 * - Copyright protection
 *
 * @example
 * <WatermarkModal
 *   isOpen={isWatermarkModalOpen}
 *   onClose={() => setIsWatermarkModalOpen(false)}
 *   onApply={handleApplyWatermark}
 * />
 */

export interface WatermarkConfig {
  type: "text" | "image";
  text: string;
  imageData: string | null;
  fontSize: number;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  color: string;
}

export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: WatermarkConfig) => void;
}

const POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "top-left", label: "↖ Top Left" },
  { value: "top-center", label: "↑ Top Center" },
  { value: "top-right", label: "↗ Top Right" },
  { value: "center-left", label: "← Center Left" },
  { value: "center", label: "⊕ Center" },
  { value: "center-right", label: "→ Center Right" },
  { value: "bottom-left", label: "↙ Bottom Left" },
  { value: "bottom-center", label: "↓ Bottom Center" },
  { value: "bottom-right", label: "↘ Bottom Right" },
];

const WATERMARK_COLORS = [
  { name: "Gray", value: "#9CA3AF" },
  { name: "Red", value: "#DC2626" },
  { name: "Blue", value: "#2563EB" },
  { name: "Green", value: "#16A34A" },
  { name: "Black", value: "#000000" },
];

const DEFAULT_CONFIG: WatermarkConfig = {
  type: "text",
  text: "CONFIDENTIAL",
  imageData: null,
  fontSize: 48,
  opacity: 30,
  rotation: -45,
  position: "center",
  color: "#9CA3AF",
};

const WatermarkModal: React.FC<WatermarkModalProps> = memo(({
  isOpen,
  onClose,
  onApply,
}) => {
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_CONFIG);
  const imageInputRef = useRef<HTMLInputElement>(null);

  /**
   * Updates a single field in the watermark config.
   */
  const updateConfig = useCallback(<K extends keyof WatermarkConfig>(
    key: K,
    value: WatermarkConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Handles image upload for image watermark.
   */
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateConfig("imageData", event.target?.result as string);
      updateConfig("type", "image");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [updateConfig]);

  /**
   * Applies the watermark configuration.
   */
  const handleApply = useCallback(() => {
    // Validate
    if (config.type === "text" && !config.text.trim()) {
      alert("Please enter watermark text");
      return;
    }
    if (config.type === "image" && !config.imageData) {
      alert("Please select an image");
      return;
    }

    onApply(config);
    onClose();
  }, [config, onApply, onClose]);

  /**
   * Resets config to defaults.
   */
  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Add Watermark</h2>
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
        <div className="p-4 space-y-4">
          {/* Type Tabs */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                config.type === "text"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => updateConfig("type", "text")}
            >
              <Type className="w-4 h-4" />
              Text
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                config.type === "image"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => updateConfig("type", "image")}
            >
              <ImageIcon className="w-4 h-4" />
              Image
            </button>
          </div>

          {/* Type-specific inputs */}
          {config.type === "text" ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="watermark-text">Watermark Text</Label>
                <Input
                  id="watermark-text"
                  value={config.text}
                  onChange={(e) => updateConfig("text", e.target.value)}
                  placeholder="Enter watermark text..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Font Size: {config.fontSize}px</Label>
                <input
                  type="range"
                  min="12"
                  max="120"
                  value={config.fontSize}
                  onChange={(e) => updateConfig("fontSize", Number(e.target.value))}
                  className="w-full h-2 mt-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-1">
                  {WATERMARK_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                        config.color === color.value
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => updateConfig("color", color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />

              {config.imageData ? (
                <div className="relative border border-border rounded-lg p-4 bg-muted/50">
                  <img
                    src={config.imageData}
                    alt="Watermark preview"
                    className="max-h-24 mx-auto object-contain"
                    style={{ opacity: config.opacity / 100 }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    className="mt-2 w-full"
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full h-24 flex flex-col gap-2"
                >
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <span>Click to upload image</span>
                </Button>
              )}
            </div>
          )}

          {/* Common options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Opacity: {config.opacity}%</Label>
              <input
                type="range"
                min="10"
                max="100"
                value={config.opacity}
                onChange={(e) => updateConfig("opacity", Number(e.target.value))}
                className="w-full h-2 mt-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div>
              <Label>Rotation: {config.rotation}°</Label>
              <input
                type="range"
                min="-180"
                max="180"
                value={config.rotation}
                onChange={(e) => updateConfig("rotation", Number(e.target.value))}
                className="w-full h-2 mt-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <Label>Position</Label>
            <div className="grid grid-cols-3 gap-1 mt-1 border border-border rounded-lg p-1 bg-muted/50">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => updateConfig("position", pos.value)}
                  className={`px-2 py-1.5 text-xs rounded transition-colors ${
                    config.position === pos.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border border-border rounded-lg p-4 bg-white relative h-32 overflow-hidden">
            <div className="absolute inset-0 flex" style={getPreviewStyle(config.position)}>
              <div
                style={{
                  transform: `rotate(${config.rotation}deg)`,
                  opacity: config.opacity / 100,
                  color: config.color,
                  fontSize: `${config.fontSize / 4}px`,
                  fontWeight: "bold",
                }}
              >
                {config.type === "text" ? (
                  config.text || "Preview"
                ) : config.imageData ? (
                  <img
                    src={config.imageData}
                    alt="Preview"
                    className="max-h-12 object-contain"
                  />
                ) : (
                  "No image"
                )}
              </div>
            </div>
            <span className="absolute bottom-1 right-2 text-xs text-muted-foreground">
              Preview
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between px-4 py-3 border-t border-border bg-muted/30">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply} className="gap-2">
              <Check className="w-4 h-4" />
              Apply to All Pages
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

WatermarkModal.displayName = "WatermarkModal";

/**
 * Gets CSS styles for positioning the watermark preview.
 */
function getPreviewStyle(position: WatermarkPosition): React.CSSProperties {
  const styles: React.CSSProperties = {
    justifyContent: "center",
    alignItems: "center",
  };

  if (position.includes("left")) styles.justifyContent = "flex-start";
  if (position.includes("right")) styles.justifyContent = "flex-end";
  if (position.includes("top")) styles.alignItems = "flex-start";
  if (position.includes("bottom")) styles.alignItems = "flex-end";

  return styles;
}

export default WatermarkModal;
