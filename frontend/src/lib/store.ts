import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GeminiModel } from './api';

interface SettingsState {
  // Gemini API settings
  geminiApiKey: string;
  selectedModel: string;
  availableModels: GeminiModel[];
  
  // UI settings
  darkMode: boolean;
  
  // Actions
  setGeminiApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setAvailableModels: (models: GeminiModel[]) => void;
  toggleDarkMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      geminiApiKey: '',
      selectedModel: 'models/gemini-1.5-pro',
      availableModels: [],
      darkMode: false,
      
      // Actions
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setAvailableModels: (models) => set({ availableModels: models }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'all-pdf-tools-settings',
      // Only persist these fields
      partialize: (state) => ({
        geminiApiKey: state.geminiApiKey,
        selectedModel: state.selectedModel,
        darkMode: state.darkMode,
      }),
    }
  )
);

// PDF processing state
interface PdfState {
  // Current PDF file being processed
  currentFile: File | null;
  
  // Processing state
  isProcessing: boolean;
  progress: number;
  error: string | null;
  
  // Result
  resultUrl: string | null;
  
  // Actions
  setCurrentFile: (file: File | null) => void;
  startProcessing: () => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setResultUrl: (url: string | null) => void;
  resetState: () => void;
}

export const usePdfStore = create<PdfState>((set) => ({
  // Initial state
  currentFile: null,
  isProcessing: false,
  progress: 0,
  error: null,
  resultUrl: null,
  
  // Actions
  setCurrentFile: (file) => set({ currentFile: file }),
  startProcessing: () => set({ isProcessing: true, progress: 0, error: null, resultUrl: null }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, isProcessing: false }),
  setResultUrl: (resultUrl) => set({ resultUrl, isProcessing: false, progress: 100 }),
  resetState: () => set({ 
    isProcessing: false, 
    progress: 0, 
    error: null, 
    resultUrl: null 
  }),
}));
