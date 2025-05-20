'use client';

import React from 'react';
import Link from 'next/link';
import { FiGithub } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {currentYear} All PDF Tools. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              A powerful toolkit for all your PDF needs
            </p>
          </div>

          <div className="flex space-x-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              Terms of Service
            </Link>
            <a
              href="https://github.com/chirag127/all-pdf-tools-nextjs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              <FiGithub className="inline-block h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
