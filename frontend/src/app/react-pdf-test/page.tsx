'use client';

import React, { useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import FileUpload from '@/components/common/FileUpload';
import ClientLayout from '@/components/common/ClientLayout';
import ReactPdfViewer from '@/components/pdf/ReactPdfViewer';
import Link from 'next/link';

export default function ReactPdfTestPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
  };

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center">
          <Link href="/" className="mr-4">
            <Button variant="outline" size="sm">
              <FiArrowLeft className="mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">React PDF Viewer Test</h1>
        </div>

        {/* File Upload */}
        {!file && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Upload a PDF File</h2>
            <FileUpload
              onFilesSelected={handleFileChange}
              accept=".pdf"
              maxFiles={1}
              maxSize={50 * 1024 * 1024} // 50MB
              className="h-64"
            />
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
            
            <ReactPdfViewer
              file={file}
              className="min-h-[600px]"
            />
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
