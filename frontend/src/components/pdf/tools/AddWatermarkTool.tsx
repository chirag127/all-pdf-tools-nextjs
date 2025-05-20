'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import * as pdfUtils from '@/lib/pdfUtils';
import { pdfApi } from '@/lib/api';

export default function AddWatermarkTool() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [opacity, setOpacity] = useState<number>(30);
  const [fontSize, setFontSize] = useState<number>(50);
  const [rotation, setRotation] = useState<number>(-45);
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

  const handleAddWatermark = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    if (!watermarkText.trim()) {
      setError('Please enter watermark text.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      
      // Try client-side watermarking first
      try {
        const watermarkedPdfBytes = await pdfUtils.addTextWatermark(
          file,
          watermarkText,
          opacity / 100,
          rotation,
          fontSize
        );
        setProgress(80);
        
        // Create a Blob from the watermarked PDF bytes
        const blob = new Blob([watermarkedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        setProgress(100);
        setResultUrl(url);
        setIsProcessing(false);
        return;
      } catch (clientError) {
        console.error('Client-side watermarking failed, falling back to server:', clientError);
        setProgress(20);
      }
      
      // Fall back to server-side watermarking if client-side fails
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Call the API to add watermark
      const result = await pdfApi.addWatermark(
        file,
        {
          watermarkText: watermarkText,
          opacity: opacity / 100,
          rotation: rotation,
        }
      );
      
      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while adding watermark.');
      console.error('Error adding watermark:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'watermarked'}_watermarked.pdf`;
      
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

          {/* Watermark options */}
          {file && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium">Watermark Options</h3>
                
                <div className="space-y-4">
                  {/* Watermark Text */}
                  <div>
                    <label htmlFor="watermark-text" className="mb-2 block text-sm font-medium">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      id="watermark-text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      placeholder="Enter watermark text"
                    />
                  </div>
                  
                  {/* Opacity */}
                  <div>
                    <label htmlFor="opacity" className="mb-2 block text-sm font-medium">
                      Opacity: {opacity}%
                    </label>
                    <input
                      type="range"
                      id="opacity"
                      min="10"
                      max="100"
                      value={opacity}
                      onChange={(e) => setOpacity(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Font Size */}
                  <div>
                    <label htmlFor="font-size" className="mb-2 block text-sm font-medium">
                      Font Size: {fontSize}px
                    </label>
                    <input
                      type="range"
                      id="font-size"
                      min="20"
                      max="100"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Rotation */}
                  <div>
                    <label htmlFor="rotation" className="mb-2 block text-sm font-medium">
                      Rotation: {rotation}°
                    </label>
                    <input
                      type="range"
                      id="rotation"
                      min="-90"
                      max="90"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add watermark button */}
          <div className="flex justify-center">
            <Button
              onClick={handleAddWatermark}
              disabled={!file || !watermarkText.trim() || isProcessing}
              className={!file || !watermarkText.trim() || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Processing...' : 'Add Watermark'}
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
            Please wait while we add the watermark to your PDF. This may take a few moments.
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
            Watermark Added Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDF has been watermarked successfully.
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
              Add Another Watermark
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
