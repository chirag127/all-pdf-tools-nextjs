// Import the static params and metadata functions
import { generateStaticParams, generateMetadata } from './static-params';

// Export the functions for Next.js to use
export { generateStaticParams, generateMetadata };

// Define the layout component
export default function PdfToolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ category: string; tool: string }>;
}) {
  return <>{children}</>;
}
