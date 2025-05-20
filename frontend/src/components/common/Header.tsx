'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiSettings, FiMoon, FiSun } from 'react-icons/fi';
import { useSettingsStore } from '@/lib/store';

export default function Header() {
  const pathname = usePathname();
  const { darkMode, toggleDarkMode } = useSettingsStore();

  // Navigation items
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'PDF Tools', href: '/pdf-tools' },
    { name: 'AI Features', href: '/ai-features' },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">All PDF Tools</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {/* Settings link */}
            <Link
              href="/settings"
              className={`rounded-full p-2 ${
                pathname === '/settings'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
              aria-label="Settings"
            >
              <FiSettings size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
