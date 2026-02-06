import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  pageNumber: number;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
}

export interface ImageAnnotation {
  id: string;
  imageData: string; // Base64 data
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export class PDFEditorService {
  private pdfDoc: PDFDocument | null = null;
  private originalBytes: Uint8Array | null = null;
  private password: string | undefined = undefined;

  getPassword(): string | undefined {
    return this.password;
  }

  async loadPDF(file: File, password?: string): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    this.originalBytes = new Uint8Array(arrayBuffer);
    this.password = password;
    
    try {
      // Try to load PDF
      // Note: pdf-lib doesn't support decrypting password-protected PDFs
      // We can only load them with ignoreEncryption: true if we have the password
      if (password) {
        // If password provided, try to load with ignoreEncryption
        // This allows viewing but may have limitations for editing
        this.pdfDoc = await PDFDocument.load(this.originalBytes, { 
          ignoreEncryption: true,
          updateMetadata: false 
        });
      } else {
        // Try without password first
        this.pdfDoc = await PDFDocument.load(this.originalBytes, {
          updateMetadata: false
        });
      }
    } catch (error: any) {
      console.error("PDF Load Error:", error);
      
      const errorMsg = error.message?.toLowerCase() || '';
      const errorName = error.constructor?.name || '';
      
      // Check if it's an EncryptedPDFError
      if (errorName === 'EncryptedPDFError' || errorMsg.includes('encrypted')) {
        // PDF is encrypted and needs a password
        throw new Error('PDF_PASSWORD_REQUIRED');
      }
      
      // Re-throw other errors as-is
      throw error;
    }
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

    let fontToEmbed = StandardFonts.Helvetica;
    if (annotation.isBold && annotation.isItalic) {
      fontToEmbed = StandardFonts.HelveticaBoldOblique;
    } else if (annotation.isBold) {
      fontToEmbed = StandardFonts.HelveticaBold;
    } else if (annotation.isItalic) {
      fontToEmbed = StandardFonts.HelveticaOblique;
    }

    const font = await this.pdfDoc.embedFont(fontToEmbed);

    page.drawText(annotation.text, {
      x: annotation.x,
      y: annotation.y,
      size: annotation.fontSize || 12,
      font,
      color: rgb(0, 0, 0),
    });
  }

  async addImage(annotation: ImageAnnotation): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");

    const pages = this.pdfDoc.getPages();
    const page = pages[annotation.pageNumber - 1];

    console.log("Adding image:", annotation.id);

    try {
      // imageData is expected to be a data URL: "data:image/png;base64,..."
      const imageDataPart = annotation.imageData.split(",")[1];
      const imageBytes = Uint8Array.from(atob(imageDataPart), (c) =>
        c.charCodeAt(0),
      );

      let embeddedImage;
      if (annotation.imageData.includes("image/png")) {
        embeddedImage = await this.pdfDoc.embedPng(imageBytes);
      } else {
        embeddedImage = await this.pdfDoc.embedJpg(imageBytes);
      }

      page.drawImage(embeddedImage, {
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: annotation.height,
      });
    } catch (error) {
      console.error("Error adding image:", error);
      throw error;
    }
  }

  async fillFormField(fieldName: string, value: string): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");

    const form = this.pdfDoc.getForm();
    const fields = form.getFields();

    const field = fields.find((f: any) => f.getName() === fieldName);
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
    const safeBytes = new Uint8Array(pdfBytes);
    const blob = new Blob([safeBytes], { type: "application/pdf" });
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
    this.password = undefined;
  }
}

export const pdfEditorService = new PDFEditorService();
