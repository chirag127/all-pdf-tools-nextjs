'use client';

import React, { useEffect } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { useSettingsStore } from '@/lib/store';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { darkMode } = useSettingsStore();
  
  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`flex min-h-screen flex-col ${darkMode ? 'dark' : ''}`}>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
