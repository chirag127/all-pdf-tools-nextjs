'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { useSettingsStore } from '@/lib/store';
import setupPdfWorker from '@/lib/pdfWorker';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { darkMode } = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  // Only run on client side
  useEffect(() => {
    setMounted(true);

    // Initialize PDF.js worker
    const initializePdfWorker = async () => {
      try {
        await setupPdfWorker();
        console.log('PDF.js worker initialized successfully');
      } catch (error) {
        console.error('Error initializing PDF.js worker:', error);
      }
    };

    initializePdfWorker();
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (mounted) {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode, mounted]);

  // Avoid hydration mismatch by using a neutral class on first render
  const themeClass = mounted ? (darkMode ? 'dark' : '') : '';

  return (
    <div className={`flex min-h-screen flex-col ${themeClass}`}>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
