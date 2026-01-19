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
      className="w-full max-w-2xl flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white shadow-sm transition-all duration-200 hover:border-indigo-400 hover:bg-slate-50 cursor-pointer group"
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
      />
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
        <Upload className="w-10 h-10 text-indigo-500" />
      </div>

      <h2 className="text-2xl font-semibold text-slate-800 mb-2">
        Upload Document
      </h2>
      <p className="text-slate-500 text-center max-w-sm mb-8">
        Drag and drop your PDF here, or click to browse files.
      </p>

      <div className="flex gap-4 text-sm text-slate-400">
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
