'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight, FiRotateCw } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import setupPdfWorker from '@/lib/pdfWorker';

interface PdfViewerProps {
  file: File | Blob | ArrayBuffer | Uint8Array;
  initialPage?: number;
  scale?: number;
  onPageChange?: (pageNumber: number) => void;
  onDocumentLoaded?: (numPages: number) => void;
  className?: string;
}

export default function PdfViewer({
  file,
  initialPage = 1,
  scale: initialScale = 1.0,
  onPageChange,
  onDocumentLoaded,
  className = '',
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(initialScale);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);

  // Initialize PDF.js worker
  useEffect(() => {
    setupPdfWorker();
  }, []);

  // Load the PDF document
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        // Dynamically import PDF.js to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');
        
        // Convert file to ArrayBuffer if it's a File or Blob
        let data: ArrayBuffer;
        if (file instanceof File || file instanceof Blob) {
          data = await file.arrayBuffer();
        } else if (file instanceof Uint8Array) {
          data = file.buffer;
        } else {
          data = file as ArrayBuffer;
        }

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        
        if (isMounted) {
          setPdfDocument(pdf);
          setNumPages(pdf.numPages);
          setPageNumber(initialPage > 0 && initialPage <= pdf.numPages ? initialPage : 1);
          setIsLoading(false);
          
          if (onDocumentLoaded) {
            onDocumentLoaded(pdf.numPages);
          }
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (isMounted) {
          setError('Failed to load PDF document. The file might be corrupted or password-protected.');
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
      // Clean up PDF document
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [file, initialPage, onDocumentLoaded]);

  // Render the current page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        setIsLoading(true);
        const page = await pdfDocument.getPage(pageNumber);
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        // Calculate viewport with scale and rotation
        const viewport = page.getViewport({ scale, rotation: rotation });
        
        // Set canvas dimensions to match viewport
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        setIsLoading(false);
        
        if (onPageChange) {
          onPageChange(pageNumber);
        }
      } catch (err) {
        console.error('Error rendering PDF page:', err);
        setError('Failed to render PDF page.');
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfDocument, pageNumber, scale, rotation, onPageChange]);

  // Handle page navigation
  const goToPreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
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
      <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={pageNumber <= 1 || isLoading}
            aria-label="Previous page"
          >
            <FiChevronLeft />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages || isLoading}
            aria-label="Next page"
          >
            <FiChevronRight />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5 || isLoading}
            aria-label="Zoom out"
          >
            <FiZoomOut />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0 || isLoading}
            aria-label="Zoom in"
          >
            <FiZoomIn />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={rotateClockwise}
            disabled={isLoading}
            aria-label="Rotate clockwise"
          >
            <FiRotateCw />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div 
        ref={containerRef}
        className="relative flex min-h-[500px] items-center justify-center overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex">
              <div className="text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} className="shadow-lg" />
      </div>
    </div>
  );
}
