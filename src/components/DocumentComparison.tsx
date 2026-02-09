import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";
import {
  GitCompare,
  X,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  FileText,
} from "lucide-react";

interface DocumentComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  originalFile: File | null;
  originalDocument: any; // PDF.js document
}

const DocumentComparison: React.FC<DocumentComparisonProps> = memo(
  ({ isOpen, onClose, originalFile, originalDocument }) => {
    const [compareFile, setCompareFile] = useState<File | null>(null);
    const [compareDocument, setCompareDocument] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1);
    const [highlightDifferences, setHighlightDifferences] = useState(true);

    const originalCanvasRef = useRef<HTMLCanvasElement>(null);
    const compareCanvasRef = useRef<HTMLCanvasElement>(null);
    const diffCanvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxPages = Math.max(
      originalDocument?.numPages || 0,
      compareDocument?.numPages || 0
    );

    // Load comparison PDF
    const handleFileSelect = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
          }).promise;

          setCompareFile(file);
          setCompareDocument(pdf);
          setCurrentPage(1);
        } catch (err: any) {
          console.error("Error loading comparison PDF:", err);
          setError("Failed to load PDF. Make sure it's a valid PDF file.");
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    // Render pages
    useEffect(() => {
      if (!isOpen) return;

      const renderPages = async () => {
        // Render original document
        if (originalDocument && originalCanvasRef.current) {
          try {
            const page = await originalDocument.getPage(
              Math.min(currentPage, originalDocument.numPages)
            );
            const viewport = page.getViewport({ scale });
            const canvas = originalCanvasRef.current;
            const context = canvas.getContext("2d");

            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              await page.render({
                canvasContext: context,
                viewport,
              }).promise;
            }
          } catch (err) {
            console.error("Error rendering original page:", err);
          }
        }

        // Render comparison document
        if (compareDocument && compareCanvasRef.current) {
          try {
            if (currentPage <= compareDocument.numPages) {
              const page = await compareDocument.getPage(currentPage);
              const viewport = page.getViewport({ scale });
              const canvas = compareCanvasRef.current;
              const context = canvas.getContext("2d");

              if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                  canvasContext: context,
                  viewport,
                }).promise;
              }
            } else {
              // Page doesn't exist in comparison document
              const canvas = compareCanvasRef.current;
              const context = canvas.getContext("2d");
              if (context) {
                canvas.height = 600;
                canvas.width = 400;
                context.fillStyle = "#f3f4f6";
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.fillStyle = "#9ca3af";
                context.font = "14px sans-serif";
                context.textAlign = "center";
                context.fillText(
                  "Page does not exist in this document",
                  canvas.width / 2,
                  canvas.height / 2
                );
              }
            }
          } catch (err) {
            console.error("Error rendering comparison page:", err);
          }
        }

        // Generate difference overlay
        if (
          highlightDifferences &&
          originalCanvasRef.current &&
          compareCanvasRef.current &&
          diffCanvasRef.current &&
          compareDocument
        ) {
          try {
            const original = originalCanvasRef.current;
            const compare = compareCanvasRef.current;
            const diff = diffCanvasRef.current;

            const width = Math.max(original.width, compare.width);
            const height = Math.max(original.height, compare.height);

            diff.width = width;
            diff.height = height;

            const diffContext = diff.getContext("2d");
            const originalContext = original.getContext("2d");
            const compareContext = compare.getContext("2d");

            if (diffContext && originalContext && compareContext) {
              const originalData = originalContext.getImageData(
                0,
                0,
                original.width,
                original.height
              );
              const compareData = compareContext.getImageData(
                0,
                0,
                compare.width,
                compare.height
              );
              const diffImageData = diffContext.createImageData(width, height);

              // Compare pixels and highlight differences
              for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                  const idx = (y * width + x) * 4;
                  
                  // Get original pixel
                  let origR = 255, origG = 255, origB = 255;
                  if (x < original.width && y < original.height) {
                    const origIdx = (y * original.width + x) * 4;
                    origR = originalData.data[origIdx];
                    origG = originalData.data[origIdx + 1];
                    origB = originalData.data[origIdx + 2];
                  }

                  // Get comparison pixel
                  let compR = 255, compG = 255, compB = 255;
                  if (x < compare.width && y < compare.height) {
                    const compIdx = (y * compare.width + x) * 4;
                    compR = compareData.data[compIdx];
                    compG = compareData.data[compIdx + 1];
                    compB = compareData.data[compIdx + 2];
                  }

                  // Calculate difference
                  const diffR = Math.abs(origR - compR);
                  const diffG = Math.abs(origG - compG);
                  const diffB = Math.abs(origB - compB);
                  const totalDiff = diffR + diffG + diffB;

                  // Threshold for considering a pixel different
                  if (totalDiff > 30) {
                    // Highlight difference in red
                    diffImageData.data[idx] = 255;
                    diffImageData.data[idx + 1] = 0;
                    diffImageData.data[idx + 2] = 0;
                    diffImageData.data[idx + 3] = 100;
                  } else {
                    // Transparent for same pixels
                    diffImageData.data[idx + 3] = 0;
                  }
                }
              }

              diffContext.putImageData(diffImageData, 0, 0);
            }
          } catch (err) {
            console.error("Error generating diff:", err);
          }
        }
      };

      renderPages();
    }, [isOpen, originalDocument, compareDocument, currentPage, scale, highlightDifferences]);

    const handlePrevPage = useCallback(() => {
      setCurrentPage((p) => Math.max(1, p - 1));
    }, []);

    const handleNextPage = useCallback(() => {
      setCurrentPage((p) => Math.min(maxPages, p + 1));
    }, [maxPages]);

    const handleZoomIn = useCallback(() => {
      setScale((s) => Math.min(2, s + 0.25));
    }, []);

    const handleZoomOut = useCallback(() => {
      setScale((s) => Math.max(0.5, s - 0.25));
    }, []);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Document Comparison</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Page navigation */}
            {compareDocument && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm min-w-[80px] text-center">
                  Page {currentPage} / {maxPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={currentPage >= maxPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Zoom */}
            {compareDocument && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  className="h-8 w-8"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm min-w-[50px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  className="h-8 w-8"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Highlight toggle */}
            {compareDocument && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={highlightDifferences}
                  onChange={(e) => setHighlightDifferences(e.target.checked)}
                  className="rounded"
                />
                Highlight Differences
              </label>
            )}

            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!compareDocument ? (
            /* Upload comparison document */
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-md w-full space-y-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <GitCompare className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Compare Documents</h3>
                  <p className="text-muted-foreground mt-1">
                    Select a PDF to compare with "{originalFile?.name || "current document"}"
                  </p>
                </div>

                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading PDF...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to select a PDF for comparison
                      </p>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileSelect}
                />

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Side-by-side comparison */
            <div className="h-full flex">
              {/* Original document */}
              <div className="flex-1 border-r border-border overflow-auto p-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Original</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {originalFile?.name}
                    </span>
                  </div>
                </div>
                <div className="relative flex justify-center">
                  <canvas
                    ref={originalCanvasRef}
                    className="shadow-lg border border-border"
                  />
                </div>
              </div>

              {/* Comparison document */}
              <div className="flex-1 overflow-auto p-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Compare</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {compareFile?.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1"
                      onClick={() => {
                        setCompareFile(null);
                        setCompareDocument(null);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="relative flex justify-center">
                  <canvas
                    ref={compareCanvasRef}
                    className="shadow-lg border border-border"
                  />
                  {/* Difference overlay */}
                  {highlightDifferences && (
                    <canvas
                      ref={diffCanvasRef}
                      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        {compareDocument && highlightDifferences && (
          <div className="px-4 py-2 border-t border-border bg-muted/30 text-center">
            <span className="text-xs text-muted-foreground">
              <span className="inline-block w-3 h-3 bg-red-500/40 rounded mr-1" />
              Red highlights indicate differences between documents
            </span>
          </div>
        )}
      </div>
    );
  }
);

DocumentComparison.displayName = "DocumentComparison";

export default DocumentComparison;
