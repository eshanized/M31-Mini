import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { FiKey, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

export default function APIKeyInput() {
  const { apiKey, setApiKey } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Load API key from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('openrouter_api_key');
      if (savedKey) {
        setApiKey(savedKey);
        // Show masked key in the input
        setInputValue('•'.repeat(Math.min(savedKey.length, 12)));
      }
    }
  }, [setApiKey]);
  
  // Show success indicator when key is set
  useEffect(() => {
    if (apiKey) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [apiKey]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setApiKey(inputValue);
      setIsModalOpen(false);
    }
  };
  
  return (
    <>
      <button 
        className="flex items-center px-3 py-1 bg-dark-100 border border-gray-800 rounded-md hover:bg-dark-200 transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        <FiKey className="h-4 w-4 mr-2 text-gray-400" />
        <span className="text-sm text-gray-300">API Key</span>
        {apiKey && <FiCheck className="h-4 w-4 ml-2 text-green-400" />}
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-white mb-4">OpenRouter API Key</h3>
            
            <p className="text-sm text-gray-400 mb-4">
              Enter your OpenRouter API key to access AI models. 
              If you don't have one, you can get a free API key at{' '}
              <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 underline"
              >
                openrouter.ai
              </a>
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                  className="w-full bg-dark-300 border border-gray-700 rounded-md px-4 py-2 text-gray-200 
                  placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="flex justify-end mt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-dark-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 rounded-md text-white hover:bg-primary-700"
                >
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 