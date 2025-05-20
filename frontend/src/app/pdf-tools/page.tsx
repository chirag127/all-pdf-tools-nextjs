'use client';

import React, { useState } from 'react';
import { FiFileText, FiTool, FiLock, FiEdit, FiRefreshCw } from 'react-icons/fi';
import { Card, CardGrid } from '@/components/common/Card';
import Link from 'next/link';

export default function PdfToolsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // PDF tool categories
  const categories = [
    {
      id: 'organization',
      title: 'Document Organization',
      icon: <FiFileText size={24} className="text-blue-500" />,
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
      icon: <FiRefreshCw size={24} className="text-green-500" />,
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
      icon: <FiEdit size={24} className="text-orange-500" />,
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
      icon: <FiLock size={24} className="text-red-500" />,
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
      icon: <FiTool size={24} className="text-purple-500" />,
      description: 'Enhance and optimize your PDF files',
      tools: [
        { id: 'compress', name: 'Compress PDF', description: 'Reduce the file size of a PDF document' },
        { id: 'repair', name: 'Repair PDF', description: 'Fix corrupted PDF files' },
        { id: 'compare', name: 'Compare PDFs', description: 'Compare two PDF documents and highlight differences' },
      ],
    },
  ];

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId === activeCategory ? null : categoryId);
    
    // Scroll to the category section if it's not already visible
    if (categoryId !== activeCategory) {
      const element = document.getElementById(categoryId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">PDF Tools</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          A comprehensive suite of tools to manage, edit, and enhance your PDF documents
        </p>
      </div>

      {/* Category navigation */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === category.id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleCategoryClick(category.id)}
          >
            <span className="mr-2">{category.icon}</span>
            {category.title}
          </button>
        ))}
      </div>

      {/* Tool categories */}
      <div className="space-y-12">
        {categories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            className={`scroll-mt-20 transition-opacity duration-300 ${
              activeCategory && activeCategory !== category.id ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <div className="mb-6">
              <h2 className="flex items-center text-2xl font-bold">
                <span className="mr-2">{category.icon}</span>
                {category.title}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{category.description}</p>
            </div>

            <CardGrid columns={4}>
              {category.tools.map((tool) => (
                <Link key={tool.id} href={`/pdf-tools/${category.id}/${tool.id}`}>
                  <Card className="h-full cursor-pointer transition-all hover:border-blue-300 hover:shadow-md dark:hover:border-blue-800">
                    <div className="flex flex-col items-center text-center">
                      <h3 className="text-lg font-medium">{tool.name}</h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </CardGrid>
          </section>
        ))}
      </div>
    </div>
  );
}
