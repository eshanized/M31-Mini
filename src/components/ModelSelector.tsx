import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiCpu } from 'react-icons/fi';
import { useAppStore } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModelSelector() {
  const { selectedModel, setSelectedModel, availableModels } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Format model name for display
  const formatModelName = (model: string): string => {
    // Remove provider prefix
    const parts = model.split('/');
    let name = parts.length > 1 ? parts[1] : model;
    
    // Clean up version numbers
    name = name.replace(/-\d{8}$/, '');
    
    // Capitalize and add spaces
    return name
      .replace(/-/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get model provider name
  const getModelProvider = (model: string): string => {
    const provider = model.split('/')[0];
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative" ref={menuRef}>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        AI Model
      </label>
      
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-full flex items-center justify-between bg-dark-100 border border-gray-700 rounded-md px-4 py-2 text-gray-100 hover:border-primary-500 transition-colors"
      >
        <div className="flex items-center">
          <FiCpu className="h-4 w-4 mr-2 text-primary-400" />
          <span>{formatModelName(selectedModel)}</span>
          <span className="ml-2 text-xs opacity-60">({getModelProvider(selectedModel)})</span>
        </div>
        {isMenuOpen ? <FiChevronUp className="h-4 w-4 ml-2" /> : <FiChevronDown className="h-4 w-4 ml-2" />}
      </button>
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 mt-1 w-full bg-dark-100 border border-gray-800 rounded-md shadow-lg max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-dark-300"
          >
            <div className="p-1">
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <button
                    key={model}
                    onClick={() => {
                      setSelectedModel(model);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
                      model === selectedModel
                        ? 'bg-primary-900/30 text-primary-300'
                        : 'text-gray-300 hover:bg-dark-200'
                    }`}
                  >
                    <span>{formatModelName(model)}</span>
                    <span className="text-xs opacity-60">{getModelProvider(model)}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">Loading models...</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 