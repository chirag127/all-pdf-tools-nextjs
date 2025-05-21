// Static params generation for PDF tools
import { getAllTools, pdfTools } from "@/lib/pdf-tools-config";

// Generate static params for all possible category and tool combinations
export async function generateStaticParams() {
    // Get all tools with their categories
    const allTools = getAllTools();

    // Log the static paths being generated
    console.log(`Generating static paths for ${allTools.length} PDF tools`);

    // Return an array of objects with category and tool params
    return allTools.map((tool) => {
        console.log(`  - /${tool.categoryId}/${tool.id}`);
        return {
            category: tool.categoryId,
            tool: tool.id,
        };
    });
}

// Generate metadata for each page
export async function generateMetadata({ params }) {
    // Find the tool info from the configuration
    const categoryInfo = pdfTools.find((cat) => cat.id === params.category);
    if (!categoryInfo) {
        return {
            title: "PDF Tool Not Found",
            description: "The requested PDF tool could not be found.",
        };
    }

    const toolInfo = categoryInfo.tools.find((t) => t.id === params.tool);
    if (!toolInfo) {
        return {
            title: "PDF Tool Not Found",
            description: "The requested PDF tool could not be found.",
        };
    }

    return {
        title: `${toolInfo.name} | All PDF Tools`,
        description: toolInfo.description,
        openGraph: {
            title: `${toolInfo.name} | All PDF Tools`,
            description: toolInfo.description,
            type: "website",
        },
    };
}
