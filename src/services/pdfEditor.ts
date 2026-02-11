import { PDFDocument, rgb, StandardFonts, degrees, PageSizes } from "pdf-lib";

export interface DrawingPath {
  id: string;
  tool: "pen" | "highlighter";
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

export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  pageNumber: number;
  fontSize?: number;
  color?: string;
  isBold?: boolean;
  isItalic?: boolean;
}

// Helper to convert hex color to RGB values (0-1 range)
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    };
  }
  return { r: 0, g: 0, b: 0 }; // Default to black
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

export type RotationDegrees = 0 | 90 | 180 | 270;

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

    // Parse color from hex string
    const textColor = annotation.color ? hexToRgb(annotation.color) : { r: 0, g: 0, b: 0 };

    page.drawText(annotation.text, {
      x: annotation.x,
      y: annotation.y,
      size: annotation.fontSize || 12,
      font,
      color: rgb(textColor.r, textColor.g, textColor.b),
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

  async addDrawingPath(path: DrawingPath): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");
    if (path.points.length < 2) return;

    const pages = this.pdfDoc.getPages();
    const page = pages[path.pageNumber - 1];
    const pageHeight = page.getHeight();

    const pathColor = hexToRgb(path.color);

    // Convert points to page coordinates (flip Y)
    const convertedPoints = path.points.map(p => ({
      x: p.x,
      y: pageHeight - p.y,
    }));

    // Draw the path as a series of lines
    for (let i = 0; i < convertedPoints.length - 1; i++) {
      page.drawLine({
        start: { x: convertedPoints[i].x, y: convertedPoints[i].y },
        end: { x: convertedPoints[i + 1].x, y: convertedPoints[i + 1].y },
        thickness: path.strokeWidth,
        color: rgb(pathColor.r, pathColor.g, pathColor.b),
        opacity: path.opacity,
      });
    }
  }

  async addDrawingShape(shape: DrawingShape): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");

    const pages = this.pdfDoc.getPages();
    const page = pages[shape.pageNumber - 1];
    const pageHeight = page.getHeight();

    const shapeColor = hexToRgb(shape.color);

    // Convert Y coordinates
    const startY = pageHeight - shape.startY;
    const endY = pageHeight - shape.endY;

    switch (shape.tool) {
      case "rectangle":
        const width = shape.endX - shape.startX;
        const height = shape.startY - shape.endY; // Inverted since Y is flipped
        page.drawRectangle({
          x: shape.startX,
          y: endY,
          width: width,
          height: height,
          borderColor: rgb(shapeColor.r, shapeColor.g, shapeColor.b),
          borderWidth: shape.strokeWidth,
        });
        break;

      case "circle":
        const radiusX = Math.abs(shape.endX - shape.startX) / 2;
        const radiusY = Math.abs(shape.endY - shape.startY) / 2;
        const centerX = shape.startX + (shape.endX - shape.startX) / 2;
        const centerY = startY + (endY - startY) / 2;
        page.drawEllipse({
          x: centerX,
          y: centerY,
          xScale: radiusX,
          yScale: radiusY,
          borderColor: rgb(shapeColor.r, shapeColor.g, shapeColor.b),
          borderWidth: shape.strokeWidth,
        });
        break;

      case "line":
        page.drawLine({
          start: { x: shape.startX, y: startY },
          end: { x: shape.endX, y: endY },
          thickness: shape.strokeWidth,
          color: rgb(shapeColor.r, shapeColor.g, shapeColor.b),
        });
        break;

      case "arrow":
        // Draw the line
        page.drawLine({
          start: { x: shape.startX, y: startY },
          end: { x: shape.endX, y: endY },
          thickness: shape.strokeWidth,
          color: rgb(shapeColor.r, shapeColor.g, shapeColor.b),
        });

        // Draw arrowhead
        const angle = Math.atan2(endY - startY, shape.endX - shape.startX);
        const arrowSize = 15;
        const arrow1X = shape.endX - arrowSize * Math.cos(angle - Math.PI / 6);
        const arrow1Y = endY - arrowSize * Math.sin(angle - Math.PI / 6);
        const arrow2X = shape.endX - arrowSize * Math.cos(angle + Math.PI / 6);
        const arrow2Y = endY - arrowSize * Math.sin(angle + Math.PI / 6);

        page.drawLine({
          start: { x: shape.endX, y: endY },
          end: { x: arrow1X, y: arrow1Y },
          thickness: shape.strokeWidth,
          color: rgb(shapeColor.r, shapeColor.g, shapeColor.b),
        });
        page.drawLine({
          start: { x: shape.endX, y: endY },
          end: { x: arrow2X, y: arrow2Y },
          thickness: shape.strokeWidth,
          color: rgb(shapeColor.r, shapeColor.g, shapeColor.b),
        });
        break;
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

  // ========== Page Management Methods ==========

  getPageCount(): number {
    if (!this.pdfDoc) return 0;
    return this.pdfDoc.getPageCount();
  }

  async rotatePage(pageIndex: number, rotation: RotationDegrees): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");
    
    const pages = this.pdfDoc.getPages();
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new Error("Invalid page index");
    }
    
    const page = pages[pageIndex];
    const currentRotation = page.getRotation().angle;
    const newRotation = (currentRotation + rotation) % 360;
    page.setRotation(degrees(newRotation));
  }

  async deletePage(pageIndex: number): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");
    
    const pageCount = this.pdfDoc.getPageCount();
    if (pageCount <= 1) {
      throw new Error("Cannot delete the last page");
    }
    if (pageIndex < 0 || pageIndex >= pageCount) {
      throw new Error("Invalid page index");
    }
    
    this.pdfDoc.removePage(pageIndex);
  }

  async insertBlankPage(afterPageIndex: number, size: [number, number] = PageSizes.A4): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");
    
    const pageCount = this.pdfDoc.getPageCount();
    if (afterPageIndex < -1 || afterPageIndex >= pageCount) {
      throw new Error("Invalid page index");
    }
    
    // Insert at the specified position (afterPageIndex + 1)
    this.pdfDoc.insertPage(afterPageIndex + 1, size);
  }

  async movePage(fromIndex: number, toIndex: number): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");
    
    const pageCount = this.pdfDoc.getPageCount();
    if (fromIndex < 0 || fromIndex >= pageCount || toIndex < 0 || toIndex >= pageCount) {
      throw new Error("Invalid page index");
    }
    
    if (fromIndex === toIndex) return;
    
    // We need to copy the page, remove it, and insert at new position
    // Create a new document with just this page
    const tempDoc = await PDFDocument.create();
    const [copiedPage] = await tempDoc.copyPages(this.pdfDoc, [fromIndex]);
    tempDoc.addPage(copiedPage);
    
    // Remove the original page
    this.pdfDoc.removePage(fromIndex);
    
    // Copy back to original document at new position
    const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    const [pageToInsert] = await this.pdfDoc.copyPages(tempDoc, [0]);
    this.pdfDoc.insertPage(adjustedToIndex, pageToInsert);
  }

  async extractPages(pageIndices: number[]): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");
    
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(this.pdfDoc, pageIndices);
    
    for (const page of copiedPages) {
      newDoc.addPage(page);
    }
    
    return await newDoc.save();
  }

  async mergePDF(otherPdfBytes: Uint8Array): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");
    
    const otherDoc = await PDFDocument.load(otherPdfBytes);
    const pageIndices = otherDoc.getPageIndices();
    const copiedPages = await this.pdfDoc.copyPages(otherDoc, pageIndices);
    
    for (const page of copiedPages) {
      this.pdfDoc.addPage(page);
    }
  }

  async splitPDF(splitAfterPage: number): Promise<{ first: Uint8Array; second: Uint8Array }> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");
    
    const pageCount = this.pdfDoc.getPageCount();
    if (splitAfterPage < 1 || splitAfterPage >= pageCount) {
      throw new Error("Invalid split position");
    }
    
    // Create first document (pages 0 to splitAfterPage-1)
    const firstDoc = await PDFDocument.create();
    const firstPages = await firstDoc.copyPages(
      this.pdfDoc, 
      Array.from({ length: splitAfterPage }, (_, i) => i)
    );
    for (const page of firstPages) {
      firstDoc.addPage(page);
    }
    
    // Create second document (pages splitAfterPage to end)
    const secondDoc = await PDFDocument.create();
    const secondPages = await secondDoc.copyPages(
      this.pdfDoc,
      Array.from({ length: pageCount - splitAfterPage }, (_, i) => i + splitAfterPage)
    );
    for (const page of secondPages) {
      secondDoc.addPage(page);
    }
    
    return {
      first: await firstDoc.save(),
      second: await secondDoc.save(),
    };
  }

  // ========== Redaction Methods ==========

  /**
   * Applies redaction boxes to the PDF.
   * Redaction boxes are solid black rectangles that permanently cover sensitive content.
   * 
   * @param redactions - Array of redaction areas with page numbers and coordinates
   */
  async applyRedactions(redactions: Array<{
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");

    const pages = this.pdfDoc.getPages();

    for (const redaction of redactions) {
      const page = pages[redaction.pageNumber - 1];
      if (!page) continue;

      const pageHeight = page.getHeight();

      // Draw a solid black rectangle to cover the content
      // Convert from screen coordinates (origin top-left) to PDF coordinates (origin bottom-left)
      page.drawRectangle({
        x: redaction.x,
        y: pageHeight - redaction.y - redaction.height,
        width: redaction.width,
        height: redaction.height,
        color: rgb(0, 0, 0), // Solid black
        borderWidth: 0,
      });
    }
  }

  // ========== Watermark Methods ==========

  /**
   * Adds a text or image watermark to all pages.
   * 
   * @param config - Watermark configuration including type, content, opacity, position, and rotation
   */
  async addWatermark(config: {
    type: "text" | "image";
    text: string;
    imageData: string | null;
    fontSize: number;
    opacity: number;
    rotation: number;
    position: string;
    color: string;
  }): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");

    const pages = this.pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();

      // Calculate position based on position string
      const pos = this.calculateWatermarkPosition(config.position, width, height, config.fontSize);

      if (config.type === "text" && config.text) {
        const font = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const textWidth = font.widthOfTextAtSize(config.text, config.fontSize);
        const textHeight = config.fontSize;

        // Adjust position to center the text at the calculated point
        const x = pos.x - textWidth / 2;
        const y = pos.y - textHeight / 2;

        const textColor = hexToRgb(config.color);

        page.drawText(config.text, {
          x,
          y,
          size: config.fontSize,
          font,
          color: rgb(textColor.r, textColor.g, textColor.b),
          opacity: config.opacity / 100,
          rotate: degrees(config.rotation),
        });
      } else if (config.type === "image" && config.imageData) {
        try {
          const imageDataPart = config.imageData.split(",")[1];
          const imageBytes = Uint8Array.from(atob(imageDataPart), (c) =>
            c.charCodeAt(0)
          );

          let embeddedImage;
          if (config.imageData.includes("image/png")) {
            embeddedImage = await this.pdfDoc.embedPng(imageBytes);
          } else {
            embeddedImage = await this.pdfDoc.embedJpg(imageBytes);
          }

          // Scale image to fit reasonably on the page
          const imgWidth = Math.min(embeddedImage.width, width * 0.3);
          const imgHeight = imgWidth * (embeddedImage.height / embeddedImage.width);

          const x = pos.x - imgWidth / 2;
          const y = pos.y - imgHeight / 2;

          page.drawImage(embeddedImage, {
            x,
            y,
            width: imgWidth,
            height: imgHeight,
            opacity: config.opacity / 100,
            rotate: degrees(config.rotation),
          });
        } catch (error) {
          console.error("Error adding watermark image:", error);
        }
      }
    }
  }

  /**
   * Calculates the x,y position for a watermark based on the position string.
   */
  private calculateWatermarkPosition(
    position: string,
    pageWidth: number,
    pageHeight: number,
    fontSize: number
  ): { x: number; y: number } {
    const margin = 50;
    let x = pageWidth / 2;
    let y = pageHeight / 2;

    if (position.includes("left")) x = margin + fontSize;
    if (position.includes("right")) x = pageWidth - margin - fontSize;
    if (position.includes("top")) y = pageHeight - margin - fontSize;
    if (position.includes("bottom")) y = margin + fontSize;

    return { x, y };
  }

  // ========== Header/Footer Methods ==========

  /**
   * Adds headers and/or footers to all pages.
   * 
   * @param config - Header/footer configuration
   */
  async addHeaderFooter(config: {
    header: {
      left: string;
      center: string;
      right: string;
      enabled: boolean;
    };
    footer: {
      left: string;
      center: string;
      right: string;
      enabled: boolean;
    };
    pageNumberFormat: string;
    dateFormat: string;
    fontSize: number;
    margin: number;
  }): Promise<void> {
    if (!this.pdfDoc) throw new Error("No PDF loaded");

    const pages = this.pdfDoc.getPages();
    const totalPages = pages.length;
    const font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const pageNum = i + 1;

      // Format text by replacing tokens
      const formatText = (text: string): string => {
        let result = text;
        result = result.replace(/\{page\}/g, pageNum.toString());
        result = result.replace(/\{total\}/g, totalPages.toString());
        result = result.replace(/\{date\}/g, this.formatDate(config.dateFormat));
        return result;
      };

      // Draw header
      if (config.header.enabled) {
        const headerY = height - config.margin;

        // Left
        if (config.header.left) {
          page.drawText(formatText(config.header.left), {
            x: config.margin,
            y: headerY,
            size: config.fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        }

        // Center
        if (config.header.center) {
          const text = formatText(config.header.center);
          const textWidth = font.widthOfTextAtSize(text, config.fontSize);
          page.drawText(text, {
            x: (width - textWidth) / 2,
            y: headerY,
            size: config.fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        }

        // Right
        if (config.header.right) {
          const text = formatText(config.header.right);
          const textWidth = font.widthOfTextAtSize(text, config.fontSize);
          page.drawText(text, {
            x: width - config.margin - textWidth,
            y: headerY,
            size: config.fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
      }

      // Draw footer
      if (config.footer.enabled) {
        const footerY = config.margin;

        // Left
        if (config.footer.left) {
          page.drawText(formatText(config.footer.left), {
            x: config.margin,
            y: footerY,
            size: config.fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        }

        // Center
        if (config.footer.center) {
          const text = formatText(config.footer.center);
          const textWidth = font.widthOfTextAtSize(text, config.fontSize);
          page.drawText(text, {
            x: (width - textWidth) / 2,
            y: footerY,
            size: config.fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        }

        // Right
        if (config.footer.right) {
          const text = formatText(config.footer.right);
          const textWidth = font.widthOfTextAtSize(text, config.fontSize);
          page.drawText(text, {
            x: width - config.margin - textWidth,
            y: footerY,
            size: config.fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
      }
    }
  }

  /**
   * Formats the current date according to the specified format.
   */
  private formatDate(format: string): string {
    const now = new Date();

    switch (format) {
      case "short":
        return now.toLocaleDateString("en-US");
      case "medium":
        return now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      case "long":
        return now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      case "iso":
        return now.toISOString().split("T")[0];
      default:
        return now.toLocaleDateString("en-US");
    }
  }

  reset(): void {
    this.pdfDoc = null;
    this.originalBytes = null;
    this.password = undefined;
  }
}

export const pdfEditorService = new PDFEditorService();
