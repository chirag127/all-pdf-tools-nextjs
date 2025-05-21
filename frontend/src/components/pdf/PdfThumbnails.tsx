'use client';

import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiFileText } from 'react-icons/fi';
import setupPdfWorker from '@/lib/pdfWorker';
import PdfPasswordInput from './PdfPasswordInput';

interface PdfThumbnailsProps {
  file: File | Blob | ArrayBuffer | Uint8Array;
  currentPage?: number;
  onThumbnailClick?: (pageNumber: number) => void;
  className?: string;
  maxThumbnails?: number;
  onPasswordProtected?: (isPasswordProtected: boolean) => void;
}

type ErrorType = 'password' | 'corrupted' | 'generic' | null;

export default function PdfThumbnails({
  file,
  currentPage = 1,
  onThumbnailClick,
  className = '',
  maxThumbnails = 20,
  onPasswordProtected,
}: PdfThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [password, setPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordAttempting, setIsPasswordAttempting] = useState<boolean>(false);

  // Initialize PDF.js worker
  useEffect(() => {
    setupPdfWorker();
  }, []);

  // Reset states when file changes
  useEffect(() => {
    setPassword('');
    setPasswordError(null);
    setErrorType(null);
    setError(null);
  }, [file]);

  // Generate thumbnails
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setErrorType(null);
    setThumbnails([]);

    const generateThumbnails = async () => {
      try {
        // Dynamically import PDF.js to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');

        // Convert file to ArrayBuffer if it's a File or Blob
        let data: ArrayBuffer | ArrayBufferLike;
        if (file instanceof File || file instanceof Blob) {
          data = await file.arrayBuffer();
        } else if (file instanceof Uint8Array) {
          data = file.buffer as ArrayBuffer;
        } else {
          data = file as ArrayBuffer;
        }

        // Create options object with password if provided
        const options: {
          data: ArrayBuffer | ArrayBufferLike;
          password?: string;
        } = {
          data,
        };

        if (password) {
          options.password = password;
        }

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(options);

        // Add an onPassword callback to detect password-protected PDFs
        loadingTask.onPassword = (updatePassword: (password: string) => void, reason: number) => {
          // reason=1 means wrong password, reason=2 means first request for password
          if (isMounted) {
            setIsLoading(false);
            setErrorType('password');

            if (reason === 1) {
              setPasswordError('Incorrect password. Please try again.');
            } else {
              setPasswordError(null);
            }

            // Notify parent component that this PDF is password protected
            if (onPasswordProtected) {
              onPasswordProtected(true);
            }
          }
        };

        const pdf = await loadingTask.promise;

        if (isMounted) {
          setNumPages(pdf.numPages);

          // If we got here with a password, clear any password errors
          if (password) {
            setPasswordError(null);
          }

          // Notify parent component that password protection is resolved (if it was protected)
          if (password && onPasswordProtected) {
            onPasswordProtected(false);
          }
        }

        // Limit the number of thumbnails to generate
        const pagesToRender = Math.min(pdf.numPages, maxThumbnails);
        const thumbnailPromises = [];

        for (let i = 1; i <= pagesToRender; i++) {
          thumbnailPromises.push(generateThumbnail(pdf, i));
        }

        const generatedThumbnails = await Promise.all(thumbnailPromises);

        // Filter out any failed thumbnails and replace with placeholders
        const validThumbnails = generatedThumbnails.map((thumbnail, index) =>
          thumbnail || generatePlaceholderThumbnail(index + 1)
        );

        if (isMounted) {
          setThumbnails(validThumbnails);
          setIsLoading(false);
        }

        // Clean up
        pdf.destroy();
      } catch (err: any) {
        console.error('Error generating thumbnails:', err);
        if (isMounted) {
          // Check if this is a password error
          if (err.name === 'PasswordException' ||
              (err.message && err.message.includes('password'))) {
            setErrorType('password');
            setError('This PDF is password protected. Please enter the password to view thumbnails.');

            // Notify parent component
            if (onPasswordProtected) {
              onPasswordProtected(true);
            }
          }
          // Check if this is a corrupted file error
          else if (err.name === 'InvalidPDFException' ||
                  (err.message && err.message.includes('corrupt'))) {
            setErrorType('corrupted');
            setError('This PDF file appears to be corrupted and cannot be processed.');
          }
          // Generic error
          else {
            setErrorType('generic');
            setError('Failed to generate thumbnails. Please try again or use a different PDF file.');
          }
          setIsLoading(false);
        }
      }
    };

    // Generate a placeholder thumbnail when actual thumbnail generation fails
    const generatePlaceholderThumbnail = (pageNumber: number): string => {
      try {
        // Create a canvas for the placeholder
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          return '';
        }

        // Set dimensions
        canvas.width = 100;
        canvas.height = 140;

        // Fill background
        context.fillStyle = '#f3f4f6'; // Light gray background
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Add page number text
        context.fillStyle = '#6b7280'; // Gray text
        context.font = '14px Arial';
        context.textAlign = 'center';
        context.fillText(`Page ${pageNumber}`, canvas.width / 2, canvas.height / 2);

        // Add document icon
        context.fillStyle = '#9ca3af';
        context.font = '24px Arial';
        context.fillText('📄', canvas.width / 2, canvas.height / 2 - 20);

        return canvas.toDataURL('image/png');
      } catch (err) {
        console.error('Error generating placeholder thumbnail:', err);
        return '';
      }
    };

    const generateThumbnail = async (pdf: any, pageNumber: number): Promise<string> => {
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnails

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        return canvas.toDataURL('image/png');
      } catch (err) {
        console.error(`Error generating thumbnail for page ${pageNumber}:`, err);
        // Return empty string, we'll replace with placeholder later
        return '';
      }
    };

    generateThumbnails();

    return () => {
      isMounted = false;
    };
  }, [file, maxThumbnails]);

  // Handle thumbnail click
  const handleThumbnailClick = (pageNumber: number) => {
    if (onThumbnailClick) {
      onThumbnailClick(pageNumber);
    }
  };

  return (
    <div className={`${className}`}>
      {isLoading ? (
        <div className="flex h-20 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Loading thumbnails...</span>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-2 text-xs dark:bg-red-900/20">
          <div className="text-red-700 dark:text-red-400">
            {error}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {thumbnails.map((thumbnail, index) => (
            <div
              key={index}
              className={`relative cursor-pointer overflow-hidden rounded border-2 ${
                currentPage === index + 1
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => handleThumbnailClick(index + 1)}
            >
              <img
                src={thumbnail}
                alt={`Page ${index + 1} thumbnail`}
                className="h-20 w-16 object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-center text-xs text-white">
                {index + 1}
              </div>
            </div>
          ))}

          {numPages > maxThumbnails && (
            <div className="flex h-20 w-16 items-center justify-center rounded border-2 border-gray-200 bg-gray-50 text-center text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              +{numPages - maxThumbnails} more pages
            </div>
          )}
        </div>
      )}
    </div>
  );
}
