# All PDF Tools

A comprehensive toolkit for all your PDF needs. Merge, split, edit, secure, and analyze your PDF documents with ease.

**Last Updated:** 2025-05-20T20:00:59.203Z (UTC)

## Overview

All PDF Tools is a web application that provides a wide range of PDF manipulation tools and AI-powered features. The application consists of a Next.js frontend and a FastAPI backend, offering a seamless user experience for working with PDF documents.

## Features

The application is organized into six main feature areas:

### 1. Document Organization

-   Merge PDFs
-   Split PDF
-   Extract Pages
-   Organize Pages

### 2. Conversion Tools

-   Convert to PDF
-   Convert from PDF
-   OCR
-   Scan to PDF

### 3. Editing Tools

-   Rotate PDF
-   Add Page Numbers
-   Add Watermark
-   Crop PDF

### 4. Security Tools

-   Protect PDF
-   Unlock PDF
-   Sign PDF
-   Redact PDF

### 5. Enhancement Tools

-   Compress PDF
-   Repair PDF
-   Compare PDFs

### 6. AI Features

-   Chat with PDF
-   Summarize PDF
-   Translate PDF
-   Generate Questions

## Tech Stack

### Frontend

-   Next.js 14
-   TypeScript
-   Tailwind CSS
-   React Icons
-   Zustand (State Management)

### Backend

-   FastAPI
-   Python 3.11+
-   PyPDF2
-   pikepdf
-   reportlab
-   pytesseract
-   Google Generative AI (Gemini API)

## Prerequisites

-   Node.js 18.17.0 or later
-   Python 3.11 or later
-   Google Gemini API key (for AI features)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

    ```bash
    cd backend
    ```

2. Create a virtual environment:

    ```bash
    python -m venv venv
    ```

3. Activate the virtual environment:

    - Windows:
        ```bash
        venv\Scripts\activate
        ```
    - macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

4. Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

5. Create a `.env` file based on `.env.example`:

    ```bash
    cp .env.example .env
    ```

6. Run the backend server:
    ```bash
    uvicorn app.main:app --reload
    ```

### Frontend Setup

1. Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env.local` file based on `.env.example`:

    ```bash
    cp .env.example .env.local
    ```

4. Run the development server:

    ```bash
    npm run dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Documentation

The backend API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs) when the backend server is running.

## Project Structure

```
all-pdf-tools-nextjs/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── temp_files/
│   │   └── main.py
│   ├── tests/
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── .env.example
│   └── package.json
├── .gitignore
├── CHANGELOG.md
└── README.md
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Chirag Singhal (GitHub: [chirag127](https://github.com/chirag127))
