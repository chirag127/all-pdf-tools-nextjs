'use client';

import React from 'react';
import Link from 'next/link';
import { FiMessageSquare, FiFileText, FiGlobe, FiHelpCircle } from 'react-icons/fi';
import { Card, CardGrid } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useSettingsStore } from '@/lib/store';
import ClientLayout from '@/components/common/ClientLayout';

export default function AiFeaturesPage() {
  const { geminiApiKey } = useSettingsStore();

  // AI features
  const features = [
    {
      id: 'chat',
      title: 'Chat with PDF',
      description: 'Ask questions about your PDF documents and get AI-powered answers',
      icon: <FiMessageSquare size={24} className="text-blue-500" />,
      href: '/ai-features/chat',
    },
    {
      id: 'summarize',
      title: 'Summarize PDF',
      description: 'Generate concise summaries of your PDF documents',
      icon: <FiFileText size={24} className="text-green-500" />,
      href: '/ai-features/summarize',
    },
    {
      id: 'translate',
      title: 'Translate PDF',
      description: 'Translate your PDF documents to different languages',
      icon: <FiGlobe size={24} className="text-purple-500" />,
      href: '/ai-features/translate',
    },
    {
      id: 'questions',
      title: 'Generate Questions',
      description: 'Generate insightful questions based on your PDF content',
      icon: <FiHelpCircle size={24} className="text-orange-500" />,
      href: '/ai-features/questions',
    },
  ];

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">AI Features</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Leverage the power of AI to extract insights from your PDF documents
          </p>
        </div>

        {!geminiApiKey ? (
          <div className="mx-auto mb-12 max-w-2xl rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-900/20">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">API Key Required</h3>
            <p className="mt-2 text-yellow-700 dark:text-yellow-300">
              To use the AI features, you need to set up your Gemini API key in the settings.
            </p>
            <div className="mt-4">
              <Link href="/settings">
                <Button variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/30">
                  Go to Settings
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        <CardGrid columns={2}>
          {features.map((feature) => (
            <Link key={feature.id} href={feature.href}>
              <Card
                className={`h-full cursor-pointer transition-all hover:border-blue-300 hover:shadow-md dark:hover:border-blue-800 ${
                  !geminiApiKey ? 'opacity-50' : ''
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-medium">{feature.title}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </CardGrid>

        <div className="mt-12 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300">How It Works</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-start">
                <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300">Upload Your PDF</h3>
                  <p className="text-blue-600 dark:text-blue-400">
                    Start by uploading the PDF document you want to analyze.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300">Select AI Feature</h3>
                  <p className="text-blue-600 dark:text-blue-400">
                    Choose the AI feature you want to use (chat, summarize, translate, or generate questions).
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300">Get AI-Powered Results</h3>
                  <p className="text-blue-600 dark:text-blue-400">
                    Our AI will process your document and provide you with the requested information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
