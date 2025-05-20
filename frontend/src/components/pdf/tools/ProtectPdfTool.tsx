'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { usePdfStore } from '@/lib/store';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

export default function ProtectPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [userPassword, setUserPassword] = useState<string>('');
  const [ownerPassword, setOwnerPassword] = useState<string>('');
  const [allowPrint, setAllowPrint] = useState<boolean>(true);
  const [allowCopy, setAllowCopy] = useState<boolean>(true);
  const [allowModify, setAllowModify] = useState<boolean>(true);
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

  const handleProtect = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    if (!userPassword && !ownerPassword) {
      setError('Please enter at least one password.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Try client-side protection first
      try {
        const protectedPdfBytes = await pdfUtils.protectPdf(
          file,
          userPassword,
          ownerPassword,
          {
            printing: allowPrint,
            copying: allowCopy,
            modifying: allowModify
          }
        );
        setProgress(80);

        // Create a Blob from the protected PDF bytes
        const blob = new Blob([protectedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        setProgress(100);
        setResultUrl(url);
        setIsProcessing(false);
        return;
      } catch (clientError) {
        console.error('Client-side protection failed, falling back to server:', clientError);
        setProgress(20);
      }

      // Fall back to server-side protection if client-side fails
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Call the API to protect PDF
      const result = await pdfApi.protectPdf(
        file,
        userPassword,
        ownerPassword,
        allowPrint,
        allowCopy,
        allowModify
      );

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while protecting the PDF.');
      console.error('Error protecting PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'protected'}_secured.pdf`;

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

          {/* Protection options */}
          {file && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium">Password Protection</h3>

                <div className="space-y-4">
                  {/* User Password */}
                  <div>
                    <label htmlFor="user-password" className="mb-2 block text-sm font-medium">
                      User Password (to open the document)
                    </label>
                    <input
                      type="password"
                      id="user-password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      placeholder="Enter password"
                    />
                  </div>

                  {/* Owner Password */}
                  <div>
                    <label htmlFor="owner-password" className="mb-2 block text-sm font-medium">
                      Owner Password (to change permissions)
                    </label>
                    <input
                      type="password"
                      id="owner-password"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Permissions</h3>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={allowPrint}
                      onChange={(e) => setAllowPrint(e.target.checked)}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:text-blue-400 dark:focus:ring-blue-400"
                    />
                    <span>Allow printing</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={allowCopy}
                      onChange={(e) => setAllowCopy(e.target.checked)}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:text-blue-400 dark:focus:ring-blue-400"
                    />
                    <span>Allow copying text and images</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={allowModify}
                      onChange={(e) => setAllowModify(e.target.checked)}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:text-blue-400 dark:focus:ring-blue-400"
                    />
                    <span>Allow modifying the document</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Protect button */}
          <div className="flex justify-center">
            <Button
              onClick={handleProtect}
              disabled={!file || (!userPassword && !ownerPassword) || isProcessing}
              className={!file || (!userPassword && !ownerPassword) || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Protecting...' : 'Protect PDF'}
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
            Please wait while we protect your PDF. This may take a few moments.
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
            PDF Protected Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDF has been password protected successfully.
          </p>
          <div className="mt-4 flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FiDownload className="mr-2" />
              Download Protected PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResultUrl(null);
                setFile(null);
                setUserPassword('');
                setOwnerPassword('');
                setPreviewUrl(null);
                setPageCount(0);
              }}
            >
              Protect Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
