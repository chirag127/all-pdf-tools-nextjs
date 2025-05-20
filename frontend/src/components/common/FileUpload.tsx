'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFile, FiX } from 'react-icons/fi';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  className?: string;
  label?: string;
  selectedFile?: File | null;
  onClear?: () => void;
}

export default function FileUpload({
  onFileSelect,
  accept = { 'application/pdf': ['.pdf'] },
  maxSize = 100 * 1024 * 1024, // 100MB
  multiple = false,
  className = '',
  label = 'Upload PDF',
  selectedFile = null,
  onClear,
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    onDropRejected: (rejections) => {
      if (rejections.length > 0) {
        const { errors } = rejections[0];
        if (errors.length > 0) {
          switch (errors[0].code) {
            case 'file-too-large':
              setError(`File is too large. Max size is ${maxSize / (1024 * 1024)}MB`);
              break;
            case 'file-invalid-type':
              setError('Invalid file type. Please upload a PDF file');
              break;
            default:
              setError('Error uploading file');
          }
        }
      }
    },
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    }
    setError(null);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'
        } ${className}`}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiFile className="text-blue-500" size={24} />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FiX size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <FiUpload className="text-gray-400 dark:text-gray-500" size={32} />
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Drag & drop a PDF file here, or click to select
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
