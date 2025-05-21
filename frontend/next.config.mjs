/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // We're using Turbopack, so we don't need webpack configuration

    // Configure output mode for deployment
    // output: "standalone", // Uncomment for production deployment

    // Fix for trailing slash redirect warning
    skipTrailingSlashRedirect: true,

    // Fix for middleware URL normalize warning
    skipMiddlewareUrlNormalize: true,

    // Disable server-side rendering for pages that use browser-specific APIs
    webpack: (config, { isServer }) => {
        // Add a rule to handle PDF.js worker
        config.module.rules.push({
            test: /pdf\.worker\.(min\.)?js/,
            use: [
                {
                    loader: "file-loader",
                    options: {
                        name: "[name].[ext]",
                        publicPath: "/_next/static/worker",
                        outputPath: "static/worker",
                    },
                },
            ],
        });

        return config;
    },
};

export default nextConfig;
