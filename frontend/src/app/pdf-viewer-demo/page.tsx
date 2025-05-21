'use client';

import React, { useState, useEffect } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import FileUpload from '@/components/common/FileUpload';
import ClientLayout from '@/components/common/ClientLayout';
import AdvancedPdfViewer from '@/components/pdf/AdvancedPdfViewer';
import Link from 'next/link';
import setupPdfWorker from '@/lib/pdfWorker';

export default function PdfViewerDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize PDF.js worker
  useEffect(() => {
    setupPdfWorker();
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.includes('pdf')) {
      setError('Please upload a PDF file.');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleClearFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/pdf-tools">
            <Button
              variant="ghost"
              className="mb-4 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <FiArrowLeft className="mr-2" />
              Back to PDF Tools
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">PDF Viewer Demo</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload a PDF file to view it with our advanced PDF viewer.
          </p>
        </div>

        {/* File upload */}
        {!file && (
          <div className="mb-8">
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={file}
              onClear={handleClearFile}
              label="Upload PDF"
              accept={{ 'application/pdf': ['.pdf'] }}
            />
            
            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <div className="flex">
                  <div className="text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PDF Viewer */}
        {file && (
          <div className="mb-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{file.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFile}
              >
                Change PDF
              </Button>
            </div>
            
            <AdvancedPdfViewer
              file={file}
              className="min-h-[600px]"
            />
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
