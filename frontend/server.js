// Custom Next.js server to handle DOMMatrix polyfill
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Add browser API polyfills for server-side rendering
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

        // Handle initialization if provided
        if (init) {
            if (typeof init === "string") {
                // Parse CSS transform string (simplified)
                console.warn(
                    "DOMMatrix string initialization not fully implemented in polyfill"
                );
            } else if (Array.isArray(init)) {
                // Initialize from array
                if (init.length === 6) {
                    // 2D matrix
                    this.a = init[0];
                    this.b = init[1];
                    this.c = init[2];
                    this.d = init[3];
                    this.e = init[4];
                    this.f = init[5];
                    this.m11 = init[0];
                    this.m12 = init[1];
                    this.m21 = init[2];
                    this.m22 = init[3];
                    this.m41 = init[4];
                    this.m42 = init[5];
                }
            }
        }
    }

    // Add minimal required methods
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

// DOMPoint polyfill
global.DOMPoint = class DOMPoint {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
};

// Canvas-related polyfills
global.CanvasRenderingContext2D = class CanvasRenderingContext2D {};
global.Path2D = class Path2D {};
global.ImageData = class ImageData {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
    }
};

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            // Parse the URL
            const parsedUrl = parse(req.url, true);

            // Let Next.js handle the request
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error occurred handling", req.url, err);
            res.statusCode = 500;
            res.end("Internal Server Error");
        }
    }).listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
