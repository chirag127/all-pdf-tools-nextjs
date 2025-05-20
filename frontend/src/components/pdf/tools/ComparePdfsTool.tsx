'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiFileText, FiArrowRight } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

export default function ComparePdfsTool() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl1, setPreviewUrl1] = useState<string | null>(null);
  const [previewUrl2, setPreviewUrl2] = useState<string | null>(null);
  const [pageCount1, setPageCount1] = useState<number>(0);
  const [pageCount2, setPageCount2] = useState<number>(0);
  const [comparisonSummary, setComparisonSummary] = useState<{
    addedCount: number;
    removedCount: number;
    changedCount: number;
  } | null>(null);

  // When files are selected, generate previews
  useEffect(() => {
    const getDocumentInfo = async (file: File | null, setPreview: (url: string) => void, setCount: (count: number) => void) => {
      if (!file) return;

      try {
        // Get page count
        const count = await pdfUtils.getPageCount(file);
        setCount(count);

        // Generate preview of first page
        const preview = await pdfUtils.getPagePreview(file, 1);
        setPreview(preview);
      } catch (error) {
        console.error('Error getting document info:', error);
        setError('Failed to read one of the PDF files. The file might be corrupted or password-protected.');
      }
    };

    getDocumentInfo(file1, setPreviewUrl1, setPageCount1);
  }, [file1]);

  useEffect(() => {
    const getDocumentInfo = async (file: File | null, setPreview: (url: string) => void, setCount: (count: number) => void) => {
      if (!file) return;

      try {
        // Get page count
        const count = await pdfUtils.getPageCount(file);
        setCount(count);

        // Generate preview of first page
        const preview = await pdfUtils.getPagePreview(file, 1);
        setPreview(preview);
      } catch (error) {
        console.error('Error getting document info:', error);
        setError('Failed to read one of the PDF files. The file might be corrupted or password-protected.');
      }
    };

    getDocumentInfo(file2, setPreviewUrl2, setPageCount2);
  }, [file2]);

  const handleFile1Select = (selectedFile: File) => {
    setFile1(selectedFile);
    setError(null);
    setResultUrl(null);
    setComparisonSummary(null);
  };

  const handleFile2Select = (selectedFile: File) => {
    setFile2(selectedFile);
    setError(null);
    setResultUrl(null);
    setComparisonSummary(null);
  };

  const handleClearFile1 = () => {
    setFile1(null);
    setPreviewUrl1(null);
    setPageCount1(0);
    setError(null);
    setResultUrl(null);
    setComparisonSummary(null);
  };

  const handleClearFile2 = () => {
    setFile2(null);
    setPreviewUrl2(null);
    setPageCount2(0);
    setError(null);
    setResultUrl(null);
    setComparisonSummary(null);
  };

  const handleComparePdfs = async () => {
    if (!file1 || !file2) {
      setError('Please upload both PDF files to compare.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // PDF comparison can only be done server-side as it requires specialized tools
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 3;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Call the API to compare PDFs
      const result = await pdfApi.comparePdfs(file1, file2);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);

      // Set comparison summary
      setComparisonSummary({
        addedCount: result.addedCount || 0,
        removedCount: result.removedCount || 0,
        changedCount: result.changedCount || 0,
      });

      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while comparing the PDFs.');
      console.error('Error comparing PDFs:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = 'pdf_comparison_report.pdf';

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
      {/* File uploads */}
      {!resultUrl && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {/* First PDF */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Original PDF</h3>
              <FileUpload
                onFileSelect={handleFile1Select}
                selectedFile={file1}
                onClear={handleClearFile1}
              />

              {/* File preview */}
              {file1 && previewUrl1 && (
                <div className="flex items-center space-x-4">
                  <div className="h-24 w-20 overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                    <img
                      src={previewUrl1}
                      alt={`Preview of ${file1.name}`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{file1.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file1.size / 1024 / 1024).toFixed(2)} MB • {pageCount1} pages
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Comparison arrow */}
            <div className="flex items-center justify-center">
              <div className="hidden md:block">
                <FiArrowRight size={32} className="text-gray-400" />
              </div>
              <div className="md:hidden">
                <FiArrowRight size={32} className="rotate-90 text-gray-400" />
              </div>
            </div>

            {/* Second PDF */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Modified PDF</h3>
              <FileUpload
                onFileSelect={handleFile2Select}
                selectedFile={file2}
                onClear={handleClearFile2}
              />

              {/* File preview */}
              {file2 && previewUrl2 && (
                <div className="flex items-center space-x-4">
                  <div className="h-24 w-20 overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                    <img
                      src={previewUrl2}
                      alt={`Preview of ${file2.name}`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{file2.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file2.size / 1024 / 1024).toFixed(2)} MB • {pageCount2} pages
                    </p>
                  </div>
                </div>
              )}
            </div>
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

          {/* Information about comparison */}
          {file1 && file2 && (
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-400">
                About PDF Comparison
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Our PDF comparison tool will:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>Identify added, removed, and changed text</li>
                <li>Highlight differences with color coding</li>
                <li>Compare text content, not visual layout</li>
                <li>Generate a detailed comparison report</li>
              </ul>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                Note: The comparison works best with text-based PDFs rather than scanned documents.
              </p>
            </div>
          )}

          {/* Compare button */}
          <div className="flex justify-center">
            <Button
              onClick={handleComparePdfs}
              disabled={!file1 || !file2 || isProcessing}
              className={!file1 || !file2 || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Processing...' : (
                <>
                  <FiFileText className="mr-2" />
                  Compare PDFs
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-400">
            Comparing PDFs
          </h2>
          <p className="mt-2 text-blue-700 dark:text-blue-300">
            Please wait while we analyze and compare your PDF files. This may take a few moments.
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
            Comparison Complete
          </h2>

          {comparisonSummary && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-md bg-green-100 p-3 text-center dark:bg-green-800">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {comparisonSummary.addedCount}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">Added</p>
              </div>
              <div className="rounded-md bg-red-100 p-3 text-center dark:bg-red-800">
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {comparisonSummary.removedCount}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">Removed</p>
              </div>
              <div className="rounded-md bg-yellow-100 p-3 text-center dark:bg-yellow-800">
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {comparisonSummary.changedCount}
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Changed</p>
              </div>
            </div>
          )}

          <p className="mt-4 text-green-700 dark:text-green-300">
            Your PDFs have been compared successfully. The comparison report highlights all differences between the documents.
          </p>

          <div className="mt-4 flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FiDownload className="mr-2" />
              Download Comparison Report
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResultUrl(null);
                setFile1(null);
                setFile2(null);
                setPreviewUrl1(null);
                setPreviewUrl2(null);
                setPageCount1(0);
                setPageCount2(0);
                setComparisonSummary(null);
              }}
            >
              Compare More PDFs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
