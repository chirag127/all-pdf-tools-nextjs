'use client';

import React, { useEffect } from 'react';
import * as pdfUtils from '@/lib/pdfUtils';

// This component is a wrapper for PDF utilities
// It's used to load PDF utilities only on the client side
const PdfUtilsWrapper: React.FC = () => {
  useEffect(() => {
    // Initialize PDF utilities
    console.log('PDF utilities initialized');
  }, []);

  return null;
};

export default PdfUtilsWrapper;
