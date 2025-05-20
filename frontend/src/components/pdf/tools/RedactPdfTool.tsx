'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiEyeOff, FiSearch, FiPlus, FiTrash2 } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

// Predefined patterns for redaction
const REDACTION_PATTERNS = [
  { id: 'email', name: 'Email Addresses', pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b' },
  { id: 'phone', name: 'Phone Numbers', pattern: '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b' },
  { id: 'ssn', name: 'Social Security Numbers', pattern: '\\b\\d{3}[-]?\\d{2}[-]?\\d{4}\\b' },
  { id: 'creditcard', name: 'Credit Card Numbers', pattern: '\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b' },
  { id: 'date', name: 'Dates', pattern: '\\b\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}\\b' },
  { id: 'address', name: 'Addresses', pattern: '\\b\\d+\\s+[A-Za-z\\s]+\\b(?:,\\s*[A-Za-z]+)?\\b(?:,\\s*[A-Z]{2})?\\b(?:,\\s*\\d{5}(?:-\\d{4})?)?\\b' },
];

export default function RedactPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [newSearchTerm, setNewSearchTerm] = useState<string>('');
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);

  // When a file is selected, generate a preview and extract text
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

        // Extract text from the PDF
        const text = await pdfUtils.extractText(file);
        setExtractedText(text);
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
    setExtractedText('');
    setSearchTerms([]);
    setSelectedPatterns([]);
  };

  const handleClearFile = () => {
    setFile(null);
    setError(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setPageCount(0);
    setExtractedText('');
    setSearchTerms([]);
    setSelectedPatterns([]);
  };

  const addSearchTerm = () => {
    if (!newSearchTerm.trim()) return;

    if (!searchTerms.includes(newSearchTerm.trim())) {
      setSearchTerms([...searchTerms, newSearchTerm.trim()]);
    }

    setNewSearchTerm('');
  };

  const removeSearchTerm = (term: string) => {
    setSearchTerms(searchTerms.filter(t => t !== term));
  };

  const togglePattern = (patternId: string) => {
    if (selectedPatterns.includes(patternId)) {
      setSelectedPatterns(selectedPatterns.filter(id => id !== patternId));
    } else {
      setSelectedPatterns([...selectedPatterns, patternId]);
    }
  };

  const highlightMatches = (text: string): React.ReactNode => {
    if (!text) return <></>;

    let highlightedText = text;
    let allMatches: { start: number; end: number; term: string }[] = [];

    // Find matches for search terms
    searchTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          term: match[0],
        });
      }
    });

    // Find matches for selected patterns
    selectedPatterns.forEach(patternId => {
      const pattern = REDACTION_PATTERNS.find(p => p.id === patternId);
      if (!pattern) return;

      const regex = new RegExp(pattern.pattern, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          term: match[0],
        });
      }
    });

    // Sort matches by start position
    allMatches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches
    const filteredMatches: typeof allMatches = [];
    let lastEnd = -1;

    for (const match of allMatches) {
      if (match.start >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.end;
      }
    }

    // Build highlighted text
    if (filteredMatches.length === 0) {
      return <span>{text}</span>;
    }

    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    filteredMatches.forEach((match, i) => {
      // Add text before match
      if (match.start > lastIndex) {
        result.push(
          <span key={`text-${i}`}>
            {text.substring(lastIndex, match.start)}
          </span>
        );
      }

      // Add highlighted match
      result.push(
        <span
          key={`highlight-${i}`}
          className="bg-red-200 dark:bg-red-900"
        >
          {text.substring(match.start, match.end)}
        </span>
      );

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return <>{result}</>;
  };

  const handleRedact = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    if (searchTerms.length === 0 && selectedPatterns.length === 0) {
      setError('Please add at least one search term or select a pattern to redact.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Redaction can only be done server-side as it requires specialized tools
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Get patterns from selected pattern IDs
      const patterns = selectedPatterns.map(id => {
        const pattern = REDACTION_PATTERNS.find(p => p.id === id);
        return pattern ? pattern.pattern : '';
      }).filter(Boolean);

      // Call the API to redact the PDF
      const result = await pdfApi.redactPdf(file, searchTerms, patterns);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while redacting the PDF.');
      console.error('Error redacting PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'redacted'}_redacted.pdf`;

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

          {/* Redaction options */}
          {file && (
            <div className="space-y-6">
              {/* Custom search terms */}
              <div>
                <h3 className="mb-4 text-lg font-medium">Custom Search Terms</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSearchTerm}
                    onChange={(e) => setNewSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSearchTerm()}
                    placeholder="Enter text to redact"
                    className="flex-1 rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                  <Button onClick={addSearchTerm}>
                    <FiPlus className="mr-2" />
                    Add
                  </Button>
                </div>

                {searchTerms.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {searchTerms.map((term, index) => (
                      <div
                        key={`${term}-${index}`}
                        className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm dark:bg-blue-900"
                      >
                        <span className="mr-1">{term}</span>
                        <button
                          onClick={() => removeSearchTerm(term)}
                          className="ml-1 rounded-full p-1 hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Predefined patterns */}
              <div>
                <h3 className="mb-4 text-lg font-medium">Predefined Patterns</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {REDACTION_PATTERNS.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="flex items-center space-x-2 rounded-md border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <input
                        type="checkbox"
                        id={`pattern-${pattern.id}`}
                        checked={selectedPatterns.includes(pattern.id)}
                        onChange={() => togglePattern(pattern.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-400"
                      />
                      <label
                        htmlFor={`pattern-${pattern.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {pattern.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Text preview with highlights */}
              {extractedText && (searchTerms.length > 0 || selectedPatterns.length > 0) && (
                <div>
                  <h3 className="mb-4 text-lg font-medium">Preview</h3>
                  <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200 p-4 dark:border-gray-700">
                    <p className="whitespace-pre-wrap text-sm">
                      {highlightMatches(extractedText)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Highlighted text will be redacted in the final PDF.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Redact button */}
          <div className="flex justify-center">
            <Button
              onClick={handleRedact}
              disabled={!file || (searchTerms.length === 0 && selectedPatterns.length === 0) || isProcessing}
              className={!file || (searchTerms.length === 0 && selectedPatterns.length === 0) || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Processing...' : (
                <>
                  <FiEyeOff className="mr-2" />
                  Redact PDF
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
            Please wait while we redact your PDF. This may take a few moments.
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
            PDF Redacted Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDF has been redacted successfully. All matching text has been permanently removed.
          </p>
          <div className="mt-4 flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FiDownload className="mr-2" />
              Download Redacted PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResultUrl(null);
                setFile(null);
                setPreviewUrl(null);
                setPageCount(0);
                setExtractedText('');
                setSearchTerms([]);
                setSelectedPatterns([]);
              }}
            >
              Redact Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
