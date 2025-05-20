'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiDownload, FiFile } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { usePdfStore } from '@/lib/store';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';
import JSZip from 'jszip';

export default function SplitPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [ranges, setRanges] = useState<{ start: number; end: number }[]>([{ start: 1, end: 1 }]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // When a file is selected, get its page count
  useEffect(() => {
    const getDocumentInfo = async () => {
      if (!file) return;

      try {
        // Get page count
        const count = await pdfUtils.getPageCount(file);
        setPageCount(count);
        setRanges([{ start: 1, end: count }]);

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

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResultUrl(null);
  };

  const handleClearFile = () => {
    setFile(null);
    setPageCount(0);
    setRanges([{ start: 1, end: 1 }]);
    setError(null);
    setPreviewUrl(null);
    setResultUrl(null);
  };

  const addRange = () => {
    if (ranges.length >= pageCount) {
      setError('You cannot add more ranges than the number of pages in the PDF.');
      return;
    }

    setRanges([...ranges, { start: 1, end: pageCount }]);
  };

  const removeRange = (index: number) => {
    if (ranges.length === 1) {
      setError('You must have at least one range.');
      return;
    }

    setRanges(ranges.filter((_, i) => i !== index));
  };

  const updateRange = (index: number, field: 'start' | 'end', value: number) => {
    const newRanges = [...ranges];
    newRanges[index][field] = value;

    // Ensure start <= end
    if (field === 'start' && value > newRanges[index].end) {
      newRanges[index].end = value;
    } else if (field === 'end' && value < newRanges[index].start) {
      newRanges[index].start = value;
    }

    setRanges(newRanges);
  };

  const validateRanges = () => {
    if (!pageCount) return false;

    for (const range of ranges) {
      if (range.start < 1 || range.end > pageCount || range.start > range.end) {
        return false;
      }
    }

    return true;
  };

  const handleSplit = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    if (!validateRanges()) {
      setError('Please enter valid page ranges.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Try client-side splitting first
      try {
        const splitPdfResults = await pdfUtils.splitPdf(file, ranges);
        setProgress(80);

        // If there's only one range, just return that PDF
        if (splitPdfResults.length === 1) {
          const blob = new Blob([splitPdfResults[0]], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setProgress(100);
          setResultUrl(url);
          setIsProcessing(false);
          return;
        }

        // If there are multiple ranges, create a ZIP file
        const zip = new JSZip();

        // Add each PDF to the ZIP file
        splitPdfResults.forEach((pdfBytes, index) => {
          const fileName = `split_${index + 1}.pdf`;
          zip.file(fileName, pdfBytes);
        });

        // Generate the ZIP file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);

        setProgress(100);
        setResultUrl(zipUrl);
        setIsProcessing(false);
        return;
      } catch (clientError) {
        console.error('Client-side splitting failed, falling back to server:', clientError);
        setProgress(20);
      }

      // Fall back to server-side splitting if client-side fails
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Format ranges as strings (e.g., "1-5")
      const rangeStrings = ranges.map(range => `${range.start}-${range.end}`);

      // Call the API to split PDF
      const result = await pdfApi.splitPdf(file, rangeStrings);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while splitting the PDF.');
      console.error('Error splitting PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      // Determine file extension based on whether we're returning a ZIP or PDF
      const isZip = ranges.length > 1;
      const fileName = `${file?.name.replace('.pdf', '') || 'split'}_${isZip ? 'files.zip' : 'file.pdf'}`;

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

          {/* Page ranges */}
          {file && pageCount > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Page Ranges</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Pages: {pageCount}
                </div>
              </div>

              <div className="space-y-4">
                {ranges.map((range, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">From</label>
                      <input
                        type="number"
                        min={1}
                        max={pageCount}
                        value={range.start}
                        onChange={(e) => updateRange(index, 'start', parseInt(e.target.value) || 1)}
                        className="w-16 rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">To</label>
                      <input
                        type="number"
                        min={1}
                        max={pageCount}
                        value={range.end}
                        onChange={(e) => updateRange(index, 'end', parseInt(e.target.value) || 1)}
                        className="w-16 rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRange(index)}
                      disabled={ranges.length === 1}
                      className={ranges.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      <FiTrash2 className="text-red-500" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRange}
                  disabled={ranges.length >= pageCount}
                  className="flex items-center"
                >
                  <FiPlus className="mr-1" />
                  Add Range
                </Button>
              </div>
            </div>
          )}

          {/* Split button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSplit}
              disabled={!file || !validateRanges() || isProcessing}
              className={!file || !validateRanges() || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Splitting...' : 'Split PDF'}
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
            Please wait while we split your PDF file. This may take a few moments.
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
            PDF Split Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            {ranges.length > 1
              ? 'Your PDF has been split into multiple files and packaged as a ZIP file.'
              : 'Your PDF has been split successfully.'}
          </p>
          <div className="mt-4 flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FiDownload className="mr-2" />
              Download {ranges.length > 1 ? 'ZIP' : 'PDF'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResultUrl(null);
                setFile(null);
                setPageCount(0);
                setRanges([{ start: 1, end: 1 }]);
                setPreviewUrl(null);
              }}
            >
              Split Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
