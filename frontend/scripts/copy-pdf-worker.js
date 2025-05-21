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

// Get the PDF.js version from package.json
let pdfJsVersion = "5.2.133"; // Default version
try {
    const packageJsonPath = path.join(
        nodeModulesPath,
        "pdfjs-dist",
        "package.json"
    );
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf8")
        );
        pdfJsVersion = packageJson.version;
        console.log(`Detected PDF.js version: ${pdfJsVersion}`);
    }
} catch (err) {
    console.warn(
        `Could not determine PDF.js version from package.json: ${err.message}`
    );
    console.warn(`Using default version: ${pdfJsVersion}`);
}

// Find the PDF.js worker file
const findPdfWorker = () => {
    // Check different possible locations for the worker file based on version
    const possiblePaths = [];

    // For PDF.js v5.x+
    if (pdfJsVersion.startsWith("5.")) {
        possiblePaths.push(
            // ES module build (PDF.js v5.x+)
            path.join(nodeModulesPath, "pdfjs-dist", "build", "pdf.worker.mjs"),
            path.join(
                nodeModulesPath,
                "pdfjs-dist",
                "build",
                "pdf.worker.min.mjs"
            ),
            // Standard build (also available in v5.x)
            path.join(nodeModulesPath, "pdfjs-dist", "build", "pdf.worker.js"),
            path.join(
                nodeModulesPath,
                "pdfjs-dist",
                "build",
                "pdf.worker.min.js"
            )
        );
    } else {
        // For older versions (v4.x and earlier)
        possiblePaths.push(
            // Standard build
            path.join(nodeModulesPath, "pdfjs-dist", "build", "pdf.worker.js"),
            path.join(
                nodeModulesPath,
                "pdfjs-dist",
                "build",
                "pdf.worker.min.js"
            ),
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
            )
        );
    }

    // Always check webpack build as a fallback
    possiblePaths.push(
        path.join(nodeModulesPath, "pdfjs-dist", "webpack", "pdf.worker.js"),
        path.join(nodeModulesPath, "pdfjs-dist", "webpack", "pdf.worker.min.js")
    );

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
        // Create the destination path - always use pdf.worker.js as the name
        // regardless of the source file name to ensure consistent loading
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

            // Update the sourceMappingURL in the worker file if needed
            let workerContent = fs.readFileSync(destPath, "utf8");
            const sourceMapPattern = /\/\/# sourceMappingURL=.*\.map/;
            if (sourceMapPattern.test(workerContent)) {
                workerContent = workerContent.replace(
                    sourceMapPattern,
                    `//# sourceMappingURL=pdf.worker.js.map`
                );
                fs.writeFileSync(destPath, workerContent);
                console.log(`Updated sourceMappingURL in ${destPath}`);
            }
        }

        // Verify the copied file exists and is readable
        if (fs.existsSync(destPath)) {
            const stats = fs.statSync(destPath);
            console.log(
                `Verified worker file: ${destPath} (${stats.size} bytes)`
            );
        } else {
            throw new Error(
                `Worker file was not copied successfully to ${destPath}`
            );
        }
    } catch (error) {
        console.error(`Error copying worker file: ${error.message}`);
        throw error;
    }
};

// Download worker file from CDN as a fallback
const downloadWorkerFile = async () => {
    try {
        console.log(`Attempting to download PDF.js worker from CDN...`);

        // Use the node-fetch module if available, otherwise use a simple HTTP request
        let fetch;
        try {
            fetch = require("node-fetch");
        } catch (err) {
            // If node-fetch is not available, use a simple HTTP request
            const https = require("https");
            fetch = async (url) => {
                return new Promise((resolve, reject) => {
                    https
                        .get(url, (res) => {
                            if (res.statusCode !== 200) {
                                reject(
                                    new Error(
                                        `Request failed with status code ${res.statusCode}`
                                    )
                                );
                                return;
                            }

                            const chunks = [];
                            res.on("data", (chunk) => chunks.push(chunk));
                            res.on("end", () =>
                                resolve({
                                    ok: true,
                                    buffer: () =>
                                        Promise.resolve(Buffer.concat(chunks)),
                                })
                            );
                        })
                        .on("error", reject);
                });
            };
        }

        // URL for the worker file - use the exact version we need
        const cdnUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJsVersion}/pdf.worker.min.js`;
        console.log(`Downloading from: ${cdnUrl}`);

        const response = await fetch(cdnUrl);
        if (!response.ok) {
            throw new Error(
                `Failed to download worker file: HTTP ${response.status}`
            );
        }

        const buffer = await response.buffer();
        const destPath = path.join(publicPath, "pdf.worker.js");
        fs.writeFileSync(destPath, buffer);

        console.log(
            `Successfully downloaded worker file from CDN (${buffer.length} bytes)`
        );
        return destPath;
    } catch (error) {
        console.error(`Error downloading worker file: ${error.message}`);
        throw error;
    }
};

// Main function
const main = async () => {
    try {
        // First try to find the worker file in node_modules
        try {
            const workerPath = findPdfWorker();
            copyWorkerFile(workerPath);
            console.log(
                "PDF.js worker file copied successfully from node_modules!"
            );
            return;
        } catch (findError) {
            console.warn(
                `Could not find worker file in node_modules: ${findError.message}`
            );
            console.log("Trying alternative methods...");
        }

        // If we couldn't find it in node_modules, try to download it from CDN
        try {
            await downloadWorkerFile();
            console.log("PDF.js worker file downloaded successfully from CDN!");
            return;
        } catch (downloadError) {
            console.warn(
                `Could not download worker file from CDN: ${downloadError.message}`
            );
        }

        // Last resort: create a placeholder worker file
        const destPath = path.join(publicPath, "pdf.worker.js");
        if (!fs.existsSync(destPath)) {
            console.log("Creating a placeholder worker file as last resort...");
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
    } catch (error) {
        console.error("Error setting up PDF.js worker file:", error.message);
        process.exit(1);
    }
};

// Run the script
main().catch((err) => {
    console.error("Unhandled error in main function:", err);
    process.exit(1);
});
