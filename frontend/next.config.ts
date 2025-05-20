import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Comment out the export option for development
    // output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
    images: {
        unoptimized: true,
    },
    // Disable server-side features since we're exporting to static HTML
    trailingSlash: true,
};

export default nextConfig;
