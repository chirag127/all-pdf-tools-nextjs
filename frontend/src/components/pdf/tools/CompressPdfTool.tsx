'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { usePdfStore } from '@/lib/store';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

type CompressionQuality = 'low' | 'medium' | 'high';

interface QualityOption {
  id: CompressionQuality;
  name: string;
  description: string;
}

export default function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<CompressionQuality>('medium');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [fileSize, setFileSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(0);

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

        // Set file size
        setFileSize(file.size);
      } catch (error) {
        console.error('Error getting document info:', error);
        setError('Failed to read the PDF file. The file might be corrupted or password-protected.');
      }
    };

    getDocumentInfo();
  }, [file]);

  const qualityOptions: QualityOption[] = [
    {
      id: 'low',
      name: 'Maximum Compression',
      description: 'Smallest file size, lower quality',
    },
    {
      id: 'medium',
      name: 'Balanced',
      description: 'Good balance between size and quality',
    },
    {
      id: 'high',
      name: 'Minimum Compression',
      description: 'Larger file size, higher quality',
    },
  ];

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResultUrl(null);
    setCompressedSize(0);
  };

  const handleClearFile = () => {
    setFile(null);
    setError(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setPageCount(0);
    setFileSize(0);
    setCompressedSize(0);
  };

  const handleCompress = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Try client-side compression first
      try {
        const compressionLevel = quality === 'low' ? 0.5 : quality === 'medium' ? 0.75 : 0.9;
        const compressedPdfBytes = await pdfUtils.compressPdf(file, compressionLevel);
        setProgress(80);

        // Create a Blob from the compressed PDF bytes
        const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Set compressed size
        setCompressedSize(blob.size);

        setProgress(100);
        setResultUrl(url);
        setIsProcessing(false);
        return;
      } catch (clientError) {
        console.error('Client-side compression failed, falling back to server:', clientError);
        setProgress(20);
      }

      // Fall back to server-side compression if client-side fails
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Call the API to compress PDF
      const result = await pdfApi.compressPdf(file, quality);

      // The API response doesn't include file size, so we'll need to calculate it another way
      // For now, we'll just set it to null
      setCompressedSize(null);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while compressing the PDF.');
      console.error('Error compressing PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'compressed'}_compressed.pdf`;

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
                  {(fileSize / 1024 / 1024).toFixed(2)} MB • {pageCount} pages
                </p>
              </div>
            </div>
          )}

          {/* Compression options */}
          {file && (
            <div>
              <h3 className="mb-4 text-lg font-medium">Compression Quality</h3>

              <div className="space-y-4">
                {qualityOptions.map(option => (
                  <div
                    key={option.id}
                    onClick={() => setQuality(option.id)}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      quality === option.id
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="mr-3 flex h-5 items-center">
                        <input
                          type="radio"
                          checked={quality === option.id}
                          onChange={() => setQuality(option.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:text-blue-400 dark:focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label
                          className={`font-medium ${
                            quality === option.id
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {option.name}
                        </label>
                        <p
                          className={
                            quality === option.id
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }
                        >
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compress button */}
          <div className="flex justify-center">
            <Button
              onClick={handleCompress}
              disabled={!file || isProcessing}
              className={!file || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Compressing...' : 'Compress PDF'}
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
            Please wait while we compress your PDF. This may take a few moments.
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
            PDF Compressed Successfully
          </h2>

          {/* Only show compression stats if we have the compressed size */}
          {compressedSize !== null && compressedSize > 0 && (
            <div className="mt-4 rounded-md bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="flex justify-between">
                <span className="font-medium">Original Size:</span>
                <span>{(fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Compressed Size:</span>
                <span>{(compressedSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Reduction:</span>
                <span>
                  {fileSize > 0
                    ? `${Math.round((1 - compressedSize / fileSize) * 100)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FiDownload className="mr-2" />
              Download Compressed PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResultUrl(null);
                setFile(null);
                setPreviewUrl(null);
                setPageCount(0);
                setFileSize(0);
                setCompressedSize(0);
              }}
            >
              Compress Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
