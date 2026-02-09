import React, { useEffect, useState, useCallback, memo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { pdfEditorService } from "@/services/pdfEditor";
import {
  RotateCw,
  Trash2,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Download,
} from "lucide-react";

interface PageThumbnailsProps {
  file: File | null;
  currentPage: number;
  onPageSelect: (page: number) => void;
  onPagesChanged: () => void;
}

interface ThumbnailData {
  pageNumber: number;
  dataUrl: string;
}

const PageThumbnails: React.FC<PageThumbnailsProps> = memo(({
  file,
  currentPage,
  onPageSelect,
  onPagesChanged,
}) => {
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [showPageActions, setShowPageActions] = useState<number | null>(null);

  // Generate thumbnails for all pages
  const generateThumbnails = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const servicePassword = pdfEditorService.getPassword();
      
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: servicePassword,
      });

      const pdf = await loadingTask.promise;
      setNumPages(pdf.numPages);

      const newThumbnails: ThumbnailData[] = [];
      const thumbnailScale = 0.3;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: thumbnailScale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        newThumbnails.push({
          pageNumber: pageNum,
          dataUrl: canvas.toDataURL(),
        });
      }

      setThumbnails(newThumbnails);
    } catch (error) {
      console.error("Error generating thumbnails:", error);
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  useEffect(() => {
    generateThumbnails();
  }, [generateThumbnails]);

  const handleRotatePage = useCallback(async (pageIndex: number) => {
    try {
      await pdfEditorService.rotatePage(pageIndex, 90);
      onPagesChanged();
      // Regenerate thumbnails after rotation
      setTimeout(generateThumbnails, 100);
    } catch (error) {
      console.error("Error rotating page:", error);
      alert("Failed to rotate page");
    }
  }, [onPagesChanged, generateThumbnails]);

  const handleDeletePage = useCallback(async (pageIndex: number) => {
    if (numPages <= 1) {
      alert("Cannot delete the last page");
      return;
    }

    if (!confirm(`Delete page ${pageIndex + 1}?`)) return;

    try {
      await pdfEditorService.deletePage(pageIndex);
      onPagesChanged();
      // Regenerate thumbnails after deletion
      setTimeout(generateThumbnails, 100);
    } catch (error) {
      console.error("Error deleting page:", error);
      alert("Failed to delete page");
    }
  }, [numPages, onPagesChanged, generateThumbnails]);

  const handleInsertBlankPage = useCallback(async (afterPageIndex: number) => {
    try {
      await pdfEditorService.insertBlankPage(afterPageIndex);
      onPagesChanged();
      // Regenerate thumbnails after insertion
      setTimeout(generateThumbnails, 100);
    } catch (error) {
      console.error("Error inserting page:", error);
      alert("Failed to insert blank page");
    }
  }, [onPagesChanged, generateThumbnails]);

  const handleExtractPage = useCallback(async (pageIndex: number) => {
    try {
      const pdfBytes = await pdfEditorService.extractPages([pageIndex]);
      const safeBytes = new Uint8Array(pdfBytes);
      const blob = new Blob([safeBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `page-${pageIndex + 1}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error extracting page:", error);
      alert("Failed to extract page");
    }
  }, []);

  if (!file) return null;

  if (isCollapsed) {
    return (
      <div className="w-10 bg-card border-r border-border flex flex-col items-center py-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="h-8 w-8"
          title="Show page thumbnails"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
        <div className="mt-4 text-xs text-muted-foreground font-medium writing-mode-vertical">
          {numPages} pages
        </div>
      </div>
    );
  }

  return (
    <div className="w-48 bg-card border-r border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">Pages</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-6 w-6"
          title="Hide thumbnails"
        >
          <PanelLeftClose className="w-3 h-3" />
        </Button>
      </div>

      {/* Thumbnails List */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-xs text-muted-foreground">Loading...</div>
          </div>
        ) : (
          thumbnails.map((thumb, index) => (
            <div
              key={thumb.pageNumber}
              className="relative group"
              onMouseEnter={() => setShowPageActions(index)}
              onMouseLeave={() => setShowPageActions(null)}
            >
              {/* Thumbnail */}
              <button
                onClick={() => onPageSelect(thumb.pageNumber)}
                className={`w-full rounded-lg overflow-hidden border-2 transition-all ${
                  currentPage === thumb.pageNumber
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <img
                  src={thumb.dataUrl}
                  alt={`Page ${thumb.pageNumber}`}
                  className="w-full h-auto"
                />
              </button>

              {/* Page number */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-background/90 text-xs font-medium px-2 py-0.5 rounded-full text-muted-foreground">
                {thumb.pageNumber}
              </div>

              {/* Action buttons (shown on hover) */}
              {showPageActions === index && (
                <div className="absolute top-1 right-1 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRotatePage(index);
                    }}
                    className="h-6 w-6 bg-background/90 hover:bg-background shadow-sm"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExtractPage(index);
                    }}
                    className="h-6 w-6 bg-background/90 hover:bg-background shadow-sm"
                    title="Extract page"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  {numPages > 1 && (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(index);
                      }}
                      className="h-6 w-6 bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-sm"
                      title="Delete page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}

              {/* Insert page button between pages */}
              {showPageActions === index && (
                <button
                  onClick={() => handleInsertBlankPage(index)}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg hover:bg-primary/90 transition-colors z-10"
                  title="Insert blank page after"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer with page info */}
      <div className="p-2 border-t border-border text-center">
        <span className="text-xs text-muted-foreground">
          {currentPage} / {numPages}
        </span>
      </div>
    </div>
  );
});

PageThumbnails.displayName = "PageThumbnails";

export default PageThumbnails;
