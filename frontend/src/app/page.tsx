'use client';

import React from 'react';
import Link from 'next/link';
import Image from "next/image";
import { FiFileText, FiTool, FiCpu, FiLock, FiEdit, FiRefreshCw } from 'react-icons/fi';
import { Card, CardGrid } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import ClientLayout from '@/components/common/ClientLayout';

export default function Home() {
  // Feature categories
  const featureCategories = [
    {
      title: 'Document Organization',
      description: 'Organize and manage your PDF documents efficiently',
      icon: <FiFileText size={24} className="text-blue-500" />,
      href: '/pdf-tools#organization',
    },
    {
      title: 'Conversion Tools',
      description: 'Convert PDFs to and from various formats',
      icon: <FiRefreshCw size={24} className="text-green-500" />,
      href: '/pdf-tools#conversion',
    },
    {
      title: 'Editing Tools',
      description: 'Edit and modify PDF content with ease',
      icon: <FiEdit size={24} className="text-orange-500" />,
      href: '/pdf-tools#editing',
    },
    {
      title: 'Security Tools',
      description: 'Protect and secure your PDF documents',
      icon: <FiLock size={24} className="text-red-500" />,
      href: '/pdf-tools#security',
    },
    {
      title: 'Enhancement Tools',
      description: 'Enhance and optimize your PDF files',
      icon: <FiTool size={24} className="text-purple-500" />,
      href: '/pdf-tools#enhancement',
    },
    {
      title: 'AI Features',
      description: 'Leverage AI to extract insights from your PDFs',
      icon: <FiCpu size={24} className="text-indigo-500" />,
      href: '/ai-features',
    },
  ];

  return (
    <ClientLayout>
      <div>
        {/* Hero section */}
        <section className="bg-gradient-to-b from-white to-gray-100 py-20 dark:from-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                All PDF Tools
              </h1>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
                A comprehensive toolkit for all your PDF needs. Merge, split, edit, secure, and analyze your PDF documents with ease.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Link href="/pdf-tools">
                  <Button size="lg">Get Started with PDF Tools</Button>
                </Link>
                <Link href="/ai-features">
                  <Button variant="outline" size="lg">
                    Explore AI Features
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Powerful PDF Tools at Your Fingertips
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Explore our comprehensive suite of PDF tools designed to help you work with PDF documents more efficiently.
              </p>
            </div>

            <div className="mt-12">
              <CardGrid columns={3}>
                {featureCategories.map((category) => (
                  <Link key={category.title} href={category.href}>
                    <Card
                      className="h-full cursor-pointer transition-all hover:border-blue-300 hover:shadow-md dark:hover:border-blue-800"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-4 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                          {category.icon}
                        </div>
                        <h3 className="text-xl font-medium">{category.title}</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{category.description}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </CardGrid>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="bg-blue-600 py-16 dark:bg-blue-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to transform your PDF workflow?
              </h2>
              <p className="mt-4 text-xl text-blue-100">
                Get started with All PDF Tools today and experience the difference.
              </p>
              <div className="mt-8">
                <Link href="/pdf-tools">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
                  >
                    Explore All Tools
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ClientLayout>
  );
}
