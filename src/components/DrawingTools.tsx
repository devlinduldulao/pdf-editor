import React, { useRef, useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Pen,
  Highlighter,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Eraser,
  Trash2,
} from "lucide-react";

export type DrawingTool = "pen" | "highlighter" | "rectangle" | "circle" | "arrow" | "line" | "eraser" | null;

export interface DrawingPath {
  id: string;
  tool: DrawingTool;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  opacity: number;
  pageNumber: number;
}

export interface DrawingShape {
  id: string;
  tool: "rectangle" | "circle" | "arrow" | "line";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  pageNumber: number;
}

interface DrawingToolbarProps {
  currentTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onClear: () => void;
  isActive: boolean;
  onToggle: () => void;
}

const DRAWING_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#dc2626" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#ea580c" },
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = memo(({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onClear,
  isActive,
  onToggle,
}) => {
  const tools: { tool: DrawingTool; icon: React.ReactNode; label: string }[] = [
    { tool: "pen", icon: <Pen className="w-4 h-4" />, label: "Pen" },
    { tool: "highlighter", icon: <Highlighter className="w-4 h-4" />, label: "Highlighter" },
    { tool: "rectangle", icon: <Square className="w-4 h-4" />, label: "Rectangle" },
    { tool: "circle", icon: <Circle className="w-4 h-4" />, label: "Circle" },
    { tool: "arrow", icon: <ArrowRight className="w-4 h-4" />, label: "Arrow" },
    { tool: "line", icon: <Minus className="w-4 h-4" />, label: "Line" },
    { tool: "eraser", icon: <Eraser className="w-4 h-4" />, label: "Eraser" },
  ];

  if (!isActive) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-8 px-2 md:px-3 gap-2 border-0 bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
        title="Drawing Tools"
      >
        <Pen className="w-4 h-4" />
        <span className="text-xs hidden md:inline">Draw</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
      {/* Tool buttons */}
      {tools.map(({ tool, icon, label }) => (
        <Button
          key={tool}
          variant="ghost"
          size="icon"
          onClick={() => onToolChange(tool)}
          className={`h-8 w-8 ${
            currentTool === tool
              ? "bg-card shadow-sm text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          title={label}
        >
          {icon}
        </Button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      {/* Color picker */}
      <div className="flex gap-0.5">
        {DRAWING_COLORS.map((color) => (
          <button
            key={color.value}
            className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform ${
              currentColor === color.value ? "border-primary ring-2 ring-primary/30" : "border-transparent"
            }`}
            style={{ backgroundColor: color.value }}
            onClick={() => onColorChange(color.value)}
            title={color.name}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Stroke width */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Size:</span>
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          className="w-16 h-1 accent-primary"
        />
        <span className="text-xs text-muted-foreground w-4">{strokeWidth}</span>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Clear button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        className="h-8 w-8 text-destructive hover:bg-destructive/10"
        title="Clear all drawings"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* Close drawing mode */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-8 px-2 text-muted-foreground hover:text-foreground"
      >
        Done
      </Button>
    </div>
  );
});

DrawingToolbar.displayName = "DrawingToolbar";

interface DrawingCanvasProps {
  width: number;
  height: number;
  currentTool: DrawingTool;
  currentColor: string;
  strokeWidth: number;
  paths: DrawingPath[];
  shapes: DrawingShape[];
  onAddPath: (path: DrawingPath) => void;
  onAddShape: (shape: DrawingShape) => void;
  onErase: (x: number, y: number) => void;
  pageNumber: number;
  scale: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = memo(({
  width,
  height,
  currentTool,
  currentColor,
  strokeWidth,
  paths,
  shapes,
  onAddPath,
  onAddShape,
  onErase,
  pageNumber,
  scale,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentEndPoint, setCurrentEndPoint] = useState<{ x: number; y: number } | null>(null);

  // Render existing paths and shapes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw existing paths for current page
    paths
      .filter((path) => path.pageNumber === pageNumber)
      .forEach((path) => {
        if (path.points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.strokeWidth * scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = path.opacity;

        ctx.moveTo(path.points[0].x * scale, path.points[0].y * scale);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x * scale, path.points[i].y * scale);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

    // Draw existing shapes for current page
    shapes
      .filter((shape) => shape.pageNumber === pageNumber)
      .forEach((shape) => {
        ctx.beginPath();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.strokeWidth * scale;
        ctx.lineCap = "round";

        const startX = shape.startX * scale;
        const startY = shape.startY * scale;
        const endX = shape.endX * scale;
        const endY = shape.endY * scale;

        switch (shape.tool) {
          case "rectangle":
            ctx.strokeRect(startX, startY, endX - startX, endY - startY);
            break;
          case "circle":
            const radiusX = Math.abs(endX - startX) / 2;
            const radiusY = Math.abs(endY - startY) / 2;
            const centerX = startX + (endX - startX) / 2;
            const centerY = startY + (endY - startY) / 2;
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.stroke();
            break;
          case "line":
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            break;
          case "arrow":
            // Draw line
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Draw arrowhead
            const angle = Math.atan2(endY - startY, endX - startX);
            const arrowSize = 15 * scale;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - arrowSize * Math.cos(angle - Math.PI / 6),
              endY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - arrowSize * Math.cos(angle + Math.PI / 6),
              endY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
            break;
        }
      });

    // Draw current path being drawn
    if (currentPoints.length > 1 && (currentTool === "pen" || currentTool === "highlighter")) {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth * scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = currentTool === "highlighter" ? 0.4 : 1;

      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw current shape being drawn
    if (startPoint && currentEndPoint && ["rectangle", "circle", "line", "arrow"].includes(currentTool || "")) {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth * scale;
      ctx.lineCap = "round";

      switch (currentTool) {
        case "rectangle":
          ctx.strokeRect(
            startPoint.x,
            startPoint.y,
            currentEndPoint.x - startPoint.x,
            currentEndPoint.y - startPoint.y
          );
          break;
        case "circle":
          const radiusX = Math.abs(currentEndPoint.x - startPoint.x) / 2;
          const radiusY = Math.abs(currentEndPoint.y - startPoint.y) / 2;
          const centerX = startPoint.x + (currentEndPoint.x - startPoint.x) / 2;
          const centerY = startPoint.y + (currentEndPoint.y - startPoint.y) / 2;
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case "line":
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(currentEndPoint.x, currentEndPoint.y);
          ctx.stroke();
          break;
        case "arrow":
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(currentEndPoint.x, currentEndPoint.y);
          ctx.stroke();

          const angle = Math.atan2(
            currentEndPoint.y - startPoint.y,
            currentEndPoint.x - startPoint.x
          );
          const arrowSize = 15 * scale;
          ctx.beginPath();
          ctx.moveTo(currentEndPoint.x, currentEndPoint.y);
          ctx.lineTo(
            currentEndPoint.x - arrowSize * Math.cos(angle - Math.PI / 6),
            currentEndPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(currentEndPoint.x, currentEndPoint.y);
          ctx.lineTo(
            currentEndPoint.x - arrowSize * Math.cos(angle + Math.PI / 6),
            currentEndPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
          break;
      }
    }
  }, [paths, shapes, currentPoints, startPoint, currentEndPoint, currentTool, currentColor, strokeWidth, pageNumber, scale, width, height]);

  const getPointerPosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentTool) return;

    const pos = getPointerPosition(e);
    setIsDrawing(true);

    if (currentTool === "pen" || currentTool === "highlighter") {
      setCurrentPoints([pos]);
    } else if (currentTool === "eraser") {
      onErase(pos.x / scale, pos.y / scale);
    } else {
      setStartPoint(pos);
      setCurrentEndPoint(pos);
    }
  }, [currentTool, getPointerPosition, onErase, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentTool) return;

    const pos = getPointerPosition(e);

    if (currentTool === "pen" || currentTool === "highlighter") {
      setCurrentPoints((prev) => [...prev, pos]);
    } else if (currentTool === "eraser") {
      onErase(pos.x / scale, pos.y / scale);
    } else {
      setCurrentEndPoint(pos);
    }
  }, [isDrawing, currentTool, getPointerPosition, onErase, scale]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentTool) return;

    setIsDrawing(false);

    if ((currentTool === "pen" || currentTool === "highlighter") && currentPoints.length > 1) {
      const newPath: DrawingPath = {
        id: `path_${Date.now()}`,
        tool: currentTool,
        points: currentPoints.map((p) => ({ x: p.x / scale, y: p.y / scale })),
        color: currentColor,
        strokeWidth: strokeWidth,
        opacity: currentTool === "highlighter" ? 0.4 : 1,
        pageNumber,
      };
      onAddPath(newPath);
    } else if (startPoint && currentEndPoint && ["rectangle", "circle", "line", "arrow"].includes(currentTool)) {
      const newShape: DrawingShape = {
        id: `shape_${Date.now()}`,
        tool: currentTool as "rectangle" | "circle" | "arrow" | "line",
        startX: startPoint.x / scale,
        startY: startPoint.y / scale,
        endX: currentEndPoint.x / scale,
        endY: currentEndPoint.y / scale,
        color: currentColor,
        strokeWidth: strokeWidth,
        pageNumber,
      };
      onAddShape(newShape);
    }

    setCurrentPoints([]);
    setStartPoint(null);
    setCurrentEndPoint(null);
  }, [isDrawing, currentTool, currentPoints, startPoint, currentEndPoint, currentColor, strokeWidth, pageNumber, scale, onAddPath, onAddShape]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      handleMouseUp();
    }
  }, [isDrawing, handleMouseUp]);

  if (!currentTool) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 z-20"
      style={{ cursor: currentTool === "eraser" ? "crosshair" : "crosshair" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
});

DrawingCanvas.displayName = "DrawingCanvas";
