// Script to copy PDF.js worker file to the public directory
const fs = require('fs');
const path = require('path');

// Paths
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const publicPath = path.join(__dirname, '..', 'public');

// Find the PDF.js worker file
const findPdfWorker = () => {
  // Check different possible locations for the worker file
  const possiblePaths = [
    // Legacy build
    path.join(nodeModulesPath, 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.js'),
    path.join(nodeModulesPath, 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.js'),
    // Standard build
    path.join(nodeModulesPath, 'pdfjs-dist', 'build', 'pdf.worker.js'),
    path.join(nodeModulesPath, 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
    // ES module build
    path.join(nodeModulesPath, 'pdfjs-dist', 'build', 'pdf.worker.mjs'),
    path.join(nodeModulesPath, 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
    // Webpack build
    path.join(nodeModulesPath, 'pdfjs-dist', 'webpack', 'pdf.worker.js'),
    path.join(nodeModulesPath, 'pdfjs-dist', 'webpack', 'pdf.worker.min.js'),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`Found PDF.js worker file at: ${filePath}`);
      return filePath;
    }
  }

  throw new Error('PDF.js worker file not found in node_modules');
};

// Copy the worker file to the public directory
const copyWorkerFile = (sourcePath) => {
  // Create the destination path
  const fileName = path.basename(sourcePath);
  const destPath = path.join(publicPath, 'pdf.worker.js');

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
};

// Main function
const main = () => {
  try {
    const workerPath = findPdfWorker();
    copyWorkerFile(workerPath);
    console.log('PDF.js worker file copied successfully!');
  } catch (error) {
    console.error('Error copying PDF.js worker file:', error.message);
    process.exit(1);
  }
};

// Run the script
main();
