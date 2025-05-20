'use client';

import React from 'react';

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function Card({ title, description, children, className = '', footer }: CardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 ${className}`}>
      {(title || description) && (
        <div className="p-6 pb-0">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}

interface CardGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function CardGrid({ children, className = '', columns = 3 }: CardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {children}
    </div>
  );
}
