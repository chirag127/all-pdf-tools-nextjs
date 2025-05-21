'use client';

import React, { useState, useEffect } from 'react';
import { FiFileText, FiImage, FiGrid } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import ReactPdfViewer from './ReactPdfViewer';
import PdfTextExtractor from './PdfTextExtractor';
import ReactPdfThumbnails from './ReactPdfThumbnails';

type ViewMode = 'pdf' | 'text' | 'both';

interface AdvancedPdfViewerProps {
  file: File | Blob | ArrayBuffer | Uint8Array;
  className?: string;
  initialViewMode?: ViewMode;
  showThumbnails?: boolean;
  initialPassword?: string;
}

export default function AdvancedPdfViewer({
  file,
  className = '',
  initialViewMode = 'pdf',
  showThumbnails = true,
  initialPassword = '',
}: AdvancedPdfViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [password, setPassword] = useState<string>(initialPassword);

  // No need to initialize PDF.js worker as react-pdf handles it internally

  // Handle document loaded
  const handleDocumentLoaded = (pages: number) => {
    setNumPages(pages);
  };

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle text extracted
  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
  };

  // Handle thumbnail click
  const handleThumbnailClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    if (viewMode === 'text') {
      setViewMode('pdf');
    }
  };

  // No longer need to handle password protected status separately
  // as react-pdf handles it internally

  // Handle password change from child components
  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* View mode controls */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'pdf' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('pdf')}
            aria-label="PDF view"
          >
            <FiImage className="mr-1" /> PDF View
          </Button>
          <Button
            variant={viewMode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('text')}
            aria-label="Text view"
          >
            <FiFileText className="mr-1" /> Text View
          </Button>
          <Button
            variant={viewMode === 'both' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('both')}
            aria-label="Split view"
          >
            <FiGrid className="mr-1" /> Split View
          </Button>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {numPages > 0 && `${currentPage} of ${numPages}`}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-4">
        {/* Thumbnails sidebar */}
        {showThumbnails && (
          <div className="hidden w-24 flex-shrink-0 overflow-y-auto md:block">
            <ReactPdfThumbnails
              file={file}
              currentPage={currentPage}
              onThumbnailClick={handleThumbnailClick}
              className="sticky top-4"
              password={password}
            />
          </div>
        )}

        {/* Main viewer area */}
        <div className="flex flex-1 flex-col">
          {viewMode === 'pdf' && (
            <ReactPdfViewer
              file={file}
              initialPage={currentPage}
              onPageChange={handlePageChange}
              onDocumentLoaded={handleDocumentLoaded}
              password={password}
            />
          )}

          {viewMode === 'text' && (
            <PdfTextExtractor
              file={file}
              onTextExtracted={handleTextExtracted}
              password={password}
            />
          )}

          {viewMode === 'both' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ReactPdfViewer
                file={file}
                initialPage={currentPage}
                onPageChange={handlePageChange}
                onDocumentLoaded={handleDocumentLoaded}
                password={password}
              />
              <PdfTextExtractor
                file={file}
                onTextExtracted={handleTextExtracted}
                showControls={false}
                password={password}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
