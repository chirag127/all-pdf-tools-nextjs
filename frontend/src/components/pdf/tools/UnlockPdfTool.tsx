'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiLock, FiUnlock } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

export default function UnlockPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);

  // When a file is selected, check if it's password protected
  useEffect(() => {
    const checkPasswordProtection = async () => {
      if (!file) return;
      
      try {
        // Try to get the page count without a password
        await pdfUtils.getPageCount(file);
        
        // If we get here, the file is not password protected
        setIsPasswordProtected(false);
        
        // Generate preview of first page
        const preview = await pdfUtils.getPagePreview(file, 1);
        setPreviewUrl(preview);
      } catch (error) {
        console.error('Error checking PDF:', error);
        // If we get an error, the file might be password protected
        setIsPasswordProtected(true);
        setPreviewUrl(null);
        setError('This PDF appears to be password protected. Please enter the password to unlock it.');
      }
    };
    
    checkPasswordProtection();
  }, [file]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResultUrl(null);
    setPassword('');
  };

  const handleClearFile = () => {
    setFile(null);
    setError(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setPassword('');
    setIsPasswordProtected(false);
  };

  const handleUnlock = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    if (isPasswordProtected && !password) {
      setError('Please enter the password to unlock the PDF.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      
      // Try client-side unlocking first
      try {
        // First try to load the PDF with the password
        const unlockedPdfBytes = await pdfUtils.unlockPdf(file, password);
        setProgress(80);
        
        // Create a Blob from the unlocked PDF bytes
        const blob = new Blob([unlockedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Try to generate a preview now that we have the password
        try {
          const preview = await pdfUtils.getPagePreview(file, 1, password);
          setPreviewUrl(preview);
        } catch (previewError) {
          console.error('Error generating preview:', previewError);
        }
        
        setProgress(100);
        setResultUrl(url);
        setIsProcessing(false);
        return;
      } catch (clientError) {
        console.error('Client-side unlocking failed, falling back to server:', clientError);
        
        if (clientError.message?.includes('password')) {
          setIsProcessing(false);
          setError('Incorrect password. Please try again.');
          return;
        }
        
        setProgress(20);
      }
      
      // Fall back to server-side unlocking if client-side fails
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Call the API to unlock PDF
      const result = await pdfApi.unlockPdf(file, password);
      
      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      
      if (err instanceof Error && err.message?.includes('password')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while unlocking the PDF.');
      }
      
      console.error('Error unlocking PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'unlocked'}_unlocked.pdf`;
      
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
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          {/* File info without preview (for password protected files) */}
          {file && !previewUrl && (
            <div className="flex items-center space-x-4">
              <div className="flex h-24 w-20 items-center justify-center rounded border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                <FiLock size={24} className="text-gray-400" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Password Protected
                </p>
              </div>
            </div>
          )}

          {/* Password input */}
          {file && isPasswordProtected && (
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                PDF Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="Enter password"
              />
            </div>
          )}

          {/* Unlock button */}
          <div className="flex justify-center">
            <Button
              onClick={handleUnlock}
              disabled={!file || (isPasswordProtected && !password) || isProcessing}
              className={!file || (isPasswordProtected && !password) || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Processing...' : (
                <>
                  <FiUnlock className="mr-2" />
                  Unlock PDF
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
            Processing PDF
          </h2>
          <p className="mt-2 text-blue-700 dark:text-blue-300">
            Please wait while we unlock your PDF. This may take a few moments.
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
            PDF Unlocked Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDF has been unlocked successfully.
          </p>
          <div className="mt-4 flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FiDownload className="mr-2" />
              Download Unlocked PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResultUrl(null);
                setFile(null);
                setPreviewUrl(null);
                setPassword('');
                setIsPasswordProtected(false);
              }}
            >
              Unlock Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
