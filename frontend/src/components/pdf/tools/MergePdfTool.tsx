'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFile, FiArrowUp, FiArrowDown, FiTrash2, FiDownload } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import { usePdfStore } from '@/lib/store';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

export default function MergePdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Generate previews for the first page of each PDF
  useEffect(() => {
    const generatePreviews = async () => {
      const previews = [];
      for (const file of files) {
        try {
          const preview = await pdfUtils.getPagePreview(file, 1);
          previews.push(preview);
        } catch (error) {
          console.error('Error generating preview:', error);
          previews.push(''); // Placeholder for failed previews
        }
      }
      setPreviewUrls(previews);
    };

    if (files.length > 0) {
      generatePreviews();
    } else {
      setPreviewUrls([]);
    }
  }, [files]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const pdfFiles = acceptedFiles.filter(file =>
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );

      if (pdfFiles.length === 0) {
        setError('Please upload PDF files only.');
        return;
      }

      setFiles(prevFiles => [...prevFiles, ...pdfFiles]);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  };

  const moveFileUp = (index: number) => {
    if (index === 0) return;
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
    setPreviewUrls(prevUrls => {
      const newUrls = [...prevUrls];
      [newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]];
      return newUrls;
    });
  };

  const moveFileDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      return newFiles;
    });
    setPreviewUrls(prevUrls => {
      const newUrls = [...prevUrls];
      [newUrls[index], newUrls[index + 1]] = [newUrls[index + 1], newUrls[index]];
      return newUrls;
    });
  };

  const clearFiles = () => {
    setFiles([]);
    setPreviewUrls([]);
    setError(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please upload at least 2 PDF files to merge.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Try client-side merging first
      try {
        const mergedPdfBytes = await pdfUtils.mergePdfs(files);
        setProgress(80);

        // Create a Blob from the merged PDF bytes
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        setProgress(100);
        setResultUrl(url);
        setIsProcessing(false);
        return;
      } catch (clientError) {
        console.error('Client-side merging failed, falling back to server:', clientError);
        setProgress(20);
      }

      // Fall back to server-side merging if client-side fails
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Call the API to merge PDFs
      const result = await pdfApi.mergePdfs(files);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while merging PDFs.');
      console.error('Error merging PDFs:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      window.open(resultUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* File upload area */}
      {!resultUrl && (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
              <FiUpload className="text-gray-400 dark:text-gray-500" size={32} />
              <p className="text-sm font-medium">Upload PDF Files</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Drag & drop PDF files here, or click to select files
              </p>
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

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Files to Merge ({files.length})</h3>
                <Button variant="outline" size="sm" onClick={clearFiles}>
                  Clear All
                </Button>
              </div>

              <div className="rounded-md border border-gray-200 dark:border-gray-700">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium dark:bg-gray-700">
                          {index + 1}
                        </span>
                        <div className="flex items-center">
                          {previewUrls[index] ? (
                            <img
                              src={previewUrls[index]}
                              alt={`Preview of ${file.name}`}
                              className="mr-3 h-12 w-12 rounded border border-gray-200 object-contain dark:border-gray-700"
                            />
                          ) : (
                            <FiFile className="mr-3 text-blue-500" size={24} />
                          )}
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveFileUp(index)}
                          disabled={index === 0}
                          className={index === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          <FiArrowUp />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveFileDown(index)}
                          disabled={index === files.length - 1}
                          className={index === files.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          <FiArrowDown />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                          <FiTrash2 className="text-red-500" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Merge button */}
          <div className="flex justify-center">
            <Button
              onClick={handleMerge}
              disabled={files.length < 2 || isProcessing}
              className={files.length < 2 || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Merging...' : 'Merge PDFs'}
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
            Please wait while we merge your PDF files. This may take a few moments.
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
            PDF Merged Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDFs have been merged successfully. You can download the merged PDF now.
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
                setFiles([]);
                setPreviewUrls([]);
              }}
            >
              Merge More PDFs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
