import { FiFileText, FiTool, FiLock, FiEdit, FiRefreshCw } from 'react-icons/fi';

// PDF tool categories and tools configuration
export const pdfTools = [
  {
    id: 'organization',
    title: 'Document Organization',
    icon: FiFileText,
    description: 'Organize and manage your PDF documents efficiently',
    tools: [
      { id: 'merge', name: 'Merge PDFs', description: 'Combine multiple PDF files into a single document' },
      { id: 'split', name: 'Split PDF', description: 'Split a PDF into multiple documents by page ranges' },
      { id: 'extract', name: 'Extract Pages', description: 'Extract specific pages from a PDF document' },
      { id: 'organize', name: 'Organize Pages', description: 'Rearrange, delete, or add pages to a PDF' },
    ],
  },
  {
    id: 'conversion',
    title: 'Conversion Tools',
    icon: FiRefreshCw,
    description: 'Convert PDFs to and from various formats',
    tools: [
      { id: 'to-pdf', name: 'Convert to PDF', description: 'Convert various file formats to PDF' },
      { id: 'from-pdf', name: 'Convert from PDF', description: 'Convert PDF to other file formats' },
      { id: 'ocr', name: 'OCR', description: 'Extract text from scanned documents using OCR' },
      { id: 'scan-to-pdf', name: 'Scan to PDF', description: 'Convert scanned images to searchable PDFs' },
    ],
  },
  {
    id: 'editing',
    title: 'Editing Tools',
    icon: FiEdit,
    description: 'Edit and modify PDF content with ease',
    tools: [
      { id: 'rotate', name: 'Rotate PDF', description: 'Rotate pages in a PDF document' },
      { id: 'add-page-numbers', name: 'Add Page Numbers', description: 'Add page numbers to a PDF document' },
      { id: 'add-watermark', name: 'Add Watermark', description: 'Add text or image watermarks to a PDF' },
      { id: 'crop', name: 'Crop PDF', description: 'Crop pages in a PDF document' },
    ],
  },
  {
    id: 'security',
    title: 'Security Tools',
    icon: FiLock,
    description: 'Protect and secure your PDF documents',
    tools: [
      { id: 'protect', name: 'Protect PDF', description: 'Add password protection to a PDF document' },
      { id: 'unlock', name: 'Unlock PDF', description: 'Remove password protection from a PDF document' },
      { id: 'sign', name: 'Sign PDF', description: 'Add digital signatures to a PDF document' },
      { id: 'redact', name: 'Redact PDF', description: 'Permanently remove sensitive information from a PDF' },
    ],
  },
  {
    id: 'enhancement',
    title: 'Enhancement Tools',
    icon: FiTool,
    description: 'Enhance and optimize your PDF files',
    tools: [
      { id: 'compress', name: 'Compress PDF', description: 'Reduce the file size of a PDF document' },
      { id: 'repair', name: 'Repair PDF', description: 'Fix corrupted PDF files' },
      { id: 'compare', name: 'Compare PDFs', description: 'Compare two PDF documents and highlight differences' },
    ],
  },
];

// Helper function to get tool info by category and tool ID
export const getToolInfo = (categoryId: string, toolId: string) => {
  const category = pdfTools.find((cat) => cat.id === categoryId);
  if (!category) return null;
  
  const tool = category.tools.find((t) => t.id === toolId);
  if (!tool) return null;
  
  return { ...tool, category: category.title };
};

// Helper function to get all tools as a flat array
export const getAllTools = () => {
  return pdfTools.flatMap((category) => 
    category.tools.map((tool) => ({
      ...tool,
      categoryId: category.id,
      categoryTitle: category.title,
    }))
  );
};
