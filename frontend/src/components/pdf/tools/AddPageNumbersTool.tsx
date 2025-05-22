'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { usePdfStore } from '@/lib/store';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface PositionOption {
  id: Position;
  name: string;
}

export default function AddPageNumbersTool() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [format, setFormat] = useState<string>('Page {page_num}');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  // When a file is selected, generate a preview
  useEffect(() => {
    const getDocumentInfo = async () => {
      if (!file) return;

      try {
        // Get page count
        const count = await pdfUtils.getPageCount(file);
        setPageCount(count);

        // Generate preview of first page
        const preview = await pdfUtils.getPagePreview(file, 1);
        setPreviewUrl(preview);
      } catch (error) {
        console.error('Error getting document info:', error);
        setError('Failed to read the PDF file. The file might be corrupted or password-protected.');
      }
    };

    getDocumentInfo();
  }, [file]);

  const positionOptions: PositionOption[] = [
    { id: 'top-left', name: 'Top Left' },
    { id: 'top-center', name: 'Top Center' },
    { id: 'top-right', name: 'Top Right' },
    { id: 'bottom-left', name: 'Bottom Left' },
    { id: 'bottom-center', name: 'Bottom Center' },
    { id: 'bottom-right', name: 'Bottom Right' },
  ];

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResultUrl(null);
  };

  const handleClearFile = () => {
    setFile(null);
    setError(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setPageCount(0);
  };

  const handleAddPageNumbers = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Try client-side page numbering first
      try {
        const numberedPdfBytes = await pdfUtils.addPageNumbers(
          file,
          position,
          startNumber,
          format
        );
        setProgress(80);

        // Create a Blob from the numbered PDF bytes
        const blob = new Blob([numberedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        setProgress(100);
        setResultUrl(url);
        setIsProcessing(false);
        return;
      } catch (clientError) {
        console.error('Client-side page numbering failed, falling back to server:', clientError);
        setProgress(20);
      }

      // Fall back to server-side page numbering if client-side fails
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Call the API to add page numbers
      const result = await pdfApi.addPageNumbers(file, position, startNumber, format);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while adding page numbers.');
      console.error('Error adding page numbers:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'numbered'}_pages.pdf`;

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

          {/* Page number options */}
          {file && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium">Page Number Options</h3>

                <div className="space-y-4">
                  {/* Position */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Position</label>
                    <div className="grid grid-cols-3 gap-2">
                      {positionOptions.map(option => (
                        <div
                          key={option.id}
                          onClick={() => setPosition(option.id)}
                          className={`cursor-pointer rounded-md border p-2 text-center text-sm transition-colors ${
                            position === option.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {option.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Start Number */}
                  <div>
                    <label htmlFor="start-number" className="mb-2 block text-sm font-medium">
                      Start Number
                    </label>
                    <input
                      type="number"
                      id="start-number"
                      min={1}
                      value={startNumber}
                      onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>

                  {/* Format */}
                  <div>
                    <label htmlFor="format" className="mb-2 block text-sm font-medium">
                      Format
                    </label>
                    <input
                      type="text"
                      id="format"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Use {'{page_num}'} for the current page number and {'{total_pages}'} for the total number of pages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add page numbers button */}
          <div className="flex justify-center">
            <Button
              onClick={handleAddPageNumbers}
              disabled={!file || isProcessing}
              className={!file || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Processing...' : 'Add Page Numbers'}
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
            Please wait while we add page numbers to your PDF. This may take a few moments.
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
            Page Numbers Added Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Page numbers have been added to your PDF successfully.
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
              }}
            >
              Add Page Numbers to Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
