import React, { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Scan,
  X,
  Loader2,
  Copy,
  Check,
  FileText,
  AlertCircle,
  Languages,
} from "lucide-react";

interface OCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDocument: any; // PDF.js document
  currentPage: number;
  scale?: number; // Optional, uses fixed scale for OCR quality
}

type OCRLanguage = {
  code: string;
  name: string;
};

// Tesseract.js types (for dynamic import)
interface TesseractResult {
  data: {
    text: string;
  };
}

interface TesseractWorkerProgress {
  status: string;
  progress: number;
}

const LANGUAGES: OCRLanguage[] = [
  { code: "eng", name: "English" },
  { code: "spa", name: "Spanish" },
  { code: "fra", name: "French" },
  { code: "deu", name: "German" },
  { code: "ita", name: "Italian" },
  { code: "por", name: "Portuguese" },
  { code: "nld", name: "Dutch" },
  { code: "jpn", name: "Japanese" },
  { code: "chi_sim", name: "Chinese (Simplified)" },
  { code: "kor", name: "Korean" },
];

const OCRModal: React.FC<OCRModalProps> = memo(
  ({ isOpen, onClose, pdfDocument, currentPage }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState("");
    const [extractedText, setExtractedText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("eng");
    const [ocrMode, setOcrMode] = useState<"current" | "all">("current");

    const renderPageToCanvas = async (pageNum: number): Promise<string> => {
      if (!pdfDocument) throw new Error("No PDF document");

      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 }); // Higher scale for better OCR

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Failed to get canvas context");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      return canvas.toDataURL("image/png");
    };

    const handleOCR = useCallback(async () => {
      if (!pdfDocument) return;

      setIsProcessing(true);
      setProgress(0);
      setProgressMessage("Initializing OCR...");
      setError(null);
      setExtractedText("");

      try {
        // Dynamically import Tesseract.js
        const Tesseract = await import("tesseract.js");

        const pagesToProcess =
          ocrMode === "current"
            ? [currentPage]
            : Array.from({ length: pdfDocument.numPages }, (_, i) => i + 1);

        let allText = "";

        for (let i = 0; i < pagesToProcess.length; i++) {
          const pageNum = pagesToProcess[i];
          setProgressMessage(`Rendering page ${pageNum}...`);
          setProgress((i / pagesToProcess.length) * 50);

          // Render page to canvas and get image data
          const imageData = await renderPageToCanvas(pageNum);

          setProgressMessage(`Recognizing text on page ${pageNum}...`);

          // Perform OCR
          const result = (await Tesseract.recognize(
            imageData,
            selectedLanguage,
            {
              logger: (info: TesseractWorkerProgress) => {
                if (info.status === "recognizing text") {
                  const pageProgress = info.progress * 50;
                  setProgress((i / pagesToProcess.length) * 50 + pageProgress);
                }
              },
            }
          )) as TesseractResult;

          if (pagesToProcess.length > 1) {
            allText += `\n--- Page ${pageNum} ---\n\n`;
          }
          allText += result.data.text;
        }

        setExtractedText(allText.trim());
        setProgress(100);
        setProgressMessage("Complete!");
      } catch (err: any) {
        console.error("OCR Error:", err);
        setError(
          err.message ||
            "OCR processing failed. Make sure you have an internet connection for Tesseract.js to download language data."
        );
      } finally {
        setIsProcessing(false);
      }
    }, [pdfDocument, currentPage, ocrMode, selectedLanguage]);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(extractedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }, [extractedText]);

    const handleReset = useCallback(() => {
      setExtractedText("");
      setProgress(0);
      setProgressMessage("");
      setError(null);
    }, []);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isProcessing) onClose();
        }}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">OCR - Text Recognition</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {!extractedText ? (
              <>
                {/* Settings */}
                <div className="space-y-4">
                  {/* Page selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pages to Process</label>
                    <div className="flex gap-2">
                      <Button
                        variant={ocrMode === "current" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOcrMode("current")}
                        className="flex-1"
                        disabled={isProcessing}
                      >
                        Current Page ({currentPage})
                      </Button>
                      <Button
                        variant={ocrMode === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOcrMode("all")}
                        className="flex-1"
                        disabled={isProcessing}
                      >
                        All Pages ({pdfDocument?.numPages || 0})
                      </Button>
                    </div>
                  </div>

                  {/* Language selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      Recognition Language
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      disabled={isProcessing}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border text-sm space-y-2">
                  <p className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">
                      OCR extracts text from scanned documents or images. For best results,
                      ensure the document is clear and well-lit.
                    </span>
                  </p>
                </div>

                {/* Progress */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{progressMessage}</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </>
            ) : (
              /* Results */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Extracted Text</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="h-7"
                    >
                      Run Again
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="h-7 gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <textarea
                  value={extractedText}
                  readOnly
                  className="w-full h-64 p-3 text-sm bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <p className="text-xs text-muted-foreground">
                  {extractedText.length} characters extracted
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-end gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              {extractedText ? "Close" : "Cancel"}
            </Button>
            {!extractedText && (
              <Button
                onClick={handleOCR}
                disabled={isProcessing || !pdfDocument}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    Extract Text
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

OCRModal.displayName = "OCRModal";

export default OCRModal;
