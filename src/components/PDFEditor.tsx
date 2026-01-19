import React, { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
}

interface PDFEditorProps {
  onAnnotationAdd: (annotation: TextAnnotation) => void;
}

const PDFEditor: React.FC<PDFEditorProps> = memo(({ onAnnotationAdd }) => {
  const [isAddingText, setIsAddingText] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAddingText) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setPosition({ x, y });
      setShowTextInput(true);
    },
    [isAddingText],
  );

  const handleAddText = useCallback(() => {
    if (textInput.trim()) {
      onAnnotationAdd({
        id: Date.now().toString(),
        text: textInput,
        x: position.x,
        y: position.y,
        fontSize,
      });
      setTextInput("");
      setShowTextInput(false);
      setIsAddingText(false);
    }
  }, [textInput, position, fontSize, onAnnotationAdd]);

  return (
    <div className="relative" onClick={handleCanvasClick}>
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
        <Button
          variant={isAddingText ? "default" : "outline"}
          size="sm"
          onClick={() => setIsAddingText(!isAddingText)}
          title="Add Text"
          className={isAddingText ? "bg-purple-600 hover:bg-purple-700" : ""}
        >
          📝 Add Text
        </Button>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-slate-800">
            Font Size:
          </Label>
          <Input
            type="number"
            min="8"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-16 h-8"
          />
        </div>
      </div>

      {showTextInput && (
        <div
          className="absolute bg-white border-2 border-purple-600 rounded-lg p-3 shadow-xl z-50 min-w-62.5"
          style={{ top: position.y, left: position.x }}
        >
          <Input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text..."
            autoFocus
            onKeyUp={(e) => e.key === "Enter" && handleAddText()}
            className="mb-2"
          />
          <div className="flex gap-2 justify-end">
            <Button
              onClick={handleAddText}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              Add
            </Button>
            <Button
              onClick={() => {
                setShowTextInput(false);
                setIsAddingText(false);
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

PDFEditor.displayName = "PDFEditor";

export default PDFEditor;
