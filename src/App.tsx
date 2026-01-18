import { useState } from 'react';
import MenuBar from './components/MenuBar';
import PDFUploader from './components/PDFUploader';
import PDFViewer from './components/PDFViewer';
import { pdfEditorService } from './services/pdfEditor';
import './App.css';

function App() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    try {
      await pdfEditorService.loadPDF(file);
      setCurrentFile(file);
      setFileName(file.name);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Failed to load PDF file');
    }
  };

  const handleSave = async () => {
    try {
      await pdfEditorService.downloadPDF(fileName);
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Failed to save PDF');
    }
  };

  const handleSaveAs = async () => {
    const newFileName = prompt('Enter file name:', fileName.replace('.pdf', ''));
    if (newFileName) {
      try {
        await pdfEditorService.downloadPDF(`${newFileName}.pdf`);
      } catch (error) {
        console.error('Error saving PDF:', error);
        alert('Failed to save PDF');
      }
    }
  };

  const handleNew = () => {
    if (confirm('Start with a new document? Any unsaved changes will be lost.')) {
      setCurrentFile(null);
      setFileName('');
      pdfEditorService.reset();
    }
  };

  return (
    <div className="app">
      <MenuBar
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onNew={handleNew}
        hasDocument={!!currentFile}
      />
      {currentFile ? (
        <PDFViewer file={currentFile} />
      ) : (
        <PDFUploader onFileSelect={handleFileSelect} />
      )}
    </div>
  );
}

export default App;
