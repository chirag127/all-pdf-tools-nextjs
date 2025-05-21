# Masterplan for All PDF Tools

Document Version: 1.0
Owner: Chirag Singhal
Status: final
Prepared for: augment code assistant
Prepared by: Chirag Singhal

---

## Project Overview

All PDF Tools is a comprehensive Next.js web application designed to provide users with a complete suite of PDF manipulation tools. The application will function as an all-in-one PDF utility, accessible from desktop and mobile devices, allowing users to perform various operations on PDF files directly in their browser. Key features include document organization, conversion, editing, security, enhancement, and AI-powered functionalities leveraging the Gemini API. The application prioritizes client-side processing to minimize server load, with a Python FastAPI backend handling tasks unsuitable for the client and all AI API interactions. No user authentication is required; AI features rely on a user-provided Gemini API key.

## Project Goals

-   Provide a free, comprehensive, and accessible suite of PDF tools.
-   Enable users to perform common PDF operations without needing to install desktop software.
-   Offer a seamless experience on both desktop and mobile web browsers.
-   Implement most PDF processing client-side for speed and to reduce backend dependency.
-   Integrate AI-powered PDF tools (Chat, Summarize, Translate) using the Gemini API with a user-provided key.
-   Ensure user-friendly file handling, including picking from local storage and saving processed files.
-   Maintain user privacy by processing files locally where possible and not requiring user accounts or cloud storage for user files.

## Technical Stack

-   **Frontend**: Next.js (latest stable version), React, TypeScript (recommended), Tailwind CSS (recommended for styling utility), JavaScript PDF libraries (e.g., `pdf-lib.js`, `PDF.js` for client-side operations).
-   **Backend**: Python 3.x, FastAPI, Uvicorn. Libraries for PDF processing (e.g., `PyPDF2`, `reportlab`, `pikepdf` for general tasks; `pytesseract` for OCR; `google-generativeai` for Gemini).
-   **Database**: None required for user data. `localStorage` for storing user's Gemini API key (with disclaimers).
-   **Deployment**:
    -   Frontend (Next.js): Vercel (recommended for Next.js) or any static hosting provider.
    -   Backend (FastAPI): Render.com (free tier: 0.1 CPU, 512MB RAM, as specified).

## Project Scope

### In Scope

-   All features listed in Section 3 of the raw idea (Document Organization, Conversion, Editing, Security, Enhancement, AI Features).
-   Client-side implementation for as many PDF features as feasible.
-   Backend implementation for complex PDF tasks (e.g., OCR, Repair, some conversions) and all Gemini API interactions.
-   User interface for uploading files, selecting operations, configuring options, and downloading results.
-   Settings page for users to input and store their Gemini API key.
-   Interface for selecting Gemini models for AI features.
-   Support for PDF files up to 100MB.
-   Progress indicators for long-running operations.
-   Error handling for corrupted/incompatible PDFs and API issues.
-   Temporary file cleanup.
-   Responsive design for usability on desktop and mobile browsers.
-   Localization: English UI initially, codebase structured for future i18n.

### Out of Scope

-   User authentication or accounts.
-   Cloud storage for user PDF files.
-   Advanced collaborative editing features.
-   Real-time multi-user interactions.
-   Native mobile applications (iOS/Android) – focus is on a web application.
-   Editing complex embedded vector graphics or very intricate PDF structures beyond basic text/image addition.
-   Automated saving to cloud storage services (e.g., Google Drive, Dropbox) directly from the app.

## Functional Requirements

### Feature Area 1: Document Organization

-   **FR1.1 (Merge PDF):** Allow users to select multiple PDF files and combine them into a single PDF document. User must be able to specify the order of the merged files.
-   **FR1.2 (Split PDF):** Allow users to split a single PDF into multiple documents. Options: by specific page ranges (e.g., 1-5, 6-10), or split every page into an individual PDF.
-   **FR1.3 (Remove Pages):** Allow users to select specific pages (by number or visual selection) from a PDF and create a new PDF without these pages.
-   **FR1.4 (Extract Pages):** Allow users to select specific pages from a PDF and save them as a new, separate PDF document.
-   **FR1.5 (Organize Pages):** Provide an interface to view thumbnails of all pages in a PDF. Allow users to reorder pages by drag-and-drop, rotate individual pages, and delete individual pages within this view.

### Feature Area 2: Conversion Tools

-   **FR2.1 (To PDF):** Convert various file formats (JPG, PNG, WEBP, DOC, DOCX, PPT, PPTX, XLS, XLSX, HTML, TXT, RTF, EPUB, ODT, ODG, ODS, ODP, TIFF, SVG, HEIC) to PDF. Support single or multiple file uploads for batch conversion (where applicable, e.g., images to one PDF). Provide layout customization options (e.g., page size, orientation, image fit for image-to-PDF).
-   **FR2.2 (From PDF):** Convert PDF files to various formats (JPG, PNG, WEBP, DOC, DOCX, PPT, PPTX, XLS, XLSX, HTML, TXT, RTF, EPUB, ODT, ODG, ODS, ODP, TIFF, SVG, HEIC). Allow selection of page ranges for conversion. PDF to Secure PDF (apply password). PDF to PDF/A (for archiving).

### Feature Area 3: Editing Tools

-   **FR3.1 (Rotate PDF):** Allow users to rotate all pages or selected pages in a PDF by 90°, 180°, or 270°.
-   **FR3.2 (Add Page Numbers):** Allow users to insert page numbers into a PDF. Customizable options: position (header/footer, left/center/right), starting number, format (e.g., "Page X of Y").
-   **FR3.3 (Add Watermark):** Allow users to add text or image watermarks to PDF pages. Customizable options: text content/font/size/color, image selection, opacity, position (e.g., tiled, centered), rotation.
-   **FR3.4 (Crop PDF):** Allow users to define a crop area visually on a page preview or by inputting margin values. Apply crop to selected pages or all pages.
-   **FR3.5 (Basic Text/Image Editing):** Allow users to add new text boxes with basic formatting (font, size, color) and add new images (from upload) onto PDF pages. (Note: Modifying existing complex embedded content is out of scope for "basic").

### Feature Area 4: Security Tools

-   **FR4.1 (Unlock PDF):** Allow users to upload a password-protected PDF. If the user provides the correct password, remove the password protection and allow saving an unlocked version. Handle cases where the password is not known (inform user).
-   **FR4.2 (Protect PDF):** Allow users to add password protection (owner and/or user password) to a PDF. Options for restricting permissions (e.g., printing, copying, editing).
-   **FR4.3 (Sign PDF):** Allow users to add a digital signature to a PDF. This could involve drawing a signature, typing text that's converted to a signature font, or uploading an image of a signature. (Note: This is for visual signing, not cryptographically secure digital signatures unless explicitly planned further).
-   **FR4.4 (Redact PDF):** Allow users to draw boxes over sensitive content. Upon processing, the content in these areas should be permanently removed (not just covered).

### Feature Area 5: Enhancement Tools

-   **FR5.1 (Compress PDF):** Reduce the file size of a PDF. Offer quality presets (e.g., high compression/low quality, medium, low compression/high quality).
-   **FR5.2 (Repair PDF):** Attempt to repair corrupted or damaged PDF files to make them viewable or usable. This will likely be a backend process.
-   **FR5.3 (OCR PDF):** Convert scanned PDFs (image-based) or PDFs with images containing text into searchable and selectable text. This will be a backend process. Primarily English, with potential for other languages.
-   **FR5.4 (Scan to PDF):** Allow users to use their device camera (via browser API) to capture images of documents and convert them into a PDF. Basic capture, with option to take multiple shots for a multi-page PDF.
-   **FR5.5 (Compare PDF):** Allow users to upload two PDF files and highlight the visual differences between them. (This can be complex; initial version might focus on textual differences if visual is too hard).

### Feature Area 6: AI Features (Gemini API Integration)

-   **FR6.1 (User Gemini API Key):** Provide a settings page where users can enter and save their own Gemini API key. The key should be stored in browser `localStorage` with a clear disclaimer about local storage security.
-   **FR6.2 (Model Selection):** Allow users to select from a list of available Gemini models (fetched via the API) for AI operations.
-   **FR6.3 (Chat with PDF):**
    -   User uploads a PDF.
    -   Backend extracts text (and relevant structural info if possible) from the PDF.
    -   Backend implements RAG: chunks text, creates embeddings (if necessary, or relies on Gemini's context window for smaller docs), and prepares context for Gemini.
    -   User can ask questions about the PDF content.
    -   Frontend sends questions to backend; backend queries Gemini with context and question.
    -   Display AI-generated answers.
-   **FR6.4 (AI PDF Summarizer):**
    -   User uploads a PDF.
    -   Backend processes PDF for RAG (as in FR6.3).
    -   User requests a summary.
    -   Backend sends content/context to Gemini with a summarization prompt.
    -   Display AI-generated summary.
-   **FR6.5 (Translate PDF):**
    -   User uploads a PDF and selects target language(s).
    -   Backend processes PDF for RAG.
    -   Backend sends text content (chunk by chunk if necessary) to Gemini for translation.
    -   Provide translated text or attempt to reconstruct a translated PDF (simple text replacement).
-   **FR6.6 (AI Question Generator):**
    -   User uploads a PDF.
    -   Backend processes PDF for RAG.
    -   Backend sends content/context to Gemini with a prompt to generate relevant questions based on the content.
    -   Display AI-generated questions.

## Non-Functional Requirements (NFR)

-   **7.1. Performance:**
    -   Client-side operations should feel responsive, with progress indicators for tasks longer than 2-3 seconds.
    -   PDF processing (client or server) for a 10MB file should generally complete within a reasonable timeframe (e.g., 5-30 seconds depending on operation complexity). Max 100MB file size support.
    -   AI feature responses should be timely, subject to Gemini API latency.
-   **7.2. Scalability:**
    -   Frontend should be scalable as it's mostly static assets and client-side logic.
    -   Backend (FastAPI on Render free tier) will have limitations (0.1 CPU, 512MB RAM). Prioritize client-side processing. Implement efficient background tasks and resource management on the server. Rate limiting for API calls to Gemini.
-   **7.3. Usability:**
    -   Intuitive and clear UI, easy for non-technical users.
    -   Clear feedback to the user (success, error, progress).
    -   Mobile-responsive design adapting to various screen sizes.
-   **7.4. Security:**
    -   User's Gemini API key stored in `localStorage` - provide clear warnings.
    -   All file processing, where possible, client-side to avoid unnecessary data transfer.
    -   Temporary files (both client and server) must be securely deleted after processing.
    -   Protect against common web vulnerabilities (XSS, CSRF) for the Next.js app.
-   **7.5. Maintainability:**
    -   Modular code structure (frontend and backend).
    -   Adherence to development guidelines (SOLID, DRY, KISS).
    -   Comprehensive comments and documentation.
-   **7.6. Reliability:**
    -   Robust error handling for PDF processing and API interactions.
    -   Graceful degradation if AI features are unavailable (e.g., API key invalid, Gemini service down).

## Implementation Plan

This section outlines the implementation plan, including phases and tasks.

### Phase 1: Setup & Foundation (Frontend & Backend)

-   **Task 1.1 (Project Setup):**
    -   Initialize Next.js project (TypeScript recommended): `frontend/`
    -   Initialize FastAPI project: `backend/`
    -   Setup version control (Git) and repository.
-   **Task 1.2 (Basic UI Layout):**
    -   Create main application layout (header, main content area, footer).
    -   Implement navigation (if multiple main pages, e.g., Home, Settings).
    -   Basic responsive design foundations.
-   **Task 1.3 (Backend Hello World & Deployment Setup):**
    -   Create basic FastAPI endpoint.
    -   Setup Dockerfile for backend.
    -   Initial deployment of backend to Render.com to verify pipeline.
    -   Initial deployment of Next.js frontend (e.g., Vercel).
-   **Task 1.4 (Core File Handling UI - Frontend):**
    -   Implement file input component (single/multiple PDF selection).
    -   Implement UI for selecting PDF operations (e.g., a sidebar or grid of tools).
    -   Basic display area for PDF previews or operation results.
    -   Download functionality for processed files.
-   **Task 1.5 (Client-Side PDF Library Integration - Frontend):**
    -   Research and select primary JavaScript PDF manipulation library (e.g., `pdf-lib.js`).
    -   Implement a simple client-side PDF operation (e.g., get page count) to test integration.
-   **Task 1.6 (Settings Page - Frontend):**
    -   Create UI for Gemini API key input.
    -   Implement logic to save/load API key from `localStorage`.
    -   Implement UI for Gemini model selection (initially can be a static list or fetched later).
-   **Task 1.7 (Backend Gemini API Setup - Backend):**

    -   Add `google-generativeai` Python SDK.
    -   Implement endpoint to list available Gemini models (using user-provided key passed from frontend).

    ```python
    # In backend/app/services/gemini_service.py or similar
    import google.generativeai as genai
    import os

    def list_gemini_models(api_key: str):
        """Lists available Gemini models for the given API key."""
        try:
            genai.configure(api_key=api_key)
            models_list = []
            for model in genai.list_models():
                # Ensure the model is one that supports generateContent, e.g., 'gemini-pro'
                if 'generateContent' in model.supported_generation_methods:
                    models_list.append({
                        "name": model.name,
                        "description": getattr(model, 'description', 'N/A'),
                        "input_token_limit": getattr(model, 'input_token_limit', 'N/A'),
                        "output_token_limit": getattr(model, 'output_token_limit', 'N/A')
                    })
            return models_list
        except Exception as e:
            # Log error and handle appropriately
            print(f"Error listing Gemini models: {e}")
            return None # Or raise custom exception

    # Example of how to integrate into FastAPI endpoint in backend/app/routers/ai_router.py
    # from fastapi import APIRouter, HTTPException, Header
    # router = APIRouter()
    # @router.get("/models")
    # async def get_models(x_gemini_api_key: str = Header(None)):
    #     if not x_gemini_api_key:
    #         raise HTTPException(status_code=400, detail="Gemini API key required in X-Gemini-API-Key header")
    #     models = list_gemini_models(x_gemini_api_key)
    #     if models is None:
    #         raise HTTPException(status_code=500, detail="Could not fetch models from Gemini")
    #     return models
    ```

    -   Frontend fetches this list and populates the model selection UI.

### Phase 2: Core PDF Functionality (Client-Side Focus)

-   **Task 2.1 (Document Organization - Client-Side):**
    -   Implement Merge PDF (using `pdf-lib.js`).
    -   Implement Split PDF (page ranges, individual pages).
    -   Implement Remove Pages.
    -   Implement Extract Pages.
    -   Implement Organize Pages (thumbnail generation using `PDF.js` for rendering, reordering logic, rotation, deletion with `pdf-lib.js`).
-   **Task 2.2 (Basic Conversions - Client-Side):**
    -   Implement Image (JPG, PNG) to PDF (using `pdf-lib.js` and canvas for image drawing).
    -   Implement PDF to Image (JPG, PNG) (using `PDF.js` to render pages to canvas, then export).
-   **Task 2.3 (Editing Tools - Client-Side):**
    -   Implement Rotate PDF.
    -   Implement Add Page Numbers.
    -   Implement Add Watermark (text and image).
    -   Implement Crop PDF (visual selection and margin input).
-   **Task 2.4 (Security Tools - Client-Side):**
    -   Implement Unlock PDF (if password known, `pdf-lib.js` can handle this).
    -   Implement Protect PDF (adding password protection).
-   **Task 2.5 (Enhancement Tools - Client-Side):**
    -   Implement Compress PDF (client-side compression can be challenging for significant results; might need a simpler approach or server-side if quality is paramount. Explore options like `pako.js` for stream compression if applicable, or image re-compression within PDFs). For now, focus on what `pdf-lib.js` can offer in terms of object optimization.
-   **Task 2.6 (Progress Indicators & Error Handling):**
    -   Integrate progress bars/spinners for all client-side operations.
    -   Implement robust error handling and user feedback for each feature.

### Phase 3: Server-Side PDF Functionality & Advanced Conversions

-   **Task 3.1 (Backend PDF Processing Setup - Backend):**
    -   Integrate Python PDF libraries (PyPDF2, pikepdf, reportlab).
    -   Create FastAPI endpoints for server-side PDF tasks.
    -   Securely handle file uploads (streaming, temporary storage) and downloads.
-   **Task 3.2 (Complex Conversions - Backend):**
    -   Implement DOC/DOCX to PDF (e.g., using `libreoffice` via subprocess, or a Python library like `docx2pdf`). This may be tricky on Render free tier. Consider alternatives or simpler text extraction.
    -   Implement PPT/PPTX to PDF.
    -   Implement XLS/XLSX to PDF.
    -   Implement HTML to PDF (e.g., `WeasyPrint` or `xhtml2pdf`).
    -   Implement other conversions listed in FR2.1 / FR2.2 that are not feasible client-side.
-   **Task 3.3 (OCR PDF - Backend):**
    -   Integrate `pytesseract` and Tesseract OCR engine (ensure it can be installed on Render).
    -   Create endpoint for OCR: upload PDF, extract images, OCR text, return text or searchable PDF.
-   **Task 3.4 (Repair PDF - Backend):**
    -   Research and implement PDF repair logic (e.g., using `pikepdf`'s repair capabilities or other tools).
    -   Create endpoint for Repair PDF.
-   **Task 3.5 (Scan to PDF - Frontend/Backend):**
    -   Frontend: Use `getUserMedia` to access camera, capture images.
    -   Frontend: Allow multiple captures, basic reordering/deletion of captured images.
    -   Frontend/Backend: Compile images into a PDF (client-side if simple, backend if server-side libraries offer better compression/handling).
-   **Task 3.6 (Other Remaining Tools):**
    -   Sign PDF (visual signature application - client-side likely sufficient).
    -   Redact PDF (ensure true redaction - client-side possible but needs care; server-side might be safer for permanent removal).
    -   Compare PDF (low priority - research libraries like `diff-pdf` for backend, or simpler text diff client-side).
    -   Basic Text/Image Editing (adding new elements - client-side).

### Phase 4: AI Features Implementation

-   **Task 4.1 (RAG Pipeline - Backend):**
    -   PDF Text Extraction: Robust text extraction from uploaded PDFs (e.g., `PyPDF2`, `pdfminer.six`).
    -   Chunking Strategy: Implement text chunking for large documents.
    -   Prompt Engineering: Develop effective prompts for Chat, Summarize, Translate, Question Generation.
-   **Task 4.2 (Chat with PDF - Full Stack):**
    -   Frontend: UI for chat interface (message display, input field).
    -   Backend: Endpoint to receive PDF context (or ID of processed PDF) and user query. Call Gemini API with RAG context.
-   **Task 4.3 (AI PDF Summarizer - Full Stack):**
    -   Frontend: UI to trigger summarization.
    -   Backend: Endpoint to receive PDF, process for RAG, call Gemini for summarization.
-   **Task 4.4 (Translate PDF - Full Stack):**
    -   Frontend: UI for language selection, triggering translation.
    -   Backend: Endpoint to receive PDF, process for RAG, call Gemini for translation (handle text segments, potentially reconstruct translated document or provide text).
-   **Task 4.5 (AI Question Generator - Full Stack):**
    -   Frontend: UI to trigger question generation.
    -   Backend: Endpoint to receive PDF, process for RAG, call Gemini for question generation.
-   **Task 4.6 (AI Error Handling & Fallbacks):**
    -   Implement graceful handling of Gemini API errors, rate limits, token limits.
    -   Provide clear user feedback.

### Phase 5: Testing, Refinement, & Documentation

-   **Task 5.1 (Comprehensive Testing):**
    -   Unit tests for critical backend logic and frontend components.
    -   Integration tests for API endpoints and client-server interactions.
    -   End-to-end testing for all user flows and features with various PDF files (different sizes, versions, complexities, corrupted files).
    -   Test on multiple browsers (Chrome, Firefox, Safari, Edge) and device sizes.
-   **Task 5.2 (Performance Optimization):**
    -   Profile client-side and backend operations.
    -   Optimize slow functions, reduce bundle sizes (frontend).
    -   Optimize memory usage on the backend.
-   **Task 5.3 (UI/UX Refinement):**
    -   Gather feedback (e.g., self-testing, peer review).
    -   Polish UI elements, improve workflows, enhance clarity.
    -   Ensure accessibility (WCAG AA compliance as a target).
-   **Task 5.4 (Documentation - Code & User):**
    -   Write/update `README.md` (project overview, setup, usage).
    -   Write/update `CHANGELOG.md`.
    -   Add function-level comments and code documentation.
    -   Create `.env.example` for backend and frontend.
    -   Document API key requirements and storage disclaimers clearly.
-   **Task 5.5 (Final Deployment Checks):**
    -   Verify all environment variables are correctly set in deployment environments.
    -   Check temporary file cleanup mechanisms.

## API Endpoints (if applicable)

(Illustrative - actual endpoints to be detailed during development)
All backend API endpoints will be under `/api/v1/` prefix.
Authentication for AI endpoints: `X-Gemini-API-Key` header.

-   **`POST /api/v1/pdf/merge`**: Upload multiple PDFs, returns merged PDF.
-   **`POST /api/v1/pdf/split`**: Upload PDF, options for splitting, returns zip of PDFs.
-   **`POST /api/v1/pdf/convert/to-pdf`**: Upload file (image, doc), returns PDF.
-   **`POST /api/v1/pdf/convert/from-pdf`**: Upload PDF, target format, returns converted file(s).
-   **`POST /api/v1/pdf/ocr`**: Upload PDF, returns text or searchable PDF.
-   **`POST /api/v1/pdf/repair`**: Upload PDF, returns repaired PDF.
-   **`GET /api/v1/ai/models`**: (Requires `X-Gemini-API-Key`) Returns list of available Gemini models.
-   **`POST /api/v1/ai/chat`**: (Requires `X-Gemini-API-Key`) Upload PDF (or reference ID), user query, returns chat response.
-   **`POST /api/v1/ai/summarize`**: (Requires `X-Gemini-API-Key`) Upload PDF, returns summary.
-   **`POST /api/v1/ai/translate`**: (Requires `X-Gemini-API-Key`) Upload PDF, target language, returns translation.
-   **`POST /api/v1/ai/generate-questions`**: (Requires `X-Gemini-API-Key`) Upload PDF, returns questions.

## Data Models (if applicable)

No persistent database models for user data.
Configuration for user (stored in browser `localStorage`):

```json
{
    "geminiApiKey": "USER_PROVIDED_API_KEY",
    "selectedGeminiModel": "models/gemini-1.5-pro" // or similar
}
```

## Project Structure

```
project-root/
├── frontend/                   # Next.js App
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── (pages)/            # Route groups
│   │   │   ├── pdf-tools/      # Example: Group for PDF tool pages
│   │   │   │   ├── [toolName]/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   └── settings/page.tsx
│   │   ├── layout.tsx          # Root layout
│   │   └── global.css
│   ├── components/             # Shared React components (UI, specific tools)
│   │   ├── common/             # Buttons, Modals, etc.
│   │   ├── pdf/                # PDF specific components (FileUploader, ToolSelector)
│   │   └── ai/                 # AI feature related components
│   ├── lib/                    # Helper functions, client-side PDF logic, API clients
│   │   ├── pdfUtils.ts         # Client-side PDF manipulation functions
│   │   └── api.ts              # Frontend API client for backend
│   ├── public/                 # Static assets
│   ├── styles/                 # Global styles, Tailwind config
│   ├── next.config.js
│   ├── tsconfig.json
│   └── package.json
├── backend/                    # Python FastAPI Server
│   ├── app/
│   │   ├── main.py             # FastAPI app initialization
│   │   ├── routers/            # API endpoint routers (pdf_router.py, ai_router.py)
│   │   ├── services/           # Business logic (pdf_service.py, gemini_service.py)
│   │   ├── models/             # Pydantic models for request/response
│   │   ├── core/               # Config, constants
│   │   └── temp_files/         # Temporary storage for processing (add to .gitignore)
│   ├── tests/                  # Pytest tests
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
├── README.md
└── CHANGELOG.md
```

## Environment Variables

```
# Backend (.env file in backend/, mirrored in Render.com)
# No specific backend env vars needed unless for external services other than Gemini (key passed via header)
# PYTHON_ENV=development # or production

# Frontend (.env.local file in frontend/, mirrored in Vercel/hosting)
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000/api/v1 # For local dev
# NEXT_PUBLIC_BACKEND_API_URL=https://your-render-backend-url.onrender.com/api/v1 # For production
```

## Testing Strategy

-   **Unit Tests**: Jest/React Testing Library for frontend components and utility functions. Pytest for backend services, routers, and helper functions. Focus on pure functions and isolated logic.
-   **Integration Tests**: Testing interactions between frontend components and backend API endpoints. Supertest for backend API endpoint testing. Testing client-side PDF library integrations.
-   **End-to-End (E2E) Tests**: Playwright or Cypress for simulating user flows across the entire application for key features.
-   **Manual Testing**: Thorough manual testing on various browsers (Chrome, Firefox, Safari, Edge) and devices (desktop, tablet, mobile) to check responsiveness and usability. Testing with diverse PDF files (size, complexity, valid/corrupted).
-   **AI Feature Testing**: Testing AI features with different PDFs and prompts, evaluating quality of responses, error handling for API issues.

## Deployment Strategy

-   **Frontend (Next.js)**:
    -   CI/CD pipeline (e.g., GitHub Actions) triggering on pushes to `main` branch.
    -   Deployment to Vercel (recommended for Next.js) or similar static/Node.js hosting platform.
    -   Environment variables configured on hosting platform.
-   **Backend (FastAPI)**:
    -   CI/CD pipeline (e.g., GitHub Actions) triggering on pushes to `main` branch.
    -   Build Docker image.
    -   Push Docker image to a container registry (e.g., Docker Hub, GitHub Container Registry).
    -   Deploy to Render.com, configured to use the pushed Docker image.
    -   Environment variables (if any needed beyond what's passed in requests) configured on Render.com.
-   **Staging/Preview**: Utilize Vercel's preview deployments for frontend and potentially a separate Render service for backend staging if budget allows.

## Maintenance Plan

-   **Monitoring**: Basic uptime monitoring for backend service on Render.com. Frontend monitoring via Vercel analytics.
-   **Logging**: Implement structured logging in the backend (FastAPI) to capture errors and important events. Client-side error reporting (e.g., Sentry, optional).
-   **Updates**: Regularly update dependencies (Next.js, FastAPI, Python, Node.js packages, PDF libraries) to patch security vulnerabilities and get new features. Test thoroughly after updates.
-   **Bug Fixes**: Prioritize and address reported bugs based on severity.
-   **Temporary File Management**: Ensure robust cleanup of temporary files on both client (if applicable) and server to prevent storage bloat. Server-side cron job or startup cleanup if needed.

## Risks and Mitigations

| Risk                                             | Impact | Likelihood | Mitigation                                                                                                                                                                                                                             |
| ------------------------------------------------ | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Complex PDF Standard**                         | High   | Medium     | Use robust, well-maintained PDF libraries. Extensive testing with diverse PDF files. Prioritize common PDF versions and features. Clearly state limitations.                                                                           |
| **Client-Side Performance Bottlenecks**          | Medium | Medium     | Optimize JavaScript code. Use Web Workers for intensive tasks if possible. Offload truly heavy operations to the backend. Progress indicators.                                                                                         |
| **Backend Resource Limits (Render Free Tier)**   | High   | High       | Maximize client-side processing. Optimize backend code for memory and CPU efficiency. Implement request queueing or graceful degradation if server is overloaded. Inform users about potential slowness for complex server-side tasks. |
| **Gemini API Costs/Rate Limits/Changes**         | Medium | Medium     | User provides their own API key, mitigating direct cost. Handle rate limits and API errors gracefully. Monitor Gemini API documentation for changes. Allow model selection to manage token usage.                                      |
| **Security of User's API Key in `localStorage`** | Medium | Medium     | Clearly warn users about XSS risks and advise using the tool in a trusted browser environment. Emphasize no server-side storage of the key. Key is scoped to the browser.                                                              |
| **Handling Large/Corrupted PDFs**                | Medium | High       | Implement size limits before upload/processing. Robust error handling and user-friendly messages. Use try-catch blocks extensively during PDF processing. Test with known problematic files.                                           |
| **Browser Compatibility**                        | Low    | Medium     | Stick to modern web standards. Test on major browsers. Use polyfills if necessary for minor features. Graceful degradation for unsupported APIs.                                                                                       |
| **Scope Creep (many features)**                  | Medium | Medium     | Stick to defined features. Prioritize core functionality. Phase implementation carefully. Defer "low" priority items if time constraints arise.                                                                                        |

## Future Enhancements

-   **Advanced PDF Editing**: More granular text editing, image manipulation, vector object editing.
-   **Cloud Integration**: Option for users to connect their cloud storage (Google Drive, Dropbox) to open/save files. (Requires auth).
-   **Collaboration Features**: Shared editing or commenting on PDFs (complex, requires auth and backend state).
-   **Batch Processing for All Tools**: UI to apply an operation to multiple files at once for all relevant tools.
-   **Expanded Language Support for OCR and Translation**: Add more languages.
-   **Template Creation/Usage**: Allow users to save/use templates for common PDF tasks.
-   **User Accounts**: To save preferences, history, and potentially API keys more securely on the server (significant change).
-   **PWA Features**: Enhanced offline capabilities, install-to-homescreen.

## Development Guidelines

### Code Quality & Design Principles

-   Follow industry-standard coding best practices (clean code, modularity, error handling, security, scalability).
-   Apply SOLID, DRY (via abstraction), and KISS principles.
-   Design modular, reusable components/functions.
-   Optimize for code readability and maintainable structure.
-   Add concise, useful function-level comments.
-   Implement comprehensive error handling (try-catch, custom errors, async handling).

### Frontend Development

-   Provide modern, clean, professional, and intuitive UI designs.
-   Adhere to UI/UX principles (clarity, consistency, simplicity, feedback, accessibility/WCAG AA as a target).
-   Use appropriate CSS frameworks/methodologies (e.g., Tailwind CSS is recommended).

### Data Handling & APIs

-   Integrate with real, live data sources and APIs as specified or implied (Gemini).
-   Prohibit placeholder, mock, or dummy data/API responses in the final code for core logic.
-   Accept credentials/config (like Gemini API key) exclusively via environment variables (for backend-held keys, not applicable here for user's key) or secure user input mechanisms.
-   Use `.env` files for local secrets/config with a template `.env.example` file.
-   Centralize all backend API endpoint URLs in a single location (e.g., `lib/api.ts` config or environment variables for base URL).
-   Never hardcode API endpoint URLs directly in service/component files.

### Asset Generation

-   Do not use placeholder images or icons in final product.
-   If custom graphics are needed, create them as SVG and convert to PNG using a library like `sharp` (if server-side generation is needed) or optimize SVGs directly for web. For this project, prefer direct SVG usage or optimized PNGs.
-   If build scripts are needed for assets, document them.

### Documentation Requirements

-   Create a comprehensive `README.md` including project overview, setup instructions (frontend and backend), environment variable setup, how to run, and how to use.
-   Maintain a `CHANGELOG.md` to document changes using semantic versioning.
-   Document required API keys/credentials clearly (i.e., user-provided Gemini key) and how they are handled.
-   Ensure all documentation is well-written, accurate, and reflects the final code.

## Tool Usage Instructions (For AI Code Assistant)

### MCP Servers and Tools

-   Use the `context7` MCP server to gather contextual information about the current task, including relevant libraries, frameworks, and APIs.
-   Use the `clear_thought` MCP servers for various problem-solving approaches:
    -   `mentalmodel_clear_thought`: For applying structured problem-solving approaches.
    -   `designpattern_clear_thought`: For applying software architecture and implementation patterns.
    -   `programmingparadigm_clear_thought`: For applying different programming approaches.
    -   `debuggingapproach_clear_thought`: For systematic debugging of technical issues.
    -   `collaborativereasoning_clear_thought`: For simulating expert collaboration.
    -   `decisionframework_clear_thought`: For structured decision analysis.
    -   `metacognitivemonitoring_clear_thought`: For tracking knowledge boundaries.
    -   `scientificmethod_clear_thought`: For applying formal scientific reasoning.
    -   `structuredargumentation_clear_thought`: For dialectical reasoning.
    -   `visualreasoning_clear_thought`: For visual thinking and problem-solving.
    -   `sequentialthinking_clear_thought`: For breaking down complex problems.
-   Use the date and time MCP server:
    -   Use `getCurrentDateTime_node` tool to get the current date and time in UTC format.
    -   Add last updated date and time in UTC format to the `README.md` file.
-   Use the `websearch` tool to find information on the internet when needed.

### System & Environment Considerations

-   Target system for reference (if specific commands are given): Windows 11 Home Single Language 23H2.
-   Use semicolon (`;`) as the command separator in PowerShell commands if generating such scripts, not `&&`.
-   Use `New-Item -ItemType Directory -Path "path1", "path2", ... -Force` for creating directories in PowerShell if generating such scripts.
-   Use language-native path manipulation libraries (e.g., Node.js `path`, Python `os.path`) for robust path handling.
-   Use package manager commands (e.g., `npm install`, `pip install`) via the `launch-process` tool to add dependencies; do not edit package.json or requirements.txt directly unless instructed for specific structural reasons.

### Error Handling & Debugging

-   First attempt to resolve errors autonomously using available tools.
-   Perform systematic debugging: consult web resources, documentation, modify code, adjust configuration, retry.
-   Report back only if an insurmountable blocker persists after exhausting all self-correction efforts.

## Conclusion

The "All PDF Tools" project aims to deliver a powerful and user-friendly web-based PDF utility. By prioritizing client-side processing and leveraging a lightweight FastAPI backend for specialized tasks and AI integration, the application can offer a comprehensive feature set without requiring user accounts or imposing heavy server costs. The success of the project will depend on careful implementation of PDF manipulation logic, robust error handling, an intuitive user experience, and seamless integration of the Gemini API. Adherence to the development guidelines and a phased implementation approach will be crucial for managing complexity and delivering a high-quality product.
