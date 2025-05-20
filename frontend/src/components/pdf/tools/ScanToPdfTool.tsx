'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiImage, FiArrowUp, FiArrowDown, FiTrash2, FiDownload } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import { pdfApi } from '@/lib/api';

// Supported image formats
const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
];

export default function ScanToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [ocrEnabled, setOcrEnabled] = useState<boolean>(false);
  const [ocrLanguage, setOcrLanguage] = useState<string>('eng');

  // Generate previews for each image
  useEffect(() => {
    const generatePreviews = async () => {
      const previews = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(previews);
    };

    if (files.length > 0) {
      generatePreviews();
    } else {
      setPreviewUrls([]);
    }

    // Clean up object URLs on unmount
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const imageFiles = acceptedFiles.filter(file =>
        SUPPORTED_TYPES.includes(file.type)
      );

      if (imageFiles.length === 0) {
        setError('Please upload image files only (JPEG, PNG, GIF, BMP, TIFF).');
        return;
      }

      setFiles(prevFiles => [...prevFiles, ...imageFiles]);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif'],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviewUrls(prevUrls => {
      const newUrls = [...prevUrls];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
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
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviewUrls([]);
    setError(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError('Please upload at least one image file.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      
      // Conversion can only be done server-side
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Call the API to convert images to PDF
      const result = await pdfApi.scanToPdf(files, ocrEnabled, ocrLanguage);
      
      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while converting images to PDF.');
      console.error('Error converting images to PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = 'scanned_document.pdf';
      
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
              <p className="text-sm font-medium">Upload Images</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Drag & drop image files here, or click to select files
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supported formats: JPEG, PNG, GIF, BMP, TIFF
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

          {/* OCR options */}
          {files.length > 0 && (
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ocr-toggle"
                  checked={ocrEnabled}
                  onChange={(e) => setOcrEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-400"
                />
                <label htmlFor="ocr-toggle" className="text-sm font-medium">
                  Make PDF searchable (OCR)
                </label>
              </div>
              
              {ocrEnabled && (
                <div className="mt-4">
                  <label htmlFor="ocr-language" className="mb-2 block text-sm font-medium">
                    OCR Language
                  </label>
                  <select
                    id="ocr-language"
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="eng">English</option>
                    <option value="fra">French</option>
                    <option value="deu">German</option>
                    <option value="spa">Spanish</option>
                    <option value="ita">Italian</option>
                    <option value="por">Portuguese</option>
                    <option value="rus">Russian</option>
                    <option value="chi_sim">Chinese (Simplified)</option>
                    <option value="chi_tra">Chinese (Traditional)</option>
                    <option value="jpn">Japanese</option>
                    <option value="kor">Korean</option>
                    <option value="ara">Arabic</option>
                    <option value="hin">Hindi</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Images to Convert ({files.length})</h3>
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
                              className="mr-3 h-16 w-16 rounded border border-gray-200 object-cover dark:border-gray-700"
                            />
                          ) : (
                            <FiImage className="mr-3 text-blue-500" size={24} />
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

          {/* Convert button */}
          <div className="flex justify-center">
            <Button
              onClick={handleConvert}
              disabled={files.length === 0 || isProcessing}
              className={files.length === 0 || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
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
            Processing Images
          </h2>
          <p className="mt-2 text-blue-700 dark:text-blue-300">
            Please wait while we convert your images to PDF. {ocrEnabled && 'OCR processing may take several minutes.'}
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
            Conversion Completed Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your images have been converted to PDF successfully.
            {ocrEnabled && ' The PDF is searchable thanks to OCR processing.'}
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
              Convert More Images
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
