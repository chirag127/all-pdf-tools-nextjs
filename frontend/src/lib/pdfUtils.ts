"use client";

// Import PDF-lib for client-side PDF manipulation
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
// Import the DOMMatrix polyfill for server-side rendering
import "./domMatrixPolyfill";

// We'll dynamically import PDF.js to avoid SSR issues
let pdfjsLib: any = null;

/**
 * Load PDF.js library dynamically
 */
async function loadPdfJs() {
    if (!pdfjsLib) {
        try {
            pdfjsLib = await import("pdfjs-dist");
        } catch (error) {
            console.error("Error loading PDF.js:", error);
            throw new Error("Failed to load PDF.js library");
        }
    }
    return pdfjsLib;
}

/**
 * Extract text from a PDF file
 */
export async function extractText(
    file: File,
    password?: string
): Promise<string> {
    try {
        // Dynamically load PDF.js
        const pdfjs = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();

        // Create options object with password if provided
        const options: {
            data: ArrayBuffer;
            password?: string;
        } = {
            data: arrayBuffer,
        };

        if (password) {
            options.password = password;
        }

        const pdf = await pdfjs.getDocument(options).promise;
        let text = "";

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
                .map((item: any) => ("str" in item ? item.str : ""))
                .join(" ");

            text += pageText + "\n\n";
        }

        pdf.destroy();
        return text;
    } catch (error) {
        console.error("Error extracting text:", error);
        throw new Error("Failed to extract text from PDF");
    }
}

/**
 * Get the number of pages in a PDF file
 */
export async function getPageCount(
    file: File,
    password?: string
): Promise<number> {
    try {
        // Dynamically load PDF.js
        const pdfjs = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();

        // Create options object with password if provided
        const options: {
            data: ArrayBuffer;
            password?: string;
        } = {
            data: arrayBuffer,
        };

        if (password) {
            options.password = password;
        }

        const pdf = await pdfjs.getDocument(options).promise;
        const pageCount = pdf.numPages;
        pdf.destroy();
        return pageCount;
    } catch (error) {
        console.error("Error getting page count:", error);
        throw new Error("Failed to get page count from PDF");
    }
}

/**
 * Get a preview of a specific page in a PDF file
 */
export async function getPagePreview(
    file: File,
    pageNumber: number,
    password?: string
): Promise<string> {
    try {
        // Dynamically load PDF.js
        const pdfjs = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();

        // Create options object with password if provided
        const options: {
            data: ArrayBuffer;
            password?: string;
        } = {
            data: arrayBuffer,
        };

        if (password) {
            options.password = password;
        }

        const pdf = await pdfjs.getDocument(options).promise;
        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Failed to get canvas context");
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport,
        }).promise;

        const dataUrl = canvas.toDataURL("image/png");
        pdf.destroy();

        return dataUrl;
    } catch (error) {
        console.error("Error getting page preview:", error);
        throw new Error("Failed to generate page preview");
    }
}

// Duplicate function removed

/**
 * Merge multiple PDF files (client-side)
 */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => mergedPdf.addPage(page));
        }

        return await mergedPdf.save();
    } catch (error) {
        console.error("Error merging PDFs:", error);
        throw new Error("Failed to merge PDF files");
    }
}

/**
 * Split a PDF file into multiple PDFs based on page ranges
 */
export async function splitPdf(
    file: File,
    ranges: { start: number; end: number }[]
): Promise<Uint8Array[]> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const results: Uint8Array[] = [];

        for (const range of ranges) {
            const newPdf = await PDFDocument.create();
            // Adjust for 0-indexing
            const pageIndices = Array.from(
                { length: range.end - range.start + 1 },
                (_, i) => range.start - 1 + i
            );

            const pages = await newPdf.copyPages(pdf, pageIndices);
            pages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            results.push(pdfBytes);
        }

        return results;
    } catch (error) {
        console.error("Error splitting PDF:", error);
        throw new Error("Failed to split PDF file");
    }
}

/**
 * Extract specific pages from a PDF file
 */
export async function extractPages(
    file: File,
    pageNumbers: number[]
): Promise<Uint8Array> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const newPdf = await PDFDocument.create();

        // Adjust for 0-indexing
        const pageIndices = pageNumbers.map((num) => num - 1);
        const pages = await newPdf.copyPages(pdf, pageIndices);
        pages.forEach((page) => newPdf.addPage(page));

        return await newPdf.save();
    } catch (error) {
        console.error("Error extracting pages:", error);
        throw new Error("Failed to extract pages from PDF");
    }
}

/**
 * Rotate pages in a PDF file
 */
export async function rotatePdf(
    file: File,
    rotation: number,
    pageNumbers?: number[]
): Promise<Uint8Array> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();

        // If no page numbers are specified, rotate all pages
        const pagesToRotate =
            pageNumbers || Array.from({ length: totalPages }, (_, i) => i + 1);

        // Adjust for 0-indexing and rotate pages
        pagesToRotate.forEach((pageNum) => {
            if (pageNum > 0 && pageNum <= totalPages) {
                const page = pdf.getPage(pageNum - 1);
                page.setRotation(degrees(rotation));
            }
        });

        return await pdf.save();
    } catch (error) {
        console.error("Error rotating PDF:", error);
        throw new Error("Failed to rotate PDF pages");
    }
}

/**
 * Add page numbers to a PDF file
 */
export async function addPageNumbers(
    file: File,
    position: string = "bottom-center",
    startNumber: number = 1,
    format: string = "Page {page_num}"
): Promise<Uint8Array> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        const totalPages = pdf.getPageCount();

        for (let i = 0; i < totalPages; i++) {
            const page = pdf.getPage(i);
            const { width, height } = page.getSize();
            const pageNumber = startNumber + i;

            // Replace placeholders in format
            const text = format
                .replace("{page_num}", pageNumber.toString())
                .replace("{total_pages}", totalPages.toString());

            const textWidth = font.widthOfTextAtSize(text, 12);

            // Calculate position
            let x = 0;
            let y = 0;

            if (position.includes("top")) {
                y = height - 30;
            } else if (position.includes("bottom")) {
                y = 30;
            }

            if (position.includes("left")) {
                x = 30;
            } else if (position.includes("right")) {
                x = width - textWidth - 30;
            } else if (position.includes("center")) {
                x = (width - textWidth) / 2;
            }

            page.drawText(text, {
                x,
                y,
                size: 12,
                font,
                color: rgb(0, 0, 0),
            });
        }

        return await pdf.save();
    } catch (error) {
        console.error("Error adding page numbers:", error);
        throw new Error("Failed to add page numbers to PDF");
    }
}

/**
 * Add a text watermark to a PDF file
 */
export async function addTextWatermark(
    file: File,
    text: string,
    opacity: number = 0.3,
    rotation: number = -45,
    fontSize: number = 50
): Promise<Uint8Array> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const font = await pdf.embedFont(StandardFonts.HelveticaBold);

        for (let i = 0; i < pdf.getPageCount(); i++) {
            const page = pdf.getPage(i);
            const { width, height } = page.getSize();

            // Calculate position (center of page)
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const x = (width - textWidth) / 2;
            const y = height / 2;

            page.drawText(text, {
                x,
                y,
                size: fontSize,
                font,
                opacity,
                rotate: degrees(rotation),
                color: rgb(0.5, 0.5, 0.5),
            });
        }

        return await pdf.save();
    } catch (error) {
        console.error("Error adding text watermark:", error);
        throw new Error("Failed to add watermark to PDF");
    }
}

/**
 * Protect a PDF file with a password
 *
 * This function delegates the password protection to the backend server
 * since PDF-lib doesn't support password protection directly.
 *
 * @throws Error if the server request fails
 */
export async function protectPdf(
    file: File,
    userPassword?: string,
    ownerPassword?: string,
    permissions?: {
        printing?: boolean;
        copying?: boolean;
        modifying?: boolean;
    }
): Promise<Uint8Array> {
    try {
        // Create a FormData object to send to the server
        const formData = new FormData();
        formData.append("file", file);

        if (userPassword) {
            formData.append("user_password", userPassword);
        }

        if (ownerPassword) {
            formData.append("owner_password", ownerPassword);
        }

        // Add permissions
        formData.append("allow_print", String(permissions?.printing !== false));
        formData.append("allow_copy", String(permissions?.copying !== false));
        formData.append(
            "allow_modify",
            String(permissions?.modifying !== false)
        );

        // Send the request to the server
        const response = await fetch("/api/v1/pdf/protect", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to protect PDF");
        }

        // Get the download URL from the response
        const data = await response.json();

        // Fetch the protected PDF
        const pdfResponse = await fetch(data.download_url);
        if (!pdfResponse.ok) {
            throw new Error("Failed to download protected PDF");
        }

        // Convert the response to an ArrayBuffer and then to Uint8Array
        const arrayBuffer = await pdfResponse.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error("Error protecting PDF:", error);
        throw error instanceof Error
            ? error
            : new Error("Failed to protect PDF");
    }
}

/**
 * Unlock a password-protected PDF
 *
 * This function delegates the password decryption to the backend server
 * since PDF-lib doesn't support password decryption directly.
 *
 * @throws Error if the password is incorrect or the server request fails
 */
export async function unlockPdf(
    file: File,
    password: string
): Promise<Uint8Array> {
    try {
        // Create a FormData object to send to the server
        const formData = new FormData();
        formData.append("file", file);
        formData.append("password", password);

        // Send the request to the server
        const response = await fetch("/api/v1/pdf/unlock", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to unlock PDF");
        }

        // Get the download URL from the response
        const data = await response.json();

        // Fetch the unlocked PDF
        const pdfResponse = await fetch(data.download_url);
        if (!pdfResponse.ok) {
            throw new Error("Failed to download unlocked PDF");
        }

        // Convert the response to an ArrayBuffer and then to Uint8Array
        const arrayBuffer = await pdfResponse.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error("Error unlocking PDF:", error);
        throw error instanceof Error
            ? error
            : new Error("Failed to unlock PDF");
    }
}

/**
 * Compress a PDF file
 */
export async function compressPdf(
    file: File,
    quality: number = 0.75 // We'll use this to determine compression level
): Promise<Uint8Array> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);

        // Save with compression options
        // PDF-lib has limited compression options
        // We'll use the quality parameter to determine if we should use compression
        const compressionEnabled = quality < 0.9;

        return await pdf.save({
            useObjectStreams: compressionEnabled,
        });
    } catch (error) {
        console.error("Error compressing PDF:", error);
        throw new Error("Failed to compress PDF");
    }
}

// Duplicate function removed

// Duplicate function removed

/**
 * Organize pages in a PDF (reorder, delete, duplicate)
 */
export async function organizePdf(
    file: File,
    pageOrder: number[]
): Promise<Uint8Array> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer);
        const newPdf = await PDFDocument.create();

        // Copy each page in the new order
        for (const pageNum of pageOrder) {
            // PDF pages are 0-indexed in pdf-lib, but 1-indexed in our UI
            const pageIndex = pageNum - 1;

            if (pageIndex >= 0 && pageIndex < sourcePdf.getPageCount()) {
                const [copiedPage] = await newPdf.copyPages(sourcePdf, [
                    pageIndex,
                ]);
                newPdf.addPage(copiedPage);
            }
        }

        // Save the new PDF
        return await newPdf.save();
    } catch (error) {
        console.error("Error organizing PDF:", error);
        throw new Error("Failed to organize PDF");
    }
}

// This is a duplicate function that has been removed
