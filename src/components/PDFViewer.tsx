import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { pdfEditorService } from "@/services/pdfEditor";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Type,
  MousePointer2,
  Check,
  Image as ImageIcon,
  Trash2,
  Bold,
  Italic,
  Plus,
  Minus,
} from "lucide-react";
import type { ImageAnnotation } from "@/services/pdfEditor";

// Set worker path - using local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PDFViewerProps {
  file: File | null;
}

interface FormField {
  id: string;
  name: string;
  type: string;
  rect: number[];
  page: number;
  value: string;
}

interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  pageNumber: number;
  fontSize: number;
  isBold?: boolean;
  isItalic?: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [scale, setScale] = useState<number>(1.5);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [imageAnnotations, setImageAnnotations] = useState<ImageAnnotation[]>(
    [],
  );
  const [isAddingText, setIsAddingText] = useState<boolean>(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Defaults for new text
  const defaultFontSize = 12;

  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      const attemptLoad = async (password?: string): Promise<any> => {
        const arrayBuffer = await file.arrayBuffer();

        // Get the password from the service if it was already provided
        const servicePassword = pdfEditorService.getPassword();
        const finalPassword = password || servicePassword;

        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          password: finalPassword,
        });

        // Handle password requests from PDF.js
        loadingTask.onPassword = (updatePassword: any, reason: number) => {
          if (reason === 1) {
            // Need password - but if service already has it, don't prompt again
            if (servicePassword) {
              updatePassword(servicePassword);
              return;
            }
            const pwd = prompt("This PDF requires a password to view:");
            if (pwd) {
              updatePassword(pwd);
            }
          } else if (reason === 2) {
            // Incorrect password
            const pwd = prompt("Incorrect password. Please try again:");
            if (pwd) {
              updatePassword(pwd);
            } else {
              throw new Error("Password required");
            }
          }
        };

        return await loadingTask.promise;
      };

      try {
        const pdf = await attemptLoad();
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);

        // Extract form fields
        await extractFormFields(pdf);
      } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Failed to load PDF");
      }
    };

    loadPDF();
  }, [file]);

  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;

      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const initialWidth = 150;
        const initialHeight = initialWidth / aspectRatio;

        const newAnnotation: ImageAnnotation = {
          id: `image_${Date.now()}`,
          imageData: base64,
          x: 50,
          y: 500, // Roughly top of page for 1.5 scale/A4
          width: initialWidth,
          height: initialHeight,
          pageNumber: currentPage,
        };
        setImageAnnotations((prev: ImageAnnotation[]) => [
          ...prev,
          newAnnotation,
        ]);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const extractFormFields = async (pdf: any) => {
    const fields: FormField[] = [];
    console.log("🔍 Extracting form fields from PDF...");

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const annotations = await page.getAnnotations();

      console.log(`Page ${pageNum}: Found ${annotations.length} annotations`);

      annotations.forEach((annotation: any, index: number) => {
        console.log(`Annotation ${index}:`, {
          type: annotation.subtype,
          fieldType: annotation.fieldType,
          fieldName: annotation.fieldName,
          rect: annotation.rect,
        });

        if (annotation.fieldType) {
          fields.push({
            id: `${annotation.fieldName || `field_${pageNum}_${index}`}`,
            name: annotation.fieldName || `field_${pageNum}_${index}`,
            type: annotation.fieldType,
            rect: annotation.rect,
            page: pageNum,
            value: annotation.fieldValue || "",
          });
        }
      });
    }

    console.log(`✅ Total form fields found: ${fields.length}`, fields);
    setFormFields(fields);

    // Initialize field values
    const initialValues: Record<string, string> = {};
    fields.forEach((field) => {
      initialValues[field.id] = field.value;
    });
    setFieldValues(initialValues);
  };

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale });

        // Clear previous canvases
        if (canvasRef.current) {
          canvasRef.current.innerHTML = "";
        }

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = "pdf-canvas";

        canvasRef.current?.appendChild(canvas);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error("Error rendering page:", error);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  }, [numPages]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }, []);

  const handleApplyChanges = async () => {
    try {
      console.log("Applying changes...");
      console.log("Form fields:", fieldValues);
      console.log("Text annotations:", textAnnotations);

      // Fill form fields using pdf-lib
      for (const [fieldName, value] of Object.entries(fieldValues)) {
        if (value && value.trim()) {
          await pdfEditorService.fillFormField(fieldName, value);
        }
      }

      // Add text annotations (filter out empty ones)
      const validAnnotations = textAnnotations.filter(
        (a) => a.text && a.text.trim(),
      );
      console.log("Valid annotations to add:", validAnnotations);

      for (const annotation of validAnnotations) {
        await pdfEditorService.addText(annotation);
      }

      // Add image annotations (on current page or all pages where they were added)
      for (const annotation of imageAnnotations) {
        await pdfEditorService.addImage(annotation);
      }

      alert(
        `Changes applied! ${validAnnotations.length} text(s) and ${imageAnnotations.length} image(s) added. Click Save to download.`,
      );
    } catch (error: any) {
      console.error("Error applying changes:", error);
      alert(`Failed to apply changes: ${error.message || error}`);
    }
  };

  const handleOverlayDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingText || !canvasRef.current?.firstChild) return;

    const canvas = canvasRef.current.firstChild as HTMLCanvasElement;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to PDF coordinates
    const pdfX = x / scale;
    const pdfY = canvas.height / scale - y / scale;

    const newAnnotation: TextAnnotation = {
      id: `text_${Date.now()}`,
      text: "",
      x: pdfX,
      y: pdfY,
      pageNumber: currentPage,
      fontSize: defaultFontSize,
      isBold: false,
      isItalic: false,
    };

    setTextAnnotations((prev) => [...prev, newAnnotation]);
    setSelectedAnnotationId(newAnnotation.id);
    setIsAddingText(false); // Switch to edit mode immediately
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const canvas = canvasRef.current?.firstChild as HTMLCanvasElement;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!canvas || !rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const initialWidth = 150;
        const initialHeight = initialWidth / aspectRatio;

        // Convert drop position to PDF coordinates
        // Drop point is center of image
        const pdfX = x / scale - initialWidth / 2;
        const pdfY = (canvas.height - y) / scale - initialHeight / 2;

        const newAnnotation: ImageAnnotation = {
          id: `image_${Date.now()}`,
          imageData: base64,
          x: pdfX,
          y: pdfY,
          width: initialWidth,
          height: initialHeight,
          pageNumber: currentPage,
        };
        setImageAnnotations((prev: ImageAnnotation[]) => [
          ...prev,
          newAnnotation,
        ]);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = useCallback((id: string, value: string) => {
    setTextAnnotations((prev) =>
      prev.map((ann) => (ann.id === id ? { ...ann, text: value } : ann)),
    );
  }, []);

  const updateAnnotationStyle = useCallback(
    (id: string, updates: Partial<TextAnnotation>) => {
      setTextAnnotations((prev) =>
        prev.map((ann) => (ann.id === id ? { ...ann, ...updates } : ann)),
      );
    },
    [],
  );

  const handleDeleteAnnotation = useCallback((id: string) => {
    setTextAnnotations((prev) => prev.filter((ann) => ann.id !== id));
  }, []);

  const getFieldPosition = useCallback(
    (field: FormField) => {
      if (!canvasRef.current?.firstChild) return null;

      const canvas = canvasRef.current.firstChild as HTMLCanvasElement;
      const [x1, y1, x2, y2] = field.rect;

      return {
        left: x1 * scale,
        top: canvas.height - y2 * scale,
        width: (x2 - x1) * scale,
        height: (y2 - y1) * scale,
      };
    },
    [scale],
  );

  const FormFieldComponent = memo(
    ({
      field,
      pos,
      isCheckbox,
    }: {
      field: FormField;
      pos: any;
      isCheckbox: boolean;
    }) => {
      const commonStyle: React.CSSProperties = {
        position: "absolute",
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        width: `${pos.width}px`,
        height: `${pos.height}px`,
      };

      if (isCheckbox) {
        return (
          <div
            key={field.id}
            style={commonStyle}
            className="flex items-center justify-center bg-blue-50/90 hover:bg-blue-100/90 border-2 border-blue-500 rounded shadow-md cursor-pointer transition-colors"
            title={field.name}
          >
            <Checkbox
              checked={
                fieldValues[field.id] === "Yes" ||
                fieldValues[field.id] === "true"
              }
              onCheckedChange={(checked) =>
                handleFieldChange(field.id, checked ? "Yes" : "No")
              }
              className="w-5 h-5"
            />
          </div>
        );
      }

      return (
        <Input
          key={field.id}
          style={commonStyle}
          value={fieldValues[field.id] || ""}
          onChange={(e: any) => handleFieldChange(field.id, e.target.value)}
          className="text-sm border-2 border-blue-500 bg-blue-50/90 hover:bg-blue-100/90 focus:bg-white focus:border-blue-600 transition-colors cursor-text shadow-md"
          placeholder="Click to type..."
          title={field.name}
        />
      );
    },
  );

  FormFieldComponent.displayName = "FormFieldComponent";

  const renderFormField = useCallback(
    (field: FormField) => {
      if (field.page !== currentPage) return null;

      const pos = getFieldPosition(field);
      if (!pos) return null;

      return (
        <FormFieldComponent
          key={field.id}
          field={field}
          pos={pos}
          isCheckbox={field.type === "Btn"}
        />
      );
    },
    [currentPage, fieldValues, handleFieldChange, getFieldPosition],
  );

  const renderTextAnnotation = (annotation: TextAnnotation) => {
    if (annotation.pageNumber !== currentPage || !canvasRef.current?.firstChild)
      return null;

    const canvas = canvasRef.current.firstChild as HTMLCanvasElement;
    const displayX = annotation.x * scale;
    const displayY = canvas.height - annotation.y * scale;

    const handleTextMouseDown = (e: React.MouseEvent) => {
      // Only allow dragging in Select mode (not Add Text mode)
      if (isAddingText) return;

      e.preventDefault();
      e.stopPropagation();

      setDraggingTextId(annotation.id);

      const startX = e.clientX;
      const startY = e.clientY;
      const startPos = { x: annotation.x, y: annotation.y };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - startX) / scale;
        const dy = (moveEvent.clientY - startY) / scale;

        setTextAnnotations((prev) =>
          prev.map((ann) =>
            ann.id === annotation.id
              ? { ...ann, x: startPos.x + dx, y: startPos.y - dy }
              : ann,
          ),
        );
      };

      const handleMouseUp = () => {
        setDraggingTextId(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const isDraggable = !isAddingText;
    const isSelected = selectedAnnotationId === annotation.id;

    const cursorStyle = isDraggable
      ? draggingTextId === annotation.id
        ? "grabbing"
        : "grab"
      : "default";

    return (
      <div
        key={annotation.id}
        style={{
          position: "absolute",
          left: `${displayX}px`,
          top: `${displayY}px`,
          minWidth: "150px",
          zIndex: isSelected ? 30 : 20,
        }}
        onMouseDown={() => setSelectedAnnotationId(annotation.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          handleDeleteAnnotation(annotation.id);
        }}
      >
        {isSelected && (
          <div
            className="absolute -top-12 left-0 flex items-center gap-1 bg-white rounded-lg shadow-xl border border-slate-200 p-1 animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${annotation.isBold ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
              onClick={() =>
                updateAnnotationStyle(annotation.id, {
                  isBold: !annotation.isBold,
                })
              }
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${annotation.isItalic ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
              onClick={() =>
                updateAnnotationStyle(annotation.id, {
                  isItalic: !annotation.isItalic,
                })
              }
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-600 hover:bg-slate-100"
              onClick={() =>
                updateAnnotationStyle(annotation.id, {
                  fontSize: Math.max(8, (annotation.fontSize || 12) - 2),
                })
              }
              title="Decrease font size"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium w-8 text-center tabular-nums text-slate-700">
              {annotation.fontSize || 12}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-600 hover:bg-slate-100"
              onClick={() =>
                updateAnnotationStyle(annotation.id, {
                  fontSize: Math.min(72, (annotation.fontSize || 12) + 2),
                })
              }
              title="Increase font size"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:bg-red-50"
              onClick={() => handleDeleteAnnotation(annotation.id)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Input
          value={annotation.text}
          onChange={(e: any) => handleTextChange(annotation.id, e.target.value)}
          style={{
            fontSize: `${annotation.fontSize}px`,
            fontWeight: annotation.isBold ? "bold" : "normal",
            fontStyle: annotation.isItalic ? "italic" : "normal",
            border: isSelected ? "1px dashed #6366f1" : "1px solid transparent",
            background: isSelected ? "rgba(255, 255, 255, 0.9)" : "transparent",
            minWidth: "150px",
            width: `${Math.max(150, annotation.text.length * (annotation.fontSize || 12) * 0.6)}px`,
          }}
          className="rounded shadow-none focus:shadow-sm transition-all p-1 h-auto"
          placeholder="Type here..."
          autoFocus={isSelected}
          readOnly={isDraggable && !isSelected}
        />

        {/* Draggable overlay in Select mode */}
        {isDraggable && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: cursorStyle,
              zIndex: 1,
            }}
            onMouseDown={handleTextMouseDown}
            title="Click and drag to move, or double-click to edit"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsAddingText(false);
              // Focus the input
              const input = e.currentTarget.previousSibling as HTMLInputElement;
              if (input) {
                input.readOnly = false;
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
              }
            }}
          />
        )}
      </div>
    );
  };

  const renderImageAnnotation = (annotation: ImageAnnotation) => {
    if (annotation.pageNumber !== currentPage || !canvasRef.current?.firstChild)
      return null;

    const canvas = canvasRef.current.firstChild as HTMLCanvasElement;
    const displayX = annotation.x * scale;
    const displayY = canvas.height - (annotation.y + annotation.height) * scale;
    const displayWidth = annotation.width * scale;
    const displayHeight = annotation.height * scale;

    const handleMouseDown = (e: React.MouseEvent, type: "move" | "resize") => {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startPos = { x: annotation.x, y: annotation.y };
      const startSize = { width: annotation.width, height: annotation.height };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - startX) / scale;
        const dy = (moveEvent.clientY - startY) / scale;

        if (type === "move") {
          setImageAnnotations((prev: ImageAnnotation[]) =>
            prev.map((ann) =>
              ann.id === annotation.id
                ? { ...ann, x: startPos.x + dx, y: startPos.y - dy }
                : ann,
            ),
          );
        } else if (type === "resize") {
          setImageAnnotations((prev: ImageAnnotation[]) =>
            prev.map((ann) =>
              ann.id === annotation.id
                ? {
                    ...ann,
                    width: Math.max(20, startSize.width + dx),
                    height: Math.max(20, startSize.height + dy),
                    y: startPos.y - dy,
                  }
                : ann,
            ),
          );
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    return (
      <div
        key={annotation.id}
        style={{
          position: "absolute",
          left: `${displayX}px`,
          top: `${displayY}px`,
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          border: "2px solid #6366f1",
          cursor: "move",
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        <img
          src={annotation.imageData}
          style={{ width: "100%", height: "100%", pointerEvents: "none" }}
          alt="Signature/Overlay"
        />
        {/* Resize handle */}
        <div
          style={{
            position: "absolute",
            bottom: -6,
            right: -6,
            width: 12,
            height: 12,
            backgroundColor: "#6366f1",
            cursor: "nwse-resize",
            borderRadius: "50%",
            border: "2px solid white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
          onMouseDown={(e) => handleMouseDown(e, "resize")}
        />
        {/* Delete button */}
        <button
          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation();
            setImageAnnotations((prev: ImageAnnotation[]) =>
              prev.filter((ann) => ann.id !== annotation.id),
            );
          }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  if (!file) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-slate-100/50">
      {/* Toolbar */}
      <div className="h-14 border-b border-slate-200 bg-white shadow-sm flex items-center justify-between px-6 shrink-0 z-10 transition-all">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingText(false)}
              className={`h-8 px-3 gap-2 border-0 ${!isAddingText ? "bg-white shadow-sm text-slate-900 font-medium" : "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            >
              <MousePointer2 className="w-4 h-4" />
              <span className="text-xs">Select</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingText(true)}
              className={`h-8 px-3 gap-2 border-0 ${isAddingText ? "bg-white shadow-sm text-indigo-600 font-medium" : "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            >
              <Type className="w-4 h-4" />
              <span className="text-xs">Add Text</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImageSelect}
              className="h-8 px-3 gap-2 border-0 bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-xs">Add Image</span>
            </Button>
            <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <Button
            onClick={handleApplyChanges}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs font-medium px-4 shadow-sm active:scale-95 transition-all"
          >
            <Check className="w-3 h-3 mr-2" />
            Apply Fields
          </Button>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold text-slate-600 min-w-[3.5rem] text-center select-none tabular-nums">
            {currentPage} <span className="text-slate-400 font-normal">/</span>{" "}
            {numPages}
          </span>
          <Button
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <Button
              onClick={handleZoomOut}
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-white hover:shadow-sm transition-all"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-medium w-10 text-center select-none tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <Button
              onClick={handleZoomIn}
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-white hover:shadow-sm transition-all"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-auto flex justify-center items-start p-8 relative bg-slate-100/50">
        <div className="relative shadow-xl ring-1 ring-slate-900/5 transition-transform duration-200 ease-in-out group">
          <div
            ref={canvasRef}
            className="[&>canvas]:block [&>canvas]:bg-white"
          ></div>
          <div
            ref={overlayRef}
            data-testid="pdf-overlay"
            className={`absolute top-0 left-0 w-full h-full ${isAddingText ? "cursor-text" : ""}`}
            onDoubleClick={handleOverlayDoubleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => setSelectedAnnotationId(null)}
          >
            <div className="relative w-full h-full">
              {formFields.map((field) => renderFormField(field))}
              {textAnnotations.map((annotation) =>
                renderTextAnnotation(annotation),
              )}
              {imageAnnotations.map((annotation) =>
                renderImageAnnotation(annotation),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Status / Toast */}
      {isAddingText && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white pl-3 pr-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-3 text-sm animate-in fade-in slide-in-from-bottom-4 z-50">
          <div className="bg-indigo-500 p-1 rounded-full">
            <Type className="w-3 h-3 text-white" />
          </div>
          <span>Double-click anywhere to add text</span>
          <div className="h-4 w-px bg-white/20 ml-1"></div>
          <Button
            variant="link"
            size="sm"
            className="text-indigo-300 h-auto p-0 hover:text-white"
            onClick={() => setIsAddingText(false)}
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
