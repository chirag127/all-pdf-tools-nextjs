// Route segment config for the PDF tools page
// This file enables static generation for this route

// Set dynamic to 'error' to ensure the route is statically generated
// This will throw an error if a page that should be static is accessed dynamically
export const dynamic = "error";

// Enable static generation for dynamic parameters
export const dynamicParams = true;

// Set revalidate to false to disable ISR (Incremental Static Regeneration)
export const revalidate = false;

// Set fetchCache to 'only-cache' to ensure data is cached
export const fetchCache = "only-cache";

// Set runtime to 'nodejs' for static generation
export const runtime = "nodejs";

// Set preferredRegion to 'auto' for optimal deployment
export const preferredRegion = "auto";
