'use client';

import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiUpload, FiDownload, FiCopy, FiCheck } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import FileUpload from '@/components/common/FileUpload';
import ClientLayout from '@/components/common/ClientLayout';
import { useSettingsStore } from '@/lib/store';
import { aiApi } from '@/lib/api';
import Link from 'next/link';
import * as pdfUtils from '@/lib/pdfUtils';

// List of languages for translation
const LANGUAGES = [
  { code: 'ar', name: 'Arabic' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'no', name: 'Norwegian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'vi', name: 'Vietnamese' },
];

export default function TranslatePdfPage() {
  const { geminiApiKey, selectedModel } = useSettingsStore();
  const [file, setFile] = useState<File | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>('es');
  const [copied, setCopied] = useState(false);

  // Process PDF when file is selected
  useEffect(() => {
    if (file) {
      processPdf();
    }
  }, [file]);

  const processPdf = async () => {
    if (!file) return;

    try {
      // Get page count
      const count = await pdfUtils.getPageCount(file);
      setPageCount(count);

      // Generate preview of first page
      const preview = await pdfUtils.getPagePreview(file, 1);
      setPreviewUrl(preview);

      // Generate a unique ID for this PDF
      const id = `pdf-${Date.now()}`;
      setPdfId(id);
    } catch (err) {
      setError('Failed to process PDF. Please try again with a different file.');
      console.error('Error processing PDF:', err);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setPdfId(null);
    setTranslatedText('');
    setSourceLanguage('');
  };

  const handleClearFile = () => {
    setFile(null);
    setPdfId(null);
    setTranslatedText('');
    setSourceLanguage('');
    setPreviewUrl(null);
    setPageCount(0);
  };

  const handleTranslate = async () => {
    if (!geminiApiKey || (!file && !pdfId) || !targetLanguage) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiApi.translatePdf(
        geminiApiKey,
        targetLanguage,
        file || undefined,
        pdfId || undefined,
        selectedModel
      );

      setTranslatedText(response.translated_text);
      if (response.source_language) {
        setSourceLanguage(response.source_language);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to translate PDF. Please try again.'
      );
      console.error('Error translating PDF:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!translatedText) return;

    const blob = new Blob([translatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace('.pdf', '') || 'document'}_translated_${targetLanguage}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!geminiApiKey) {
    return (
      <ClientLayout>
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Link href="/ai-features">
              <Button variant="ghost" className="mb-4">
                <FiArrowLeft className="mr-2" /> Back to AI Features
              </Button>
            </Link>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-900/20">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">API Key Required</h3>
            <p className="mt-2 text-yellow-700 dark:text-yellow-300">
              To use the Translate PDF feature, you need to set up your Gemini API key in the settings.
            </p>
            <div className="mt-4">
              <Link href="/settings">
                <Button variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/30">
                  Go to Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link href="/ai-features">
            <Button variant="ghost">
              <FiArrowLeft className="mr-2" /> Back to AI Features
            </Button>
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Translate PDF</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Translate your PDF documents to different languages using AI
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold">Upload PDF</h2>

            {!file ? (
              <FileUpload
                onFileSelect={handleFileSelect}
                selectedFile={file}
                onClear={handleClearFile}
              />
            ) : (
              <div className="flex items-center space-x-4">
                {previewUrl && (
                  <div className="h-24 w-20 overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                    <img
                      src={previewUrl}
                      alt={`Preview of ${file.name}`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount} pages
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleClearFile}
                  >
                    Change PDF
                  </Button>
                </div>
              </div>
            )}

            {file && (
              <div className="mt-6">
                <h3 className="mb-2 text-lg font-medium">Translation Options</h3>
                <div className="mb-4">
                  <label htmlFor="targetLanguage" className="mb-2 block text-sm font-medium">
                    Target Language
                  </label>
                  <select
                    id="targetLanguage"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleTranslate}
                  isLoading={isLoading}
                  loadingText="Translating..."
                  disabled={!file || isLoading}
                >
                  Translate PDF
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {translatedText && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Translated Text</h2>
                  {sourceLanguage && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Translated from {LANGUAGES.find(l => l.code === sourceLanguage)?.name || sourceLanguage} to {LANGUAGES.find(l => l.code === targetLanguage)?.name}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center"
                  >
                    {copied ? <FiCheck className="mr-1" /> : <FiCopy className="mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center"
                  >
                    <FiDownload className="mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <p className="whitespace-pre-wrap">{translatedText}</p>
              </div>
            </div>
          )}

          {!file && !translatedText && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <FiUpload className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="text-xl font-medium">Upload a PDF to get started</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                You can translate your PDF documents to different languages
              </p>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
