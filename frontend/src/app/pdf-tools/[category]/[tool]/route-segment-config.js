// Route segment config for the PDF tools page
// This file enables static generation for this route

// Set dynamic to 'force-static' to ensure the route is statically generated
// This is the recommended approach for Next.js 15.3.2
export const dynamic = "force-static";

// Enable static generation for dynamic parameters
export const dynamicParams = true;

// Set revalidate to false to disable ISR (Incremental Static Regeneration)
export const revalidate = false;

// Set runtime to 'nodejs' for static generation
export const runtime = "nodejs";

// Set preferredRegion to 'auto' for optimal deployment
export const preferredRegion = "auto";
