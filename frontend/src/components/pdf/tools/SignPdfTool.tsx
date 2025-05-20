'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiDownload, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import FileUpload from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { pdfApi } from '@/lib/api';
import * as pdfUtils from '@/lib/pdfUtils';

// Signature types
type SignatureType = 'draw' | 'type' | 'image';

// Signature fonts
const SIGNATURE_FONTS = [
  { id: 'dancing-script', name: 'Dancing Script', className: 'font-dancing-script' },
  { id: 'pacifico', name: 'Pacifico', className: 'font-pacifico' },
  { id: 'caveat', name: 'Caveat', className: 'font-caveat' },
  { id: 'satisfy', name: 'Satisfy', className: 'font-satisfy' },
  { id: 'permanent-marker', name: 'Permanent Marker', className: 'font-permanent-marker' },
];

export default function SignPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [signatureType, setSignatureType] = useState<SignatureType>('draw');
  const [typedSignature, setTypedSignature] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<string>('dancing-script');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [canvasEmpty, setCanvasEmpty] = useState<boolean>(true);

  // When a file is selected, generate a preview
  useEffect(() => {
    const getDocumentInfo = async () => {
      if (!file) return;

      try {
        // Get page count
        const count = await pdfUtils.getPageCount(file);
        setPageCount(count);

        // Generate preview of first page
        updatePagePreview(1);
      } catch (error) {
        console.error('Error getting document info:', error);
        setError('Failed to read the PDF file. The file might be corrupted or password-protected.');
      }
    };

    getDocumentInfo();
  }, [file]);

  // Initialize canvas for drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 150;

    // Set canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set drawing style
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
  }, []);

  const updatePagePreview = async (pageNum: number) => {
    if (!file) return;

    try {
      const preview = await pdfUtils.getPagePreview(file, pageNum);
      setPreviewUrl(preview);
      setCurrentPage(pageNum);
    } catch (error) {
      console.error('Error generating page preview:', error);
      setError('Failed to generate page preview.');
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResultUrl(null);
  };

  const handleClearFile = () => {
    setFile(null);
    setError(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setPageCount(0);
    setCurrentPage(1);
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setCanvasEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setCanvasEmpty(true);
  };

  const getSignatureImage = (): string | null => {
    switch (signatureType) {
      case 'draw':
        return canvasEmpty ? null : canvasRef.current?.toDataURL('image/png') || null;
      case 'type':
        return typedSignature ? createTypedSignatureImage() : null;
      case 'image':
        return signatureImage;
      default:
        return null;
    }
  };

  const createTypedSignatureImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Set canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text style
    ctx.fillStyle = '#000000';
    ctx.font = `30px ${selectedFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSignatureImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSignPdf = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    const signatureImg = getSignatureImage();
    if (!signatureImg) {
      setError('Please create a signature first.');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Signature placement can only be done server-side as it requires specialized tools
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      // Call the API to sign the PDF
      const result = await pdfApi.signPdf(file, signatureImg, currentPage, signaturePosition);

      clearInterval(progressInterval);
      setProgress(100);
      setResultUrl(result.downloadUrl);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An error occurred while signing the PDF.');
      console.error('Error signing PDF:', err);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const fileName = `${file?.name.replace('.pdf', '') || 'signed'}_signed.pdf`;

      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = resultUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6">
      {/* File upload */}
      {!resultUrl && (
        <>
          <div>
            <h3 className="mb-2 text-lg font-medium">Upload PDF</h3>
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={file}
              onClear={handleClearFile}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex">
                <div className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* PDF preview and page navigation */}
          {file && previewUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Document Preview</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePagePreview(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePagePreview(Math.min(pageCount, currentPage + 1))}
                    disabled={currentPage >= pageCount}
                  >
                    Next
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto max-w-md overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                <img
                  src={previewUrl}
                  alt={`Page ${currentPage} of ${file.name}`}
                  className="w-full"
                />
                {/* Signature position indicator */}
                <div
                  className="absolute h-12 w-24 cursor-move border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-50 dark:bg-blue-900 dark:bg-opacity-50"
                  style={{ left: `${signaturePosition.x}%`, top: `${signaturePosition.y}%` }}
                  // Drag functionality would be implemented here in a real application
                ></div>
              </div>
            </div>
          )}

          {/* Signature creation */}
          {file && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Create Signature</h3>

              <div className="flex space-x-4">
                <Button
                  variant={signatureType === 'draw' ? 'default' : 'outline'}
                  onClick={() => setSignatureType('draw')}
                >
                  Draw
                </Button>
                <Button
                  variant={signatureType === 'type' ? 'default' : 'outline'}
                  onClick={() => setSignatureType('type')}
                >
                  Type
                </Button>
                <Button
                  variant={signatureType === 'image' ? 'default' : 'outline'}
                  onClick={() => setSignatureType('image')}
                >
                  Upload
                </Button>
              </div>

              {/* Draw signature */}
              {signatureType === 'draw' && (
                <div className="space-y-2">
                  <div className="rounded border border-gray-300 dark:border-gray-700">
                    <canvas
                      ref={canvasRef}
                      className="h-[150px] w-full cursor-crosshair bg-white"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    ></canvas>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearCanvas}>
                    <FiTrash2 className="mr-2" />
                    Clear
                  </Button>
                </div>
              )}

              {/* Type signature */}
              {signatureType === 'type' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="typed-signature" className="mb-2 block text-sm font-medium">
                      Type your signature
                    </label>
                    <input
                      type="text"
                      id="typed-signature"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      placeholder="Your signature"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Select font
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {SIGNATURE_FONTS.map((font) => (
                        <div
                          key={font.id}
                          onClick={() => setSelectedFont(font.id)}
                          className={`cursor-pointer rounded-md border p-2 text-center transition-colors ${
                            selectedFont === font.id
                              ? 'border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className={font.className}>{font.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {typedSignature && (
                    <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
                      <p className={`text-center text-2xl ${SIGNATURE_FONTS.find(f => f.id === selectedFont)?.className}`}>
                        {typedSignature}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload signature image */}
              {signatureType === 'image' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="signature-image" className="mb-2 block text-sm font-medium">
                      Upload signature image
                    </label>
                    <input
                      type="file"
                      id="signature-image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>

                  {signatureImage && (
                    <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
                      <img
                        src={signatureImage}
                        alt="Uploaded signature"
                        className="mx-auto max-h-[150px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sign button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSignPdf}
              disabled={!file || !getSignatureImage() || isProcessing}
              className={!file || !getSignatureImage() || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Processing...' : (
                <>
                  <FiEdit2 className="mr-2" />
                  Sign PDF
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-400">
            Processing PDF
          </h2>
          <p className="mt-2 text-blue-700 dark:text-blue-300">
            Please wait while we add your signature to the PDF. This may take a few moments.
          </p>
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-in-out dark:bg-blue-400"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-1 text-right text-sm text-blue-700 dark:text-blue-300">
              {progress}%
            </div>
          </div>
        </div>
      )}

      {/* Result section */}
      {resultUrl && !isProcessing && (
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
          <h2 className="text-xl font-semibold text-green-800 dark:text-green-400">
            PDF Signed Successfully
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Your PDF has been signed successfully.
          </p>
          <div className="mt-4 flex space-x-4">
            <Button
              onClick={handleDownload}
              className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FiDownload className="mr-2" />
              Download Signed PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResultUrl(null);
                setFile(null);
                setPreviewUrl(null);
                setPageCount(0);
                setCurrentPage(1);
              }}
            >
              Sign Another PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
