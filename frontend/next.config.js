// Add polyfills for browser APIs in Node.js environment
if (typeof window === "undefined") {
    // DOMMatrix polyfill
    global.DOMMatrix = class DOMMatrix {
        constructor(init) {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
            this.m11 = 1;
            this.m12 = 0;
            this.m13 = 0;
            this.m14 = 0;
            this.m21 = 0;
            this.m22 = 1;
            this.m23 = 0;
            this.m24 = 0;
            this.m31 = 0;
            this.m32 = 0;
            this.m33 = 1;
            this.m34 = 0;
            this.m41 = 0;
            this.m42 = 0;
            this.m43 = 0;
            this.m44 = 1;
            this.is2D = true;
            this.isIdentity = true;
        }

        multiply() {
            return this;
        }
        inverse() {
            return this;
        }
        translate() {
            return this;
        }
        scale() {
            return this;
        }
        rotate() {
            return this;
        }
        transformPoint() {
            return { x: 0, y: 0, z: 0, w: 1 };
        }
    };

    // Other browser API polyfills
    global.DOMPoint = class DOMPoint {
        constructor(x = 0, y = 0, z = 0, w = 1) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
    };

    global.Path2D = class Path2D {};
    global.ImageData = class ImageData {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.data = new Uint8ClampedArray(width * height * 4);
        }
    };
}

const path = require("path");
const fs = require("fs");

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable strict mode to prevent double rendering in development
    // This can help with navigation issues
    reactStrictMode: false,

    // Skip prerendering for pages that use browser-specific APIs
    skipTrailingSlashRedirect: true,
    skipMiddlewareUrlNormalize: true,

    // Configure webpack
    webpack: (config, { isServer, dev }) => {
        // Add a rule to handle PDF.js worker
        config.module.rules.push({
            test: /pdf\.worker\.(min\.)?(js|mjs)$/,
            use: [
                {
                    loader: "file-loader",
                    options: {
                        name: "pdf.worker.js",
                        publicPath: "/_next/static/worker",
                        outputPath: "static/worker",
                    },
                },
            ],
        });

        // Add resolve aliases for PDF.js
        config.resolve.alias = {
            ...config.resolve.alias,
            // Add aliases for different PDF.js builds if needed
            "pdfjs-dist/build/pdf.worker": path.resolve(
                __dirname,
                "node_modules/pdfjs-dist/build/pdf.worker.js"
            ),
        };

        // Copy PDF.js worker file to public directory during build
        if (!isServer && dev) {
            const publicDir = path.join(__dirname, "public");
            const workerSrc = path.join(
                __dirname,
                "node_modules/pdfjs-dist/build/pdf.worker.js"
            );
            const workerDest = path.join(publicDir, "pdf.worker.js");

            // Check if worker file exists in node_modules
            if (fs.existsSync(workerSrc)) {
                // Create public directory if it doesn't exist
                if (!fs.existsSync(publicDir)) {
                    fs.mkdirSync(publicDir, { recursive: true });
                }

                // Copy worker file to public directory
                fs.copyFileSync(workerSrc, workerDest);
                console.log(`Copied PDF.js worker file to ${workerDest}`);
            } else {
                console.warn("PDF.js worker file not found in node_modules");
            }
        }

        return config;
    },
};

module.exports = nextConfig;
