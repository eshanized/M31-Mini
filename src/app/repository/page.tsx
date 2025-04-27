'use client';

import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import { FiGitBranch, FiFolder, FiFile, FiSearch, FiDownload, FiRefreshCw, FiCode, FiExternalLink } from 'react-icons/fi';
import { useAppStore } from '../../lib/store';
import GitHubRepoInput from '../../components/GitHubRepoInput';
import Link from 'next/link';

export default function RepositoryPage() {
  const { 
    githubRepo, 
    isLoadingRepo,
    repoLoadingProgress,
    apiKey,
    setApiKey,
    initializeAIService,
    aiService
  } = useAppStore();
  
  const [hasHydrated, setHasHydrated] = useState(false);
  const [fileTree, setFileTree] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<string[]>([]);
  
  // Initialize service
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openrouter_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    setHasHydrated(true);
  }, [setApiKey]);
  
  useEffect(() => {
    if (apiKey && hasHydrated) {
      initializeAIService();
    }
  }, [apiKey, hasHydrated, initializeAIService]);
  
  // Load file tree once repo is loaded
  useEffect(() => {
    const fetchFileTree = async () => {
      if (githubRepo && aiService) {
        try {
          const tree = await aiService.getFileTree();
          setFileTree(tree);
        } catch (error) {
          console.error('Error fetching file tree:', error);
        }
      }
    };
    
    fetchFileTree();
  }, [githubRepo, aiService]);
  
  // Load file content when a file is selected
  const handleFileSelect = async (filePath: string) => {
    if (!aiService || !githubRepo) return;
    
    setSelectedFile(filePath);
    setIsLoadingFile(true);
    
    try {
      // Extract relative path from full path
      const relativePath = filePath.replace(`/${githubRepo.owner}/${githubRepo.name}/`, '');
      const content = await aiService.getFileContent(relativePath);
      setFileContent(content);
    } catch (error) {
      console.error('Error loading file:', error);
      setFileContent(`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingFile(false);
    }
  };
  
  // Filter files based on search query
  useEffect(() => {
    if (!searchQuery.trim() || !fileTree) {
      setFilteredFiles([]);
      return;
    }
    
    const searchResults: string[] = [];
    
    const searchInTree = (node: any, currentPath: string = '') => {
      if (node.type === 'file') {
        const fullPath = `${currentPath}/${node.name}`;
        if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          searchResults.push(fullPath);
        }
      } else if (node.children) {
        const nextPath = currentPath ? `${currentPath}/${node.name}` : node.name;
        for (const child of node.children) {
          searchInTree(child, nextPath);
        }
      }
    };
    
    searchInTree(fileTree);
    setFilteredFiles(searchResults);
  }, [searchQuery, fileTree]);
  
  // Render file tree recursively
  const renderFileTree = (node: any, depth: number = 0) => {
    if (!node) return null;
    
    const paddingLeft = `${depth * 16}px`;
    
    if (node.type === 'file') {
      return (
        <div 
          key={node.path}
          className={`py-1 px-2 flex items-center cursor-pointer hover:bg-dark-100 rounded ${
            selectedFile === node.path ? 'bg-primary-900/20 text-primary-300' : 'text-gray-300'
          }`}
          style={{ paddingLeft }}
          onClick={() => handleFileSelect(node.path)}
        >
          <FiFile className="mr-2 flex-shrink-0" />
          <span className="truncate text-sm">{node.name}</span>
        </div>
      );
    }
    
    if (node.type === 'dir' && node.children) {
      const [isOpen, setIsOpen] = useState(depth === 0);
      
      return (
        <div key={node.path}>
          <div 
            className="py-1 px-2 flex items-center cursor-pointer hover:bg-dark-100 rounded text-gray-200"
            style={{ paddingLeft }}
            onClick={() => setIsOpen(!isOpen)}
          >
            <FiFolder className="mr-2 text-primary-400 flex-shrink-0" />
            <span className="font-medium text-sm">{node.name}</span>
          </div>
          
          {isOpen && (
            <div>
              {node.children.map((child: any) => renderFileTree(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  // Get stats for file types
  const getFileTypeStats = () => {
    if (!githubRepo?.fileTypes) return [];
    
    return Object.entries(githubRepo.fileTypes)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-white flex items-center">
            <FiGitBranch className="mr-3 text-primary-500" /> GitHub Repository Explorer
          </h1>
          <p className="text-gray-400 mt-2">
            Clone, explore, and analyze GitHub repositories to generate context-aware code
          </p>
        </motion.div>
        
        {/* Repository Input */}
        <div className="card p-6 mb-8">
          <GitHubRepoInput />
        </div>
        
        {/* Repository Content */}
        {githubRepo ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left panel: File Explorer */}
            <div className="lg:col-span-4 space-y-4">
              {/* Repo info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="card p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <FiGitBranch className="mr-2 text-primary-400" /> {githubRepo.name}
                  </h2>
                  <a 
                    href={githubRepo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 p-1"
                  >
                    <FiExternalLink />
                  </a>
                </div>
                <div className="text-sm text-gray-300 mb-4">
                  <p><span className="text-gray-500">Owner:</span> {githubRepo.owner}</p>
                  <p><span className="text-gray-500">Files:</span> {githubRepo.fileCount}</p>
                  <p><span className="text-gray-500">Stars:</span> {githubRepo.stars}</p>
                  <p><span className="text-gray-500">Forks:</span> {githubRepo.forks}</p>
                  {githubRepo.description && (
                    <p className="mt-2 text-gray-400 border-t border-gray-800 pt-2">
                      {githubRepo.description}
                    </p>
                  )}
                </div>
                
                {/* File type distribution */}
                <div className="border-t border-gray-800 pt-3">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">File Types</h3>
                  <div className="space-y-2">
                    {getFileTypeStats().map(([ext, count]) => (
                      <div key={ext} className="flex items-center">
                        <div className="text-xs text-gray-400 w-20">{ext}</div>
                        <div className="flex-1 bg-dark-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary-500 h-full rounded-full"
                            style={{ 
                              width: `${Math.min(100, (count as number / githubRepo.fileCount) * 100)}%` 
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 ml-2 w-8 text-right">
                          {count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4">
                  <Link 
                    href="/generate" 
                    className="btn btn-primary w-full flex justify-center items-center text-sm"
                  >
                    <FiCode className="mr-2" /> Generate Code for this Repo
                  </Link>
                </div>
              </motion.div>
              
              {/* File search */}
              <div className="card p-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="input pl-10"
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
                
                {searchQuery && (
                  <div className="mt-3 max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-dark-300">
                    {filteredFiles.length > 0 ? (
                      <div className="space-y-1">
                        {filteredFiles.map(path => {
                          const fileName = path.split('/').pop() || '';
                          return (
                            <div 
                              key={path}
                              className="py-1 px-2 flex items-center cursor-pointer hover:bg-dark-100 rounded text-gray-300 text-sm"
                              onClick={() => handleFileSelect(path)}
                            >
                              <FiFile className="mr-2 flex-shrink-0 text-gray-400" />
                              <span className="truncate">{fileName}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-2 text-sm">
                        No files found
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* File tree */}
              <div className="card p-4 flex-grow">
                <h3 className="text-sm font-medium text-white mb-3">Files</h3>
                <div className="max-h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-dark-300">
                  {fileTree ? (
                    renderFileTree(fileTree)
                  ) : (
                    <div className="flex justify-center items-center h-32 text-gray-500">
                      <FiRefreshCw className="animate-spin mr-2" />
                      Loading files...
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right panel: File content */}
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="card overflow-hidden h-full min-h-[600px] flex flex-col"
              >
                {selectedFile ? (
                  <>
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-dark-200">
                      <div className="flex items-center overflow-hidden">
                        <FiFile className="mr-2 flex-shrink-0 text-primary-400" />
                        <span className="truncate text-sm text-gray-300">
                          {selectedFile.split('/').slice(2).join('/')}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (fileContent) {
                            navigator.clipboard.writeText(fileContent);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Copy content"
                      >
                        <FiDownload className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex-grow overflow-auto p-4 bg-dark-300 relative">
                      {isLoadingFile ? (
                        <div className="flex justify-center items-center h-full text-gray-500">
                          <FiRefreshCw className="animate-spin mr-2" />
                          Loading file content...
                        </div>
                      ) : (
                        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                          {fileContent}
                        </pre>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col justify-center items-center h-full text-center p-8">
                    <FiFile className="h-16 w-16 text-gray-700 mb-4" />
                    <h3 className="text-xl font-medium text-gray-300 mb-2">No File Selected</h3>
                    <p className="text-gray-500 max-w-md">
                      Select a file from the file explorer to view its contents. You can use the search box to find specific files in the repository.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="card p-8 flex flex-col items-center justify-center text-center">
            <FiGitBranch className="h-16 w-16 text-gray-700 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Repository Loaded</h2>
            <p className="text-gray-400 max-w-2xl mb-6">
              Enter a GitHub repository URL above to clone and explore its contents. 
              You can browse files, view code, and generate Python solutions based on the repository context.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button className="btn btn-secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Clone a Repository
              </button>
              <Link href="/generate" className="btn btn-primary">
                Go to Code Generator
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 