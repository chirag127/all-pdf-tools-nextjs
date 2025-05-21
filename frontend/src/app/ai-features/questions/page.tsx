'use client';

import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiUpload, FiDownload, FiCopy, FiCheck, FiPlus, FiMinus } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import FileUpload from '@/components/common/FileUpload';
import ClientLayout from '@/components/common/ClientLayout';
import { useSettingsStore } from '@/lib/store';
import { aiApi } from '@/lib/api';
import Link from 'next/link';
import * as pdfUtils from '@/lib/pdfUtils';

export default function GenerateQuestionsPage() {
  const { geminiApiKey, selectedModel } = useSettingsStore();
  const [file, setFile] = useState<File | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
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
    setQuestions([]);
  };

  const handleClearFile = () => {
    setFile(null);
    setPdfId(null);
    setQuestions([]);
    setPreviewUrl(null);
    setPageCount(0);
  };

  const handleGenerateQuestions = async () => {
    if (!geminiApiKey || (!file && !pdfId)) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiApi.generateQuestions(
        geminiApiKey,
        file || undefined,
        pdfId || undefined,
        questionCount,
        selectedModel
      );

      setQuestions(response.questions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate questions. Please try again.'
      );
      console.error('Error generating questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const text = questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (questions.length === 0) return;

    const text = questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace('.pdf', '') || 'document'}_questions.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const increaseQuestionCount = () => {
    if (questionCount < 20) {
      setQuestionCount(questionCount + 1);
    }
  };

  const decreaseQuestionCount = () => {
    if (questionCount > 1) {
      setQuestionCount(questionCount - 1);
    }
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
              To use the Generate Questions feature, you need to set up your Gemini API key in the settings.
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
          <h1 className="text-3xl font-bold">Generate Questions</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Generate insightful questions based on your PDF content
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
                <h3 className="mb-2 text-lg font-medium">Question Options</h3>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium">Number of Questions</label>
                  <div className="flex w-40 items-center">
                    <button
                      type="button"
                      onClick={decreaseQuestionCount}
                      className="flex h-10 w-10 items-center justify-center rounded-l-md border border-gray-300 bg-gray-100 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <FiMinus />
                    </button>
                    <input
                      type="number"
                      value={questionCount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 1 && value <= 20) {
                          setQuestionCount(value);
                        }
                      }}
                      min="1"
                      max="20"
                      className="h-10 w-20 border-y border-gray-300 bg-white text-center dark:border-gray-600 dark:bg-gray-800"
                    />
                    <button
                      type="button"
                      onClick={increaseQuestionCount}
                      className="flex h-10 w-10 items-center justify-center rounded-r-md border border-gray-300 bg-gray-100 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateQuestions}
                  isLoading={isLoading}
                  loadingText="Generating Questions..."
                  disabled={!file || isLoading}
                >
                  Generate Questions
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {questions.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Generated Questions</h2>
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
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900"
                  >
                    <p className="font-medium">
                      {index + 1}. {question}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!file && questions.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <FiUpload className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="text-xl font-medium">Upload a PDF to get started</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                You can generate insightful questions based on your PDF content
              </p>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
