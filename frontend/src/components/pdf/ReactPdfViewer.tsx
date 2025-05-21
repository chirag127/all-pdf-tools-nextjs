'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight, FiRotateCw, FiAlertTriangle } from 'react-icons/fi';
import { Button } from '@/components/common/Button';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ReactPdfViewerProps {
  file: File | Blob | ArrayBuffer | Uint8Array | string;
  initialPage?: number;
  scale?: number;
  onPageChange?: (pageNumber: number) => void;
  onDocumentLoaded?: (numPages: number) => void;
  className?: string;
  password?: string;
}

export default function ReactPdfViewer({
  file,
  initialPage = 1,
  scale: initialScale = 1.0,
  onPageChange,
  onDocumentLoaded,
  className = '',
  password,
}: ReactPdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(initialScale);
  const [rotation, setRotation] = useState<number>(0);
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
    if (onDocumentLoaded) {
      onDocumentLoaded(numPages);
    }
  };

  // Handle document load error
  const handleLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF document. Please try again or use a different PDF file.');
    setIsLoading(false);
  };

  // Handle page change
  const goToPreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
      if (onPageChange) {
        onPageChange(pageNumber - 1);
      }
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
      if (onPageChange) {
        onPageChange(pageNumber + 1);
      }
    }
  };

  // Handle zoom
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.25, 0.5));
  };

  // Handle rotation
  const rotateClockwise = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
        {/* Page navigation */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={pageNumber <= 1}
          >
            <FiChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages || '?'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <FiChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom and rotation controls */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <FiZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <FiZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={rotateClockwise}>
            <FiRotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="relative flex-1 overflow-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}

        {error ? (
          <div className="flex h-full w-full flex-col items-center justify-center p-4">
            <FiAlertTriangle className="mb-2 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-lg font-semibold text-red-500">Error Loading PDF</h3>
            <p className="text-center text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        ) : (
          <div className="flex justify-center p-4">
            <Document
              file={getFileData()}
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              loading={<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>}
              options={{ password }}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={true}
                loading={<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
