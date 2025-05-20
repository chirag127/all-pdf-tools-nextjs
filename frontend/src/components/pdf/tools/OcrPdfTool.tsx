'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

// Supported languages for OCR
const OCR_LANGUAGES = [
  { id: 'eng', name: 'English' },
  { id: 'fra', name: 'French' },
  { id: 'deu', name: 'German' },
  { id: 'spa', name: 'Spanish' },
  { id: 'ita', name: 'Italian' },
  { id: 'por', name: 'Portuguese' },
  { id: 'rus', name: 'Russian' },
  { id: 'chi_sim', name: 'Chinese (Simplified)' },
  { id: 'chi_tra', name: 'Chinese (Traditional)' },
  { id: 'jpn', name: 'Japanese' },
  { id: 'kor', name: 'Korean' },
  { id: 'ara', name: 'Arabic' },
  { id: 'hin', name: 'Hindi' },
];

export default function OcrPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('eng');
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

  const handleOcr = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // OCR can only be done server-side as it requires specialized tools
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 2;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);

      // Call the API to perform OCR on the PDF
      const result = await pdfApi.ocrPdf(file, language);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while performing OCR on the PDF.');
      console.error('Error performing OCR:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'ocr'}_searchable.pdf`;

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

          {/* Language selection */}
          {file && (
            <div>
              <h3 className="mb-4 text-lg font-medium">Select Language</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {OCR_LANGUAGES.map((ocrLanguage) => (
                  <div
                    key={ocrLanguage.id}
                    onClick={() => setLanguage(ocrLanguage.id)}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      language === ocrLanguage.id
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="mr-3 flex h-5 items-center">
                        <input
                          type="radio"
                          checked={language === ocrLanguage.id}
                          onChange={() => setLanguage(ocrLanguage.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:text-blue-400 dark:focus:ring-blue-400"
                        />
                      </div>
                      <span className={language === ocrLanguage.id ? 'font-medium' : ''}>
                        {ocrLanguage.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information about OCR */}
          {file && (
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-400">
                About OCR (Optical Character Recognition)
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                OCR technology will analyze your PDF to recognize text in images and make it searchable.
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>Makes scanned documents searchable</li>
                <li>Allows text selection and copying</li>
                <li>Preserves the original appearance</li>
                <li>Best results with clear, high-resolution scans</li>
              </ul>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                Note: OCR accuracy depends on image quality and document complexity.
              </p>
            </div>
          )}

          {/* OCR button */}
          <div className="flex justify-center">
            <Button
              onClick={handleOcr}
              disabled={!file || isProcessing}
              className={!file || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Processing...' : (
                <>
                  <FiFileText className="mr-2" />
                  Make PDF Searchable
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
            Please wait while we perform OCR on your PDF. This may take several minutes for large documents.
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
            OCR Completed Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDF has been processed with OCR and is now searchable.
          </p>
          <div className="mt-4 flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FiDownload className="mr-2" />
              Download Searchable PDF
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
              Process Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
