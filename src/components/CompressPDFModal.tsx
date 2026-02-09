import React, { memo, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  FileArchive,
  X,
  Loader2,
  Check,
  Download,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import { pdfEditorService } from "@/services/pdfEditor";

interface CompressPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const CompressPDFModal: React.FC<CompressPDFModalProps> = memo(
  ({ isOpen, onClose, fileName }) => {
    const [isCompressing, setIsCompressing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [originalSize, setOriginalSize] = useState<number | null>(null);
    const [compressedSize, setCompressedSize] = useState<number | null>(null);
    const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Get original size when modal opens
    useEffect(() => {
      if (isOpen) {
        const getSize = async () => {
          try {
            const size = await pdfEditorService.getPDFSize();
            setOriginalSize(size);
          } catch (err) {
            setOriginalSize(null);
          }
        };
        getSize();
        setIsComplete(false);
        setCompressedSize(null);
        setCompressedBlob(null);
        setError(null);
      }
    }, [isOpen]);

    const handleCompress = useCallback(async () => {
      setIsCompressing(true);
      setError(null);

      try {
        const compressedBytes = await pdfEditorService.compressPDF();
        setCompressedSize(compressedBytes.length);
        
        const blob = new Blob([new Uint8Array(compressedBytes).buffer], { type: "application/pdf" });
        setCompressedBlob(blob);
        setIsComplete(true);
      } catch (err: any) {
        console.error("Compression failed:", err);
        setError(err.message || "Compression failed");
      } finally {
        setIsCompressing(false);
      }
    }, []);

    const handleDownload = useCallback(() => {
      if (!compressedBlob) return;

      const url = URL.createObjectURL(compressedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.replace(".pdf", "-compressed.pdf");
      link.click();
      URL.revokeObjectURL(url);
    }, [compressedBlob, fileName]);

    const savings = originalSize && compressedSize
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isCompressing) onClose();
        }}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Compress PDF</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              disabled={isCompressing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* File info */}
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm font-medium truncate">{fileName}</p>
              {originalSize && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current size: {formatBytes(originalSize)}
                </p>
              )}
            </div>

            {/* Info about compression */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                PDF compression optimizes the document by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Using object streams for better efficiency</li>
                <li>Removing redundant data</li>
                <li>Optimizing internal structure</li>
              </ul>
              <p className="text-xs mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Note: Compression ratio depends on the original PDF content. 
                PDFs with already-compressed images may see minimal reduction.
              </p>
            </div>

            {/* Results */}
            {isComplete && compressedSize !== null && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Compression Complete!</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Original</p>
                    <p className="text-lg font-semibold">
                      {formatBytes(originalSize || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Compressed</p>
                    <p className="text-lg font-semibold text-primary">
                      {formatBytes(compressedSize)}
                    </p>
                  </div>
                </div>

                {savings > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-medium">{savings}% smaller</span>
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">
                    This PDF is already well-optimized
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCompressing}
            >
              {isComplete ? "Close" : "Cancel"}
            </Button>
            
            {!isComplete ? (
              <Button
                onClick={handleCompress}
                disabled={isCompressing}
                className="gap-2"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4" />
                    Compress
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CompressPDFModal.displayName = "CompressPDFModal";

export default CompressPDFModal;
