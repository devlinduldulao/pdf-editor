import { PDFDocument, rgb } from "pdf-lib";

export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  pageNumber: number;
  fontSize?: number;
}

export class PDFEditorService {
  private pdfDoc: PDFDocument | null = null;
  private originalBytes: Uint8Array | null = null;

  async loadPDF(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    this.originalBytes = new Uint8Array(arrayBuffer);
    this.pdfDoc = await PDFDocument.load(this.originalBytes);
  }

  async addText(annotation: TextAnnotation): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");

    // Skip empty text
    if (!annotation.text || annotation.text.trim() === "") {
      console.log("Skipping empty text annotation");
      return;
    }

    const pages = this.pdfDoc.getPages();
    const page = pages[annotation.pageNumber - 1];

    console.log("Adding text:", annotation);

    page.drawText(annotation.text, {
      x: annotation.x,
      y: annotation.y,
      size: annotation.fontSize || 12,
      color: rgb(0, 0, 0),
    });
  }

  async fillFormField(fieldName: string, value: string): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");

    const form = this.pdfDoc.getForm();
    const fields = form.getFields();

    const field = fields.find((f) => f.getName() === fieldName);
    if (field) {
      try {
        const textField = form.getTextField(fieldName);
        textField.setText(value);
      } catch (error) {
        console.warn(`Could not fill field ${fieldName}:`, error);
      }
    }
  }

  async savePDF(): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");
    return await this.pdfDoc.save();
  }

  async downloadPDF(filename: string = "edited-document.pdf"): Promise<void> {
    const pdfBytes = await this.savePDF();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  reset(): void {
    this.pdfDoc = null;
    this.originalBytes = null;
  }
}

export const pdfEditorService = new PDFEditorService();
