import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Enable static export for GitHub Pages deployment
    output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
    images: {
        unoptimized: true,
    },
    // Disable server-side features since we're exporting to static HTML
    trailingSlash: true,
};

export default nextConfig;
