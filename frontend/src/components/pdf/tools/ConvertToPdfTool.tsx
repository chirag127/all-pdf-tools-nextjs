'use client';

import React, { useState } from 'react';
import { FiDownload, FiFile } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { pdfApi } from '@/lib/api';

// Supported file types for conversion
const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/html',
  'text/markdown',
  'text/rtf',
];

// File type descriptions
const FILE_TYPE_DESCRIPTIONS: Record<string, string> = {
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'image/gif': 'GIF Image',
  'image/bmp': 'BMP Image',
  'image/tiff': 'TIFF Image',
  'application/msword': 'Word Document (.doc)',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document (.docx)',
  'application/vnd.ms-excel': 'Excel Spreadsheet (.xls)',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet (.xlsx)',
  'application/vnd.ms-powerpoint': 'PowerPoint Presentation (.ppt)',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation (.pptx)',
  'text/plain': 'Text File',
  'text/html': 'HTML File',
  'text/markdown': 'Markdown File',
  'text/rtf': 'Rich Text Format',
};

export default function ConvertToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!SUPPORTED_TYPES.includes(selectedFile.type)) {
      setError(`Unsupported file type: ${selectedFile.type}. Please upload one of the supported file types.`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResultUrl(null);
  };

  const handleClearFile = () => {
    setFile(null);
    setError(null);
    setResultUrl(null);
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please upload a file to convert.');
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

      // Call the API to convert file to PDF
      const result = await pdfApi.convertToPdf(file);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while converting the file.');
      console.error('Error converting file to PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.split('.')[0] || 'converted'}.pdf`;

      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = resultUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Get file type description
  const getFileTypeDescription = (file: File) => {
    return FILE_TYPE_DESCRIPTIONS[file.type] || file.type;
  };

  return (
    <div className="space-y-6">
      {/* File upload */}
      {!resultUrl && (
        <>
          <div>
            <h3 className="mb-2 text-lg font-medium">Upload File to Convert</h3>
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={file}
              onClear={handleClearFile}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Supported file types: Images (JPG, PNG, GIF, BMP, TIFF), Office Documents (DOC, DOCX, XLS, XLSX, PPT, PPTX), and Text Files (TXT, HTML, MD, RTF)
            </p>
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

          {/* File info */}
          {file && (
            <div className="flex items-center space-x-4">
              <div className="flex h-24 w-20 items-center justify-center rounded border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                <FiFile size={24} className="text-gray-400" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {getFileTypeDescription(file)}
                </p>
              </div>
            </div>
          )}

          {/* Information about conversion */}
          {file && (
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-400">
                About File Conversion
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We'll convert your {getFileTypeDescription(file)} to a high-quality PDF document while preserving:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>Text formatting and fonts</li>
                <li>Images and graphics</li>
                <li>Document layout and structure</li>
                <li>Tables and other elements</li>
              </ul>
            </div>
          )}

          {/* Convert button */}
          <div className="flex justify-center">
            <Button
              onClick={handleConvert}
              disabled={!file || isProcessing}
              className={!file || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Converting...' : 'Convert to PDF'}
            </Button>
          </div>
        </>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-400">
            Converting File
          </h2>
          <p className="mt-2 text-blue-700 dark:text-blue-300">
            Please wait while we convert your file to PDF. This may take a few moments.
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
            File Converted Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your file has been converted to PDF successfully.
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
              }}
            >
              Convert Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
