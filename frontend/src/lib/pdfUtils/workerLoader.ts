"use client";

/**
 * This file provides a robust mechanism for loading the PDF.js worker
 * It tries multiple approaches to ensure the worker is loaded correctly
 */

// Function to load the PDF.js worker
export async function loadPdfWorker() {
    if (typeof window === "undefined") {
        // Skip worker setup in server-side rendering
        return;
    }

    try {
        // Dynamically import PDF.js
        const pdfjsLib = await import("pdfjs-dist");

        // Check if worker is already set
        if (pdfjsLib.GlobalWorkerOptions.workerSrc) {
            console.log(
                "PDF.js worker already configured:",
                pdfjsLib.GlobalWorkerOptions.workerSrc
            );
            return;
        }

        // Try multiple approaches to load the worker
        await tryLoadWorker(pdfjsLib);
    } catch (error) {
        console.error("Error loading PDF.js worker:", error);
    }
}

// Try different approaches to load the worker
async function tryLoadWorker(pdfjsLib: any) {
    // Approach 1: Use the worker file from the public directory
    try {
        const baseUrl = window.location.origin;
        const workerUrl = `${baseUrl}/pdf.worker.js`;

        // Check if the worker file exists
        const response = await fetch(workerUrl, { method: "HEAD" });
        if (response.ok) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
            console.log(
                "PDF.js worker loaded from public directory:",
                workerUrl
            );
            return;
        }
    } catch (error) {
        console.warn(
            "Failed to load PDF.js worker from public directory:",
            error
        );
    }

    // Approach 2: Try to load the worker from _next/static/worker
    try {
        const baseUrl = window.location.origin;
        const workerUrl = `${baseUrl}/_next/static/worker/pdf.worker.js`;

        // Check if the worker file exists
        const response = await fetch(workerUrl, { method: "HEAD" });
        if (response.ok) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
            console.log(
                "PDF.js worker loaded from _next/static/worker:",
                workerUrl
            );
            return;
        }
    } catch (error) {
        console.warn(
            "Failed to load PDF.js worker from _next/static/worker:",
            error
        );
    }

    // Approach 3: Try to import the worker directly (for ESM builds)
    try {
        // Import the worker directly - use any type to avoid TypeScript errors
        await (import("pdfjs-dist/build/pdf.worker.mjs") as Promise<any>);
        console.log("PDF.js worker loaded via direct ESM import");
        return;
    } catch (error) {
        console.warn(
            "Failed to load PDF.js worker via direct ESM import:",
            error
        );
    }

    // Approach 4: Use a CDN version as a last resort
    try {
        const cdnUrl =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrl;
        console.log("PDF.js worker loaded from CDN:", cdnUrl);
        return;
    } catch (error) {
        console.error("All attempts to load PDF.js worker failed:", error);
    }
}
