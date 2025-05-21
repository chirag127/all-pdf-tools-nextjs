/**
 * Wrapper for PDF utilities to handle dynamic imports and avoid SSR issues
 * 
 * This file provides a wrapper around the PDF utilities to ensure they're only
 * loaded in the browser environment and not during server-side rendering.
 */

// Import the DOMMatrix polyfill for server-side rendering
import './domMatrixPolyfill';

// Define the shape of the PDF utilities
interface PdfUtils {
  extractText: (file: File, password?: string) => Promise<string>;
  getPageCount: (file: File, password?: string) => Promise<number>;
  getPagePreview: (file: File, pageNumber: number, password?: string) => Promise<string>;
  mergePdfs: (files: File[]) => Promise<Uint8Array>;
  splitPdf: (file: File, ranges: { start: number; end: number }[]) => Promise<Uint8Array[]>;
  extractPages: (file: File, pageNumbers: number[]) => Promise<Uint8Array>;
  rotatePdf: (file: File, rotation: number, pageNumbers?: number[]) => Promise<Uint8Array>;
  addPageNumbers: (
    file: File,
    position?: string,
    startNumber?: number,
    format?: string
  ) => Promise<Uint8Array>;
  addTextWatermark: (
    file: File,
    text: string,
    opacity?: number,
    rotation?: number,
    fontSize?: number
  ) => Promise<Uint8Array>;
  protectPdf: (
    file: File,
    userPassword?: string,
    ownerPassword?: string,
    permissions?: {
      printing?: boolean;
      copying?: boolean;
      modifying?: boolean;
    }
  ) => Promise<Uint8Array>;
  unlockPdf: (file: File, password: string) => Promise<Uint8Array>;
  compressPdf: (file: File, quality?: number) => Promise<Uint8Array>;
  organizePdf: (file: File, pageOrder: number[]) => Promise<Uint8Array>;
}

// Create a wrapper that dynamically imports the PDF utilities
const createPdfUtilsWrapper = async (): Promise<PdfUtils> => {
  // Only import in browser environment
  if (typeof window === 'undefined') {
    // Return stub implementations for server-side rendering
    return {
      extractText: async () => '',
      getPageCount: async () => 0,
      getPagePreview: async () => '',
      mergePdfs: async () => new Uint8Array(),
      splitPdf: async () => [],
      extractPages: async () => new Uint8Array(),
      rotatePdf: async () => new Uint8Array(),
      addPageNumbers: async () => new Uint8Array(),
      addTextWatermark: async () => new Uint8Array(),
      protectPdf: async () => new Uint8Array(),
      unlockPdf: async () => new Uint8Array(),
      compressPdf: async () => new Uint8Array(),
      organizePdf: async () => new Uint8Array(),
    };
  }

  // Dynamically import the PDF utilities
  const pdfUtilsModule = await import('./pdfUtils');
  return pdfUtilsModule;
};

export default createPdfUtilsWrapper;
