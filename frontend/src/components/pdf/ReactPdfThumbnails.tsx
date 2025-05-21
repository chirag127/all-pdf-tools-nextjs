'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiAlertTriangle, FiFileText } from 'react-icons/fi';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ReactPdfThumbnailsProps {
  file: File | Blob | ArrayBuffer | Uint8Array | string;
  currentPage?: number;
  onThumbnailClick?: (pageNumber: number) => void;
  className?: string;
  maxThumbnails?: number;
  password?: string;
}

export default function ReactPdfThumbnails({
  file,
  currentPage = 1,
  onThumbnailClick,
  className = '',
  maxThumbnails = 20,
  password = '',
}: ReactPdfThumbnailsProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Convert file to a format that react-pdf can handle
  const getFileData = () => {
    if (typeof file === 'string') {
      return file; // URL or base64 data
    } else if (file instanceof File || file instanceof Blob) {
      return file;
    } else if (file instanceof ArrayBuffer || file instanceof Uint8Array) {
      return new Blob([file]);
    }
    return file;
  };

  // Handle document load success
  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  // Handle document load error
  const handleLoadError = (error: Error) => {
    console.error('Error loading PDF for thumbnails:', error);
    setError('Failed to load PDF document for thumbnails.');
    setIsLoading(false);
  };

  // Handle thumbnail click
  const handleThumbnailClick = (pageNumber: number) => {
    if (onThumbnailClick) {
      onThumbnailClick(pageNumber);
    }
  };

  // Generate a range of page numbers to display as thumbnails
  const getThumbnailPages = (): number[] => {
    const pages = [];
    const totalPages = Math.min(numPages, maxThumbnails);
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className={`${className}`}>
      {isLoading ? (
        <div className="flex h-20 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Loading thumbnails...</span>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-3 text-xs dark:bg-red-900/20">
          <div className="flex items-start">
            <FiAlertTriangle className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
            <div className="text-red-700 dark:text-red-400">
              {error}
            </div>
          </div>
        </div>
      ) : (
        <Document
          file={getFileData()}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          options={{ password }}
        >
          <div className="flex flex-wrap gap-2">
            {getThumbnailPages().map((pageNumber) => (
              <div
                key={pageNumber}
                className={`relative cursor-pointer overflow-hidden rounded border-2 ${
                  currentPage === pageNumber
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => handleThumbnailClick(pageNumber)}
              >
                <div className="h-20 w-16">
                  <Page
                    pageNumber={pageNumber}
                    width={64}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                      </div>
                    }
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-center text-xs text-white">
                  {pageNumber}
                </div>
              </div>
            ))}

            {numPages > maxThumbnails && (
              <div className="flex h-20 w-16 items-center justify-center rounded border-2 border-gray-200 bg-gray-50 text-center text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                +{numPages - maxThumbnails} more pages
              </div>
            )}
          </div>
        </Document>
      )}
    </div>
  );
}
