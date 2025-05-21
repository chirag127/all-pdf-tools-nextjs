'use client';

import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import ClientLayout from '@/components/common/ClientLayout';
import Link from 'next/link';

export default function QuestionsLoading() {
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
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
              <span className="ml-2">Loading PDF tools...</span>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
