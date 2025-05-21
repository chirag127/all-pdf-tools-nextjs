'use client';

import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiLock, FiUnlock } from 'react-icons/fi';
import { Button } from '@/components/common/Button';

interface PdfPasswordInputProps {
  onSubmit: (password: string) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export default function PdfPasswordInput({
  onSubmit,
  isLoading = false,
  error = null,
  className = '',
}: PdfPasswordInputProps) {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
    }
  };

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      <div className="mb-3 flex items-center text-blue-600 dark:text-blue-400">
        <FiLock className="mr-2" />
        <h3 className="text-lg font-medium">Password Protected PDF</h3>
      </div>
      
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        This PDF is password protected. Please enter the password to view the document.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              placeholder="Enter PDF password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          
          {error && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!password.trim() || isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                Unlocking...
              </>
            ) : (
              <>
                <FiUnlock className="mr-2" />
                Unlock PDF
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
