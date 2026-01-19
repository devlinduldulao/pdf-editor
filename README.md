# PDF Editor

<p align="center">
  <strong>A modern, browser-based PDF editor built with React, TypeScript, and Vite. Edit PDF documents, fill form fields, add text annotations, and insert images—all directly in your browser without uploading files to any server.</strong>
</p>

<p align="center">
  <!-- CI/CD & Deployment Status -->
  <a href="https://github.com/devlinduldulao/pdf-editor/actions">
    <img src="https://github.com/devlinduldulao/pdf-editor/workflows/CI/badge.svg" alt="CI Status">
  </a>
  <a href="https://vercel.com">
    <img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white" alt="Deployed on Vercel">
  </a>
</p>

<p align="center">
  <!-- Tech Stack -->
  <img src="https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/shadcn%2Fui-Latest-000000?logo=shadcnui&logoColor=white" alt="shadcn/ui">
  <img src="https://img.shields.io/badge/PDF.js-5.4-FF6B35?logo=adobe&logoColor=white" alt="PDF.js">
  <img src="https://img.shields.io/badge/pdf--lib-1.17-FF6B35?logo=adobe&logoColor=white" alt="pdf-lib">
  <img src="https://img.shields.io/badge/Vitest-4.0-6E9F18?logo=vitest&logoColor=white" alt="Vitest">
</p>

## 📋 Table of Contents

- [Features](#-features)
- [Demo](#-demo)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Building for Production](#building-for-production)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Functionality

- **📄 PDF Viewing** - View PDF documents with high-quality rendering using PDF.js
- **📝 Form Filling** - Automatically detect and fill interactive PDF form fields
- **✍️ Text Annotations** - Add custom text anywhere on the PDF with adjustable positioning
- **🖼️ Image Insertion** - Insert images (signatures, stamps, logos) via upload or drag-and-drop
- **💾 Save & Export** - Download edited PDFs with all changes preserved

### User Experience

- **🎨 Modern UI** - Clean, intuitive interface built with Tailwind CSS and shadcn/ui
- **🔒 Privacy First** - All processing happens locally in your browser—no server uploads
- **📱 Responsive Design** - Works seamlessly on desktop and tablet devices
- **⚡ Real-time Preview** - See changes immediately as you edit
- **🎯 Smart Navigation** - Easy page navigation with zoom controls
- **🖱️ Drag & Drop** - Move text and images freely, resize images as needed

### Advanced Features

- **Two Edit Modes:**
  - **Select Mode** - Move and reposition annotations by dragging
  - **Add Text Mode** - Double-click to add new text annotations
- **Interactive Checkboxes** - Fill checkbox form fields with a single click
- **Image Manipulation** - Resize images with visual handles, delete unwanted elements
- **Right-click to Delete** - Remove text annotations with context menu
- **Keyboard Shortcuts** - Press Enter to confirm text input

## 🎬 Demo

Visit the [Live Demo](https://pdf-editor-ten-alpha.vercel.app/) to try the application.

### Quick Start Example:

1. Upload a PDF document
2. Click form fields to fill them
3. Switch to "Add Text" mode and double-click to add text
4. Click "Add Image" to insert signatures or stamps
5. Use "Select" mode to reposition elements
6. Click "Apply Fields" then "Save" to download

## 🛠️ Tech Stack

### Core Technologies

- **[React 19.2.3](https://react.dev/)** - UI framework with modern hooks and concurrent features
- **[TypeScript 5.9.3](https://www.typescriptlang.org/)** - Type-safe development
- **[Vite 8.0](https://vitejs.dev/)** - Lightning-fast build tool and dev server

### PDF Libraries

- **[PDF.js 5.4.530](https://mozilla.github.io/pdf.js/)** - PDF rendering and parsing (Mozilla)
- **[pdf-lib 1.17.1](https://pdf-lib.js.org/)** - PDF creation and modification

### UI Components & Styling

- **[Tailwind CSS 4.1.18](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible component system
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **[clsx](https://github.com/lukeed/clsx)** & **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Conditional styling utilities

### Development Tools

- **[Vitest 4.0.17](https://vitest.dev/)** - Unit testing framework
- **[Testing Library](https://testing-library.com/)** - React component testing
- **[ESLint](https://eslint.org/)** - Code linting
- **[TypeScript ESLint](https://typescript-eslint.io/)** - TypeScript-specific linting

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 18.x or higher)
- **npm** or **yarn** or **pnpm**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/devlinduldulao/pdf-editor.git
   cd pdf-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the optimized production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Other Scripts

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm run test
```

## 📖 Usage Guide

### 1. Loading a PDF

- **Method 1**: Click the upload area and select a PDF file from your computer
- **Method 2**: Drag and drop a PDF file onto the upload area

### 2. Navigating the PDF

- Use the **Previous/Next** buttons to navigate between pages
- View current page number in the format "1 / 5"
- Use **Zoom In/Out** buttons to adjust viewing size (50% - 300%)

### 3. Filling Form Fields

1. Form fields are automatically detected and highlighted with blue borders
2. Click on any text field to type content
3. Click checkboxes to toggle them on/off
4. Fields show tooltips with their names on hover

### 4. Adding Text Annotations

1. Click the **"Add Text"** button in the toolbar
2. Double-click anywhere on the PDF to create a text box
3. Type your text directly
4. Press **Enter** or click **Add** to confirm
5. Switch to **"Select"** mode to move the text by dragging

### 5. Working with Images

**Adding Images:**

- **Method 1**: Click **"Add Image"** button and select an image file
- **Method 2**: Drag an image directly from your computer onto the PDF

**Manipulating Images:**

- **Move**: Click and drag the image
- **Resize**: Click and drag the resize handle (bottom-right corner)
- **Delete**: Click the red delete button (top-right corner)

### 6. Edit Modes

**Select Mode** (Default):

- Move text annotations and images by dragging
- Double-click text to edit content
- Right-click text to delete

**Add Text Mode**:

- Double-click anywhere to create new text annotations
- Existing text cannot be moved in this mode

### 7. Saving Your Work

1. Click **"Apply Fields"** to commit all changes to the PDF
2. Click **"Save"** to download with the original filename
3. Click **"Export"** to save with a custom filename

### 8. Starting Fresh

Click **"New"** in the menu bar to start with a new document (will prompt for confirmation)

## 📁 Project Structure

```
pdf-editor/
├── public/                      # Static assets
├── src/
│   ├── components/             # React components
│   │   ├── MenuBar.tsx        # Top navigation bar
│   │   ├── PDFEditor.tsx      # PDF editing controls (legacy)
│   │   ├── PDFUploader.tsx    # File upload component
│   │   ├── PDFViewer.tsx      # Main PDF viewer and editor
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── input.tsx
│   │   │   └── label.tsx
│   │   └── __tests__/         # Component tests
│   │
│   ├── services/              # Business logic
│   │   ├── pdfEditor.ts      # PDF manipulation service
│   │   └── __tests__/        # Service tests
│   │
│   ├── lib/                   # Utilities
│   │   └── utils.ts          # Helper functions
│   │
│   ├── styles/               # Component-specific CSS
│   │   ├── MenuBar.css
│   │   ├── PDFEditor.css
│   │   ├── PDFUploader.css
│   │   └── PDFViewer.css
│   │
│   ├── test/                 # Test configuration
│   │   └── setup.ts
│   │
│   ├── App.tsx              # Root application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
│
├── docs/                     # Documentation
│   ├── BEST_PRACTICES_GUIDE.md
│   ├── DOCUMENTATION_INDEX.md
│   ├── IMPLEMENTATION_CHECKLIST.md
│   └── REACT_BEST_PRACTICES_APPLIED.md
│
├── components.json          # shadcn/ui configuration
├── eslint.config.js        # ESLint configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json            # Project dependencies
```

## 🏗️ Architecture

### Component Hierarchy

```
App
├── MenuBar (Navigation & Actions)
└── Main Content
    ├── PDFUploader (No document loaded)
    └── PDFViewer (Document loaded)
        ├── Toolbar (Edit modes, zoom, navigation)
        ├── Canvas (PDF rendering)
        └── Overlay (Annotations & form fields)
```

### Data Flow

1. **File Selection**: User uploads PDF → `App` → `pdfEditorService.loadPDF()`
2. **PDF Rendering**: `PDFViewer` uses PDF.js to render pages on canvas
3. **Form Detection**: `PDFViewer` extracts form fields from PDF annotations
4. **User Edits**: Form fields, text, and image annotations stored in component state
5. **Save**: User clicks "Apply Fields" → `pdfEditorService` uses pdf-lib to modify PDF → Download

### State Management

- **App Level**: Current file, filename
- **PDFViewer Level**:
  - PDF document reference
  - Current page, zoom level
  - Form fields and values
  - Text and image annotations
  - Edit mode (select/add text)

### Service Layer

**PDFEditorService** (`src/services/pdfEditor.ts`):

- Singleton service handling PDF manipulation
- Methods:
  - `loadPDF(file)` - Load PDF into memory
  - `addText(annotation)` - Add text to specific page coordinates
  - `addImage(annotation)` - Add image to specific page coordinates
  - `fillFormField(name, value)` - Fill form field by name
  - `savePDF()` - Generate modified PDF bytes
  - `downloadPDF(filename)` - Trigger browser download
  - `reset()` - Clear current document

## 📚 API Reference

### PDFEditorService

#### `loadPDF(file: File): Promise<void>`

Loads a PDF file into memory for editing.

**Parameters:**

- `file` - PDF file object

**Throws:** Error if PDF cannot be loaded

#### `addText(annotation: TextAnnotation): Promise<void>`

Adds text annotation to the PDF.

**Parameters:**

```typescript
interface TextAnnotation {
  id: string;
  text: string;
  x: number; // X coordinate in PDF points
  y: number; // Y coordinate in PDF points
  pageNumber: number; // 1-based page index
  fontSize?: number; // Font size (default: 12)
}
```

#### `addImage(annotation: ImageAnnotation): Promise<void>`

Adds image to the PDF.

**Parameters:**

```typescript
interface ImageAnnotation {
  id: string;
  imageData: string; // Base64 data URL
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}
```

#### `fillFormField(fieldName: string, value: string): Promise<void>`

Fills a PDF form field with the specified value.

**Parameters:**

- `fieldName` - Name of the form field
- `value` - Value to fill

#### `downloadPDF(filename?: string): Promise<void>`

Downloads the edited PDF with all modifications.

**Parameters:**

- `filename` - Optional custom filename (default: "edited-document.pdf")

### Component Props

#### PDFUploader

```typescript
interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
}
```

#### PDFViewer

```typescript
interface PDFViewerProps {
  file: File | null;
}
```

#### MenuBar

```typescript
interface MenuBarProps {
  onSave: () => void;
  onSaveAs: () => void;
  onNew: () => void;
  hasDocument: boolean;
}
```

## 🧪 Testing

The project uses Vitest and React Testing Library for testing.

### Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
src/
├── __tests__/
│   └── App.test.tsx
├── components/__tests__/
│   ├── PDFUploader.test.tsx
│   └── PDFViewer.test.tsx
└── services/__tests__/
    └── pdfEditor.test.ts
```

### Writing Tests

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## 🎨 Styling Conventions

### Tailwind CSS Classes

- Use utility-first approach
- Group related utilities (layout → spacing → colors → effects)
- Prefer semantic color names from the Tailwind palette

### Component Structure

```tsx
<div className="flex flex-col gap-4">
  {" "}
  {/* Layout */}
  <div className="p-4 rounded-lg">
    {" "}
    {/* Spacing & borders */}
    <div className="bg-white shadow-md">
      {" "}
      {/* Colors & effects */}
      Content
    </div>
  </div>
</div>
```

### Color Palette

- **Primary**: Indigo/Purple (`indigo-600`, `purple-600`)
- **Background**: Slate (`slate-100`, `slate-900`)
- **Form highlights**: Blue (`blue-500`)
- **Success**: Green
- **Danger**: Red (`red-500`)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Use camelCase for variables and functions in TypeScript/JavaScript
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

### Code Style

- **TypeScript**: Use explicit types, avoid `any`
- **React**: Use functional components with hooks
- **Naming**: Use descriptive names (e.g., `handleFileSelect`, `getFieldPosition`)
- **Comments**: Add comments for complex logic only

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla for PDF rendering
- [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/devlinduldulao/pdf-editor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/devlinduldulao/pdf-editor/discussions)
- **Author**: Devlin Duldulao

## 🗺️ Roadmap

Future enhancements planned:

- [ ] **Open Password-Protected PDFs** (Unlock and view secured files)
- [ ] **Security & Protection**
  - [ ] Redaction (Permanently remove sensitive content)
  - [ ] Password Encryption (Secure files with AES-256)
  - [ ] Permissions Management (Restrict printing, copying, editing)
- [ ] **Advanced Page Manipulation**
  - [ ] Convert PDF (to Word, Excel, PowerPoint)
  - [ ] Compress/Optimize (Reduce file size)
  - [ ] Flatten PDF (Merge annotations into base layer)
- [ ] **Professional Editing**
  - [ ] Edit Original Text (Modify existing base content)
  - [ ] Form Creation (Add new fields, checkboxes, dropdowns)
  - [ ] Bates Numbering (Legal document indexing)
  - [ ] Watermarking (Add text/image watermarks)
- [ ] **Workflow & Collaboration**
  - [ ] eSign Workflows (Audit trails, request signatures)
  - [ ] Compare Documents (Diff view for versions)
- [ ] OCR text extraction
- [ ] Cloud storage integration
- [ ] Mobile app versions

---

**Built with ❤️ using React, TypeScript, and Vite**
