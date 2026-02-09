import React, { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, X, Check } from "lucide-react";

/**
 * HeaderFooterModal Component
 *
 * This component provides header and footer functionality for PDFs:
 * - Add page numbers (with customizable format)
 * - Add date (with format options)
 * - Add custom text
 * - Position options (left, center, right for both header and footer)
 *
 * How headers/footers work:
 * 1. User configures header and/or footer content
 * 2. Selects text alignment (left, center, right)
 * 3. Chooses page numbering format
 * 4. On apply, content is added to all pages
 *
 * Common uses:
 * - Page numbers: "Page 1 of 10"
 * - Document title in header
 * - Date/timestamp
 * - Confidentiality notices
 * - Copyright text
 *
 * @example
 * <HeaderFooterModal
 *   isOpen={isHeaderFooterModalOpen}
 *   onClose={() => setIsHeaderFooterModalOpen(false)}
 *   onApply={handleApplyHeaderFooter}
 *   totalPages={numPages}
 * />
 */

export type Alignment = "left" | "center" | "right";

export interface HeaderFooterConfig {
  header: {
    left: string;
    center: string;
    right: string;
    enabled: boolean;
  };
  footer: {
    left: string;
    center: string;
    right: string;
    enabled: boolean;
  };
  pageNumberFormat: PageNumberFormat;
  dateFormat: DateFormat;
  fontSize: number;
  margin: number;
}

export type PageNumberFormat =
  | "none"
  | "page-only"           // "1"
  | "page-of-total"       // "Page 1 of 10"
  | "page-slash-total"    // "1/10"
  | "page-dash-total";    // "1 - 10"

export type DateFormat =
  | "none"
  | "short"       // "02/09/2026"
  | "medium"      // "Feb 9, 2026"
  | "long"        // "February 9, 2026"
  | "iso";        // "2026-02-09"

interface HeaderFooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: HeaderFooterConfig) => void;
  totalPages: number;
}

const PAGE_NUMBER_FORMATS: { value: PageNumberFormat; label: string; example: string }[] = [
  { value: "none", label: "None", example: "" },
  { value: "page-only", label: "Page Number Only", example: "1" },
  { value: "page-of-total", label: "Page X of Y", example: "Page 1 of 10" },
  { value: "page-slash-total", label: "X/Y", example: "1/10" },
  { value: "page-dash-total", label: "X - Y", example: "1 - 10" },
];

const DATE_FORMATS: { value: DateFormat; label: string; example: string }[] = [
  { value: "none", label: "None", example: "" },
  { value: "short", label: "Short", example: "02/09/2026" },
  { value: "medium", label: "Medium", example: "Feb 9, 2026" },
  { value: "long", label: "Long", example: "February 9, 2026" },
  { value: "iso", label: "ISO", example: "2026-02-09" },
];

const DEFAULT_CONFIG: HeaderFooterConfig = {
  header: {
    left: "",
    center: "",
    right: "",
    enabled: false,
  },
  footer: {
    left: "",
    center: "",
    right: "",
    enabled: true,
  },
  pageNumberFormat: "page-of-total",
  dateFormat: "none",
  fontSize: 10,
  margin: 30,
};

/**
 * Special tokens that will be replaced with actual values:
 * - {page} - Current page number
 * - {total} - Total number of pages
 * - {date} - Current date in selected format
 */
const TOKENS_HELP = [
  { token: "{page}", description: "Current page number" },
  { token: "{total}", description: "Total pages" },
  { token: "{date}", description: "Current date" },
];

const HeaderFooterModal: React.FC<HeaderFooterModalProps> = memo(({
  isOpen,
  onClose,
  onApply,
  totalPages,
}) => {
  const [config, setConfig] = useState<HeaderFooterConfig>(DEFAULT_CONFIG);

  /**
   * Updates header configuration.
   */
  const updateHeader = useCallback(<K extends keyof HeaderFooterConfig["header"]>(
    key: K,
    value: HeaderFooterConfig["header"][K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      header: { ...prev.header, [key]: value, enabled: true },
    }));
  }, []);

  /**
   * Updates footer configuration.
   */
  const updateFooter = useCallback(<K extends keyof HeaderFooterConfig["footer"]>(
    key: K,
    value: HeaderFooterConfig["footer"][K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      footer: { ...prev.footer, [key]: value, enabled: true },
    }));
  }, []);

  /**
   * Updates general configuration.
   */
  const updateConfig = useCallback(<K extends keyof HeaderFooterConfig>(
    key: K,
    value: HeaderFooterConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Adds a preset page number to the footer center.
   */
  const addPageNumbers = useCallback(() => {
    const format = config.pageNumberFormat;
    let pageText = "";

    switch (format) {
      case "page-only":
        pageText = "{page}";
        break;
      case "page-of-total":
        pageText = "Page {page} of {total}";
        break;
      case "page-slash-total":
        pageText = "{page}/{total}";
        break;
      case "page-dash-total":
        pageText = "{page} - {total}";
        break;
    }

    updateFooter("center", pageText);
  }, [config.pageNumberFormat, updateFooter]);

  /**
   * Adds the date to the footer right.
   */
  const addDate = useCallback(() => {
    if (config.dateFormat !== "none") {
      updateFooter("right", "{date}");
    }
  }, [config.dateFormat, updateFooter]);

  /**
   * Applies the header/footer configuration.
   */
  const handleApply = useCallback(() => {
    // Check if at least something is configured
    const hasHeader =
      config.header.left.trim() ||
      config.header.center.trim() ||
      config.header.right.trim();
    const hasFooter =
      config.footer.left.trim() ||
      config.footer.center.trim() ||
      config.footer.right.trim();

    if (!hasHeader && !hasFooter) {
      alert("Please add at least one header or footer item");
      return;
    }

    onApply({
      ...config,
      header: { ...config.header, enabled: hasHeader },
      footer: { ...config.footer, enabled: hasFooter },
    });
    onClose();
  }, [config, onApply, onClose]);

  /**
   * Resets configuration to defaults.
   */
  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  /**
   * Formats a preview string by replacing tokens.
   */
  const formatPreview = useCallback((text: string): string => {
    let result = text;
    result = result.replace("{page}", "1");
    result = result.replace("{total}", totalPages.toString());

    // Format date based on selected format
    const now = new Date();
    let dateStr = "";
    switch (config.dateFormat) {
      case "short":
        dateStr = now.toLocaleDateString("en-US");
        break;
      case "medium":
        dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        break;
      case "long":
        dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        break;
      case "iso":
        dateStr = now.toISOString().split("T")[0];
        break;
    }
    result = result.replace("{date}", dateStr);

    return result;
  }, [totalPages, config.dateFormat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Header & Footer</h2>
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
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Label>Page Numbers:</Label>
              <select
                value={config.pageNumberFormat}
                onChange={(e) => updateConfig("pageNumberFormat", e.target.value as PageNumberFormat)}
                className="h-8 px-2 text-sm border border-border rounded bg-background"
              >
                {PAGE_NUMBER_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label} {format.example && `(${format.example})`}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={addPageNumbers}
                disabled={config.pageNumberFormat === "none"}
              >
                Add to Footer
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label>Date:</Label>
              <select
                value={config.dateFormat}
                onChange={(e) => updateConfig("dateFormat", e.target.value as DateFormat)}
                className="h-8 px-2 text-sm border border-border rounded bg-background"
              >
                {DATE_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label} {format.example && `(${format.example})`}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={addDate}
                disabled={config.dateFormat === "none"}
              >
                Add to Footer
              </Button>
            </div>
          </div>

          {/* Header Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Header</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  value={config.header.left}
                  onChange={(e) => updateHeader("left", e.target.value)}
                  placeholder="Left aligned..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Center</Label>
                <Input
                  value={config.header.center}
                  onChange={(e) => updateHeader("center", e.target.value)}
                  placeholder="Centered..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  value={config.header.right}
                  onChange={(e) => updateHeader("right", e.target.value)}
                  placeholder="Right aligned..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Footer</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  value={config.footer.left}
                  onChange={(e) => updateFooter("left", e.target.value)}
                  placeholder="Left aligned..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Center</Label>
                <Input
                  value={config.footer.center}
                  onChange={(e) => updateFooter("center", e.target.value)}
                  placeholder="Centered..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  value={config.footer.right}
                  onChange={(e) => updateFooter("right", e.target.value)}
                  placeholder="Right aligned..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Font Size: {config.fontSize}px</Label>
              <input
                type="range"
                min="8"
                max="18"
                value={config.fontSize}
                onChange={(e) => updateConfig("fontSize", Number(e.target.value))}
                className="w-full h-2 mt-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
            <div>
              <Label>Margin: {config.margin}px</Label>
              <input
                type="range"
                min="10"
                max="60"
                value={config.margin}
                onChange={(e) => updateConfig("margin", Number(e.target.value))}
                className="w-full h-2 mt-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Tokens Help */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">
              Available tokens (will be replaced with actual values):
            </p>
            <div className="flex gap-4 text-xs">
              {TOKENS_HELP.map((t) => (
                <span key={t.token}>
                  <code className="bg-muted px-1 rounded">{t.token}</code> = {t.description}
                </span>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-1 bg-muted/50 text-xs text-muted-foreground">
              Preview (Page 1 of {totalPages})
            </div>
            <div className="bg-white p-4 relative" style={{ minHeight: "120px" }}>
              {/* Header Preview */}
              {(config.header.left || config.header.center || config.header.right) && (
                <div
                  className="absolute top-2 left-3 right-3 flex justify-between text-gray-600 border-b border-gray-200 pb-1"
                  style={{ fontSize: `${config.fontSize}px` }}
                >
                  <span>{formatPreview(config.header.left)}</span>
                  <span>{formatPreview(config.header.center)}</span>
                  <span>{formatPreview(config.header.right)}</span>
                </div>
              )}

              {/* Page Content Placeholder */}
              <div className="text-center text-muted-foreground text-xs py-6">
                [Page Content]
              </div>

              {/* Footer Preview */}
              {(config.footer.left || config.footer.center || config.footer.right) && (
                <div
                  className="absolute bottom-2 left-3 right-3 flex justify-between text-gray-600 border-t border-gray-200 pt-1"
                  style={{ fontSize: `${config.fontSize}px` }}
                >
                  <span>{formatPreview(config.footer.left)}</span>
                  <span>{formatPreview(config.footer.center)}</span>
                  <span>{formatPreview(config.footer.right)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between px-4 py-3 border-t border-border bg-muted/30 shrink-0">
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

HeaderFooterModal.displayName = "HeaderFooterModal";

export default HeaderFooterModal;
