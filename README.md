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
- [Getting Started](#-getting-started)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Features
- **📄 PDF Viewing** - High-quality rendering with zoom, page navigation, and thumbnails
- **📝 Form Filling** - Automatic field detection with text inputs and checkboxes
- **✍️ Text Annotations** - Add, edit, drag, style with colors, bold/italic
- **🖼️ Image/Signature** - Insert images and signatures via drag-and-drop
- **🔒 Privacy First** - 100% client-side; no files uploaded to servers

### Editing Tools
- **↩️ Undo/Redo** - Full history with Ctrl+Z / Ctrl+Y keyboard shortcuts
- **🎨 Drawing** - Freehand pen, highlighter, shapes (rectangle, circle, arrow, line)
- **🔍 Search** - Find text with Ctrl+F, highlighted matches, navigation
- **📑 Page Management** - Rotate, delete, extract, insert blank pages

### Professional Features  
- **✒️ Signature Pad** - Draw or type signatures, save for reuse
- **█ Redaction** - Preview and permanently black out sensitive content
- **💧 Watermark** - Text/image with configurable opacity, position, rotation
- **📋 Header/Footer** - Page numbers, dates, custom text with positioning
- **🔐 Password Protection** - Encrypt PDF output with permissions

### User Experience
- **🌓 Dark/Light Theme** - Toggle between themes
- **📱 Responsive Design** - Works on desktop and tablet
- **⚡ PWA Support** - Install as desktop/mobile app

## 🎬 Demo

👉 **[Launch Live Demo](https://pdf-editor-ten-alpha.vercel.app/)**

**Quick Start:**

1. Upload a PDF.
2. Click fields to fill or double-click to add text.
3. Click "Apply Fields" then "Save" to download.

## 🚀 Getting Started

```bash
# 1. Clone & Install
git clone https://github.com/devlinduldulao/pdf-editor.git
cd pdf-editor && npm install

# 2. Start Dev Server
npm run dev

# 3. Build / Test
npm run build
npm run test
```

## 🗺️ Roadmap

### ✅ Completed
- [x] Undo/Redo System
- [x] Page Management (rotate, delete, extract, insert)
- [x] Drawing & Markup Tools (freehand, highlighter, shapes)
- [x] Text Color & Styling
- [x] Search & Find (Ctrl+F)
- [x] Thumbnail Navigation
- [x] Signature Management
- [x] Redaction Tools
- [x] Password Protection
- [x] Watermark
- [x] Header/Footer

### 🔜 Planned (Future Releases)
- [ ] Document Comparison (side-by-side diff)
- [ ] OCR Text Recognition
- [ ] PDF Compression
- [ ] Bookmark Editor
- [ ] Export to Images (PNG/JPG)
- [ ] Sticky Notes & Comments

See [FEATURE_ROADMAP.md](docs/FEATURE_ROADMAP.md) for full details.

## 🤝 Contributing

PRs welcome! Please fork, create a feature branch, and submit a PR.

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

**Built with ❤️ using React, TypeScript, and Vite**
