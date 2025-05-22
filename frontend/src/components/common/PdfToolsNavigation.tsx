'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import { pdfTools } from '@/lib/pdf-tools-config';
import { Button } from '@/components/common/Button';

interface PdfToolsNavigationProps {
  className?: string;
}

export default function PdfToolsNavigation({ className = '' }: PdfToolsNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Check if a tool is active
  const isToolActive = (categoryId: string, toolId: string) => {
    return pathname === `/pdf-tools/${categoryId}/${toolId}`;
  };

  // Check if a category has any active tool
  const isCategoryActive = (categoryId: string) => {
    return pathname?.includes(`/pdf-tools/${categoryId}/`);
  };

  // Sidebar animation variants
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: 0.1
      }
    }
  };

  // Category animation variants
  const categoryVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    closed: {
      opacity: 0,
      y: 20,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  // Tool item animation variants
  const toolVariants = {
    open: {
      opacity: 1,
      y: 0
    },
    closed: {
      opacity: 0,
      y: 10
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="sm"
        className="flex md:hidden items-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="pdf-tools-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </Button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className="fixed top-16 left-0 w-full h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 z-50 overflow-y-auto md:hidden"
            id="pdf-tools-menu"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <div className="p-4">
              <motion.div
                variants={categoryVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="space-y-6"
              >
                {pdfTools.map((category) => (
                  <motion.div key={category.id} variants={toolVariants} className="space-y-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <category.icon className="mr-2" />
                      {category.title}
                    </h3>
                    <ul className="pl-6 space-y-2">
                      {category.tools.map((tool) => (
                        <motion.li key={tool.id} variants={toolVariants}>
                          <Link
                            href={`/pdf-tools/${category.id}/${tool.id}`}
                            className={`block py-2 px-3 rounded-md ${
                              isToolActive(category.id, tool.id)
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                          >
                            {tool.name}
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Menu */}
      <div className="hidden md:block">
        <nav className="space-y-6">
          {pdfTools.map((category) => (
            <div key={category.id} className="space-y-2">
              <h3 className={`text-lg font-medium flex items-center ${
                isCategoryActive(category.id)
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                <category.icon className="mr-2" />
                {category.title}
              </h3>
              <ul className="pl-6 space-y-2">
                {category.tools.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={`/pdf-tools/${category.id}/${tool.id}`}
                      className={`block py-2 px-3 rounded-md ${
                        isToolActive(category.id, tool.id)
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
