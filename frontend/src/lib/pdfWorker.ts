"use client";

// Import the DOMMatrix polyfill for server-side rendering
import "../lib/domMatrixPolyfill";

// This file is responsible for setting up the PDF.js worker
const setupPdfWorker = () => {
    if (typeof window === "undefined") {
        // Skip worker setup in server-side rendering
        // The DOMMatrix polyfill will be applied automatically
        return;
    }

    try {
        // Dynamically import PDF.js to avoid SSR issues
        import("pdfjs-dist")
            .then((pdfjsLib) => {
                // Use the worker file we copied to the public directory
                const workerSrc = "/pdf.worker.js"; // Path to the worker file in the public directory

                // Set the worker source with absolute URL to avoid protocol-relative URL issues
                const baseUrl = window.location.origin;
                pdfjsLib.GlobalWorkerOptions.workerSrc = `${baseUrl}${workerSrc}`;

                console.log(
                    "PDF.js worker configured successfully with path:",
                    pdfjsLib.GlobalWorkerOptions.workerSrc
                );
            })
            .catch((error) => {
                console.error("Error importing PDF.js:", error);
            });
    } catch (error) {
        console.error("Error setting up PDF.js worker:", error);
    }
};

export default setupPdfWorker;
