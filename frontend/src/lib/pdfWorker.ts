"use client";

// Import the DOMMatrix polyfill for server-side rendering
import "../lib/domMatrixPolyfill";
import { loadPdfWorker } from "./pdfUtils/workerLoader";

// This file is responsible for setting up the PDF.js worker
const setupPdfWorker = async () => {
    if (typeof window === "undefined") {
        // Skip worker setup in server-side rendering
        // The DOMMatrix polyfill will be applied automatically
        return;
    }

    try {
        // Use the robust worker loader
        await loadPdfWorker();
    } catch (error) {
        console.error("Error setting up PDF.js worker:", error);

        // Last resort fallback
        try {
            console.warn("Attempting emergency fallback for PDF.js worker...");

            // Dynamically import PDF.js
            const pdfjsLib = await import("pdfjs-dist");

            // Try to use a CDN version as an absolute last resort
            const cdnUrl =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrl;
            console.log(
                "Emergency fallback: PDF.js worker set to CDN:",
                cdnUrl
            );
        } catch (fallbackError) {
            console.error(
                "All PDF.js worker setup attempts failed:",
                fallbackError
            );
        }
    }
};

export default setupPdfWorker;
