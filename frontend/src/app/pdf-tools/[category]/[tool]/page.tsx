'use client';

import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import ClientLayout from '@/components/common/ClientLayout';
import { usePdfStore } from '@/lib/store';
import { pdfTools, getAllTools } from '@/lib/pdf-tools-config';

import { useParams, useRouter } from 'next/navigation';
import MergePdfTool from '@/components/pdf/tools/MergePdfTool';
import SplitPdfTool from '@/components/pdf/tools/SplitPdfTool';
import ExtractPagesTool from '@/components/pdf/tools/ExtractPagesTool';
import OrganizePagesTool from '@/components/pdf/tools/OrganizePagesTool';
import RotatePdfTool from '@/components/pdf/tools/RotatePdfTool';
import AddPageNumbersTool from '@/components/pdf/tools/AddPageNumbersTool';
import AddWatermarkTool from '@/components/pdf/tools/AddWatermarkTool';
import CropPdfTool from '@/components/pdf/tools/CropPdfTool';
import ProtectPdfTool from '@/components/pdf/tools/ProtectPdfTool';
import UnlockPdfTool from '@/components/pdf/tools/UnlockPdfTool';
import CompressPdfTool from '@/components/pdf/tools/CompressPdfTool';
import RepairPdfTool from '@/components/pdf/tools/RepairPdfTool';
import ConvertToPdfTool from '@/components/pdf/tools/ConvertToPdfTool';
import ConvertFromPdfTool from '@/components/pdf/tools/ConvertFromPdfTool';
import OcrPdfTool from '@/components/pdf/tools/OcrPdfTool';
import ScanToPdfTool from '@/components/pdf/tools/ScanToPdfTool';
import SignPdfTool from '@/components/pdf/tools/SignPdfTool';
import RedactPdfTool from '@/components/pdf/tools/RedactPdfTool';
// Temporarily comment out the ComparePdfsTool import until it's fixed
// import ComparePdfsTool from '@/components/pdf/tools/ComparePdfsTool';
import ProcessingIndicator from '@/components/pdf/ProcessingIndicator';
import dynamic from 'next/dynamic';

// Dynamically import the PDF viewer demo to avoid SSR issues
const PdfViewerDemo = dynamic(() => import('@/app/pdf-viewer-demo/page'), {
  ssr: false,
  loading: () => <div className="flex h-96 items-center justify-center">Loading PDF Viewer...</div>,
});

// Static params and metadata are defined in static-params.js

export default function PdfToolPage() {
  const params = useParams();
  const router = useRouter();
  const { category, tool } = params as { category: string; tool: string };
  const { isProcessing, resultUrl, resetState } = usePdfStore();
  const [toolInfo, setToolInfo] = useState<any>(null);

  useEffect(() => {
    // Reset PDF store state when navigating to a new tool
    resetState();

    // Find the tool info from the configuration
    const categoryInfo = pdfTools.find((cat) => cat.id === category);
    if (categoryInfo) {
      const toolInfo = categoryInfo.tools.find((t) => t.id === tool);
      if (toolInfo) {
        setToolInfo({ ...toolInfo, category: categoryInfo.title });
      } else {
        // Tool not found, redirect to PDF tools page
        router.push('/pdf-tools');
      }
    } else {
      // Category not found, redirect to PDF tools page
      router.push('/pdf-tools');
    }
  }, [category, tool, router, resetState]);

  const handleBack = () => {
    router.push('/pdf-tools');
  };

  const handleDownload = () => {
    if (resultUrl) {
      window.open(resultUrl, '_blank');
    }
  };

  // Render the appropriate tool component based on the category and tool
  const renderToolComponent = () => {
    if (!toolInfo) return null;

    // PDF Viewer tools
    if (category === 'viewer') {
      switch (tool) {
        case 'demo':
          return <PdfViewerDemo />;
        default:
          return <div>Tool not implemented yet</div>;
      }
    }

    // Organization tools
    if (category === 'organization') {
      switch (tool) {
        case 'merge':
          return <MergePdfTool />;
        case 'split':
          return <SplitPdfTool />;
        case 'extract':
          return <ExtractPagesTool />;
        case 'organize':
          return <OrganizePagesTool />;
        default:
          return <div>Tool not implemented yet</div>;
      }
    }

    // Conversion tools
    if (category === 'conversion') {
      switch (tool) {
        case 'to-pdf':
          return <ConvertToPdfTool />;
        case 'from-pdf':
          return <ConvertFromPdfTool />;
        case 'ocr':
          return <OcrPdfTool />;
        case 'scan-to-pdf':
          return <ScanToPdfTool />;
        default:
          return <div>Tool not implemented yet</div>;
      }
    }

    // Editing tools
    if (category === 'editing') {
      switch (tool) {
        case 'rotate':
          return <RotatePdfTool />;
        case 'add-page-numbers':
          return <AddPageNumbersTool />;
        case 'add-watermark':
          return <AddWatermarkTool />;
        case 'crop':
          return <CropPdfTool />;
        default:
          return <div>Tool not implemented yet</div>;
      }
    }

    // Security tools
    if (category === 'security') {
      switch (tool) {
        case 'protect':
          return <ProtectPdfTool />;
        case 'unlock':
          return <UnlockPdfTool />;
        case 'sign':
          return <SignPdfTool />;
        case 'redact':
          return <RedactPdfTool />;
        default:
          return <div>Tool not implemented yet</div>;
      }
    }

    // Enhancement tools
    if (category === 'enhancement') {
      switch (tool) {
        case 'compress':
          return <CompressPdfTool />;
        case 'repair':
          return <RepairPdfTool />;
        case 'compare':
          return <div>Compare PDFs tool is currently under maintenance.</div>;
        default:
          return <div>Tool not implemented yet</div>;
      }
    }

    return <div>Tool not implemented yet</div>;
  };

  if (!toolInfo) {
    return null;
  }

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            onClick={handleBack}
          >
            <FiArrowLeft className="mr-2" />
            Back to PDF Tools
          </Button>
          <h1 className="text-3xl font-bold">{toolInfo.name}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {toolInfo.description}
          </p>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-500">
            Category: {toolInfo.category}
          </div>
        </div>

        {/* Tool component */}
        <div className="mb-8">{renderToolComponent()}</div>

        {/* Processing indicator */}
        {isProcessing && <ProcessingIndicator />}

        {/* Result section */}
        {resultUrl && !isProcessing && (
          <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-400">
              PDF Processed Successfully
            </h2>
            <p className="mt-2 text-green-700 dark:text-green-300">
              Your PDF has been processed successfully. You can download it now.
            </p>
            <div className="mt-4">
              <Button
                onClick={handleDownload}
                className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                <FiDownload className="mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
