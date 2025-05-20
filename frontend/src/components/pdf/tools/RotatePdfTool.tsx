'use client';

import React, { useState, useEffect } from 'react';
import { FiRotateCw, FiDownload } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { usePdfStore } from '@/lib/store';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

export default function RotatePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(90);
  const [rotateAll, setRotateAll] = useState<boolean>(true);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pagePreviews, setPagePreviews] = useState<string[]>([]);

  // When a file is selected, get its page count and generate previews
  useEffect(() => {
    const getDocumentInfo = async () => {
      if (!file) return;

      try {
        // Get page count
        const count = await pdfUtils.getPageCount(file);
        setPageCount(count);
        setSelectedPages([1]); // Select the first page by default

        // Generate preview of first page
        const preview = await pdfUtils.getPagePreview(file, 1);
        setPreviewUrl(preview);

        // Generate previews for all pages (up to a reasonable limit)
        const maxPreviewPages = Math.min(count, 20); // Limit to 20 pages for performance
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
  };

  const handleClearFile = () => {
    setFile(null);
    setPageCount(0);
    setSelectedPages([]);
    setError(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setPagePreviews([]);
  };

  const togglePage = (pageNumber: number) => {
    if (selectedPages.includes(pageNumber)) {
      // Remove page if already selected
      setSelectedPages(selectedPages.filter(p => p !== pageNumber));
    } else {
      // Add page if not selected
      setSelectedPages([...selectedPages, pageNumber].sort((a, b) => a - b));
    }
  };

  const selectAllPages = () => {
    setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1));
  };

  const clearSelection = () => {
    setSelectedPages([]);
  };

  const handleRotate = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    if (!rotateAll && selectedPages.length === 0) {
      setError('Please select at least one page to rotate.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Try client-side rotation first
      try {
        const rotatedPdfBytes = await pdfUtils.rotatePdf(
          file,
          rotation,
          rotateAll ? undefined : selectedPages
        );
        setProgress(80);

        // Create a Blob from the rotated PDF bytes
        const blob = new Blob([rotatedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        setProgress(100);
        setResultUrl(url);
        setIsProcessing(false);
        return;
      } catch (clientError) {
        console.error('Client-side rotation failed, falling back to server:', clientError);
        setProgress(20);
      }

      // Fall back to server-side rotation if client-side fails
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Call the API to rotate PDF
      const result = await pdfApi.rotatePdf(
        file,
        rotation,
        rotateAll ? undefined : selectedPages
      );

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while rotating the PDF.');
      console.error('Error rotating PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'rotated'}_${rotation}deg.pdf`;

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

          {/* File preview */}
          {file && previewUrl && (
            <div className="flex items-center space-x-4">
              <div className="h-24 w-20 overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                <img
                  src={previewUrl}
                  alt={`Preview of ${file.name}`}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount} pages
                </p>
              </div>
            </div>
          )}

          {/* Rotation options */}
          {file && (
            <div>
              <h3 className="mb-4 text-lg font-medium">Rotation Options</h3>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Rotation Angle</label>
                  <div className="flex space-x-4">
                    {[90, 180, 270].map(angle => (
                      <button
                        key={angle}
                        onClick={() => setRotation(angle)}
                        className={`flex items-center space-x-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                          rotation === angle
                            ? 'border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <FiRotateCw className={angle === 180 ? 'rotate-180' : angle === 270 ? '-rotate-90' : ''} />
                        <span>{angle}°</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Pages to Rotate</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={rotateAll}
                        onChange={() => setRotateAll(true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:text-blue-400 dark:focus:ring-blue-400"
                      />
                      <span>All Pages</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={!rotateAll}
                        onChange={() => setRotateAll(false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:text-blue-400 dark:focus:ring-blue-400"
                      />
                      <span>Selected Pages</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page selection (if not rotating all pages) */}
          {file && pageCount > 0 && !rotateAll && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Select Pages to Rotate</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Pages: {pageCount}
                </div>
              </div>

              <div className="mb-4 flex space-x-2">
                <Button variant="outline" size="sm" onClick={selectAllPages}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>

              <div className="grid grid-cols-5 gap-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNumber => (
                  <div
                    key={pageNumber}
                    onClick={() => togglePage(pageNumber)}
                    className={`cursor-pointer overflow-hidden rounded-md border transition-colors ${
                      selectedPages.includes(pageNumber)
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="relative aspect-[3/4]">
                      {pagePreviews[pageNumber - 1] ? (
                        <img
                          src={pagePreviews[pageNumber - 1]}
                          alt={`Page ${pageNumber}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                          <span className="text-gray-400">Page {pageNumber}</span>
                        </div>
                      )}
                      <div
                        className={`absolute inset-0 flex items-center justify-center ${
                          selectedPages.includes(pageNumber) ? 'bg-blue-500/10' : ''
                        }`}
                      >
                        {selectedPages.includes(pageNumber) && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                            <span className="text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-1 text-center text-xs">
                      Page {pageNumber}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Selected {selectedPages.length} of {pageCount} pages
              </div>
            </div>
          )}

          {/* Rotate button */}
          <div className="flex justify-center">
            <Button
              onClick={handleRotate}
              disabled={!file || (!rotateAll && selectedPages.length === 0) || isProcessing}
              className={!file || (!rotateAll && selectedPages.length === 0) || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Rotating...' : 'Rotate PDF'}
            </Button>
          </div>
        </>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-400">
            Processing PDF
          </h2>
          <p className="mt-2 text-blue-700 dark:text-blue-300">
            Please wait while we rotate your PDF. This may take a few moments.
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
            PDF Rotated Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDF has been rotated successfully.
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
                setSelectedPages([]);
                setPreviewUrl(null);
                setPagePreviews([]);
              }}
            >
              Rotate Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
