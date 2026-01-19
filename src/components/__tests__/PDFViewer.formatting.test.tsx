import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PDFViewer from "../PDFViewer";

// Mock pdfjs-dist
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn(() =>
        Promise.resolve({
          getViewport: vi.fn(() => ({
            width: 612,
            height: 792,
            scale: 1,
          })),
          render: vi.fn(() => ({
            promise: Promise.resolve(),
          })),
          getAnnotations: vi.fn(() => Promise.resolve([])),
        }),
      ),
    }),
  })),
}));

// Mock pdfEditor service
vi.mock("@/services/pdfEditor", () => ({
  pdfEditorService: {
    loadPDF: vi.fn(),
    fillFormField: vi.fn(),
    addText: vi.fn(),
    addImage: vi.fn(),
    getPassword: vi.fn(() => undefined),
  },
}));

describe("PDFViewer - Text Formatting Features", () => {
  const mockFile = new File(["test"], "test.pdf", {
    type: "application/pdf",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Bold Formatting", () => {
    it("should toggle bold formatting when Bold button is clicked", async () => {
      render(<PDFViewer file={mockFile} />);

      // Wait for PDF to load and switch to Add Text mode
      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      // Get the overlay and double-click to add text
      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      // After double-click, it automatically switches to Select mode
      // Wait for text annotation to appear
      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      // Type some text
      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test Text" } });

      // Click on the text input to select the annotation
      fireEvent.mouseDown(textInput.parentElement!);

      // Wait for formatting toolbar to appear
      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });

      const boldButton = screen.getByTitle("Bold");

      // Click bold button - it should stay visible
      fireEvent.click(boldButton);

      // Bold button should still be visible after clicking
      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });

      // Verify the button shows active state (has indigo background)
      expect(boldButton).toHaveClass("bg-indigo-50");
    });

    it("should allow multiple formatting button clicks without disappearing", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test" } });
      fireEvent.mouseDown(textInput.parentElement!);

      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });

      // Click Bold button multiple times
      const boldButton = screen.getByTitle("Bold");
      fireEvent.click(boldButton);
      fireEvent.click(boldButton);
      fireEvent.click(boldButton);

      // Button should still be visible
      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });
    });
  });

  describe("Italic Formatting", () => {
    it("should toggle italic formatting when Italic button is clicked", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test Text" } });
      fireEvent.mouseDown(textInput.parentElement!);

      await waitFor(() => {
        expect(screen.getByTitle("Italic")).toBeInTheDocument();
      });

      // Find and click the Italic button
      const italicButton = screen.getByTitle("Italic");
      expect(italicButton).toBeInTheDocument();

      fireEvent.click(italicButton);

      // Italic button should still be visible
      await waitFor(() => {
        expect(screen.getByTitle("Italic")).toBeInTheDocument();
      });

      // Verify active state
      expect(italicButton).toHaveClass("bg-indigo-50");
    });

    it("should apply both bold and italic formatting", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test" } });
      fireEvent.mouseDown(textInput.parentElement!);

      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });

      const boldButton = screen.getByTitle("Bold");
      const italicButton = screen.getByTitle("Italic");

      // Click both buttons
      fireEvent.click(boldButton);
      fireEvent.click(italicButton);

      // Both buttons should be active
      await waitFor(() => {
        expect(boldButton).toHaveClass("bg-indigo-50");
        expect(italicButton).toHaveClass("bg-indigo-50");
      });

      // Both buttons should still be visible
      expect(screen.getByTitle("Bold")).toBeInTheDocument();
      expect(screen.getByTitle("Italic")).toBeInTheDocument();
    });
  });

  describe("Font Size Controls", () => {
    it("should increase font size when plus button is clicked", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test" } });
      fireEvent.mouseDown(textInput.parentElement!);

      await waitFor(() => {
        expect(screen.getByTitle("Increase font size")).toBeInTheDocument();
      });

      // Find the increase font size button
      const increaseButton = screen.getByTitle("Increase font size");
      expect(increaseButton).toBeInTheDocument();

      // Initial font size should be 12
      expect(screen.getByText("12")).toBeInTheDocument();

      // Click to increase
      fireEvent.click(increaseButton);

      // Font size should increase to 14
      await waitFor(() => {
        expect(screen.getByText("14")).toBeInTheDocument();
      });

      // Button should still be visible
      expect(screen.getByTitle("Increase font size")).toBeInTheDocument();
    });

    it("should decrease font size when minus button is clicked", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test" } });
      fireEvent.mouseDown(textInput.parentElement!);

      await waitFor(() => {
        expect(screen.getByTitle("Decrease font size")).toBeInTheDocument();
      });

      // Find the decrease font size button
      const decreaseButton = screen.getByTitle("Decrease font size");
      expect(decreaseButton).toBeInTheDocument();

      // Click to decrease
      fireEvent.click(decreaseButton);

      // Font size should decrease to 10
      await waitFor(() => {
        expect(screen.getByText("10")).toBeInTheDocument();
      });

      // Button should still be visible
      expect(screen.getByTitle("Decrease font size")).toBeInTheDocument();
    });

    it("should not decrease font size below 8", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test" } });
      fireEvent.mouseDown(textInput.parentElement!);

      await waitFor(() => {
        expect(screen.getByTitle("Decrease font size")).toBeInTheDocument();
      });

      const decreaseButton = screen.getByTitle("Decrease font size");

      // Click multiple times to reach minimum
      fireEvent.click(decreaseButton);
      fireEvent.click(decreaseButton);
      fireEvent.click(decreaseButton);
      fireEvent.click(decreaseButton);
      fireEvent.click(decreaseButton);

      // Should stop at 8
      await waitFor(() => {
        expect(screen.getByText("8")).toBeInTheDocument();
      });

      // One more click should not go below 8
      fireEvent.click(decreaseButton);
      await waitFor(() => {
        expect(screen.getByText("8")).toBeInTheDocument();
      });
    });

    it("should not increase font size above 72", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test" } });
      fireEvent.mouseDown(textInput.parentElement!);

      await waitFor(() => {
        expect(screen.getByTitle("Increase font size")).toBeInTheDocument();
      });

      const increaseButton = screen.getByTitle("Increase font size");

      // Click many times to reach maximum (from 12 to 72 = 30 clicks)
      for (let i = 0; i < 35; i++) {
        fireEvent.click(increaseButton);
      }

      // Should stop at 72
      await waitFor(() => {
        expect(screen.getByText("72")).toBeInTheDocument();
      });
    });
  });

  describe("Formatting Toolbar Persistence", () => {
    it("should keep formatting toolbar visible after clicking any button", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test" } });
      fireEvent.mouseDown(textInput.parentElement!);

      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });

      // Get all formatting buttons
      const boldButton = screen.getByTitle("Bold");
      const italicButton = screen.getByTitle("Italic");
      const increaseButton = screen.getByTitle("Increase font size");
      const decreaseButton = screen.getByTitle("Decrease font size");

      // Click each button and verify toolbar stays visible
      fireEvent.click(boldButton);
      expect(screen.getByTitle("Bold")).toBeInTheDocument();

      fireEvent.click(italicButton);
      expect(screen.getByTitle("Italic")).toBeInTheDocument();

      fireEvent.click(increaseButton);
      expect(screen.getByTitle("Increase font size")).toBeInTheDocument();

      fireEvent.click(decreaseButton);
      expect(screen.getByTitle("Decrease font size")).toBeInTheDocument();

      // All buttons should still be visible
      expect(screen.getByTitle("Bold")).toBeInTheDocument();
      expect(screen.getByTitle("Italic")).toBeInTheDocument();
      expect(screen.getByTitle("Increase font size")).toBeInTheDocument();
      expect(screen.getByTitle("Decrease font size")).toBeInTheDocument();
    });

    it("should hide toolbar only when clicking outside the annotation", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test" } });
      fireEvent.mouseDown(textInput.parentElement!);

      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });

      // Toolbar should be visible
      expect(screen.getByTitle("Bold")).toBeInTheDocument();

      // Click on the overlay (outside annotation)
      fireEvent.click(overlay);

      // Toolbar should be hidden (annotation deselected)
      await waitFor(() => {
        expect(screen.queryByTitle("Bold")).not.toBeInTheDocument();
      });
    });
  });

  describe("Delete Button", () => {
    it("should keep delete button visible when clicked", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      });

      const addTextButton = screen.getByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = screen.getByTestId("pdf-overlay");
      fireEvent.doubleClick(overlay, {
        clientX: 100,
        clientY: 100,
      });

      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
        expect(inputs.length).toBeGreaterThan(0);
      });

      const textInput = screen.getAllByPlaceholderText(/Type here.../i)[0];
      fireEvent.change(textInput, { target: { value: "Test" } });
      fireEvent.mouseDown(textInput.parentElement!);

      await waitFor(() => {
        expect(screen.getByTitle("Delete")).toBeInTheDocument();
      });

      // Find delete button
      const deleteButton = screen.getByTitle("Delete");
      expect(deleteButton).toBeInTheDocument();

      // Click delete
      fireEvent.click(deleteButton);

      // Text annotation should be removed
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/Type here.../i),
        ).not.toBeInTheDocument();
      });
    });
  });
});
