import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiLoader, FiChevronDown, FiChevronUp, FiHelpCircle, FiBookOpen, FiGithub } from 'react-icons/fi';
import { useAppStore } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';

const promptTemplates = [
  {
    label: "Data Analysis",
    text: "Create a Python script to analyze CSV data for sales trends, including data cleaning, statistical analysis, and visualization.",
    category: "data_analysis"
  },
  {
    label: "Web Scraper",
    text: "Build a web scraper to extract product information (name, price, ratings) from an e-commerce website and save to CSV.",
    category: "web_development"
  },
  {
    label: "ML Classification",
    text: "Create a machine learning model for classifying customer reviews as positive or negative using scikit-learn.",
    category: "machine_learning"
  },
  {
    label: "API Client",
    text: "Develop a Python client to interact with a RESTful API, including authentication, error handling, and data parsing.",
    category: "web_development"
  },
  {
    label: "File Automation",
    text: "Write a script to organize files in a directory based on their type (images, documents, videos) into separate folders.",
    category: "automation"
  },
  {
    label: "Algorithm",
    text: "Implement an efficient algorithm to find the shortest path between nodes in a weighted graph.",
    category: "algorithms"
  }
];

export default function PromptInput() {
  const {
    currentPrompt,
    setCurrentPrompt,
    selectedModel,
    setSelectedModel,
    availableModels,
    isGenerating,
    aiService,
    setGeneratedCode,
    setIsGenerating,
    addMessage,
    githubRepo,
    analyzeRepositoryCode
  } = useAppStore();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [promptCategory, setPromptCategory] = useState('default');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const [analyzeMode, setAnalyzeMode] = useState<'normal' | 'github'>('normal');
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentPrompt]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentPrompt(e.target.value);
    
    // Try to determine the category of the prompt
    if (aiService) {
      const text = e.target.value.toLowerCase();
      setPromptCategory(determineCategory(text));
      
      // Recommend a model based on the prompt category
      if (text.length > 10) {
        const recommendedModel = aiService.getModelRecommendation(promptCategory);
        if (recommendedModel !== selectedModel) {
          setSelectedModel(recommendedModel);
        }
      }
    }
  };
  
  const determineCategory = (text: string): string => {
    if (text.includes('data') || text.includes('csv') || text.includes('pandas') || text.includes('analysis')) {
      return 'data_analysis';
    } else if (text.includes('web') || text.includes('api') || text.includes('http') || text.includes('request')) {
      return 'web_development';
    } else if (text.includes('machine learning') || text.includes('ml') || text.includes('model') || text.includes('train')) {
      return 'machine_learning';
    } else if (text.includes('automate') || text.includes('script') || text.includes('batch')) {
      return 'automation';
    } else if (text.includes('algorithm') || text.includes('sort') || text.includes('search') || text.includes('tree')) {
      return 'algorithms';
    } else if (text.length < 50) {
      return 'simple_scripts';
    }
    return 'default';
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleSubmit = async () => {
    if (!currentPrompt.trim() || !aiService || isGenerating) return;
    
    setIsGenerating(true);
    setStreamingText('');
    
    addMessage({ role: 'user', content: currentPrompt });
    
    try {
      if (analyzeMode === 'normal' || !githubRepo) {
        // Use normal code generation flow
        await aiService.streamPythonCode(
          currentPrompt,
          selectedModel,
          (chunk) => {
            setStreamingText(prev => prev + chunk);
          },
          (fullResponse) => {
            setGeneratedCode(fullResponse);
            addMessage({ role: 'assistant', content: fullResponse });
            setCurrentPrompt('');
            setIsGenerating(false);
          }
        );
      } else {
        // Use GitHub repository analysis flow
        await analyzeRepositoryCode(currentPrompt);
        setCurrentPrompt('');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      setIsGenerating(false);
    }
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleTemplateMenu = () => {
    setIsTemplateMenuOpen(!isTemplateMenuOpen);
  };
  
  const selectModel = (model: string) => {
    setSelectedModel(model);
    setIsMenuOpen(false);
  };
  
  const useTemplate = (template: typeof promptTemplates[0]) => {
    setCurrentPrompt(template.text);
    setPromptCategory(template.category);
    setIsTemplateMenuOpen(false);
    
    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    
    // Set the recommended model
    if (aiService) {
      const recommendedModel = aiService.getModelRecommendation(template.category);
      setSelectedModel(recommendedModel);
    }
  };
  
  const toggleHints = () => {
    setShowHints(!showHints);
  };
  
  // Update analyzeMode when repository state changes
  useEffect(() => {
    setAnalyzeMode(githubRepo ? 'github' : 'normal');
  }, [githubRepo]);
  
  return (
    <div className="relative">
      <div className="flex flex-col space-y-2">
        {/* Mode Toggle Button */}
        {githubRepo && (
          <div className="flex justify-end mb-1">
            <button
              onClick={() => setAnalyzeMode(analyzeMode === 'normal' ? 'github' : 'normal')}
              className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-full transition-colors ${
                analyzeMode === 'github' 
                  ? 'bg-primary-900 text-primary-300'
                  : 'bg-dark-200 text-gray-400 hover:text-white'
              }`}
            >
              <FiGithub className="h-4 w-4 mr-1" />
              <span>Repository Analysis {analyzeMode === 'github' ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        )}
        
        {/* Prompt Templates Button */}
        <div className="flex justify-end mb-1">
          <div className="relative" ref={templateMenuRef}>
            <button
              onClick={toggleTemplateMenu}
              className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <FiBookOpen className="h-4 w-4" />
              <span>Prompt Templates</span>
              {isTemplateMenuOpen ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
            </button>
            
            <AnimatePresence>
              {isTemplateMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 right-0 w-80 bg-dark-100 border border-gray-800 rounded-md shadow-lg z-10 overflow-hidden"
                >
                  <div className="max-h-64 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-dark-300">
                    <div className="p-2 border-b border-gray-800 bg-dark-200">
                      <h3 className="text-sm font-medium text-gray-300">Select a template to get started</h3>
                    </div>
                    {promptTemplates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => useTemplate(template)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0"
                      >
                        <div className="text-sm font-medium text-primary-400 mb-1">{template.label}</div>
                        <div className="text-xs text-gray-400 line-clamp-2">{template.text}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button
            onClick={toggleHints}
            className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors ml-4"
            title="Prompt writing tips"
          >
            <FiHelpCircle className="h-4 w-4" />
            <span>Tips</span>
          </button>
        </div>
        
        {/* Prompt Tips */}
        <AnimatePresence>
          {showHints && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-dark-100 border border-gray-800 rounded-md p-3 text-sm text-gray-300 overflow-hidden"
            >
              <h4 className="font-medium text-primary-400 mb-1">
                {analyzeMode === 'github' 
                  ? 'Tips for repository analysis:' 
                  : 'Tips for better Python code generation:'}
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                {analyzeMode === 'github' ? (
                  <>
                    <li>Ask for specific file analysis</li>
                    <li>Request dependency analysis or suggestions</li>
                    <li>Ask for architectural improvements</li>
                    <li>Identify potential security issues</li>
                    <li>Request performance optimizations</li>
                  </>
                ) : (
                  <>
                    <li>Be specific about input/output formats and data types</li>
                    <li>Mention the Python version if necessary</li>
                    <li>Specify libraries you want to use (e.g., pandas, numpy)</li>
                    <li>For complex tasks, break down into subtasks</li>
                    <li>Mention performance requirements if important</li>
                  </>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={currentPrompt}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={analyzeMode === 'github' 
              ? `Analyze this repository and ${githubRepo?.name || 'its'} code (e.g., "find security vulnerabilities" or "suggest performance improvements")...`
              : "Describe the Python code you want to generate..."
            }
            className="input min-h-[120px] max-h-[300px] pr-12 transition-all duration-300 border-gray-700 focus:border-primary-500"
            rows={4}
            disabled={isGenerating}
          />
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !currentPrompt.trim() || !aiService}
            className="absolute right-2 bottom-2 p-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? <FiLoader className="h-5 w-5 animate-spin" /> : <FiSend className="h-5 w-5" />}
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleMenu}
              className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors group"
            >
              <span>Model: <span className="text-primary-400 font-medium">{selectedModel.split('/').pop()}</span></span>
              {isMenuOpen ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
            </button>
            
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-0 w-60 bg-dark-100 border border-gray-800 rounded-md shadow-lg z-10 overflow-hidden"
                >
                  <div className="p-2 border-b border-gray-800 bg-dark-200">
                    <h3 className="text-xs font-medium text-gray-300">Select AI model</h3>
                  </div>
                  <div className="max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-dark-300">
                    {availableModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => selectModel(model)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors flex justify-between items-center ${
                          selectedModel === model ? 'bg-gray-800 text-primary-400' : 'text-gray-300'
                        }`}
                      >
                        <span>{model.split('/').pop()}</span>
                        {promptCategory !== 'default' && model === aiService?.getModelRecommendation(promptCategory) && (
                          <span className="text-xs bg-primary-900/50 text-primary-300 px-2 py-0.5 rounded-full">Recommended</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {!aiService && (
            <span className="text-sm text-red-500">Please set your OpenRouter API key first</span>
          )}
          
          {analyzeMode === 'github' && githubRepo && (
            <div className="text-xs text-primary-300 bg-primary-900/30 px-2 py-1 rounded-full flex items-center">
              <FiGithub className="mr-1" />
              Analyzing: {githubRepo.owner}/{githubRepo.name}
            </div>
          )}
        </div>
        
        {isGenerating && streamingText && (
          <div className="mt-4 p-4 bg-dark-100 border border-gray-800 rounded-md">
            <div className="flex items-center mb-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <p className="text-sm text-gray-400">Generating code...</p>
            </div>
            <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary-600 animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 