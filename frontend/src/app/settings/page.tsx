'use client';

import React, { useEffect, useState } from 'react';
import { FiMoon, FiSun, FiKey, FiInfo } from 'react-icons/fi';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useSettingsStore } from '@/lib/store';
import { aiApi, GeminiModel } from '@/lib/api';

export default function SettingsPage() {
  const { 
    geminiApiKey, 
    setGeminiApiKey, 
    darkMode, 
    toggleDarkMode,
    selectedModel,
    setSelectedModel,
    availableModels,
    setAvailableModels
  } = useSettingsStore();
  
  const [apiKey, setApiKey] = useState(geminiApiKey);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);
  
  // Fetch available models when API key changes
  useEffect(() => {
    if (geminiApiKey) {
      fetchModels();
    }
  }, [geminiApiKey]);
  
  const fetchModels = async () => {
    if (!geminiApiKey) return;
    
    setIsTestingKey(true);
    setError(null);
    
    try {
      const response = await aiApi.getModels(geminiApiKey);
      setAvailableModels(response.models);
      setSuccess('API key is valid. Models loaded successfully.');
    } catch (err) {
      setError('Failed to fetch models. Please check your API key.');
      console.error('Error fetching models:', err);
    } finally {
      setIsTestingKey(false);
    }
  };
  
  const handleSaveApiKey = () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      setGeminiApiKey(apiKey);
      setSuccess('API key saved successfully.');
    } catch (err) {
      setError('Failed to save API key.');
      console.error('Error saving API key:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* Appearance Settings */}
        <Card title="Appearance" description="Customize the appearance of the application">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {darkMode ? <FiMoon size={20} /> : <FiSun size={20} />}
              <span>Dark Mode</span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
            </label>
          </div>
        </Card>
        
        {/* Gemini API Settings */}
        <Card title="Gemini API" description="Configure your Gemini API settings for AI features">
          <div className="space-y-4">
            <div>
              <label htmlFor="api-key" className="mb-2 block text-sm font-medium">
                API Key
              </label>
              <div className="flex">
                <input
                  type="password"
                  id="api-key"
                  className="block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button
                  className="ml-2"
                  onClick={handleSaveApiKey}
                  isLoading={isLoading}
                  loadingText="Saving..."
                  disabled={!apiKey || apiKey === geminiApiKey}
                >
                  Save
                </Button>
              </div>
              <p className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                <FiInfo className="mr-1" size={12} />
                Get your API key from the <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline dark:text-blue-400">Google AI Studio</a>
              </p>
              
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              {success && <p className="mt-2 text-sm text-green-500">{success}</p>}
            </div>
            
            <div>
              <label htmlFor="model" className="mb-2 block text-sm font-medium">
                Default Model
              </label>
              <select
                id="model"
                className="block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                value={selectedModel}
                onChange={handleModelChange}
                disabled={availableModels.length === 0}
              >
                {availableModels.length > 0 ? (
                  availableModels.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name.split('/').pop()} - {model.description}
                    </option>
                  ))
                ) : (
                  <option value="models/gemini-1.5-pro">Gemini 1.5 Pro (Default)</option>
                )}
              </select>
              
              {geminiApiKey && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchModels}
                    isLoading={isTestingKey}
                    loadingText="Testing..."
                  >
                    Test API Key & Load Models
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
