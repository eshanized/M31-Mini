import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { FiChevronDown, FiInfo } from 'react-icons/fi';

export default function ModelSelector() {
  const { selectedModel, setSelectedModel, availableModels, fetchAvailableModels } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Model display names for better UX
  const modelDisplayNames: Record<string, string> = {
    'anthropic/claude-instant-1': 'Claude Instant',
    'meta-llama/llama-2-13b-chat': 'Llama 2 (13B)',
    'google/palm-2-chat-bison': 'PaLM 2',
    'google/gemini-pro': 'Gemini Pro',
    'mistralai/mistral-7b-instruct': 'Mistral (7B)',
    'mistralai/mixtral-8x7b-instruct': 'Mixtral 8x7B'
  };
  
  // Get models from store on component mount
  useEffect(() => {
    fetchAvailableModels();
  }, [fetchAvailableModels]);
  
  const getModelName = (model: string) => {
    return modelDisplayNames[model] || model.split('/').pop() || model;
  };
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const selectModel = (model: string) => {
    setSelectedModel(model);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-2 px-3 py-1 bg-dark-100 border border-gray-800 rounded-md hover:bg-dark-200 transition-colors"
        >
          <span className="text-sm text-gray-300">{getModelName(selectedModel)}</span>
          <FiChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        
        <div 
          className="ml-2 text-gray-400 cursor-pointer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <FiInfo className="h-4 w-4" />
        </div>
      </div>
      
      {showTooltip && (
        <div className="absolute top-8 right-0 w-64 p-3 bg-dark-200 border border-gray-700 rounded-md shadow-lg z-50 text-xs text-gray-300">
          These are free models available through OpenRouter. Model quality and response time may vary.
        </div>
      )}
      
      {isOpen && (
        <div className="absolute top-8 right-0 w-48 mt-1 bg-dark-200 border border-gray-700 rounded-md shadow-lg z-50">
          <ul className="py-1">
            {availableModels.length > 0 ? (
              availableModels.map((model) => (
                <li 
                  key={model} 
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-dark-100 ${
                    selectedModel === model ? 'bg-primary-900/30 text-primary-300' : 'text-gray-300'
                  }`}
                  onClick={() => selectModel(model)}
                >
                  {getModelName(model)}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-gray-400">
                Loading models...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 