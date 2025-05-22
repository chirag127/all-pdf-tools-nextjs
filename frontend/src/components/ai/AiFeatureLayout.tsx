'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import ClientLayout from '@/components/common/ClientLayout';
import PdfToolsNavigation from '@/components/common/PdfToolsNavigation';

interface AiFeatureLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export default function AiFeatureLayout({ 
  children, 
  title, 
  description 
}: AiFeatureLayoutProps) {
  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="md:col-span-1">
            <div className="mb-4 md:hidden">
              <Link href="/ai-features">
                <Button variant="ghost" className="flex items-center">
                  <FiArrowLeft className="mr-2" /> Back to AI Features
                </Button>
              </Link>
            </div>
            <PdfToolsNavigation className="sticky top-20" />
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-3">
            <div className="mb-8">
              <div className="hidden md:block">
                <Link href="/ai-features">
                  <Button variant="ghost" className="mb-4 flex items-center">
                    <FiArrowLeft className="mr-2" /> Back to AI Features
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </div>

            {/* Feature content */}
            {children}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
