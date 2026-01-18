import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import '../styles/PDFViewer.css';

// Set worker path - using local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
    file: File | null;
    onFormFieldClick?: (field: any, pageNum: number, x: number, y: number) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onFormFieldClick }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pdfDocument, setPdfDocument] = useState<any>(null);
    const [scale, setScale] = useState<number>(1.5);

    useEffect(() => {
        if (!file) return;

        const loadPDF = async () => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                setPdfDocument(pdf);
                setNumPages(pdf.numPages);
                setCurrentPage(1);
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Failed to load PDF');
            }
        };

        loadPDF();
    }, [file]);

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

    if (!file) {
        return null;
    }

    return (
        <div className="pdf-viewer">
            <div className="pdf-controls">
                <div className="page-controls">
                    <button onClick={handlePrevPage} disabled={currentPage <= 1}>
                        ← Previous
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {numPages}
                    </span>
                    <button onClick={handleNextPage} disabled={currentPage >= numPages}>
                        Next →
                    </button>
                </div>
                <div className="zoom-controls">
                    <button onClick={handleZoomOut}>−</button>
                    <span>{Math.round(scale * 100)}%</span>
                    <button onClick={handleZoomIn}>+</button>
                </div>
            </div>
            <div className="pdf-canvas-container" ref={canvasRef}></div>
        </div>
    );
};

export default PDFViewer;
