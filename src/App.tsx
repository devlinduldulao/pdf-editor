import { useState, useCallback } from "react";
import MenuBar from "./components/MenuBar";
import PDFUploader from "./components/PDFUploader";
import PDFViewer from "./components/PDFViewer";
import { pdfEditorService } from "./services/pdfEditor";

function App() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileSelect = useCallback(async (file: File) => {
    const attemptLoad = async (password?: string): Promise<boolean> => {
      try {
        await pdfEditorService.loadPDF(file, password);
        setCurrentFile(file);
        setFileName(file.name);
        return true;
      } catch (error: any) {
        console.error("Error loading PDF:", error);
        // Check if it's specifically the password required error
        if (error.message === "PDF_PASSWORD_REQUIRED") {
          return false;
        }
        // For other errors, throw them
        throw error;
      }
    };

    try {
      // First attempt without password
      const success = await attemptLoad();
      if (!success) {
        // PDF is password protected, prompt user
        const password = prompt(
          "This PDF is password-protected. Please enter the password:",
        );
        if (password) {
          const retrySuccess = await attemptLoad(password);
          if (!retrySuccess) {
            alert("Incorrect password. Please try again.");
            // Retry one more time
            const retryPassword = prompt(
              "Incorrect password. Please try again:",
            );
            if (retryPassword) {
              const finalSuccess = await attemptLoad(retryPassword);
              if (!finalSuccess) {
                alert("Failed to open PDF: Incorrect password");
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading PDF:", error);

      const errorMessage = error.message || String(error);

      // If it's a parsing error or object ref error, inform the user specifically
      if (
        errorMessage.includes("Invalid object ref") ||
        errorMessage.includes("parse")
      ) {
        alert(
          "Parse Error: The PDF file structure is invalid or not supported by the editor.",
        );
        return; // Stop processing
      }

      alert("Failed to load PDF file: " + errorMessage);
    }
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
    <div className="flex flex-col h-dvh overflow-hidden bg-slate-100 font-sans text-slate-900">
      <MenuBar
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onNew={handleNew}
        onPrint={handlePrint}
        hasDocument={!!currentFile}
      />
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {currentFile ? (
          <PDFViewer file={currentFile} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <PDFUploader onFileSelect={handleFileSelect} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
