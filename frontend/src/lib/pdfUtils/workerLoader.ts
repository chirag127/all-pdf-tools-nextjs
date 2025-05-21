"use client";

/**
 * This file provides a robust mechanism for loading the PDF.js worker
 * It uses a webpack-friendly approach to avoid "Critical dependency" warnings
 */

// Import PDF.js library - using a static import to avoid webpack warnings
import * as pdfjsLib from "pdfjs-dist";

// Function to load the PDF.js worker
export async function loadPdfWorker() {
    if (typeof window === "undefined") {
        // Skip worker setup in server-side rendering
        return;
    }

    try {
        // Check if worker is already set
        if (pdfjsLib.GlobalWorkerOptions.workerSrc) {
            console.log(
                "PDF.js worker already configured:",
                pdfjsLib.GlobalWorkerOptions.workerSrc
            );
            return;
        }

        // Set up the worker using CDN approach
        await setupWorkerFromCDN();
    } catch (error) {
        console.error("Error loading PDF.js worker:", error);
    }
}

// Set up the worker using CDN approach - most reliable for Next.js
async function setupWorkerFromCDN() {
    // Get the PDF.js version from the library
    const pdfJsVersion = pdfjsLib.version || "5.2.133";
    console.log("PDF.js version:", pdfJsVersion);

    // Primary CDN: cdnjs
    const cdnUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJsVersion}/pdf.worker.min.js`;

    try {
        // Verify the CDN URL is accessible
        const response = await fetch(cdnUrl, { method: "HEAD" });
        if (response.ok) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrl;
            console.log("PDF.js worker loaded from CDN:", cdnUrl);
            return;
        } else {
            console.warn(
                "CDN worker URL returned non-OK status:",
                response.status
            );
        }
    } catch (cdnError) {
        console.warn(
            `Failed to load PDF.js worker from primary CDN:`,
            cdnError
        );
    }

    // Alternative CDN: unpkg
    try {
        const unpkgUrl = `https://unpkg.com/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`;
        pdfjsLib.GlobalWorkerOptions.workerSrc = unpkgUrl;
        console.log("PDF.js worker loaded from alternative CDN:", unpkgUrl);
        return;
    } catch (unpkgError) {
        console.warn(
            `Failed to load PDF.js worker from alternative CDN:`,
            unpkgError
        );
    }

    // Fallback to a known working version if the exact version isn't available
    try {
        const fallbackCdnUrl =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.2.133/pdf.worker.min.js";
        pdfjsLib.GlobalWorkerOptions.workerSrc = fallbackCdnUrl;
        console.log(
            "PDF.js worker loaded from CDN (fallback):",
            fallbackCdnUrl
        );
    } catch (error) {
        console.error("All attempts to load PDF.js worker failed:", error);
    }
}
