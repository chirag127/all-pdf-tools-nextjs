// Add polyfills for browser APIs in Node.js environment
if (typeof window === 'undefined') {
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
    
    multiply() { return this; }
    inverse() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    transformPoint() { return { x: 0, y: 0, z: 0, w: 1 }; }
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Skip prerendering for pages that use browser-specific APIs
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  
  // Configure webpack
  webpack: (config, { isServer }) => {
    // Add a rule to handle PDF.js worker
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            publicPath: '/_next/static/worker',
            outputPath: 'static/worker',
          },
        },
      ],
    });
    
    return config;
  },
};

module.exports = nextConfig;
