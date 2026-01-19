import { describe, expect, it, vi, beforeEach } from "vitest";
import { PDFEditorService } from "../pdfEditor";
import { PDFDocument } from "pdf-lib";

vi.mock("pdf-lib", () => ({
  PDFDocument: {
    load: vi.fn(),
  },
  rgb: vi.fn(),
  StandardFonts: {
    Helvetica: "Helvetica",
    HelveticaBold: "Helvetica-Bold",
    HelveticaOblique: "Helvetica-Oblique",
    HelveticaBoldOblique: "Helvetica-BoldOblique",
  },
}));

describe("PDFEditorService", () => {
  let service: PDFEditorService;
  let mockPdfDoc: any;

  beforeEach(() => {
    service = new PDFEditorService();
    mockPdfDoc = {
      getPages: vi.fn().mockReturnValue([{
        drawText: vi.fn(),
        drawImage: vi.fn(),
      }]),
      getForm: vi.fn().mockReturnValue({
        getFields: vi.fn().mockReturnValue([]),
      }),
      save: vi.fn().mockResolvedValue(new Uint8Array()),
      embedPng: vi.fn().mockResolvedValue({}),
      embedJpg: vi.fn().mockResolvedValue({}),
      embedFont: vi.fn().mockResolvedValue({}),
    };
    (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);
  });

  it("should load a PDF from a File", async () => {
    const file = new File(["%PDF-1.4"], "test.pdf", { type: "application/pdf" });
    await service.loadPDF(file);
    expect(PDFDocument.load).toHaveBeenCalled();
  });

  it("should add text to a page", async () => {
    const file = new File(["%PDF-1.4"], "test.pdf", { type: "application/pdf" });
    await service.loadPDF(file);

    const annotation = {
      id: "1",
      text: "Hello World",
      x: 100,
      y: 100,
      pageNumber: 1,
      fontSize: 12,
    };

    await service.addText(annotation);
    const firstPage = mockPdfDoc.getPages()[0];
    expect(firstPage.drawText).toHaveBeenCalledWith("Hello World", expect.any(Object));
  });

  it("should add an image to a page", async () => {
    const file = new File(["%PDF-1.4"], "test.pdf", { type: "application/pdf" });
    await service.loadPDF(file);

    const annotation = {
      id: "img1",
      imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      pageNumber: 1,
    };

    await service.addImage(annotation);
    expect(mockPdfDoc.embedPng).toHaveBeenCalled();
    const firstPage = mockPdfDoc.getPages()[0];
    expect(firstPage.drawImage).toHaveBeenCalled();
  });

  it("should reset state", async () => {
    const file = new File(["%PDF-1.4"], "test.pdf", { type: "application/pdf" });
    await service.loadPDF(file);
    service.reset();
    
    // After reset, calling addText should throw
    await expect(service.addText({
      id: "1",
      text: "test",
      x: 0,
      y: 0,
      pageNumber: 1,
    })).rejects.toThrow("No PDF loaded");
  });
});
