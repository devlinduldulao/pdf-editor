import { describe, it, expect, vi, beforeEach } from "vitest";
import { PDFEditorService } from "../pdfEditor";
import { PDFDocument } from "pdf-lib";

// Mock pdf-lib
vi.mock("pdf-lib", () => {
  const createMockPdfDoc = () => ({
    getPages: vi.fn(() => [
      {
        getWidth: vi.fn(() => 595),
        getHeight: vi.fn(() => 842),
        drawText: vi.fn(),
        drawImage: vi.fn(),
      },
    ]),
    embedFont: vi.fn(async (font: any) => ({
      name: font,
      widthOfTextAtSize: vi.fn(() => 100),
    })),
    embedStandardFont: vi.fn(async (font: any) => ({
      name: font,
      widthOfTextAtSize: vi.fn(() => 100),
    })),
    embedPng: vi.fn(async () => ({ scale: vi.fn(() => ({ width: 100, height: 100 })) })),
    embedJpg: vi.fn(async () => ({ scale: vi.fn(() => ({ width: 100, height: 100 })) })),
    save: vi.fn(async () => new Uint8Array([1, 2, 3, 4])),
  });

  return {
    PDFDocument: {
      load: vi.fn(async (bytes: Uint8Array, options?: { password?: string }) => {
        // Simulate encrypted PDF requiring password
        const isEncrypted = bytes[0] === 255; // Mock detection
        
        if (isEncrypted && !options?.password) {
          throw new Error("PDF is encrypted and requires a password");
        }
        
        if (isEncrypted && options?.password !== "correctPassword") {
          throw new Error("Incorrect password for encrypted PDF");
        }
        
        return createMockPdfDoc();
      }),
    },
    StandardFonts: {
      Helvetica: "Helvetica",
      HelveticaBold: "Helvetica-Bold",
      HelveticaOblique: "Helvetica-Oblique",
      HelveticaBoldOblique: "Helvetica-BoldOblique",
    },
    rgb: vi.fn(() => ({ r: 0, g: 0, b: 0 })),
  };
});

describe("PDFEditorService - Password Protection", () => {
  let service: PDFEditorService;

  beforeEach(() => {
    service = new PDFEditorService();
    vi.clearAllMocks();
  });

  it("should load an unencrypted PDF without password", async () => {
    const unencryptedBytes = new Uint8Array([0, 1, 2, 3]); // First byte != 255
    const file = new File([unencryptedBytes], "test.pdf", {
      type: "application/pdf",
    });

    await expect(service.loadPDF(file)).resolves.not.toThrow();
  });

  it("should throw PDF_PASSWORD_REQUIRED when loading encrypted PDF without password", async () => {
    const encryptedBytes = new Uint8Array([255, 1, 2, 3]); // First byte = 255 (mock encryption)
    const file = new File([encryptedBytes], "encrypted.pdf", {
      type: "application/pdf",
    });

    await expect(service.loadPDF(file)).rejects.toThrow("PDF_PASSWORD_REQUIRED");
  });

  it("should throw PDF_PASSWORD_REQUIRED when loading encrypted PDF with wrong password", async () => {
    const encryptedBytes = new Uint8Array([255, 1, 2, 3]);
    const file = new File([encryptedBytes], "encrypted.pdf", {
      type: "application/pdf",
    });

    await expect(service.loadPDF(file, "wrongPassword")).rejects.toThrow(
      "PDF_PASSWORD_REQUIRED"
    );
  });

  it("should successfully load encrypted PDF with correct password", async () => {
    const encryptedBytes = new Uint8Array([255, 1, 2, 3]);
    const file = new File([encryptedBytes], "encrypted.pdf", {
      type: "application/pdf",
    });

    await expect(
      service.loadPDF(file, "correctPassword")
    ).resolves.not.toThrow();
  });

  it("should save password-protected PDF after modifications", async () => {
    const encryptedBytes = new Uint8Array([255, 1, 2, 3]);
    const file = new File([encryptedBytes], "encrypted.pdf", {
      type: "application/pdf",
    });

    await service.loadPDF(file, "correctPassword");
    await service.addText({
      id: "test1",
      text: "Test Annotation",
      x: 100,
      y: 100,
      pageNumber: 1,
      fontSize: 12,
      isBold: false,
      isItalic: false,
    });

    const result = await service.savePDF();
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle multiple password attempts", async () => {
    const encryptedBytes = new Uint8Array([255, 1, 2, 3]);
    const file = new File([encryptedBytes], "encrypted.pdf", {
      type: "application/pdf",
    });

    // First attempt with wrong password
    await expect(service.loadPDF(file, "wrongPassword1")).rejects.toThrow(
      "PDF_PASSWORD_REQUIRED"
    );

    // Second attempt with wrong password
    await expect(service.loadPDF(file, "wrongPassword2")).rejects.toThrow(
      "PDF_PASSWORD_REQUIRED"
    );

    // Third attempt with correct password
    await expect(
      service.loadPDF(file, "correctPassword")
    ).resolves.not.toThrow();
  });

  it("should throw other errors that are not password-related", async () => {
    const mockLoad = vi.mocked(PDFDocument.load);
    
    // Mock a non-password related error
    mockLoad.mockImplementationOnce(async () => {
      throw new Error("Corrupted PDF file");
    });

    const bytes = new Uint8Array([0, 1, 2, 3]);
    const file = new File([bytes], "corrupted.pdf", {
      type: "application/pdf",
    });

    await expect(service.loadPDF(file)).rejects.toThrow("Corrupted PDF file");
  });
});
