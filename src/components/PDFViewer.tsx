import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { pdfEditorService } from '@/services/pdfEditor';
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Type,
    MousePointer2,
    Check,
    AlertCircle
} from 'lucide-react';

// Set worker path - using local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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
    const [isAddingText, setIsAddingText] = useState<boolean>(false);
    const [fontSize, setFontSize] = useState<number>(12);

    useEffect(() => {
        if (!file) return;

        const loadPDF = async () => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                setPdfDocument(pdf);
                setNumPages(pdf.numPages);
                setCurrentPage(1);

                // Extract form fields
                await extractFormFields(pdf);
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Failed to load PDF');
            }
        };

        loadPDF();
    }, [file]);

    const extractFormFields = async (pdf: any) => {
        const fields: FormField[] = [];
        console.log('🔍 Extracting form fields from PDF...');

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const annotations = await page.getAnnotations();

            console.log(`Page ${pageNum}: Found ${annotations.length} annotations`);

            annotations.forEach((annotation: any, index: number) => {
                console.log(`Annotation ${index}:`, {
                    type: annotation.subtype,
                    fieldType: annotation.fieldType,
                    fieldName: annotation.fieldName,
                    rect: annotation.rect
                });

                if (annotation.fieldType) {
                    fields.push({
                        id: `${annotation.fieldName || `field_${pageNum}_${index}`}`,
                        name: annotation.fieldName || `field_${pageNum}_${index}`,
                        type: annotation.fieldType,
                        rect: annotation.rect,
                        page: pageNum,
                        value: annotation.fieldValue || ''
                    });
                }
            });
        }

        console.log(`✅ Total form fields found: ${fields.length}`, fields);
        setFormFields(fields);

        // Initialize field values
        const initialValues: Record<string, string> = {};
        fields.forEach(field => {
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
                    canvasRef.current.innerHTML = '';
                }

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.className = 'pdf-canvas';

                canvasRef.current?.appendChild(canvas);

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;
            } catch (error) {
                console.error('Error rendering page:', error);
            }
        };

        renderPage();
    }, [pdfDocument, currentPage, scale]);

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < numPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleFieldChange = (fieldId: string, value: string) => {
        setFieldValues(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const handleApplyChanges = async () => {
        try {
            console.log('Applying changes...');
            console.log('Form fields:', fieldValues);
            console.log('Text annotations:', textAnnotations);

            // Fill form fields using pdf-lib
            for (const [fieldName, value] of Object.entries(fieldValues)) {
                if (value && value.trim()) {
                    await pdfEditorService.fillFormField(fieldName, value);
                }
            }

            // Add text annotations (filter out empty ones)
            const validAnnotations = textAnnotations.filter(a => a.text && a.text.trim());
            console.log('Valid annotations to add:', validAnnotations);

            for (const annotation of validAnnotations) {
                await pdfEditorService.addText(annotation);
            }

            alert(`Changes applied! ${validAnnotations.length} text(s) added. Click Save to download.`);
        } catch (error: any) {
            console.error('Error applying changes:', error);
            alert(`Failed to apply changes: ${error.message || error}`);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isAddingText || !canvasRef.current?.firstChild) return;

        const canvas = canvasRef.current.firstChild as HTMLCanvasElement;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to PDF coordinates
        const pdfX = x / scale;
        const pdfY = canvas.height / scale - (y / scale);

        const newAnnotation: TextAnnotation = {
            id: `text_${Date.now()}`,
            text: '',
            x: pdfX,
            y: pdfY,
            pageNumber: currentPage,
            fontSize: fontSize
        };

        setTextAnnotations(prev => [...prev, newAnnotation]);
    };

    const handleTextChange = (id: string, value: string) => {
        setTextAnnotations(prev =>
            prev.map(ann => ann.id === id ? { ...ann, text: value } : ann)
        );
    };

    const handleDeleteAnnotation = (id: string) => {
        setTextAnnotations(prev => prev.filter(ann => ann.id !== id));
    };

    const getFieldPosition = (field: FormField) => {
        if (!canvasRef.current?.firstChild) return null;

        const canvas = canvasRef.current.firstChild as HTMLCanvasElement;
        const [x1, y1, x2, y2] = field.rect;

        return {
            left: x1 * scale,
            top: canvas.height - (y2 * scale),
            width: (x2 - x1) * scale,
            height: (y2 - y1) * scale
        };
    };

    const renderFormField = (field: FormField) => {
        if (field.page !== currentPage) return null;

        const pos = getFieldPosition(field);
        if (!pos) return null;

        const commonStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${pos.left}px`,
            top: `${pos.top}px`,
            width: `${pos.width}px`,
            height: `${pos.height}px`,
        };

        if (field.type === 'Tx') { // Text field
            return (
                <Input
                    key={field.id}
                    style={commonStyle}
                    value={fieldValues[field.id] || ''}
                    onChange={(e: any) => handleFieldChange(field.id, e.target.value)}
                    className="text-sm border-2 border-blue-500 bg-blue-50/90 hover:bg-blue-100/90 focus:bg-white focus:border-blue-600 transition-colors cursor-text shadow-md"
                    placeholder="Click to type..."
                    title={field.name}
                />
            );
        } else if (field.type === 'Btn') { // Checkbox/Button
            return (
                <div
                    key={field.id}
                    style={commonStyle}
                    className="flex items-center justify-center bg-blue-50/90 hover:bg-blue-100/90 border-2 border-blue-500 rounded shadow-md cursor-pointer transition-colors"
                    title={field.name}
                >
                    <Checkbox
                        checked={fieldValues[field.id] === 'Yes' || fieldValues[field.id] === 'true'}
                        onCheckedChange={(checked) =>
                            handleFieldChange(field.id, checked ? 'Yes' : 'No')
                        }
                        className="w-5 h-5"
                    />
                </div>
            );
        }

        return null;
    };

    const renderTextAnnotation = (annotation: TextAnnotation) => {
        if (annotation.pageNumber !== currentPage || !canvasRef.current?.firstChild) return null;

        const canvas = canvasRef.current.firstChild as HTMLCanvasElement;
        const displayX = annotation.x * scale;
        const displayY = canvas.height - (annotation.y * scale);

        return (
            <div
                key={annotation.id}
                style={{
                    position: 'absolute',
                    left: `${displayX}px`,
                    top: `${displayY}px`,
                    minWidth: '150px',
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    handleDeleteAnnotation(annotation.id);
                }}
            >
                <Input
                    value={annotation.text}
                    onChange={(e: any) => handleTextChange(annotation.id, e.target.value)}
                    style={{ fontSize: `${annotation.fontSize}px` }}
                    className="border-0 bg-transparent hover:bg-indigo-50/30 focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/20 rounded shadow-none focus:shadow-sm transition-all p-1"
                    placeholder="Type here..."
                    autoFocus
                />
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
                            variant={!isAddingText ? 'white' : 'ghost'}
                            size="sm"
                            onClick={() => setIsAddingText(false)}
                            className={`h-8 px-3 gap-2 border-0 ${!isAddingText ? 'bg-white shadow-sm text-slate-900 font-medium' : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            <MousePointer2 className="w-4 h-4" />
                            <span className="text-xs">Select</span>
                        </Button>
                        <Button
                            variant={isAddingText ? 'white' : 'ghost'}
                            size="sm"
                            onClick={() => setIsAddingText(true)}
                            className={`h-8 px-3 gap-2 border-0 ${isAddingText ? 'bg-white shadow-sm text-indigo-600 font-medium' : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            <Type className="w-4 h-4" />
                            <span className="text-xs">Add Text</span>
                        </Button>
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
                        {currentPage} <span className="text-slate-400 font-normal">/</span> {numPages}
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
                        className={`absolute top-0 left-0 w-full h-full ${isAddingText ? 'cursor-text' : ''}`}
                        onClick={handleOverlayClick}
                    >
                        <div className="relative w-full h-full">
                            {formFields.map(field => renderFormField(field))}
                            {textAnnotations.map(annotation => renderTextAnnotation(annotation))}
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
                    <span>Click anywhere to add text</span>
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
