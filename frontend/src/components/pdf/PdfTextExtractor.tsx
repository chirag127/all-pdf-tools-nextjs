'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiDownload, FiCopy, FiAlertTriangle } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import setupPdfWorker from '@/lib/pdfWorker';
import PdfPasswordInput from './PdfPasswordInput';

interface PdfTextExtractorProps {
  file: File | Blob | ArrayBuffer | Uint8Array;
  onTextExtracted?: (text: string) => void;
  className?: string;
  showControls?: boolean;
  password?: string;
}

type ErrorType = 'password' | 'corrupted' | 'generic' | null;

export default function PdfTextExtractor({
  file,
  onTextExtracted,
  className = '',
  showControls = true,
  password: initialPassword,
}: PdfTextExtractorProps) {
  const [extractedText, setExtractedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedText, setHighlightedText] = useState<string>('');
  const [password, setPassword] = useState<string>(initialPassword || '');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordAttempting, setIsPasswordAttempting] = useState<boolean>(false);

  // Initialize PDF.js worker
  useEffect(() => {
    setupPdfWorker();
  }, []);

  // Reset states when file changes
  useEffect(() => {
    if (!initialPassword) {
      setPassword('');
    }
    setPasswordError(null);
    setErrorType(null);
    setError(null);
  }, [file, initialPassword]);

  // Extract text from PDF
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setErrorType(null);
    setExtractedText('');

    const extractText = async () => {
      try {
        // Dynamically import PDF.js to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');

        // Convert file to ArrayBuffer if it's a File or Blob
        // Use a type that's compatible with PDF.js DocumentInitParameters
        let data: ArrayBuffer | Uint8Array;
        if (file instanceof File || file instanceof Blob) {
          data = await file.arrayBuffer();
        } else if (file instanceof Uint8Array) {
          data = file; // Use the Uint8Array directly
        } else {
          // Convert ArrayBufferLike to Uint8Array if needed
          data = file instanceof SharedArrayBuffer
            ? new Uint8Array(file)
            : file as ArrayBuffer;
        }

        // Create options object with password if provided
        // Use the correct type for DocumentInitParameters
        const options = {
          data: data instanceof SharedArrayBuffer
            ? new Uint8Array(data) // Convert SharedArrayBuffer to Uint8Array
            : data, // Keep ArrayBuffer as is
          password: password || undefined,
        };

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
          }
        };

        const pdf = await loadingTask.promise;

        let fullText = '';

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ');

          fullText += `Page ${i}\n${pageText}\n\n`;
        }

        if (isMounted) {
          setExtractedText(fullText);
          setIsLoading(false);

          // If we got here with a password, clear any password errors
          if (password) {
            setPasswordError(null);
          }

          if (onTextExtracted) {
            onTextExtracted(fullText);
          }
        }

        // Clean up
        pdf.destroy();
      } catch (err: any) {
        console.error('Error extracting text from PDF:', err);
        if (isMounted) {
          // Check if this is a password error
          if (err.name === 'PasswordException' ||
              (err.message && err.message.includes('password'))) {
            setErrorType('password');
            setError('This PDF is password protected. Please enter the password to extract text.');
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
            setError('Failed to extract text from PDF. Please try again or use a different PDF file.');
          }
          setIsLoading(false);
        }
      }
    };

    extractText();

    return () => {
      isMounted = false;
    };
  }, [file, onTextExtracted, password]);

  // Handle search
  useEffect(() => {
    if (!searchTerm || !extractedText) {
      setHighlightedText(extractedText);
      return;
    }

    try {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      const highlighted = extractedText.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
      );
      setHighlightedText(highlighted);
    } catch (err) {
      // In case of invalid regex
      setHighlightedText(extractedText);
    }
  }, [searchTerm, extractedText]);

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(extractedText)
      .then(() => {
        alert('Text copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy text:', err);
        alert('Failed to copy text to clipboard');
      });
  };

  // Handle download as text file
  const handleDownloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle password submission
  const handlePasswordSubmit = (submittedPassword: string) => {
    setIsPasswordAttempting(true);
    setPassword(submittedPassword);
    setIsLoading(true);

    // The effect will re-run with the new password
    setTimeout(() => {
      if (password === submittedPassword) {
        setIsPasswordAttempting(false);
      }
    }, 500);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {showControls && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
          <div className="relative flex-grow">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FiSearch className="text-gray-500" />
            </div>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              placeholder="Search in text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              disabled={isLoading || !extractedText}
              aria-label="Copy to clipboard"
            >
              <FiCopy className="mr-1" /> Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadText}
              disabled={isLoading || !extractedText}
              aria-label="Download text"
            >
              <FiDownload className="mr-1" /> Download
            </Button>
          </div>
        </div>
      )}

      <div className="relative min-h-[300px] rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">Extracting text...</span>
          </div>
        ) : errorType === 'password' ? (
          <div className="w-full max-w-md p-4">
            <PdfPasswordInput
              onSubmit={handlePasswordSubmit}
              isLoading={isPasswordAttempting}
              error={passwordError}
            />
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex items-start">
              {errorType === 'corrupted' ? (
                <FiAlertTriangle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
              ) : null}
              <div>
                <div className="text-sm font-medium text-red-800 dark:text-red-300">
                  {errorType === 'corrupted' ? 'Corrupted PDF File' : 'Error Extracting Text'}
                </div>
                <div className="mt-1 text-sm text-red-700 dark:text-red-400">
                  {error}
                  {errorType === 'corrupted' && (
                    <div className="mt-2 text-xs">
                      Try opening this file with a different PDF viewer to verify if it's corrupted.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="max-h-[500px] overflow-auto whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
        )}
      </div>
    </div>
  );
}
