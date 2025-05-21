// Script to copy PDF.js worker file to the public directory
const fs = require("fs");
const path = require("path");

// Paths
const nodeModulesPath = path.join(__dirname, "..", "node_modules");
const publicPath = path.join(__dirname, "..", "public");

// Ensure public directory exists
if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
    console.log(`Created public directory at: ${publicPath}`);
}

// Find the PDF.js worker file
const findPdfWorker = () => {
    // Check different possible locations for the worker file
    const possiblePaths = [
        // ES module build (PDF.js v5.x+)
        path.join(nodeModulesPath, "pdfjs-dist", "build", "pdf.worker.mjs"),
        path.join(nodeModulesPath, "pdfjs-dist", "build", "pdf.worker.min.mjs"),
        // Standard build (PDF.js v4.x and earlier)
        path.join(nodeModulesPath, "pdfjs-dist", "build", "pdf.worker.js"),
        path.join(nodeModulesPath, "pdfjs-dist", "build", "pdf.worker.min.js"),
        // Legacy build
        path.join(
            nodeModulesPath,
            "pdfjs-dist",
            "legacy",
            "build",
            "pdf.worker.js"
        ),
        path.join(
            nodeModulesPath,
            "pdfjs-dist",
            "legacy",
            "build",
            "pdf.worker.min.js"
        ),
        // Webpack build
        path.join(nodeModulesPath, "pdfjs-dist", "webpack", "pdf.worker.js"),
        path.join(
            nodeModulesPath,
            "pdfjs-dist",
            "webpack",
            "pdf.worker.min.js"
        ),
    ];

    // Check if any of the paths exist
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            console.log(`Found PDF.js worker file at: ${filePath}`);
            return filePath;
        }
    }

    // If no worker file is found, check if the pdfjs-dist package exists
    const pdfjsDistPath = path.join(nodeModulesPath, "pdfjs-dist");
    if (fs.existsSync(pdfjsDistPath)) {
        console.error(
            "pdfjs-dist package exists, but worker file not found in expected locations."
        );
        console.error("Available files in pdfjs-dist/build:");
        try {
            const buildPath = path.join(pdfjsDistPath, "build");
            if (fs.existsSync(buildPath)) {
                const files = fs.readdirSync(buildPath);
                files.forEach((file) => console.error(` - ${file}`));
            } else {
                console.error(" - build directory not found");
            }
        } catch (err) {
            console.error(" - Error listing files:", err.message);
        }
    } else {
        console.error("pdfjs-dist package not found. Please run npm install.");
    }

    throw new Error("PDF.js worker file not found in node_modules");
};

// Copy the worker file to the public directory
const copyWorkerFile = (sourcePath) => {
    try {
        // Create the destination path
        const fileName = path.basename(sourcePath);
        const destPath = path.join(publicPath, "pdf.worker.js");

        // Copy the file
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied ${fileName} to ${destPath}`);

        // If there's a map file, copy that too
        const mapPath = `${sourcePath}.map`;
        if (fs.existsSync(mapPath)) {
            const mapDestPath = `${destPath}.map`;
            fs.copyFileSync(mapPath, mapDestPath);
            console.log(`Copied ${path.basename(mapPath)} to ${mapDestPath}`);
        }
    } catch (error) {
        console.error(`Error copying worker file: ${error.message}`);
        throw error;
    }
};

// Main function
const main = () => {
    try {
        const workerPath = findPdfWorker();
        copyWorkerFile(workerPath);
        console.log("PDF.js worker file copied successfully!");
    } catch (error) {
        console.error("Error copying PDF.js worker file:", error.message);

        // Create a fallback worker file if needed
        try {
            const destPath = path.join(publicPath, "pdf.worker.js");
            if (!fs.existsSync(destPath)) {
                console.log(
                    "Creating a placeholder worker file as fallback..."
                );
                const placeholderContent = `
          // Placeholder PDF.js worker file
          // This is a fallback created because the actual worker file could not be found
          self.onmessage = function(event) {
            self.postMessage({
              error: true,
              message: "This is a placeholder PDF.js worker. The actual worker file could not be found."
            });
          };
        `;
                fs.writeFileSync(destPath, placeholderContent);
                console.log("Created placeholder worker file as fallback.");
            }
        } catch (fallbackError) {
            console.error(
                "Failed to create fallback worker file:",
                fallbackError.message
            );
        }

        process.exit(1);
    }
};

// Run the script
main();
