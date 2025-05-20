'use client';

import React from 'react';
import { usePdfStore } from '@/lib/store';

export default function ProcessingIndicator() {
  const { progress } = usePdfStore();
  
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
      <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-400">
        Processing PDF
      </h2>
      <p className="mt-2 text-blue-700 dark:text-blue-300">
        Please wait while we process your PDF file. This may take a few moments.
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
  );
}
