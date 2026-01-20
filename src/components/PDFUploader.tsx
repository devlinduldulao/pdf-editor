import React, { useRef, useCallback, memo } from "react";
import { Card } from "@/components/ui/card";
import { Upload, FileText } from "lucide-react";

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = memo(({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === "application/pdf") {
        onFileSelect(file);
      } else {
        alert("Please select a valid PDF file");
      }
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type === "application/pdf") {
        onFileSelect(file);
      } else {
        alert("Please drop a valid PDF file");
      }
    },
    [onFileSelect],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Card
      className="w-full max-w-2xl flex flex-col items-center justify-center p-8 md:p-16 border-2 border-dashed border-border rounded-2xl bg-card shadow-sm transition-all duration-200 hover:border-primary hover:bg-accent cursor-pointer group m-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
        data-testid="pdf-upload-input"
      />
      <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
        <Upload className="w-8 h-8 md:w-10 md:h-10 text-primary" />
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-card-foreground mb-2 text-center">
        Upload Document
      </h2>
      <p className="text-muted-foreground text-center max-w-sm mb-8 text-sm md:text-base">
        Drag and drop your PDF here, or click to browse files.
      </p>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <FileText className="w-4 h-4" />
          <span>PDF Support</span>
        </div>
      </div>
    </Card>
  );
});

PDFUploader.displayName = "PDFUploader";

export default PDFUploader;
