import React, { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Stamp,
  X,
  Loader2,
  Check,
  AlertCircle,
  Download,
  Info,
} from "lucide-react";
import { pdfEditorService } from "@/services/pdfEditor";

interface FlattenAnnotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
}

const FlattenAnnotationsModal: React.FC<FlattenAnnotationsModalProps> = memo(
  ({ isOpen, onClose, fileName }) => {
    const [isFlattening, setIsFlattening] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [flattenedBlob, setFlattenedBlob] = useState<Blob | null>(null);

    const handleFlatten = useCallback(async () => {
      setIsFlattening(true);
      setError(null);

      try {
        // Flatten the annotations
        await pdfEditorService.flattenAnnotations();
        
        // Get the flattened PDF
        const pdfBytes = await pdfEditorService.savePDF();
        const blob = new Blob([new Uint8Array(pdfBytes).buffer], { type: "application/pdf" });
        setFlattenedBlob(blob);
        setIsComplete(true);
      } catch (err: any) {
        console.error("Flatten failed:", err);
        setError(err.message || "Failed to flatten annotations");
      } finally {
        setIsFlattening(false);
      }
    }, []);

    const handleDownload = useCallback(() => {
      if (!flattenedBlob) return;

      const url = URL.createObjectURL(flattenedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.replace(".pdf", "-flattened.pdf");
      link.click();
      URL.revokeObjectURL(url);
    }, [flattenedBlob, fileName]);

    const handleReset = useCallback(() => {
      setIsComplete(false);
      setFlattenedBlob(null);
      setError(null);
    }, []);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isFlattening) onClose();
        }}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Stamp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Flatten Annotations</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              disabled={isFlattening}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* File info */}
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm font-medium truncate">{fileName}</p>
            </div>

            {!isComplete ? (
              <>
                {/* Info about flattening */}
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-blue-700 dark:text-blue-300">
                          What is flattening?
                        </p>
                        <p className="text-blue-600 dark:text-blue-400">
                          Flattening permanently embeds form fields and annotations into the PDF.
                          After flattening:
                        </p>
                        <ul className="list-disc list-inside text-blue-600 dark:text-blue-400 space-y-1">
                          <li>Form fields become static text (non-editable)</li>
                          <li>Digital signatures are preserved visually</li>
                          <li>Comments and annotations become permanent</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        <strong>Important:</strong> This action is irreversible on the resulting file.
                        Keep a copy of the original if you need to edit forms later.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Common use cases */}
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Common use cases:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Submitting filled forms as final documents</li>
                    <li>Preventing further edits to a signed document</li>
                    <li>Reducing file size by removing form functionality</li>
                    <li>Ensuring consistent appearance across PDF viewers</li>
                  </ul>
                </div>
              </>
            ) : (
              /* Success state */
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center space-y-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Annotations Flattened!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    All form fields and annotations have been permanently embedded.
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={isComplete ? handleReset : onClose}
              disabled={isFlattening}
            >
              {isComplete ? "Flatten Another" : "Cancel"}
            </Button>

            {!isComplete ? (
              <Button
                onClick={handleFlatten}
                disabled={isFlattening}
                className="gap-2"
              >
                {isFlattening ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Flattening...
                  </>
                ) : (
                  <>
                    <Stamp className="w-4 h-4" />
                    Flatten
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download Flattened PDF
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

FlattenAnnotationsModal.displayName = "FlattenAnnotationsModal";

export default FlattenAnnotationsModal;
