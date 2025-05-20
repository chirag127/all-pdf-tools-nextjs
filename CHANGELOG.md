# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-05-20T20:01:58.778Z (UTC)

### Added

#### Backend
- Initial FastAPI project setup
- PDF operations API endpoints:
  - Merge PDFs
  - Split PDF
  - Extract Pages
  - Rotate PDF
  - Add Page Numbers
  - Add Watermark
  - Crop PDF
  - Protect PDF
  - Unlock PDF
  - Compress PDF
  - Repair PDF
- AI features API endpoints:
  - List Gemini models
  - Chat with PDF
  - Summarize PDF
  - Translate PDF
  - Generate Questions
- PDF service implementation for all PDF operations
- Gemini API integration for AI features
- Temporary file management system
- Error handling and logging

#### Frontend
- Initial Next.js project setup
- Responsive UI with dark mode support
- Home page with feature categories
- PDF Tools page with tool categories
- AI Features page
- Settings page for Gemini API configuration
- API client for backend integration
- State management with Zustand
- Common UI components:
  - Button
  - Card
  - FileUpload
  - Header
  - Footer

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)
