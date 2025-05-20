'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import * as pdfUtils from '@/lib/pdfUtils';
import { pdfApi } from '@/lib/api';

export default function CropPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [left, setLeft] = useState<number>(0);
  const [right, setRight] = useState<number>(0);
  const [top, setTop] = useState<number>(0);
  const [bottom, setBottom] = useState<number>(0);
  const [cropAll, setCropAll] = useState<boolean>(true);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
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
    setError(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setPageCount(0);
    setPagePreviews([]);
    setSelectedPages([]);
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

  const handleCrop = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    if (!cropAll && selectedPages.length === 0) {
      setError('Please select at least one page to crop.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Call the API to crop PDF
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      const result = await pdfApi.cropPdf(
        file,
        left,
        bottom,
        right,
        top,
        cropAll ? undefined : selectedPages
      );

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while cropping the PDF.');
      console.error('Error cropping PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'cropped'}_cropped.pdf`;

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

          {/* Crop options */}
          {file && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium">Crop Options</h3>

                <div className="space-y-4">
                  {/* Margin controls */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Left margin */}
                    <div>
                      <label htmlFor="left-margin" className="mb-2 block text-sm font-medium">
                        Left Margin: {left}mm
                      </label>
                      <input
                        type="range"
                        id="left-margin"
                        min="0"
                        max="50"
                        value={left}
                        onChange={(e) => setLeft(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Right margin */}
                    <div>
                      <label htmlFor="right-margin" className="mb-2 block text-sm font-medium">
                        Right Margin: {right}mm
                      </label>
                      <input
                        type="range"
                        id="right-margin"
                        min="0"
                        max="50"
                        value={right}
                        onChange={(e) => setRight(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Top margin */}
                    <div>
                      <label htmlFor="top-margin" className="mb-2 block text-sm font-medium">
                        Top Margin: {top}mm
                      </label>
                      <input
                        type="range"
                        id="top-margin"
                        min="0"
                        max="50"
                        value={top}
                        onChange={(e) => setTop(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Bottom margin */}
                    <div>
                      <label htmlFor="bottom-margin" className="mb-2 block text-sm font-medium">
                        Bottom Margin: {bottom}mm
                      </label>
                      <input
                        type="range"
                        id="bottom-margin"
                        min="0"
                        max="50"
                        value={bottom}
                        onChange={(e) => setBottom(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Pages to crop */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Pages to Crop</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={cropAll}
                          onChange={() => setCropAll(true)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:text-blue-400 dark:focus:ring-blue-400"
                        />
                        <span>All Pages</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={!cropAll}
                          onChange={() => setCropAll(false)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:text-blue-400 dark:focus:ring-blue-400"
                        />
                        <span>Selected Pages</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page selection (if not cropping all pages) */}
          {file && pageCount > 0 && !cropAll && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Select Pages to Crop</h3>
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

          {/* Crop button */}
          <div className="flex justify-center">
            <Button
              onClick={handleCrop}
              disabled={!file || (!cropAll && selectedPages.length === 0) || isProcessing}
              className={!file || (!cropAll && selectedPages.length === 0) || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Processing...' : 'Crop PDF'}
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
            Please wait while we crop your PDF. This may take a few moments.
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
            PDF Cropped Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDF has been cropped successfully.
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
                setPreviewUrl(null);
                setPageCount(0);
                setPagePreviews([]);
                setSelectedPages([]);
              }}
            >
              Crop Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}