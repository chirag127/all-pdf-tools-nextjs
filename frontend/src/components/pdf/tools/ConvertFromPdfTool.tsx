'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiFile } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

// Supported output formats
const OUTPUT_FORMATS = [
  { id: 'docx', name: 'Word Document (.docx)', icon: 'docx' },
  { id: 'xlsx', name: 'Excel Spreadsheet (.xlsx)', icon: 'xlsx' },
  { id: 'pptx', name: 'PowerPoint Presentation (.pptx)', icon: 'pptx' },
  { id: 'txt', name: 'Text File (.txt)', icon: 'txt' },
  { id: 'html', name: 'HTML File (.html)', icon: 'html' },
  { id: 'md', name: 'Markdown File (.md)', icon: 'md' },
  { id: 'rtf', name: 'Rich Text Format (.rtf)', icon: 'rtf' },
  { id: 'jpg', name: 'JPEG Image (.jpg)', icon: 'jpg' },
  { id: 'png', name: 'PNG Image (.png)', icon: 'png' },
];

export default function ConvertFromPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string>('docx');
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

  const handleConvert = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Conversion can only be done server-side as it requires specialized tools
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Call the API to convert PDF to the selected format
      const result = await pdfApi.convertFromPdf(file, format);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while converting the PDF.');
      console.error('Error converting PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'converted'}.${format}`;

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

          {/* Format selection */}
          {file && (
            <div>
              <h3 className="mb-4 text-lg font-medium">Select Output Format</h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {OUTPUT_FORMATS.map((outputFormat) => (
                  <div
                    key={outputFormat.id}
                    onClick={() => setFormat(outputFormat.id)}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      format === outputFormat.id
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="mr-3 flex h-5 items-center">
                        <input
                          type="radio"
                          checked={format === outputFormat.id}
                          onChange={() => setFormat(outputFormat.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:text-blue-400 dark:focus:ring-blue-400"
                        />
                      </div>
                      <div className="flex items-center">
                        <FiFile className="mr-2 text-gray-500 dark:text-gray-400" />
                        <span className={format === outputFormat.id ? 'font-medium' : ''}>
                          {outputFormat.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information about conversion */}
          {file && (
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-400">
                About PDF Conversion
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We'll convert your PDF to {OUTPUT_FORMATS.find(f => f.id === format)?.name} while preserving:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>Text content and formatting</li>
                <li>Images and graphics (where supported)</li>
                <li>Document structure</li>
              </ul>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                Note: Some complex formatting or elements may not convert perfectly depending on the target format.
              </p>
            </div>
          )}

          {/* Convert button */}
          <div className="flex justify-center">
            <Button
              onClick={handleConvert}
              disabled={!file || isProcessing}
              className={!file || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Converting...' : `Convert to ${format.toUpperCase()}`}
            </Button>
          </div>
        </>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-400">
            Converting PDF
          </h2>
          <p className="mt-2 text-blue-700 dark:text-blue-300">
            Please wait while we convert your PDF to {format.toUpperCase()}. This may take a few moments.
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
            PDF Converted Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDF has been converted to {format.toUpperCase()} successfully.
          </p>
          <div className="mt-4 flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FiDownload className="mr-2" />
              Download {format.toUpperCase()}
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
              Convert Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
