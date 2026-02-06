import { useState, useCallback, Suspense, lazy } from "react";
import MenuBar from "./components/MenuBar";
import PDFUploader from "./components/PDFUploader";
import { pdfEditorService } from "./services/pdfEditor";
import { PasswordPrompt } from "./components/PasswordPrompt";
import { LoadingSpinner } from "./components/ui/loading-spinner";
import { AlertCircle } from "lucide-react";

// Lazy load the heavy PDF viewer
const PDFViewer = lazy(() => import("./components/PDFViewer"));

function App() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [isPasswordError, setIsPasswordError] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFile = async (file: File, password?: string) => {
    try {
      await pdfEditorService.loadPDF(file, password);
      setCurrentFile(file);
      setFileName(file.name);
      setIsPasswordPromptOpen(false);
      setIsPasswordError(false);
      setPendingFile(null);
      setError(null);
      return true;
    } catch (error: any) {
      console.error("Error loading PDF:", error);
      if (error.message === "PDF_PASSWORD_REQUIRED") {
        setPendingFile(file);
        setIsPasswordPromptOpen(true);
        setIsPasswordError(!!password); // If we provided a password and it failed, it's an error
        return false;
      }

      const errorMessage = error.message || String(error);
      if (errorMessage.includes("Invalid object ref") || errorMessage.includes("parse")) {
        setError("The PDF file structure is invalid or not supported.");
      } else {
        setError(`Failed to load PDF: ${errorMessage}`);
      }
      return false;
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (pendingFile) {
      loadFile(pendingFile, password);
    }
  };

  const handlePasswordCancel = () => {
    setIsPasswordPromptOpen(false);
    setPendingFile(null);
    setIsPasswordError(false);
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    loadFile(file);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await pdfEditorService.downloadPDF(fileName);
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert("Failed to save PDF");
    }
  }, [fileName]);

  const handleSaveAs = useCallback(async () => {
    const newFileName = prompt(
      "Enter file name:",
      fileName.replace(".pdf", ""),
    );
    if (newFileName) {
      try {
        await pdfEditorService.downloadPDF(`${newFileName}.pdf`);
      } catch (error) {
        console.error("Error saving PDF:", error);
        alert("Failed to save PDF");
      }
    }
  }, [fileName]);

  const handlePrint = useCallback(async () => {
    try {
      const pdfBytes = await pdfEditorService.savePDF();
      const blob = new Blob([pdfBytes as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      // Create hidden iframe for printing
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      // Set up load handler before setting src
      iframe.onload = () => {
        try {
          // Small delay to ensure PDF is fully loaded
          setTimeout(() => {
            iframe.contentWindow?.print();
          }, 250);
        } catch (err) {
          console.error("Error triggering print:", err);
          alert("Failed to open print dialog");
        }
      };

      iframe.src = url;
      document.body.appendChild(iframe);

      // Cleanup after a longer delay
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error("Error cleaning up print iframe:", err);
        }
      }, 5000);
    } catch (error) {
      console.error("Error printing PDF:", error);
      alert("Failed to print PDF");
    }
  }, []);

  const handleNew = useCallback(() => {
    if (
      confirm("Start with a new document? Any unsaved changes will be lost.")
    ) {
      setCurrentFile(null);
      setFileName("");
      pdfEditorService.reset();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <PasswordPrompt
        isOpen={isPasswordPromptOpen}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
        isError={isPasswordError}
      />

      <MenuBar
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onNew={handleNew}
        onPrint={handlePrint}
        hasDocument={!!currentFile}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
        <div className="space-y-8">
          <div className="text-center space-y-4 pt-8">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-primary via-purple-500 to-pink-500 pb-2 font-display">
              PDF Editor
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Securely edit, sign, and annotate your PDF documents locally.
            </p>
          </div>

          {!currentFile && (
            <div className="max-w-xl mx-auto mt-12 transform transition-all hover:scale-[1.01] duration-300">
              <PDFUploader onFileSelect={handleFileSelect} />

              {error && (
                <div className="mt-4 p-4 bg-destructive/10 border-destructive/20 border rounded-lg flex items-center gap-3 text-destructive animate-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}
            </div>
          )}

          {currentFile && (
            <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-2xl bg-card">
              <Suspense
                fallback={
                  <div className="h-[80vh] flex flex-col items-center justify-center gap-4 bg-muted/30">
                    <LoadingSpinner size="xl" />
                    <p className="text-muted-foreground animate-pulse font-medium">Loading PDF Viewer...</p>
                  </div>
                }
              >
                <PDFViewer file={currentFile} />
              </Suspense>
            </div>
          )}
        </div>
      </main>

      <div className="fixed inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--primary)_100%)] opacity-5 pointer-events-none dark:opacity-20 mix-blend-overlay" />
    </div>
  );
}

export default App;
