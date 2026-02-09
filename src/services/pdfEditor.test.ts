/**
 * Tests for the PDFEditorService.
 *
 * The PDFEditorService is the core business logic of the app — it uses the
 * `pdf-lib` library to manipulate PDF documents (add text, images, shapes,
 * rotate pages, merge, split, etc.).
 *
 * Testing strategy:
 * - We create real PDF documents with `pdf-lib`'s `PDFDocument.create()` so
 *   we test against actual PDF structures, not mocks.
 * - We test the public API of the service: load → manipulate → save.
 * - Error cases (no PDF loaded, invalid indices) are tested for robustness.
 *
 * Why not mock `pdf-lib`?
 * Mocking the library would test our mock, not our code. By using real PDFs
 * we catch integration issues (e.g., wrong coordinate transforms).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  PDFEditorService,
  type TextAnnotation,
  type DrawingPath,
  type DrawingShape,
  type ImageAnnotation,
} from "@/services/pdfEditor";

/**
 * Helper: creates a minimal valid PDF file as a File object.
 * This lets us call `service.loadPDF(file)` in tests.
 */
async function createTestPDFFile(pageCount = 1): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([612, 792]); // US Letter size
  }
  const bytes = await doc.save();
  return new File([bytes], "test.pdf", { type: "application/pdf" });
}

describe("PDFEditorService", () => {
  let service: PDFEditorService;

  beforeEach(() => {
    // Each test gets a fresh service so tests don't leak state.
    service = new PDFEditorService();
  });

  // ──────────────────────────────────────
  // Loading & Basic Operations
  // ──────────────────────────────────────
  describe("loadPDF", () => {
    it("should load a valid PDF file", async () => {
      const file = await createTestPDFFile();

      // Should not throw
      await service.loadPDF(file);

      // The page count should reflect what we created
      expect(service.getPageCount()).toBe(1);
    });

    it("should load a multi-page PDF file", async () => {
      const file = await createTestPDFFile(5);
      await service.loadPDF(file);

      expect(service.getPageCount()).toBe(5);
    });

    it("should store the password when provided", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file, "secret123");

      expect(service.getPassword()).toBe("secret123");
    });

    it("should have undefined password when none provided", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      expect(service.getPassword()).toBeUndefined();
    });
  });

  // ──────────────────────────────────────
  // Text Annotations
  // ──────────────────────────────────────
  describe("addText", () => {
    it("should throw if no PDF is loaded", async () => {
      const annotation: TextAnnotation = {
        id: "1",
        text: "Hello",
        x: 100,
        y: 100,
        pageNumber: 1,
      };

      await expect(service.addText(annotation)).rejects.toThrow("No PDF loaded");
    });

    it("should add text to a loaded PDF without throwing", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const annotation: TextAnnotation = {
        id: "1",
        text: "Hello World",
        x: 100,
        y: 700,
        pageNumber: 1,
        fontSize: 14,
        color: "#FF0000",
      };

      // Should complete without error
      await expect(service.addText(annotation)).resolves.not.toThrow();
    });

    it("should skip empty text annotations gracefully", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const annotation: TextAnnotation = {
        id: "1",
        text: "   ",
        x: 100,
        y: 100,
        pageNumber: 1,
      };

      // Should not throw — it silently returns
      await expect(service.addText(annotation)).resolves.not.toThrow();
    });

    it("should handle bold and italic font styles", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const annotation: TextAnnotation = {
        id: "1",
        text: "Styled Text",
        x: 50,
        y: 200,
        pageNumber: 1,
        isBold: true,
        isItalic: true,
        fontSize: 16,
        color: "#0000FF",
      };

      await expect(service.addText(annotation)).resolves.not.toThrow();
    });
  });

  // ──────────────────────────────────────
  // Drawing Paths (freehand pen/highlighter)
  // ──────────────────────────────────────
  describe("addDrawingPath", () => {
    it("should throw if no PDF is loaded", async () => {
      const path: DrawingPath = {
        id: "1",
        tool: "pen",
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        color: "#000000",
        strokeWidth: 2,
        opacity: 1,
        pageNumber: 1,
      };

      await expect(service.addDrawingPath(path)).rejects.toThrow("No PDF loaded");
    });

    it("should draw a path with multiple points", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const path: DrawingPath = {
        id: "1",
        tool: "pen",
        points: [
          { x: 10, y: 10 },
          { x: 50, y: 50 },
          { x: 100, y: 100 },
        ],
        color: "#FF0000",
        strokeWidth: 3,
        opacity: 0.8,
        pageNumber: 1,
      };

      await expect(service.addDrawingPath(path)).resolves.not.toThrow();
    });

    it("should silently skip paths with fewer than 2 points", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const path: DrawingPath = {
        id: "1",
        tool: "pen",
        points: [{ x: 10, y: 10 }], // Only 1 point — can't draw a line
        color: "#000000",
        strokeWidth: 2,
        opacity: 1,
        pageNumber: 1,
      };

      await expect(service.addDrawingPath(path)).resolves.not.toThrow();
    });
  });

  // ──────────────────────────────────────
  // Drawing Shapes
  // ──────────────────────────────────────
  describe("addDrawingShape", () => {
    it("should draw a rectangle", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const shape: DrawingShape = {
        id: "1",
        tool: "rectangle",
        startX: 50,
        startY: 50,
        endX: 200,
        endY: 200,
        color: "#00FF00",
        strokeWidth: 2,
        pageNumber: 1,
      };

      await expect(service.addDrawingShape(shape)).resolves.not.toThrow();
    });

    it("should draw a circle (ellipse)", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const shape: DrawingShape = {
        id: "1",
        tool: "circle",
        startX: 100,
        startY: 100,
        endX: 250,
        endY: 250,
        color: "#0000FF",
        strokeWidth: 2,
        pageNumber: 1,
      };

      await expect(service.addDrawingShape(shape)).resolves.not.toThrow();
    });

    it("should draw a line", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const shape: DrawingShape = {
        id: "1",
        tool: "line",
        startX: 10,
        startY: 10,
        endX: 300,
        endY: 400,
        color: "#333333",
        strokeWidth: 1,
        pageNumber: 1,
      };

      await expect(service.addDrawingShape(shape)).resolves.not.toThrow();
    });

    it("should draw an arrow with arrowhead", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const shape: DrawingShape = {
        id: "1",
        tool: "arrow",
        startX: 50,
        startY: 50,
        endX: 200,
        endY: 200,
        color: "#FF0000",
        strokeWidth: 2,
        pageNumber: 1,
      };

      await expect(service.addDrawingShape(shape)).resolves.not.toThrow();
    });
  });

  // ──────────────────────────────────────
  // Save & Download
  // ──────────────────────────────────────
  describe("savePDF", () => {
    it("should throw if no PDF is loaded", async () => {
      await expect(service.savePDF()).rejects.toThrow("No PDF loaded");
    });

    it("should return valid PDF bytes", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const result = await service.savePDF();

      // PDF bytes should start with the PDF magic number "%PDF"
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);

      // First 4 bytes should be "%PDF" (ASCII 37, 80, 68, 70)
      expect(result[0]).toBe(37); // %
      expect(result[1]).toBe(80); // P
      expect(result[2]).toBe(68); // D
      expect(result[3]).toBe(70); // F
    });
  });

  describe("downloadPDF", () => {
    it("should create a download link and click it", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      // Mock DOM methods for download
      const clickMock = vi.fn();
      const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
        set href(_v: string) { /* noop */ },
        set download(_v: string) { /* noop */ },
        click: clickMock,
      } as unknown as HTMLAnchorElement);

      await service.downloadPDF("output.pdf");

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(clickMock).toHaveBeenCalledOnce();

      createElementSpy.mockRestore();
    });
  });

  // ──────────────────────────────────────
  // Page Management
  // ──────────────────────────────────────
  describe("getPageCount", () => {
    it("should return 0 when no PDF is loaded", () => {
      expect(service.getPageCount()).toBe(0);
    });
  });

  describe("rotatePage", () => {
    it("should throw for invalid page index", async () => {
      const file = await createTestPDFFile(2);
      await service.loadPDF(file);

      await expect(service.rotatePage(5, 90)).rejects.toThrow("Invalid page index");
      await expect(service.rotatePage(-1, 90)).rejects.toThrow("Invalid page index");
    });

    it("should rotate a page by 90 degrees", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      await expect(service.rotatePage(0, 90)).resolves.not.toThrow();
    });
  });

  describe("deletePage", () => {
    it("should throw when trying to delete the last remaining page", async () => {
      const file = await createTestPDFFile(1);
      await service.loadPDF(file);

      await expect(service.deletePage(0)).rejects.toThrow("Cannot delete the last page");
    });

    it("should delete a page from a multi-page document", async () => {
      const file = await createTestPDFFile(3);
      await service.loadPDF(file);

      await service.deletePage(1); // Delete page 2

      expect(service.getPageCount()).toBe(2);
    });

    it("should throw for invalid page index", async () => {
      const file = await createTestPDFFile(3);
      await service.loadPDF(file);

      await expect(service.deletePage(10)).rejects.toThrow("Invalid page index");
    });
  });

  describe("insertBlankPage", () => {
    it("should insert a blank page after a given index", async () => {
      const file = await createTestPDFFile(2);
      await service.loadPDF(file);

      await service.insertBlankPage(0);

      expect(service.getPageCount()).toBe(3);
    });

    it("should insert at the beginning when afterPageIndex is -1", async () => {
      const file = await createTestPDFFile(1);
      await service.loadPDF(file);

      await service.insertBlankPage(-1);

      expect(service.getPageCount()).toBe(2);
    });
  });

  describe("movePage", () => {
    it("should do nothing when from and to are the same", async () => {
      const file = await createTestPDFFile(3);
      await service.loadPDF(file);

      await service.movePage(1, 1);

      expect(service.getPageCount()).toBe(3); // Unchanged
    });

    it("should move a page to a different position", async () => {
      const file = await createTestPDFFile(3);
      await service.loadPDF(file);

      await service.movePage(0, 2);

      expect(service.getPageCount()).toBe(3); // Count unchanged
    });

    it("should throw for invalid indices", async () => {
      const file = await createTestPDFFile(2);
      await service.loadPDF(file);

      await expect(service.movePage(-1, 0)).rejects.toThrow("Invalid page index");
      await expect(service.movePage(0, 10)).rejects.toThrow("Invalid page index");
    });
  });

  describe("extractPages", () => {
    it("should extract specified pages into a new PDF", async () => {
      const file = await createTestPDFFile(5);
      await service.loadPDF(file);

      const extractedBytes = await service.extractPages([0, 2, 4]);

      // Load the extracted PDF to verify
      const extractedDoc = await PDFDocument.load(extractedBytes);
      expect(extractedDoc.getPageCount()).toBe(3);
    });
  });

  describe("mergePDF", () => {
    it("should append pages from another PDF", async () => {
      const file = await createTestPDFFile(2);
      await service.loadPDF(file);

      // Create another PDF to merge
      const otherDoc = await PDFDocument.create();
      otherDoc.addPage();
      otherDoc.addPage();
      otherDoc.addPage();
      const otherBytes = await otherDoc.save();

      await service.mergePDF(otherBytes);

      expect(service.getPageCount()).toBe(5); // 2 + 3
    });
  });

  describe("splitPDF", () => {
    it("should split a PDF into two parts", async () => {
      const file = await createTestPDFFile(4);
      await service.loadPDF(file);

      const { first, second } = await service.splitPDF(2);

      const firstDoc = await PDFDocument.load(first);
      const secondDoc = await PDFDocument.load(second);

      expect(firstDoc.getPageCount()).toBe(2);
      expect(secondDoc.getPageCount()).toBe(2);
    });

    it("should throw for invalid split position", async () => {
      const file = await createTestPDFFile(3);
      await service.loadPDF(file);

      await expect(service.splitPDF(0)).rejects.toThrow("Invalid split position");
      await expect(service.splitPDF(3)).rejects.toThrow("Invalid split position");
    });
  });

  // ──────────────────────────────────────
  // Redactions
  // ──────────────────────────────────────
  describe("applyRedactions", () => {
    it("should apply redaction rectangles without throwing", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      await expect(
        service.applyRedactions([
          { pageNumber: 1, x: 50, y: 50, width: 100, height: 20 },
        ]),
      ).resolves.not.toThrow();
    });

    it("should skip redactions for non-existent pages", async () => {
      const file = await createTestPDFFile(1);
      await service.loadPDF(file);

      // Page 5 doesn't exist — the code does `if (!page) continue;`
      await expect(
        service.applyRedactions([
          { pageNumber: 5, x: 50, y: 50, width: 100, height: 20 },
        ]),
      ).resolves.not.toThrow();
    });
  });

  // ──────────────────────────────────────
  // Watermark
  // ──────────────────────────────────────
  describe("addWatermark", () => {
    it("should add a text watermark to all pages", async () => {
      const file = await createTestPDFFile(3);
      await service.loadPDF(file);

      await expect(
        service.addWatermark({
          type: "text",
          text: "CONFIDENTIAL",
          imageData: null,
          fontSize: 48,
          opacity: 30,
          rotation: -45,
          position: "center",
          color: "#FF0000",
        }),
      ).resolves.not.toThrow();
    });

    it("should handle different position options (top-left, bottom-right, etc.)", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      for (const position of ["top-left", "top-right", "bottom-left", "bottom-right", "center"]) {
        await expect(
          service.addWatermark({
            type: "text",
            text: "WATERMARK",
            imageData: null,
            fontSize: 24,
            opacity: 50,
            rotation: 0,
            position,
            color: "#888888",
          }),
        ).resolves.not.toThrow();
      }
    });
  });

  // ──────────────────────────────────────
  // Header/Footer
  // ──────────────────────────────────────
  describe("addHeaderFooter", () => {
    it("should add headers and footers with page tokens", async () => {
      const file = await createTestPDFFile(3);
      await service.loadPDF(file);

      await expect(
        service.addHeaderFooter({
          header: { left: "Doc Title", center: "Page {page} of {total}", right: "{date}", enabled: true },
          footer: { left: "", center: "Footer", right: "", enabled: true },
          pageNumberFormat: "{page}/{total}",
          dateFormat: "iso",
          fontSize: 10,
          margin: 30,
        }),
      ).resolves.not.toThrow();
    });

    it("should skip headers when disabled", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      await expect(
        service.addHeaderFooter({
          header: { left: "", center: "", right: "", enabled: false },
          footer: { left: "Footer", center: "", right: "", enabled: true },
          pageNumberFormat: "{page}",
          dateFormat: "short",
          fontSize: 10,
          margin: 30,
        }),
      ).resolves.not.toThrow();
    });
  });

  // ──────────────────────────────────────
  // Flatten Annotations
  // ──────────────────────────────────────
  describe("flattenAnnotations", () => {
    it("should flatten form fields without error", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      // Even with no form fields, flatten should not crash
      await expect(service.flattenAnnotations()).resolves.not.toThrow();
    });
  });

  // ──────────────────────────────────────
  // Compress & Size
  // ──────────────────────────────────────
  describe("compressPDF", () => {
    it("should return compressed PDF bytes", async () => {
      const file = await createTestPDFFile(3);
      await service.loadPDF(file);

      const compressed = await service.compressPDF();

      expect(compressed).toBeInstanceOf(Uint8Array);
      expect(compressed.length).toBeGreaterThan(0);
    });
  });

  describe("getPDFSize", () => {
    it("should return the size in bytes", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      const size = await service.getPDFSize();

      expect(size).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────
  // Bookmarks & Links (limited by pdf-lib)
  // ──────────────────────────────────────
  describe("getOutline", () => {
    it("should return an empty array (pdf-lib limitation)", () => {
      expect(service.getOutline()).toEqual([]);
    });
  });

  describe("addBookmark", () => {
    it("should not throw (stub implementation)", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      await expect(service.addBookmark("Chapter 1", 0)).resolves.not.toThrow();
    });
  });

  describe("addUrlLink", () => {
    it("should add a visual link indicator", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      await expect(
        service.addUrlLink(0, { x: 50, y: 50, width: 100, height: 20 }, "https://example.com"),
      ).resolves.not.toThrow();
    });

    it("should throw for invalid page index", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      await expect(
        service.addUrlLink(5, { x: 50, y: 50, width: 100, height: 20 }, "https://example.com"),
      ).rejects.toThrow("Invalid page index");
    });
  });

  describe("addPageLink", () => {
    it("should add an internal link indicator", async () => {
      const file = await createTestPDFFile(3);
      await service.loadPDF(file);

      await expect(
        service.addPageLink(0, { x: 50, y: 50, width: 100, height: 20 }, 2),
      ).resolves.not.toThrow();
    });

    it("should throw for invalid source page", async () => {
      const file = await createTestPDFFile(2);
      await service.loadPDF(file);

      await expect(
        service.addPageLink(5, { x: 50, y: 50, width: 100, height: 20 }, 0),
      ).rejects.toThrow("Invalid source page index");
    });

    it("should throw for invalid target page", async () => {
      const file = await createTestPDFFile(2);
      await service.loadPDF(file);

      await expect(
        service.addPageLink(0, { x: 50, y: 50, width: 100, height: 20 }, 10),
      ).rejects.toThrow("Invalid target page index");
    });
  });

  // ──────────────────────────────────────
  // Sticky Notes
  // ──────────────────────────────────────
  describe("addStickyNote", () => {
    it("should add a sticky note to a valid page", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      await expect(
        service.addStickyNote({
          pageNumber: 1,
          x: 100,
          y: 200,
          content: "This is a note",
          author: "Test User",
          color: "#FFFF00",
        }),
      ).resolves.not.toThrow();
    });

    it("should add a sticky note without optional content", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      await expect(
        service.addStickyNote({
          pageNumber: 1,
          x: 100,
          y: 200,
          content: "",
        }),
      ).resolves.not.toThrow();
    });
  });

  // ──────────────────────────────────────
  // Export to Images
  // ──────────────────────────────────────
  describe("getPageAsImageData", () => {
    it("should return metadata for a valid page", async () => {
      const file = await createTestPDFFile(3);
      await service.loadPDF(file);

      const result = await service.getPageAsImageData(1, "png");

      expect(result).toEqual({ pageIndex: 1, format: "png" });
    });

    it("should throw for an invalid page index", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file);

      await expect(service.getPageAsImageData(5)).rejects.toThrow("Invalid page index");
    });
  });

  // ──────────────────────────────────────
  // Reset
  // ──────────────────────────────────────
  describe("reset", () => {
    it("should clear all internal state", async () => {
      const file = await createTestPDFFile();
      await service.loadPDF(file, "pw");

      expect(service.getPageCount()).toBe(1);
      expect(service.getPassword()).toBe("pw");

      service.reset();

      expect(service.getPageCount()).toBe(0);
      expect(service.getPassword()).toBeUndefined();
    });
  });
});
