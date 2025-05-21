'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight, FiRotateCw, FiAlertTriangle } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import setupPdfWorker from '@/lib/pdfWorker';
import PdfPasswordInput from './PdfPasswordInput';

interface PdfViewerProps {
  file: File | Blob | ArrayBuffer | Uint8Array;
  initialPage?: number;
  scale?: number;
  onPageChange?: (pageNumber: number) => void;
  onDocumentLoaded?: (numPages: number) => void;
  className?: string;
  password?: string;
}

type ErrorType = 'password' | 'corrupted' | 'generic' | null;

export default function PdfViewer({
  file,
  initialPage = 1,
  scale: initialScale = 1.0,
  onPageChange,
  onDocumentLoaded,
  className = '',
  password: initialPassword,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(initialScale);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [password, setPassword] = useState<string>(initialPassword || '');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordAttempting, setIsPasswordAttempting] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);

  // Initialize PDF.js worker
  useEffect(() => {
    setupPdfWorker();
  }, []);

  // Reset states when file changes
  useEffect(() => {
    if (!initialPassword) {
      setPassword('');
    }
    setPasswordError(null);
    setErrorType(null);
    setError(null);
  }, [file, initialPassword]);

  // Load the PDF document
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    const loadPdf = async () => {
      try {
        // Dynamically import PDF.js to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');

        // Convert file to ArrayBuffer if it's a File or Blob
        // Use a type that's compatible with PDF.js DocumentInitParameters
        let data: ArrayBuffer | Uint8Array;
        if (file instanceof File || file instanceof Blob) {
          data = await file.arrayBuffer();
        } else if (file instanceof Uint8Array) {
          data = file; // Use the Uint8Array directly
        } else {
          // Convert ArrayBufferLike to Uint8Array if needed
          data = file instanceof SharedArrayBuffer
            ? new Uint8Array(file)
            : file as ArrayBuffer;
        }

        // Create options object with password if provided
        // Use the correct type for DocumentInitParameters
        const options = {
          data: data instanceof SharedArrayBuffer
            ? new Uint8Array(data) // Convert SharedArrayBuffer to Uint8Array
            : data, // Keep ArrayBuffer as is
          password: password || undefined,
        };

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(options);

        // Add an onPassword callback to detect password-protected PDFs
        loadingTask.onPassword = (updatePassword: (password: string) => void, reason: number) => {
          // reason=1 means wrong password, reason=2 means first request for password
          if (isMounted) {
            setIsLoading(false);
            setErrorType('password');

            if (reason === 1) {
              setPasswordError('Incorrect password. Please try again.');
            } else {
              setPasswordError(null);
            }
          }
        };

        const pdf = await loadingTask.promise;

        if (isMounted) {
          setPdfDocument(pdf);
          setNumPages(pdf.numPages);
          setPageNumber(initialPage > 0 && initialPage <= pdf.numPages ? initialPage : 1);
          setIsLoading(false);

          // If we got here with a password, clear any password errors
          if (password) {
            setPasswordError(null);
          }

          if (onDocumentLoaded) {
            onDocumentLoaded(pdf.numPages);
          }
        }
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        if (isMounted) {
          // Check if this is a password error
          if (err.name === 'PasswordException' ||
              (err.message && err.message.includes('password'))) {
            setErrorType('password');
            setError('This PDF is password protected. Please enter the password to view the document.');
          }
          // Check if this is a corrupted file error
          else if (err.name === 'InvalidPDFException' ||
                  (err.message && err.message.includes('corrupt'))) {
            setErrorType('corrupted');
            setError('This PDF file appears to be corrupted and cannot be processed.');
          }
          // Generic error
          else {
            setErrorType('generic');
            setError('Failed to load PDF document. Please try again or use a different PDF file.');
          }
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
  }, [file, initialPage, onDocumentLoaded, password]);

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

  // Handle password submission
  const handlePasswordSubmit = (submittedPassword: string) => {
    setIsPasswordAttempting(true);
    setPassword(submittedPassword);
    setIsLoading(true);

    // The effect will re-run with the new password
    setTimeout(() => {
      if (password === submittedPassword) {
        setIsPasswordAttempting(false);
      }
    }, 500);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Controls - Only show when PDF is loaded successfully */}
      {numPages > 0 && !error && (
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
      )}

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

        {errorType === 'password' ? (
          <div className="w-full max-w-md p-4">
            <PdfPasswordInput
              onSubmit={handlePasswordSubmit}
              isLoading={isPasswordAttempting}
              error={passwordError}
            />
          </div>
        ) : error ? (
          <div className="w-full max-w-md p-4">
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex items-start">
                {errorType === 'corrupted' ? (
                  <FiAlertTriangle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
                ) : null}
                <div>
                  <div className="text-sm font-medium text-red-800 dark:text-red-300">
                    {errorType === 'corrupted' ? 'Corrupted PDF File' : 'Error Loading PDF'}
                  </div>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-400">
                    {error}
                    {errorType === 'corrupted' && (
                      <div className="mt-2 text-xs">
                        Try opening this file with a different PDF viewer to verify if it's corrupted.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-lg" />
        )}
      </div>
    </div>
  );
}
