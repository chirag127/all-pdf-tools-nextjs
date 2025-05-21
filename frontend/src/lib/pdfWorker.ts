"use client";

// Import the DOMMatrix polyfill for server-side rendering
import "../lib/domMatrixPolyfill";
// Import PDF.js statically to avoid webpack warnings
import * as pdfjsLib from "pdfjs-dist";

// This file is responsible for setting up the PDF.js worker
const setupPdfWorker = async () => {
    if (typeof window === "undefined") {
        // Skip worker setup in server-side rendering
        // The DOMMatrix polyfill will be applied automatically
        return;
    }

    try {
        // Log the PDF.js version for debugging
        console.log("PDF.js version:", pdfjsLib.version);

        // Check if worker is already set
        if (pdfjsLib.GlobalWorkerOptions.workerSrc) {
            console.log(
                "PDF.js worker already configured:",
                pdfjsLib.GlobalWorkerOptions.workerSrc
            );
            return;
        }

        // Use CDN for the worker file - this is the most reliable approach for Next.js
        const version = pdfjsLib.version || "5.2.133";
        const cdnUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

        console.log("Setting PDF.js worker to CDN:", cdnUrl);
        pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrl;

        // Verify the CDN URL is accessible
        try {
            const response = await fetch(cdnUrl, { method: "HEAD" });
            if (response.ok) {
                console.log("Successfully verified CDN worker URL:", cdnUrl);
            } else {
                console.warn(
                    "CDN worker URL returned non-OK status:",
                    response.status
                );
                // Try alternative CDN if the first one fails
                const alternativeCdnUrl = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;
                console.log("Trying alternative CDN:", alternativeCdnUrl);
                pdfjsLib.GlobalWorkerOptions.workerSrc = alternativeCdnUrl;
            }
        } catch (fetchError) {
            console.warn("Failed to verify CDN worker URL:", fetchError);
            // Try alternative CDN if the first one fails
            const alternativeCdnUrl = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;
            console.log("Trying alternative CDN:", alternativeCdnUrl);
            pdfjsLib.GlobalWorkerOptions.workerSrc = alternativeCdnUrl;
        }
    } catch (error) {
        console.error("Error setting up PDF.js worker:", error);

        // Last resort fallback - try a specific version that is known to work
        try {
            console.warn("Attempting emergency fallback for PDF.js worker...");

            // Try to use a CDN version as an absolute last resort
            const cdnUrl =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.2.133/pdf.worker.min.js";
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
