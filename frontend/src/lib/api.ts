/**
 * API client for interacting with the backend API
 */

// Base URL for the API
const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000/api/v1";

// PDF API endpoints
const PDF_API = {
    MERGE: `${API_BASE_URL}/pdf/merge`,
    SPLIT: `${API_BASE_URL}/pdf/split`,
    EXTRACT_PAGES: `${API_BASE_URL}/pdf/extract-pages`,
    ROTATE: `${API_BASE_URL}/pdf/rotate`,
    ADD_PAGE_NUMBERS: `${API_BASE_URL}/pdf/add-page-numbers`,
    ADD_WATERMARK: `${API_BASE_URL}/pdf/add-watermark`,
    CROP: `${API_BASE_URL}/pdf/crop`,
    PROTECT: `${API_BASE_URL}/pdf/protect`,
    UNLOCK: `${API_BASE_URL}/pdf/unlock`,
    COMPRESS: `${API_BASE_URL}/pdf/compress`,
    REPAIR: `${API_BASE_URL}/pdf/repair`,
    DOWNLOAD: `${API_BASE_URL}/pdf/download`,
    DOWNLOAD_ZIP: `${API_BASE_URL}/pdf/download-zip`,
};

// AI API endpoints
const AI_API = {
    MODELS: `${API_BASE_URL}/ai/models`,
    CHAT: `${API_BASE_URL}/ai/chat`,
    SUMMARIZE: `${API_BASE_URL}/ai/summarize`,
    TRANSLATE: `${API_BASE_URL}/ai/translate`,
    GENERATE_QUESTIONS: `${API_BASE_URL}/ai/generate-questions`,
};

// Types for AI API
export interface GeminiModel {
    name: string;
    description: string;
    input_token_limit: number | string;
    output_token_limit: number | string;
}

export interface GeminiModelsResponse {
    models: GeminiModel[];
}

export interface ChatRequest {
    question: string;
    pdf_id?: string;
    context?: string;
}

export interface ChatResponse {
    answer: string;
    source_pages?: number[];
}

export interface SummarizeRequest {
    pdf_id?: string;
    length?: "short" | "medium" | "long";
}

export interface SummarizeResponse {
    summary: string;
}

export interface TranslateRequest {
    pdf_id?: string;
    target_language: string;
}

export interface TranslateResponse {
    translated_text: string;
    source_language?: string;
}

export interface GenerateQuestionsRequest {
    pdf_id?: string;
    count?: number;
}

export interface GenerateQuestionsResponse {
    questions: string[];
}

/**
 * Generic API error class
 */
export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = "ApiError";
    }
}

/**
 * Generic function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = "An error occurred";
        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
        } catch (e) {
            // If we can't parse the error response, use the status text
            errorMessage = response.statusText || errorMessage;
        }
        throw new ApiError(errorMessage, response.status);
    }

    return response.json() as Promise<T>;
}

/**
 * PDF API client
 */
export const pdfApi = {
    /**
     * Merge multiple PDFs into a single PDF
     */
    mergePdfs: async (files: File[]): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });

        const response = await fetch(PDF_API.MERGE, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Split a PDF into multiple PDFs based on page ranges
     */
    splitPdf: async (
        file: File,
        ranges: string[]
    ): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        ranges.forEach((range) => {
            formData.append("ranges", range);
        });

        const response = await fetch(PDF_API.SPLIT, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Extract specific pages from a PDF
     */
    extractPages: async (
        file: File,
        pages: number[]
    ): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        pages.forEach((page) => {
            formData.append("pages", page.toString());
        });

        const response = await fetch(PDF_API.EXTRACT_PAGES, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Rotate pages in a PDF
     */
    rotatePdf: async (
        file: File,
        rotation: number,
        pages?: number[]
    ): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("rotation", rotation.toString());
        if (pages) {
            pages.forEach((page) => {
                formData.append("pages", page.toString());
            });
        }

        const response = await fetch(PDF_API.ROTATE, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Add page numbers to a PDF
     */
    addPageNumbers: async (
        file: File,
        position: string = "bottom-center",
        startNumber: number = 1,
        formatStr: string = "Page {page_num}"
    ): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("position", position);
        formData.append("start_number", startNumber.toString());
        formData.append("format_str", formatStr);

        const response = await fetch(PDF_API.ADD_PAGE_NUMBERS, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Add a watermark to a PDF
     */
    addWatermark: async (
        file: File,
        options: {
            watermarkText?: string;
            watermarkImage?: File;
            opacity?: number;
            position?: string;
            rotation?: number;
        }
    ): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);

        if (options.watermarkText) {
            formData.append("watermark_text", options.watermarkText);
        }

        if (options.watermarkImage) {
            formData.append("watermark_image", options.watermarkImage);
        }

        if (options.opacity !== undefined) {
            formData.append("opacity", options.opacity.toString());
        }

        if (options.position) {
            formData.append("position", options.position);
        }

        if (options.rotation !== undefined) {
            formData.append("rotation", options.rotation.toString());
        }

        const response = await fetch(PDF_API.ADD_WATERMARK, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Crop a PDF
     */
    cropPdf: async (
        file: File,
        left: number = 0,
        bottom: number = 0,
        right: number = 0,
        top: number = 0,
        pages?: number[]
    ): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("left", left.toString());
        formData.append("bottom", bottom.toString());
        formData.append("right", right.toString());
        formData.append("top", top.toString());

        if (pages) {
            pages.forEach((page) => {
                formData.append("pages", page.toString());
            });
        }

        const response = await fetch(PDF_API.CROP, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Protect a PDF with a password
     */
    protectPdf: async (
        file: File,
        userPassword?: string,
        ownerPassword?: string,
        allowPrint: boolean = true,
        allowCopy: boolean = true,
        allowModify: boolean = true
    ): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);

        if (userPassword) {
            formData.append("user_password", userPassword);
        }

        if (ownerPassword) {
            formData.append("owner_password", ownerPassword);
        }

        formData.append("allow_print", allowPrint.toString());
        formData.append("allow_copy", allowCopy.toString());
        formData.append("allow_modify", allowModify.toString());

        const response = await fetch(PDF_API.PROTECT, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Unlock a password-protected PDF
     */
    unlockPdf: async (
        file: File,
        password: string
    ): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("password", password);

        const response = await fetch(PDF_API.UNLOCK, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Compress a PDF to reduce file size
     */
    compressPdf: async (
        file: File,
        quality: "low" | "medium" | "high" = "medium"
    ): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("quality", quality);

        const response = await fetch(PDF_API.COMPRESS, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Repair a corrupted PDF
     */
    repairPdf: async (file: File): Promise<{ downloadUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(PDF_API.REPAIR, {
            method: "POST",
            body: formData,
        });

        return handleResponse<{ downloadUrl: string }>(response);
    },

    /**
     * Get the full download URL for a file
     */
    getDownloadUrl: (fileName: string): string => {
        return `${PDF_API.DOWNLOAD}/${fileName}`;
    },

    /**
     * Get the full download URL for a zip file
     */
    getDownloadZipUrl: (dirId: string): string => {
        return `${PDF_API.DOWNLOAD_ZIP}/${dirId}`;
    },
};

/**
 * AI API client
 */
export const aiApi = {
    /**
     * Get available Gemini models
     */
    getModels: async (apiKey: string): Promise<GeminiModelsResponse> => {
        const response = await fetch(AI_API.MODELS, {
            method: "GET",
            headers: {
                "X-Gemini-API-Key": apiKey,
            },
        });

        return handleResponse<GeminiModelsResponse>(response);
    },

    /**
     * Chat with a PDF using Gemini API
     */
    chatWithPdf: async (
        apiKey: string,
        question: string,
        file?: File,
        pdfId?: string,
        modelName: string = "models/gemini-1.5-pro"
    ): Promise<ChatResponse> => {
        const formData = new FormData();

        // Add file if provided
        if (file) {
            formData.append("file", file);
        }

        // Create request object
        const request: ChatRequest = {
            question,
        };

        if (pdfId) {
            request.pdf_id = pdfId;
        }

        // Add request as JSON string
        formData.append("request", JSON.stringify(request));

        const response = await fetch(
            `${AI_API.CHAT}?model_name=${encodeURIComponent(modelName)}`,
            {
                method: "POST",
                headers: {
                    "X-Gemini-API-Key": apiKey,
                },
                body: formData,
            }
        );

        return handleResponse<ChatResponse>(response);
    },

    /**
     * Summarize a PDF using Gemini API
     */
    summarizePdf: async (
        apiKey: string,
        file?: File,
        pdfId?: string,
        length: "short" | "medium" | "long" = "medium",
        modelName: string = "models/gemini-1.5-pro"
    ): Promise<SummarizeResponse> => {
        const formData = new FormData();

        // Add file if provided
        if (file) {
            formData.append("file", file);
        }

        // Create request object
        const request: SummarizeRequest = {
            length,
        };

        if (pdfId) {
            request.pdf_id = pdfId;
        }

        // Add request as JSON string
        formData.append("request", JSON.stringify(request));

        // Add length as form field
        formData.append("length", length);

        const response = await fetch(
            `${AI_API.SUMMARIZE}?model_name=${encodeURIComponent(modelName)}`,
            {
                method: "POST",
                headers: {
                    "X-Gemini-API-Key": apiKey,
                },
                body: formData,
            }
        );

        return handleResponse<SummarizeResponse>(response);
    },

    /**
     * Translate a PDF using Gemini API
     */
    translatePdf: async (
        apiKey: string,
        targetLanguage: string,
        file?: File,
        pdfId?: string,
        modelName: string = "models/gemini-1.5-pro"
    ): Promise<TranslateResponse> => {
        const formData = new FormData();

        // Add file if provided
        if (file) {
            formData.append("file", file);
        }

        // Create request object
        const request: TranslateRequest = {
            target_language: targetLanguage,
        };

        if (pdfId) {
            request.pdf_id = pdfId;
        }

        // Add request as JSON string
        formData.append("request", JSON.stringify(request));

        // Add target language as form field
        formData.append("target_language", targetLanguage);

        const response = await fetch(
            `${AI_API.TRANSLATE}?model_name=${encodeURIComponent(modelName)}`,
            {
                method: "POST",
                headers: {
                    "X-Gemini-API-Key": apiKey,
                },
                body: formData,
            }
        );

        return handleResponse<TranslateResponse>(response);
    },

    /**
     * Generate questions from a PDF using Gemini API
     */
    generateQuestions: async (
        apiKey: string,
        file?: File,
        pdfId?: string,
        count: number = 5,
        modelName: string = "models/gemini-1.5-pro"
    ): Promise<GenerateQuestionsResponse> => {
        const formData = new FormData();

        // Add file if provided
        if (file) {
            formData.append("file", file);
        }

        // Create request object
        const request: GenerateQuestionsRequest = {
            count,
        };

        if (pdfId) {
            request.pdf_id = pdfId;
        }

        // Add request as JSON string
        formData.append("request", JSON.stringify(request));

        // Add count as form field
        formData.append("count", count.toString());

        const response = await fetch(
            `${AI_API.GENERATE_QUESTIONS}?model_name=${encodeURIComponent(
                modelName
            )}`,
            {
                method: "POST",
                headers: {
                    "X-Gemini-API-Key": apiKey,
                },
                body: formData,
            }
        );

        return handleResponse<GenerateQuestionsResponse>(response);
    },
};
