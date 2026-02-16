import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { pdfEditorService } from "@/services/pdfEditor";
import { useHistoryStore, type EditorState } from "@/stores/historyStore";
import PageThumbnails from "@/components/PageThumbnails";
import { DrawingToolbar, DrawingCanvas, type DrawingTool, type DrawingPath, type DrawingShape } from "@/components/DrawingTools";
import SearchBar, { SearchHighlightsOverlay, type SearchHighlight } from "@/components/SearchBar";
import SignaturePad from "@/components/SignaturePad";
import { RedactionCanvas, type Redaction } from "@/components/RedactionTools";
import WatermarkModal, { type WatermarkConfig } from "@/components/WatermarkModal";
import HeaderFooterModal, { type HeaderFooterConfig } from "@/components/HeaderFooterModal";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";
import ExportToImagesModal from "@/components/ExportToImagesModal";
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
  Undo2,
  Redo2,
  Palette,
  Search,
  PenTool,
  Droplets,
  FileText,
  MoreHorizontal,
  Keyboard,
  ImageDown,
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
  color: string;
  isBold?: boolean;
  isItalic?: boolean;
}

interface PdfJsAnnotation {
  subtype?: string;
  fieldType?: string;
  fieldName?: string;
  rect: number[];
  fieldValue?: string;
}

interface PdfJsPage {
  getAnnotations(): Promise<PdfJsAnnotation[]>;
  getViewport(params: { scale: number }): { height: number; width: number };
  render(params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { height: number; width: number };
  }): { promise: Promise<void> };
}

interface PdfJsDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfJsPage>;
}

// Preset colors for text
const TEXT_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#dc2626" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "Purple", value: "#9333ea" },
  { name: "Orange", value: "#ea580c" },
];

interface FormFieldComponentProps {
  field: FormField;
  pos: { left: number; top: number; width: number; height: number };
  isCheckbox: boolean;
  fieldValue: string;
  onFieldChange: (fieldId: string, value: string) => void;
}

const FormFieldComponent = memo(
  ({ field, pos, isCheckbox, fieldValue, onFieldChange }: FormFieldComponentProps) => {
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
          style={commonStyle}
          className="flex items-center justify-center bg-blue-50/90 hover:bg-blue-100/90 border-2 border-blue-500 rounded shadow-md cursor-pointer transition-colors"
          title={field.name}
        >
          <Checkbox
            checked={fieldValue === "Yes" || fieldValue === "true"}
            onCheckedChange={(checked) =>
              onFieldChange(field.id, checked ? "Yes" : "No")
            }
            className="w-5 h-5"
          />
        </div>
      );
    }

    return (
      <Input
        style={commonStyle}
        value={fieldValue || ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange(field.id, e.target.value)}
        className="text-sm border-2 border-blue-500 bg-blue-50/90 hover:bg-blue-100/90 focus:bg-white focus:border-blue-600 transition-colors cursor-text shadow-md"
        placeholder="Click to type..."
        title={field.name}
      />
    );
  }
);

FormFieldComponent.displayName = "FormFieldComponent";

const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

  const canvasRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDocument, setPdfDocument] = useState<PdfJsDocument | null>(null);
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
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [currentTextColor] = useState<string>("#000000");
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentDrawingTool, setCurrentDrawingTool] = useState<DrawingTool>(null);
  const [drawingColor, setDrawingColor] = useState("#000000");
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(3);
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [drawingShapes, setDrawingShapes] = useState<DrawingShape[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchHighlights, setSearchHighlights] = useState<SearchHighlight[]>([]);

  // Signature state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Redaction state
  const [isRedactionMode, setIsRedactionMode] = useState(false);
  const [redactions, setRedactions] = useState<Redaction[]>([]);

  // Watermark state
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);

  // Header/Footer state
  const [isHeaderFooterModalOpen, setIsHeaderFooterModalOpen] = useState(false);

  // Keyboard shortcuts state
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);

  // Export to Images state
  const [isExportImagesOpen, setIsExportImagesOpen] = useState(false);

  // Tools menu state (for mobile)
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  // History store for undo/redo
  const { pushState, undo, redo, canUndo, canRedo } = useHistoryStore();

  // Defaults for new text
  const defaultFontSize = 12;

  // Save current state to history
  const saveToHistory = useCallback((action: string) => {
    const state: EditorState = {
      textAnnotations: textAnnotations.map(a => ({ ...a, color: a.color || "#000000" })),
      imageAnnotations: [...imageAnnotations],
      fieldValues: { ...fieldValues },
    };
    pushState(state, action);
  }, [textAnnotations, imageAnnotations, fieldValues, pushState]);

  // Restore state from history
  const restoreState = useCallback((state: EditorState | null) => {
    if (!state) return;
    setTextAnnotations(state.textAnnotations as TextAnnotation[]);
    setImageAnnotations(state.imageAnnotations);
    setFieldValues(state.fieldValues);
  }, []);

  // Handle undo
  const handleUndo = useCallback(() => {
    const previousState = undo();
    restoreState(previousState);
  }, [undo, restoreState]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const nextState = redo();
    restoreState(nextState);
  }, [redo, restoreState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Escape: Deselect and close menus
      if (e.key === "Escape") {
        setSelectedAnnotationId(null);
        setIsAddingText(false);
        setShowColorPicker(null);
        setIsToolsMenuOpen(false);
      }
      // ? key: Show keyboard shortcuts
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsKeyboardShortcutsOpen(true);
      }
      // Ctrl+F: Open search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Navigation: Arrow keys for pages
      if (e.key === "ArrowLeft" && !e.ctrlKey && !e.metaKey && document.activeElement === document.body) {
        e.preventDefault();
        setCurrentPage((p) => Math.max(1, p - 1));
      }
      if (e.key === "ArrowRight" && !e.ctrlKey && !e.metaKey && document.activeElement === document.body) {
        e.preventDefault();
        setCurrentPage((p) => Math.min(numPages, p + 1));
      }
      // Zoom: Ctrl+/- 
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setScale((s) => Math.min(3, s + 0.25));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setScale((s) => Math.max(0.5, s - 0.25));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, numPages]);

  // Click-outside handler to close More Tools dropdown
  useEffect(() => {
    if (!isToolsMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is outside the dropdown and button
      if (!target.closest('[data-tools-menu]')) {
        setIsToolsMenuOpen(false);
      }
    };

    // Add listener with a small delay to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isToolsMenuOpen]);

  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      const attemptLoad = async (password?: string): Promise<PdfJsDocument> => {
        const arrayBuffer = await file.arrayBuffer();

        // Get the password from the service if it was already provided
        const servicePassword = pdfEditorService.getPassword();
        const finalPassword = password || servicePassword;

        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          password: finalPassword,
        });

        // Handle password requests from PDF.js
        loadingTask.onPassword = (
          updatePassword: (password: string) => void,
          reason: number,
        ) => {
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
        saveToHistory("Add image");
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

  const extractFormFields = async (pdf: PdfJsDocument) => {
    const fields: FormField[] = [];
    console.log("🔍 Extracting form fields from PDF...");

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const annotations = await page.getAnnotations();

      console.log(`Page ${pageNum}: Found ${annotations.length} annotations`);

      annotations.forEach((annotation: PdfJsAnnotation, index: number) => {
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

        // Update canvas size for drawing overlay
        setCanvasSize({ width: viewport.width, height: viewport.height });
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

  // Drawing handlers
  const handleAddDrawingPath = useCallback((path: DrawingPath) => {
    saveToHistory("Draw path");
    setDrawingPaths((prev) => [...prev, path]);
  }, [saveToHistory]);

  const handleAddDrawingShape = useCallback((shape: DrawingShape) => {
    saveToHistory("Draw shape");
    setDrawingShapes((prev) => [...prev, shape]);
  }, [saveToHistory]);

  const handleEraseDrawing = useCallback((x: number, y: number) => {
    const eraseRadius = 20;
    
    // Remove paths that pass near the erase point
    setDrawingPaths((prev) => prev.filter((path) => {
      if (path.pageNumber !== currentPage) return true;
      return !path.points.some((p) => {
        const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
        return dist < eraseRadius;
      });
    }));

    // Remove shapes that are near the erase point
    setDrawingShapes((prev) => prev.filter((shape) => {
      if (shape.pageNumber !== currentPage) return true;
      const centerX = (shape.startX + shape.endX) / 2;
      const centerY = (shape.startY + shape.endY) / 2;
      const dist = Math.sqrt(Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2));
      return dist >= eraseRadius;
    }));
  }, [currentPage]);

  const handleClearDrawings = useCallback(() => {
    if (!confirm("Clear all drawings on this page?")) return;
    saveToHistory("Clear drawings");
    setDrawingPaths((prev) => prev.filter((p) => p.pageNumber !== currentPage));
    setDrawingShapes((prev) => prev.filter((s) => s.pageNumber !== currentPage));
  }, [currentPage, saveToHistory]);

  const toggleDrawingMode = useCallback(() => {
    setIsDrawingMode((prev) => {
      if (!prev) {
        setIsAddingText(false);
        setIsRedactionMode(false);
        setCurrentDrawingTool("pen");
      } else {
        setCurrentDrawingTool(null);
      }
      return !prev;
    });
  }, []);

  // Toggle redaction mode
  const toggleRedactionMode = useCallback(() => {
    setIsRedactionMode((prev) => {
      if (!prev) {
        setIsAddingText(false);
        setIsDrawingMode(false);
        setCurrentDrawingTool(null);
      }
      return !prev;
    });
  }, []);

  // Redaction handlers
  const handleAddRedaction = useCallback((redaction: Redaction) => {
    saveToHistory("Add redaction");
    setRedactions((prev) => [...prev, redaction]);
  }, [saveToHistory]);

  const handleRemoveRedaction = useCallback((id: string) => {
    saveToHistory("Remove redaction");
    setRedactions((prev) => prev.filter((r) => r.id !== id));
  }, [saveToHistory]);

  const handleClearRedactions = useCallback(() => {
    if (!confirm("Clear all redactions on this page?")) return;
    saveToHistory("Clear redactions");
    setRedactions((prev) => prev.filter((r) => r.pageNumber !== currentPage));
  }, [currentPage, saveToHistory]);

  // Signature handler
  const handleApplySignature = useCallback((signatureData: string) => {
    saveToHistory("Add signature");
    const newAnnotation: ImageAnnotation = {
      id: `signature_${Date.now()}`,
      imageData: signatureData,
      x: 50,
      y: 100, // Place near bottom of page
      width: 150,
      height: 50,
      pageNumber: currentPage,
    };
    setImageAnnotations((prev) => [...prev, newAnnotation]);
  }, [currentPage, saveToHistory]);

  // Watermark handler
  const handleApplyWatermark = useCallback(async (config: WatermarkConfig) => {
    try {
      await pdfEditorService.addWatermark(config);
      alert("Watermark applied to all pages!");
    } catch (error) {
      console.error("Error applying watermark:", error);
      alert("Failed to apply watermark");
    }
  }, []);

  // Header/Footer handler
  const handleApplyHeaderFooter = useCallback(async (config: HeaderFooterConfig) => {
    try {
      await pdfEditorService.addHeaderFooter(config);
      alert("Header/Footer applied to all pages!");
    } catch (error) {
      console.error("Error applying header/footer:", error);
      alert("Failed to apply header/footer");
    }
  }, []);

  // Export to images handler
  const handleExportImages = useCallback(async (
    pages: number[],
    format: "png" | "jpeg",
    quality: number,
    exportScale: number
  ) => {
    if (!pdfDocument) return;

    for (let i = 0; i < pages.length; i++) {
      const pageNum = pages[i];
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: exportScale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      // Convert to blob and download
      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `page-${pageNum}.${format}`;
          link.click();
          URL.revokeObjectURL(url);
        },
        mimeType,
        quality
      );

      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, [pdfDocument]);

  const handleApplyChanges = async () => {
    try {
      console.log("Applying changes...");
      console.log("Form fields:", fieldValues);
      console.log("Text annotations:", textAnnotations);
      console.log("Drawing paths:", drawingPaths.length);
      console.log("Drawing shapes:", drawingShapes.length);

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

      // Add drawing paths
      for (const path of drawingPaths) {
        if (path.tool === "pen" || path.tool === "highlighter") {
          await pdfEditorService.addDrawingPath({
            id: path.id,
            tool: path.tool,
            points: path.points,
            color: path.color,
            strokeWidth: path.strokeWidth,
            opacity: path.opacity,
            pageNumber: path.pageNumber,
          });
        }
      }

      // Add drawing shapes
      for (const shape of drawingShapes) {
        await pdfEditorService.addDrawingShape(shape);
      }

      // Apply redactions (solid black rectangles over sensitive content)
      if (redactions.length > 0) {
        await pdfEditorService.applyRedactions(redactions);
        console.log("Applied redactions:", redactions.length);
      }

      const totalItems = validAnnotations.length + imageAnnotations.length + drawingPaths.length + drawingShapes.length + redactions.length;
      alert(
        `Changes applied! ${totalItems} item(s) added. Click Save to download.`,
      );
    } catch (error: unknown) {
      console.error("Error applying changes:", error);
      alert(`Failed to apply changes: ${getErrorMessage(error)}`);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAddingText) {
       if (!canvasRef.current?.firstChild) return;

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
        color: currentTextColor,
        isBold: false,
        isItalic: false,
      };

      saveToHistory("Add text");
      setTextAnnotations((prev) => [...prev, newAnnotation]);
      setSelectedAnnotationId(newAnnotation.id);
      setIsAddingText(false); // Switch to edit mode immediately
    } else {
      setSelectedAnnotationId(null);
    }
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
        saveToHistory("Add image");
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
    saveToHistory("Delete text");
    setTextAnnotations((prev) => prev.filter((ann) => ann.id !== id));
  }, [saveToHistory]);

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
          fieldValue={fieldValues[field.id] || ""}
          onFieldChange={handleFieldChange}
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
            className="absolute -top-12 left-0 flex items-center gap-1 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-1 animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${annotation.isBold ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              onClick={(e) => {
                e.stopPropagation();
                updateAnnotationStyle(annotation.id, {
                  isBold: !annotation.isBold,
                });
              }}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${annotation.isItalic ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              onClick={(e) => {
                e.stopPropagation();
                updateAnnotationStyle(annotation.id, {
                  isItalic: !annotation.isItalic,
                });
              }}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            {/* Color Picker */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(showColorPicker === annotation.id ? null : annotation.id);
                }}
                title="Text Color"
              >
                <div className="relative">
                  <Palette className="w-4 h-4" />
                  <div
                    className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-full"
                    style={{ backgroundColor: annotation.color || "#000000" }}
                  />
                </div>
              </Button>
              {showColorPicker === annotation.id && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-lg shadow-xl z-50 flex gap-1">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                        (annotation.color || "#000000") === color.value ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={(e) => {
                        e.stopPropagation();
                        saveToHistory("Change color");
                        updateAnnotationStyle(annotation.id, { color: color.value });
                        setShowColorPicker(null);
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                saveToHistory("Change font size");
                updateAnnotationStyle(annotation.id, {
                  fontSize: Math.max(8, (annotation.fontSize || 12) - 2),
                });
              }}
              title="Decrease font size"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium w-8 text-center tabular-nums text-foreground">
              {annotation.fontSize || 12}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                saveToHistory("Change font size");
                updateAnnotationStyle(annotation.id, {
                  fontSize: Math.min(72, (annotation.fontSize || 12) + 2),
                });
              }}
              title="Increase font size"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteAnnotation(annotation.id);
              }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Input
          value={annotation.text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleTextChange(annotation.id, e.target.value)
          }
          style={{
            fontSize: `${annotation.fontSize}px`,
            fontWeight: annotation.isBold ? "bold" : "normal",
            fontStyle: annotation.isItalic ? "italic" : "normal",
            color: annotation.color || "#000000",
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
    <div className="flex flex-col h-full bg-muted/50">
      {/* Toolbar - Two rows on mobile, single row on desktop */}
      <div className="border-b border-border bg-card shadow-sm shrink-0 z-10">
        {/* Top Row - Primary Actions */}
        <div className="flex items-center justify-between px-2 md:px-4 py-2 gap-2">
          {/* Left: Core Edit Tools */}
          <div className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar">
            {/* Select/Text/Image Toggle */}
            <div className="flex items-center bg-muted p-0.5 rounded-lg shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingText(false)}
                className={`h-7 px-2 gap-1 border-0 ${!isAddingText ? "bg-card shadow-sm text-card-foreground font-medium" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
                title="Select Mode"
              >
                <MousePointer2 className="w-3.5 h-3.5" />
                <span className="text-xs hidden sm:inline">Select</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingText(true)}
                className={`h-7 px-2 gap-1 border-0 ${isAddingText ? "bg-card shadow-sm text-primary font-medium" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
                title="Add Text"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="text-xs hidden sm:inline">Text</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImageSelect}
                className="h-7 px-2 gap-1 border-0 bg-transparent text-muted-foreground hover:text-foreground"
                title="Add Image"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="text-xs hidden sm:inline">Image</span>
              </Button>
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {/* Drawing Tools - Compact */}
            <DrawingToolbar
              currentTool={currentDrawingTool}
              onToolChange={setCurrentDrawingTool}
              currentColor={drawingColor}
              onColorChange={setDrawingColor}
              strokeWidth={drawingStrokeWidth}
              onStrokeWidthChange={setDrawingStrokeWidth}
              onClear={handleClearDrawings}
              isActive={isDrawingMode}
              onToggle={toggleDrawingMode}
            />
          </div>

          {/* More Tools Dropdown */}
          <div className="relative shrink-0" data-tools-menu>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                className="h-7 px-2 gap-1 border-0 bg-transparent text-muted-foreground hover:text-foreground"
                title="More Tools"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                <span className="text-xs hidden md:inline">More</span>
              </Button>
              {isToolsMenuOpen && (
                <div className="absolute top-full right-0 md:left-0 md:right-auto mt-1 z-50 bg-card border border-border rounded-lg shadow-xl p-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-100">
                  {/* Annotate group */}
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Annotate</div>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-muted transition-colors"
                    onClick={() => {
                      setIsSignatureModalOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                  >
                    <PenTool className="w-4 h-4" />
                    Add Signature
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-muted transition-colors"
                    onClick={() => {
                      toggleRedactionMode();
                      setIsToolsMenuOpen(false);
                    }}
                  >
                    <div className="w-4 h-4 bg-current rounded-sm opacity-80" />
                    {isRedactionMode ? "Exit Redaction" : "Redaction Tool"}
                    {redactions.filter(r => r.pageNumber === currentPage).length > 0 && (
                      <span className="ml-auto text-xs bg-destructive/10 text-destructive px-1.5 rounded-full">
                        {redactions.filter(r => r.pageNumber === currentPage).length}
                      </span>
                    )}
                  </button>

                  {/* Page & Document group */}
                  <div className="h-px bg-border my-1" />
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Document</div>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-muted transition-colors"
                    onClick={() => {
                      setIsSearchOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                  >
                    <Search className="w-4 h-4" />
                    Search
                    <span className="ml-auto text-[10px] text-muted-foreground/50">Ctrl+F</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-muted transition-colors"
                    onClick={() => {
                      setIsWatermarkModalOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                  >
                    <Droplets className="w-4 h-4" />
                    Add Watermark
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-muted transition-colors"
                    onClick={() => {
                      setIsHeaderFooterModalOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Header / Footer
                  </button>

                  {/* Export group */}
                  <div className="h-px bg-border my-1" />
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Export</div>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-muted transition-colors"
                    onClick={() => {
                      setIsExportImagesOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                  >
                    <ImageDown className="w-4 h-4" />
                    Export to Images
                  </button>

                  {/* Utilities group */}
                  <div className="h-px bg-border my-1" />
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-muted transition-colors"
                    onClick={() => {
                      setIsKeyboardShortcutsOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                  >
                    <Keyboard className="w-4 h-4" />
                    Keyboard Shortcuts
                    <span className="ml-auto text-[10px] text-muted-foreground/50">?</span>
                  </button>

                  {/* Conditional: Clear Redactions */}
                  {redactions.filter(r => r.pageNumber === currentPage).length > 0 && (
                    <>
                      <div className="h-px bg-border my-1" />
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-muted text-destructive transition-colors"
                        onClick={() => {
                          handleClearRedactions();
                          setIsToolsMenuOpen(false);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear Redactions
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

          {/* Center: Undo/Redo */}
          <div className="hidden md:flex items-center bg-muted p-0.5 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo()}
              className="h-7 px-2 gap-1 border-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo()}
              className="h-7 px-2 gap-1 border-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Right: Apply Button - Always Visible */}
          <Button
            onClick={handleApplyChanges}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs font-medium px-3 shadow-sm active:scale-95 transition-all shrink-0"
            title="Apply Fields"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            <span>Apply</span>
          </Button>
        </div>

        {/* Bottom Row - Navigation & Zoom */}
        <div className="flex items-center justify-between px-2 md:px-4 py-1.5 border-t border-border/50 bg-muted/30">
          {/* Mobile Undo/Redo */}
          <div className="flex md:hidden items-center bg-muted p-0.5 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo()}
              className="h-7 px-2 border-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo()}
              className="h-7 px-2 border-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center bg-card border border-border rounded-lg p-0.5 shadow-sm">
            <Button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground min-w-12 text-center select-none tabular-nums">
              {currentPage} <span className="opacity-50">/</span> {numPages}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <Button
              onClick={handleZoomOut}
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-card transition-all"
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium w-10 text-center select-none tabular-nums text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button
              onClick={handleZoomIn}
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-card transition-all"
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area with Thumbnails Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Page Thumbnails Sidebar */}
        <PageThumbnails
          file={file}
          currentPage={currentPage}
          onPageSelect={setCurrentPage}
          onPagesChanged={() => {
            // Trigger re-render of the current page
            setNumPages(pdfEditorService.getPageCount());
          }}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 overflow-auto flex justify-center items-start p-2 md:p-8 relative bg-muted/50">

        {/* Search Bar */}
        <SearchBar
          pdfDocument={pdfDocument}
          currentPage={currentPage}
          scale={scale}
          onNavigateToPage={setCurrentPage}
          onHighlightsChange={setSearchHighlights}
          isOpen={isSearchOpen}
          onOpenChange={setIsSearchOpen}
        />

        <div className="relative shadow-xl ring-1 ring-black/5 transition-transform duration-200 ease-in-out group">
          <div
            ref={canvasRef}
            className="[&>canvas]:block [&>canvas]:bg-white"
          ></div>
          <div
            ref={overlayRef}
            data-testid="pdf-overlay"
            className={`absolute top-0 left-0 w-full h-full ${isAddingText ? "cursor-text" : ""} ${isDrawingMode || isRedactionMode ? "pointer-events-none" : ""}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleCanvasClick}
          >
            <div className="relative w-full h-full">
              {/* Search Highlights */}
              <SearchHighlightsOverlay
                highlights={searchHighlights}
                currentPage={currentPage}
                scale={scale}
              />
              {formFields.map((field) => renderFormField(field))}
              {textAnnotations.map((annotation) =>
                renderTextAnnotation(annotation),
              )}
              {imageAnnotations.map((annotation) =>
                renderImageAnnotation(annotation),
              )}
            </div>
          </div>
          {/* Drawing Canvas Overlay */}
          {isDrawingMode && canvasSize.width > 0 && (
            <DrawingCanvas
              width={canvasSize.width}
              height={canvasSize.height}
              currentTool={currentDrawingTool}
              currentColor={drawingColor}
              strokeWidth={drawingStrokeWidth}
              paths={drawingPaths}
              shapes={drawingShapes}
              onAddPath={handleAddDrawingPath}
              onAddShape={handleAddDrawingShape}
              onErase={handleEraseDrawing}
              pageNumber={currentPage}
              scale={scale}
            />
          )}
          {/* Redaction Canvas Overlay */}
          <RedactionCanvas
            width={canvasSize.width}
            height={canvasSize.height}
            redactions={redactions}
            onAddRedaction={handleAddRedaction}
            onRemoveRedaction={handleRemoveRedaction}
            pageNumber={currentPage}
            scale={scale}
            isActive={isRedactionMode}
          />
        </div>
        </div>
      </div>

      {/* Floating Status / Toast */}
      {isAddingText && (
        <div className="absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white pl-3 pr-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-3 text-sm animate-in fade-in slide-in-from-bottom-4 z-50 whitespace-nowrap">
          <div className="bg-indigo-500 p-1 rounded-full">
            <Type className="w-3 h-3 text-white" />
          </div>
          <span className="hidden md:inline">Double-click anywhere to add text</span>
          <span className="md:hidden">Tap to add text</span>
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

      {/* Modals */}
      <SignaturePad
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onApply={handleApplySignature}
      />

      <WatermarkModal
        isOpen={isWatermarkModalOpen}
        onClose={() => setIsWatermarkModalOpen(false)}
        onApply={handleApplyWatermark}
      />

      <HeaderFooterModal
        isOpen={isHeaderFooterModalOpen}
        onClose={() => setIsHeaderFooterModalOpen(false)}
        onApply={handleApplyHeaderFooter}
        totalPages={numPages}
      />

      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />

      <ExportToImagesModal
        isOpen={isExportImagesOpen}
        onClose={() => setIsExportImagesOpen(false)}
        pdfDocument={pdfDocument}
        totalPages={numPages}
        onExport={handleExportImages}
      />
    </div>
  );
};

export default PDFViewer;
