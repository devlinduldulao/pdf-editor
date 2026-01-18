import React, { useState } from 'react';
import '../styles/PDFEditor.css';

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

const PDFEditor: React.FC<PDFEditorProps> = ({ onAnnotationAdd }) => {
    const [isAddingText, setIsAddingText] = useState(false);
    const [fontSize, setFontSize] = useState(12);
    const [textInput, setTextInput] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isAddingText) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setPosition({ x, y });
        setShowTextInput(true);
    };

    const handleAddText = () => {
        if (textInput.trim()) {
            onAnnotationAdd({
                id: Date.now().toString(),
                text: textInput,
                x: position.x,
                y: position.y,
                fontSize,
            });
            setTextInput('');
            setShowTextInput(false);
            setIsAddingText(false);
        }
    };

    return (
        <div className="pdf-editor-tools">
            <div className="toolbar">
                <button
                    className={`tool-btn ${isAddingText ? 'active' : ''}`}
                    onClick={() => setIsAddingText(!isAddingText)}
                    title="Add Text"
                >
                    📝 Add Text
                </button>
                <div className="font-size-control">
                    <label>Font Size:</label>
                    <input
                        type="number"
                        min="8"
                        max="72"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                    />
                </div>
            </div>

            {showTextInput && (
                <div className="text-input-dialog" style={{ top: position.y, left: position.x }}>
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Enter text..."
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
                    />
                    <div className="dialog-buttons">
                        <button onClick={handleAddText}>Add</button>
                        <button onClick={() => {
                            setShowTextInput(false);
                            setIsAddingText(false);
                        }}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PDFEditor;
