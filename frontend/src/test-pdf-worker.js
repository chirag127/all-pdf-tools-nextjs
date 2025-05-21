// Test script to verify PDF.js worker loading
// Import the ESM module using dynamic import
(async () => {
    try {
        // Use dynamic import for ESM modules
        const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");

        // Log the PDF.js version
        console.log("PDF.js version:", pdfjsLib.version);

        // Set the worker source to a CDN URL
        const version = pdfjsLib.version || "5.2.133";
        const cdnUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
        console.log("Setting worker source to:", cdnUrl);
        pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrl;

        // Verify the worker source is set correctly
        console.log(
            "Worker source is now:",
            pdfjsLib.GlobalWorkerOptions.workerSrc
        );

        console.log("PDF.js worker test completed successfully!");
    } catch (error) {
        console.error("Error testing PDF.js worker:", error);
    }
})();
