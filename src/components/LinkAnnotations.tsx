import React, { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, ExternalLink, FileText, X, Plus, Trash2 } from "lucide-react";

export interface LinkAnnotation {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "url" | "page";
  url?: string;
  targetPage?: number;
  label?: string;
}

interface LinkAnnotationsCanvasProps {
  links: LinkAnnotation[];
  currentPage: number;
  totalPages: number;
  scale: number;
  canvasHeight?: number;
  isActive: boolean;
  onAddLink: (link: LinkAnnotation) => void;
  onUpdateLink?: (id: string, updates: Partial<LinkAnnotation>) => void;
  onDeleteLink: (id: string) => void;
  onNavigateToPage: (page: number) => void;
}

const LinkAnnotationsCanvas: React.FC<LinkAnnotationsCanvasProps> = memo(
  ({
    links,
    currentPage,
    totalPages,
    scale,
    canvasHeight: _canvasHeight,
    isActive,
    onAddLink,
    onUpdateLink: _onUpdateLink,
    onDeleteLink,
    onNavigateToPage,
  }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [linkType, setLinkType] = useState<"url" | "page">("url");
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [urlValue, setUrlValue] = useState("");
    const [pageValue, setPageValue] = useState(1);
    const [labelValue, setLabelValue] = useState("");
    const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

    const currentPageLinks = links.filter((l) => l.pageNumber === currentPage);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isActive || !isCreating) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setStartPoint({ x, y });
      },
      [isActive, isCreating, scale]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!startPoint) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setCurrentRect({
          x: Math.min(startPoint.x, x),
          y: Math.min(startPoint.y, y),
          width: Math.abs(x - startPoint.x),
          height: Math.abs(y - startPoint.y),
        });
      },
      [startPoint, scale]
    );

    const handleMouseUp = useCallback(() => {
      if (!startPoint || !currentRect) return;

      if (currentRect.width > 10 && currentRect.height > 10) {
        setIsConfiguring(true);
      }

      setStartPoint(null);
    }, [startPoint, currentRect]);

    const handleConfirmLink = useCallback(() => {
      if (!currentRect) return;

      const newLink: LinkAnnotation = {
        id: `link_${Date.now()}`,
        pageNumber: currentPage,
        ...currentRect,
        type: linkType,
        url: linkType === "url" ? urlValue : undefined,
        targetPage: linkType === "page" ? pageValue : undefined,
        label: labelValue || undefined,
      };

      onAddLink(newLink);
      
      // Reset state
      setCurrentRect(null);
      setIsConfiguring(false);
      setUrlValue("");
      setPageValue(1);
      setLabelValue("");
      setIsCreating(false);
    }, [currentRect, currentPage, linkType, urlValue, pageValue, labelValue, onAddLink]);

    const handleCancelLink = useCallback(() => {
      setCurrentRect(null);
      setIsConfiguring(false);
      setUrlValue("");
      setPageValue(1);
      setLabelValue("");
    }, []);

    const handleLinkClick = useCallback(
      (link: LinkAnnotation) => {
        if (isActive) {
          setSelectedLinkId(link.id);
          return;
        }

        if (link.type === "url" && link.url) {
          window.open(link.url, "_blank", "noopener,noreferrer");
        } else if (link.type === "page" && link.targetPage) {
          onNavigateToPage(link.targetPage);
        }
      },
      [isActive, onNavigateToPage]
    );

    const renderLink = (link: LinkAnnotation) => {
      const displayX = link.x * scale;
      const displayY = link.y * scale;
      const displayWidth = link.width * scale;
      const displayHeight = link.height * scale;
      const isSelected = selectedLinkId === link.id;

      return (
        <div
          key={link.id}
          className={`absolute ${
            isActive
              ? "cursor-pointer"
              : "cursor-pointer hover:ring-2 hover:ring-blue-400"
          } ${isSelected ? "ring-2 ring-primary" : ""}`}
          style={{
            left: displayX,
            top: displayY,
            width: displayWidth,
            height: displayHeight,
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleLinkClick(link);
          }}
        >
          {/* Link overlay */}
          <div
            className={`absolute inset-0 rounded border-2 transition-colors ${
              link.type === "url"
                ? "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20"
                : "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
            }`}
          />

          {/* Icon indicator */}
          <div
            className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow ${
              link.type === "url" ? "bg-blue-500" : "bg-green-500"
            } text-white`}
          >
            {link.type === "url" ? (
              <ExternalLink className="w-3 h-3" />
            ) : (
              <FileText className="w-3 h-3" />
            )}
          </div>

          {/* Label tooltip */}
          {link.label && (
            <div className="absolute -bottom-6 left-0 px-2 py-0.5 bg-card border border-border rounded text-xs shadow whitespace-nowrap">
              {link.label}
            </div>
          )}

          {/* Delete button (when selected in edit mode) */}
          {isActive && isSelected && (
            <button
              className="absolute -top-3 -left-3 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow hover:bg-destructive/90"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLink(link.id);
                setSelectedLinkId(null);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      );
    };

    if (!isActive) {
      return (
        <div className="absolute inset-0 pointer-events-none">
          <div className="pointer-events-auto">
            {currentPageLinks.map(renderLink)}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`absolute inset-0 ${isCreating && !isConfiguring ? "cursor-crosshair" : ""}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Toolbar */}
        <div className="absolute top-2 right-2 z-50 flex flex-col gap-2 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Link Tool</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isCreating ? "default" : "outline"}
              size="sm"
              onClick={() => setIsCreating(!isCreating)}
              className="h-7 gap-1 flex-1"
            >
              <Plus className="w-3 h-3" />
              {isCreating ? "Drawing..." : "Add Link"}
            </Button>
          </div>

          {isCreating && !isConfiguring && (
            <>
              <div className="flex gap-1">
                <Button
                  variant={linkType === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLinkType("url")}
                  className="h-7 flex-1 gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  URL
                </Button>
                <Button
                  variant={linkType === "page" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLinkType("page")}
                  className="h-7 flex-1 gap-1"
                >
                  <FileText className="w-3 h-3" />
                  Page
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Drag to draw a link area
              </p>
            </>
          )}
        </div>

        {/* Drawing rectangle preview */}
        {currentRect && !isConfiguring && (
          <div
            className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
            style={{
              left: currentRect.x * scale,
              top: currentRect.y * scale,
              width: currentRect.width * scale,
              height: currentRect.height * scale,
            }}
          />
        )}

        {/* Configuration modal */}
        {isConfiguring && currentRect && (
          <div
            className="absolute z-50 bg-card border border-border rounded-lg shadow-xl p-4 min-w-[300px]"
            style={{
              left: currentRect.x * scale,
              top: (currentRect.y + currentRect.height) * scale + 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Configure Link</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCancelLink}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={linkType === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLinkType("url")}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  External URL
                </Button>
                <Button
                  variant={linkType === "page" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLinkType("page")}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Page Link
                </Button>
              </div>

              {linkType === "url" ? (
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Target Page</Label>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageValue}
                    onChange={(e) => setPageValue(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Page 1 - {totalPages}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input
                  placeholder="Link description"
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelLink}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmLink}
                  disabled={linkType === "url" && !urlValue}
                >
                  Add Link
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Render existing links */}
        {currentPageLinks.map(renderLink)}
      </div>
    );
  }
);

LinkAnnotationsCanvas.displayName = "LinkAnnotationsCanvas";

export default LinkAnnotationsCanvas;
