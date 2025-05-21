'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiUpload, FiArrowLeft, FiUser, FiCpu, FiLoader } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import FileUpload from '@/components/common/FileUpload';
import ClientLayout from '@/components/common/ClientLayout';
import { useSettingsStore } from '@/lib/store';
import { aiApi } from '@/lib/api';
import Link from 'next/link';
import * as pdfUtils from '@/lib/pdfUtils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourcePages?: number[];
}

export default function ChatWithPdfPage() {
  const { geminiApiKey, selectedModel } = useSettingsStore();
  const [file, setFile] = useState<File | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

      // Extract text from PDF
      const text = await pdfUtils.extractText(file);
      setExtractedText(text);

      // Generate a unique ID for this PDF
      const id = `pdf-${Date.now()}`;
      setPdfId(id);

      // Add welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `I've processed your PDF (${count} pages). What would you like to know about it?`,
        },
      ]);
    } catch (err) {
      setError('Failed to process PDF. Please try again with a different file.');
      console.error('Error processing PDF:', err);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setPdfId(null);
    setMessages([]);
    setExtractedText('');
  };

  const handleClearFile = () => {
    setFile(null);
    setPdfId(null);
    setMessages([]);
    setPreviewUrl(null);
    setPageCount(0);
    setExtractedText('');
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !geminiApiKey || (!file && !pdfId)) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiApi.chatWithPdf(
        geminiApiKey,
        input,
        file,
        pdfId || undefined,
        selectedModel
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        sourcePages: response.source_pages,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to get a response. Please try again.'
      );
      console.error('Error in chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
              To use the Chat with PDF feature, you need to set up your Gemini API key in the settings.
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
      <div className="container mx-auto flex h-[calc(100vh-64px)] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link href="/ai-features">
            <Button variant="ghost">
              <FiArrowLeft className="mr-2" /> Back to AI Features
            </Button>
          </Link>
        </div>

        <div className="flex flex-1 flex-col md:flex-row md:space-x-4">
          {/* PDF Upload/Preview Panel */}
          <div className="mb-4 w-full md:mb-0 md:w-1/3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold">Upload PDF</h2>
              
              {!file ? (
                <FileUpload
                  onFileSelect={handleFileSelect}
                  selectedFile={file}
                  onClear={handleClearFile}
                />
              ) : (
                <div className="space-y-4">
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
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="flex w-full flex-1 flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:w-2/3">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <FiUpload className="mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="text-xl font-medium">Upload a PDF to start chatting</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    You can ask questions about the content of your PDF document
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <div className="mb-1 flex items-center">
                          {message.role === 'user' ? (
                            <FiUser className="mr-2" />
                          ) : (
                            <FiCpu className="mr-2" />
                          )}
                          <span className="font-medium">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.sourcePages && message.sourcePages.length > 0 && (
                          <div className="mt-2 text-xs">
                            <span className="font-medium">Sources:</span> Pages{' '}
                            {message.sourcePages.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {error && (
              <div className="mx-4 mb-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center">
                <textarea
                  className="flex-1 resize-none rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Ask a question about your PDF..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={!file && !pdfId}
                />
                <Button
                  className="ml-2"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || !file || isLoading}
                >
                  {isLoading ? <FiLoader className="animate-spin" /> : <FiSend />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
