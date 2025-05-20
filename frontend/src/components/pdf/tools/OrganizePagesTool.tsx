'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiArrowUp, FiArrowDown, FiTrash2, FiCopy } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import * as pdfUtils from '@/lib/pdfUtils';
import { pdfApi } from '@/lib/api';

// Define the props for the page component
interface PageItemProps {
  id: number;
  index: number;
  pageNumber: number;
  preview: string;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
}

// Page component
const PageItem: React.FC<PageItemProps> = ({
  id,
  index,
  pageNumber,
  preview,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate
}) => {
  return (
    <div className="relative rounded-md border border-gray-200 dark:border-gray-700">
      <div className="relative aspect-[3/4]">
        {preview ? (
          <img
            src={preview}
            alt={`Page ${pageNumber}`}
            className="h-full w-full rounded-t-md object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
            <span className="text-gray-400">Page {pageNumber}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between rounded-b-md bg-white p-2 dark:bg-gray-800">
        <span className="text-xs font-medium">Page {pageNumber}</span>
        <div className="flex space-x-1">
          <button
            onClick={() => onMoveUp(index)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="Move up"
            disabled={index === 0}
          >
            <FiArrowUp size={14} className={index === 0 ? 'opacity-50' : ''} />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="Move down"
            disabled={index === pageNumber - 1}
          >
            <FiArrowDown size={14} />
          </button>
          <button
            onClick={() => onDuplicate(index)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="Duplicate page"
          >
            <FiCopy size={14} />
          </button>
          <button
            onClick={() => onDelete(index)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="Delete page"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OrganizePagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pagePreviews, setPagePreviews] = useState<string[]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // When a file is selected, get its page count and generate previews
  useEffect(() => {
    const getDocumentInfo = async () => {
      if (!file) return;

      try {
        // Get page count
        const count = await pdfUtils.getPageCount(file);
        setPageCount(count);

        // Initialize page order
        setPageOrder(Array.from({ length: count }, (_, i) => i + 1));

        // Generate previews for all pages (up to a reasonable limit)
        const maxPreviewPages = Math.min(count, 50); // Limit to 50 pages for performance
        const previews = [];

        for (let i = 1; i <= maxPreviewPages; i++) {
          const pagePreview = await pdfUtils.getPagePreview(file, i);
          previews.push(pagePreview);
        }

        setPagePreviews(previews);
      } catch (error) {
        console.error('Error getting document info:', error);
        setError('Failed to read the PDF file. The file might be corrupted or password-protected.');
      }
    };

    getDocumentInfo();
  }, [file]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResultUrl(null);
    setPagePreviews([]);
    setPageOrder([]);
  };

  const handleClearFile = () => {
    setFile(null);
    setError(null);
    setResultUrl(null);
    setPageCount(0);
    setPagePreviews([]);
    setPageOrder([]);
  };

  // Move a page up
  const handleMovePageUp = (index: number) => {
    if (index === 0) return;

    const newOrder = [...pageOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;

    setPageOrder(newOrder);
  };

  // Move a page down
  const handleMovePageDown = (index: number) => {
    if (index === pageOrder.length - 1) return;

    const newOrder = [...pageOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;

    setPageOrder(newOrder);
  };

  // Delete a page
  const handleDeletePage = (index: number) => {
    if (pageOrder.length <= 1) {
      setError('Cannot delete the last page. A PDF must have at least one page.');
      return;
    }

    const newOrder = [...pageOrder];
    newOrder.splice(index, 1);
    setPageOrder(newOrder);
  };

  // Duplicate a page
  const handleDuplicatePage = (index: number) => {
    const newOrder = [...pageOrder];
    const pageToDuplicate = newOrder[index];
    newOrder.splice(index + 1, 0, pageToDuplicate);
    setPageOrder(newOrder);
  };

  // Organize the PDF with the new page order
  const handleOrganize = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    if (pageOrder.length === 0) {
      setError('Cannot create a PDF with no pages.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Try client-side organization first
      try {
        const organizedPdfBytes = await pdfUtils.organizePdf(file, pageOrder);
        setProgress(80);

        // Create a Blob from the organized PDF bytes
        const blob = new Blob([organizedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        setProgress(100);
        setResultUrl(url);
        setIsProcessing(false);
        return;
      } catch (clientError) {
        console.error('Client-side organization failed, falling back to server:', clientError);
        setProgress(20);
      }

      // Fall back to server-side organization if client-side fails
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Call the API to organize PDF
      const result = await pdfApi.organizePdf(file, pageOrder);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while organizing the PDF.');
      console.error('Error organizing PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'organized'}_organized.pdf`;

      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = resultUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6">
      {/* File upload */}
      {!resultUrl && (
        <>
          <div>
            <h3 className="mb-2 text-lg font-medium">Upload PDF</h3>
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={file}
              onClear={handleClearFile}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex">
                <div className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* Page organization UI */}
          {file && pageOrder.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-medium">Organize Pages</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Use the arrow buttons to reorder pages. You can also delete or duplicate pages.
              </p>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {pageOrder.map((pageNum, index) => (
                  <PageItem
                    key={`${pageNum}-${index}`}
                    id={pageNum}
                    index={index}
                    pageNumber={pageNum}
                    preview={pagePreviews[pageNum - 1] || ''}
                    onMoveUp={handleMovePageUp}
                    onMoveDown={handleMovePageDown}
                    onDelete={handleDeletePage}
                    onDuplicate={handleDuplicatePage}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Organize button */}
          {file && pageOrder.length > 0 && (
            <div className="flex justify-center">
              <Button
                onClick={handleOrganize}
                disabled={isProcessing}
                className={isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isProcessing ? 'Processing...' : 'Apply Changes'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-400">
            Processing PDF
          </h2>
          <p className="mt-2 text-blue-700 dark:text-blue-300">
            Please wait while we organize your PDF. This may take a few moments.
          </p>
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-in-out dark:bg-blue-400"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-1 text-right text-sm text-blue-700 dark:text-blue-300">
              {progress}%
            </div>
          </div>
        </div>
      )}

      {/* Result section */}
      {resultUrl && !isProcessing && (
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
          <h2 className="text-xl font-semibold text-green-800 dark:text-green-400">
            PDF Organized Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDF has been organized successfully.
          </p>
          <div className="mt-4 flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FiDownload className="mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResultUrl(null);
                setFile(null);
                setPageCount(0);
                setPagePreviews([]);
                setPageOrder([]);
              }}
            >
              Organize Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
