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
        // Check if it's a password-related error
        const errorMsg = error.message?.toLowerCase() || "";
        if (
          errorMsg.includes("password") ||
          errorMsg.includes("encrypted") ||
          errorMsg.includes("decrypt") ||
          errorMsg === "pdf_password_required"
        ) {
          return false;
        }
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
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Failed to load PDF file");
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
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      <MenuBar
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onNew={handleNew}
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
