/**
 * Polyfill for DOMMatrix and related classes for server-side rendering
 *
 * This file provides minimal implementations of DOMMatrix and related classes
 * that are used by PDF.js but not available in Node.js environment.
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Only apply polyfills if we're not in a browser environment
if (!isBrowser) {
    // Simple DOMMatrix polyfill for server-side rendering
    class DOMMatrixPolyfill {
        a: number;
        b: number;
        c: number;
        d: number;
        e: number;
        f: number;
        m11: number;
        m12: number;
        m13: number;
        m14: number;
        m21: number;
        m22: number;
        m23: number;
        m24: number;
        m31: number;
        m32: number;
        m33: number;
        m34: number;
        m41: number;
        m42: number;
        m43: number;
        m44: number;
        is2D: boolean;
        isIdentity: boolean;

        constructor(init?: string | number[]) {
            // Initialize with identity matrix
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
                    } else if (init.length === 16) {
                        // 3D matrix
                        this.m11 = init[0];
                        this.m12 = init[1];
                        this.m13 = init[2];
                        this.m14 = init[3];
                        this.m21 = init[4];
                        this.m22 = init[5];
                        this.m23 = init[6];
                        this.m24 = init[7];
                        this.m31 = init[8];
                        this.m32 = init[9];
                        this.m33 = init[10];
                        this.m34 = init[11];
                        this.m41 = init[12];
                        this.m42 = init[13];
                        this.m43 = init[14];
                        this.m44 = init[15];
                        this.a = init[0];
                        this.b = init[1];
                        this.c = init[4];
                        this.d = init[5];
                        this.e = init[12];
                        this.f = init[13];
                    }
                    this.is2D = init.length === 6;
                    this.isIdentity = false; // Simplified check
                }
            }
        }

        // Add minimal required methods
        multiply(): DOMMatrixPolyfill {
            return this; // Simplified implementation
        }

        inverse(): DOMMatrixPolyfill {
            return this; // Simplified implementation
        }

        translate(): DOMMatrixPolyfill {
            return this; // Simplified implementation
        }

        scale(): DOMMatrixPolyfill {
            return this; // Simplified implementation
        }

        rotate(): DOMMatrixPolyfill {
            return this; // Simplified implementation
        }

        transformPoint(): { x: number; y: number; z: number; w: number } {
            return { x: 0, y: 0, z: 0, w: 1 }; // Simplified implementation
        }
    }

    // Apply polyfills to global scope
    if (typeof global !== "undefined") {
        (global as any).DOMMatrix = DOMMatrixPolyfill;

        // Add other required browser APIs that might be missing
        (global as any).DOMPoint = class DOMPoint {
            x: number;
            y: number;
            z: number;
            w: number;

            constructor(x = 0, y = 0, z = 0, w = 1) {
                this.x = x;
                this.y = y;
                this.z = z;
                this.w = w;
            }
        };

        // Add canvas-related polyfills if needed
        if (!(global as any).CanvasRenderingContext2D) {
            (
                global as any
            ).CanvasRenderingContext2D = class CanvasRenderingContext2D {};
        }

        // Add Path2D polyfill
        if (!(global as any).Path2D) {
            (global as any).Path2D = class Path2D {};
        }

        // Add ImageData polyfill
        if (!(global as any).ImageData) {
            (global as any).ImageData = class ImageData {
                width: number;
                height: number;
                data: Uint8ClampedArray;

                constructor(width: number, height: number) {
                    this.width = width;
                    this.height = height;
                    this.data = new Uint8ClampedArray(width * height * 4);
                }
            };
        }
    }
}

export {};
