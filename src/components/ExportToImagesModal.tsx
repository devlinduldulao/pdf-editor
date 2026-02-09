import React, { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ImageIcon,
  Download,
  X,
  FileImage,
  Loader2,
  Check,
  Settings,
} from "lucide-react";

interface ExportToImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDocument: any; // PDF.js document
  totalPages: number;
  onExport: (
    pages: number[],
    format: "png" | "jpeg",
    quality: number,
    scale: number
  ) => Promise<void>;
}

const ExportToImagesModal: React.FC<ExportToImagesModalProps> = memo(
  ({ isOpen, onClose, pdfDocument: _pdfDocument, totalPages, onExport }) => {
    const [format, setFormat] = useState<"png" | "jpeg">("png");
    const [quality, setQuality] = useState(92);
    const [scale, setScale] = useState(2);
    const [exportMode, setExportMode] = useState<"all" | "current" | "range">(
      "all"
    );
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(totalPages);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const handleExport = useCallback(async () => {
      let pagesToExport: number[] = [];

      switch (exportMode) {
        case "all":
          pagesToExport = Array.from({ length: totalPages }, (_, i) => i + 1);
          break;
        case "current":
          pagesToExport = [1]; // Will be replaced with currentPage in the component
          break;
        case "range":
          pagesToExport = Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
          );
          break;
      }

      setIsExporting(true);
      setExportProgress(0);

      try {
        await onExport(pagesToExport, format, quality / 100, scale);
        setExportProgress(100);
        setTimeout(() => {
          onClose();
          setIsExporting(false);
          setExportProgress(0);
        }, 500);
      } catch (error) {
        console.error("Export failed:", error);
        setIsExporting(false);
        alert("Failed to export images. Please try again.");
      }
    }, [exportMode, totalPages, startPage, endPage, format, quality, scale, onExport, onClose]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isExporting) onClose();
        }}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Export to Images</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              disabled={isExporting}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Page Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pages to Export</label>
              <div className="flex gap-2">
                <Button
                  variant={exportMode === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportMode("all")}
                  className="flex-1"
                >
                  All Pages
                </Button>
                <Button
                  variant={exportMode === "current" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportMode("current")}
                  className="flex-1"
                >
                  Current
                </Button>
                <Button
                  variant={exportMode === "range" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportMode("range")}
                  className="flex-1"
                >
                  Range
                </Button>
              </div>

              {exportMode === "range" && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={startPage}
                    onChange={(e) =>
                      setStartPage(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="h-8"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={endPage}
                    onChange={(e) =>
                      setEndPage(
                        Math.min(totalPages, parseInt(e.target.value) || totalPages)
                      )
                    }
                    className="h-8"
                  />
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <div className="flex gap-2">
                <Button
                  variant={format === "png" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat("png")}
                  className="flex-1"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  PNG
                </Button>
                <Button
                  variant={format === "jpeg" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat("jpeg")}
                  className="flex-1"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  JPEG
                </Button>
              </div>
            </div>

            {/* Quality (JPEG only) */}
            {format === "jpeg" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quality</label>
                  <span className="text-sm text-muted-foreground">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Scale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Resolution Scale</label>
                <span className="text-sm text-muted-foreground">{scale}x</span>
              </div>
              <div className="flex gap-2">
                {[1, 1.5, 2, 3].map((s) => (
                  <Button
                    key={s}
                    variant={scale === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setScale(s)}
                    className="flex-1"
                  >
                    {s}x
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Higher scale = larger, higher quality images
              </p>
            </div>

            {/* Preview info */}
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Export Summary:</span>
              </div>
              <ul className="mt-2 text-sm space-y-1">
                <li>
                  • {exportMode === "all" ? totalPages : exportMode === "current" ? 1 : endPage - startPage + 1} page(s)
                </li>
                <li>• Format: {format.toUpperCase()}</li>
                <li>• Resolution: {scale}x scale</li>
              </ul>
            </div>

            {/* Progress */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Exporting...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : exportProgress === 100 ? (
                <>
                  <Check className="w-4 h-4" />
                  Done!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ExportToImagesModal.displayName = "ExportToImagesModal";

export default ExportToImagesModal;
