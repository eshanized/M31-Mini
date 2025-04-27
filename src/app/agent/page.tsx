'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { FiCode, FiSearch, FiFolder, FiFile, FiEdit, FiRefreshCw, FiSave, FiRotateCw, FiCheck, FiX } from 'react-icons/fi';
import CodeEditor from '@/components/CodeEditor';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { FileTree } from '@/services/github-service';

interface FileEdit {
  path: string;
  originalContent: string;
  editedContent: string;
}

export default function AgentPage() {
  const { aiService, githubRepo } = useAppStore();
  const [fileTree, setFileTree] = useState<FileTree | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditingFile, setIsEditingFile] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<string[]>([]);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [fileEdits, setFileEdits] = useState<FileEdit[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch file tree when repository is loaded
  useEffect(() => {
    const fetchFileTree = async () => {
      if (!aiService || !githubRepo) return;
      
      try {
        const tree = await aiService.getFileTree();
        setFileTree(tree);
      } catch (error) {
        console.error('Error fetching file tree:', error);
      }
    };
    
    fetchFileTree();
  }, [githubRepo, aiService]);
  
  // Load file content when a file is selected
  const handleFileSelect = async (filePath: string) => {
    if (!aiService || !githubRepo) return;
    
    setSelectedFile(filePath);
    setIsLoadingFile(true);
    setIsEditingFile(false);
    
    try {
      // Extract relative path from full path
      const relativePath = filePath.replace(`/${githubRepo.owner}/${githubRepo.name}/`, '');
      const content = await aiService.getFileContent(relativePath);
      setFileContent(content);
      setEditedContent(content);
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
            selectedFile === node.path ? 'bg-accent-500/20 text-accent-300' : 'text-gray-300'
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
            <FiFolder className="mr-2 text-accent-400 flex-shrink-0" />
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
  
  // Determine language for syntax highlighting
  const getLanguage = (filename: string): string => {
    if (!filename) return 'text';
    
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'sh': 'bash',
      'bash': 'bash',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'vue': 'markup',
      'sql': 'sql',
      'graphql': 'graphql',
      'xml': 'xml',
    };
    
    return extensionMap[extension] || 'text';
  };
  
  // Handle editing file
  const handleEditFile = () => {
    setIsEditingFile(true);
    setEditedContent(fileContent);
  };
  
  // Save edited file
  const handleSaveEdit = () => {
    // Add to edits list
    if (selectedFile && editedContent !== fileContent) {
      const newEdit: FileEdit = {
        path: selectedFile,
        originalContent: fileContent,
        editedContent: editedContent
      };
      
      // Update or add the edit
      const existingEditIndex = fileEdits.findIndex(edit => edit.path === selectedFile);
      if (existingEditIndex >= 0) {
        const updatedEdits = [...fileEdits];
        updatedEdits[existingEditIndex] = newEdit;
        setFileEdits(updatedEdits);
      } else {
        setFileEdits([...fileEdits, newEdit]);
      }
      
      // Update current view
      setFileContent(editedContent);
    }
    
    setIsEditingFile(false);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingFile(false);
    setEditedContent(fileContent);
  };

  // Process agent query
  const handleAgentSubmit = async () => {
    if (!aiService || !agentPrompt.trim()) {
      setAgentResponse("Error: Please enter a prompt and ensure API key is set");
      return;
    }
    
    setIsAgentProcessing(true);
    setAgentResponse(null);
    
    try {
      // Track if we're analyzing a specific file or the whole repository
      const isFileAnalysis = selectedFile !== null;
      
      const analysisPrompt = `
Analyze the following ${isFileAnalysis ? 'file' : 'repository'} and respond to this request:

${agentPrompt}

${isFileAnalysis ? 'Focus on the specific file provided.' : 'Consider the entire repository structure and patterns.'}
`;
      
      let response;
      try {
        if (isFileAnalysis && selectedFile) {
          // For file-specific analysis
          response = await useAppStore.getState().analyzeCodeWithAgent(
            analysisPrompt,
            selectedFile,
            fileContent
          );
        } else if (githubRepo) {
          // For whole repository analysis
          response = await aiService.analyzeRepositoryCode(analysisPrompt);
        } else {
          throw new Error("No repository loaded. Please load a repository first.");
        }
      } catch (e) {
        console.error("Error during analysis:", e);
        throw new Error(`Analysis failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
      
      if (!response) {
        throw new Error("No response received from the model");
      }
      
      setAgentResponse(response);
    } catch (error) {
      console.error('Error in agent processing:', error);
      setAgentResponse(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    } finally {
      setIsAgentProcessing(false);
    }
  };
  
  // Apply agent response as edit
  const applyAgentResponseAsEdit = () => {
    if (!selectedFile || !agentResponse) return;
    
    setEditedContent(agentResponse);
    setIsEditingFile(true);
  };
  
  // Save all file edits
  const saveAllEdits = async () => {
    if (fileEdits.length === 0 || !githubRepo) return;
    
    setIsSaving(true);
    
    try {
      // In a real implementation, this would save to the repository
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear edits after "saving"
      setFileEdits([]);
    } catch (error) {
      console.error('Error saving edits:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {githubRepo ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left panel: File explorer and repo info */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Repository info */}
                <div className="bg-dark-200 rounded-xl border border-gray-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium text-white">{githubRepo.name}</h2>
                  </div>
                  <div className="text-sm text-gray-300 mb-4">
                    <p><span className="text-gray-500">Owner:</span> {githubRepo.owner}</p>
                    <p><span className="text-gray-500">Files:</span> {githubRepo.fileCount}</p>
                  </div>
                </div>
                
                {/* File search */}
                <div className="bg-dark-200 rounded-xl border border-gray-800 p-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search files..."
                      className="w-full bg-dark-100 border border-gray-700 rounded-md px-4 py-2 text-gray-100 pl-10 focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all"
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  </div>
                  
                  {searchQuery.trim() && filteredFiles.length > 0 && (
                    <div className="mt-3 max-h-60 overflow-y-auto">
                      <h3 className="text-xs font-medium text-gray-400 mb-2">Search Results</h3>
                      {filteredFiles.map((filePath) => (
                        <div
                          key={filePath}
                          className="py-1 px-2 text-sm text-gray-300 hover:bg-dark-100 rounded cursor-pointer truncate"
                          onClick={() => handleFileSelect(filePath)}
                        >
                          {filePath.split('/').pop()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* File explorer */}
                <div className="bg-dark-200 rounded-xl border border-gray-800 p-4 min-h-[400px]">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">File Explorer</h3>
                  <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-dark-300">
                    {fileTree ? (
                      renderFileTree(fileTree)
                    ) : (
                      <div className="flex items-center justify-center text-gray-500 h-20">
                        <FiRefreshCw className="animate-spin mr-2" />
                        Loading files...
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Modified files */}
                {fileEdits.length > 0 && (
                  <div className="bg-dark-200 rounded-xl border border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-300">Modified Files</h3>
                      <button 
                        onClick={saveAllEdits}
                        disabled={isSaving}
                        className="px-3 py-1 text-xs bg-accent-500 text-white rounded-md hover:bg-accent-600 disabled:opacity-50 flex items-center"
                      >
                        {isSaving ? <FiRefreshCw className="animate-spin mr-1 h-3 w-3" /> : <FiSave className="mr-1 h-3 w-3" />}
                        Save All
                      </button>
                    </div>
                    <div className="space-y-1">
                      {fileEdits.map(edit => (
                        <div 
                          key={edit.path} 
                          className="text-sm text-accent-300 cursor-pointer hover:underline truncate"
                          onClick={() => handleFileSelect(edit.path)}
                        >
                          {edit.path.split('/').pop()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
            
            {/* Right panel: File editor and agent interface */}
            <div className="lg:col-span-9">
              <div className="space-y-4">
                {/* File editor */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-dark-200 rounded-xl border border-gray-800 overflow-hidden"
                >
                  {selectedFile ? (
                    <>
                      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-dark-300">
                        <div className="flex items-center overflow-hidden">
                          <FiFile className="mr-2 flex-shrink-0 text-accent-400" />
                          <span className="truncate text-sm text-gray-300">
                            {selectedFile.split('/').slice(2).join('/')}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {isEditingFile ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                                title="Save changes"
                              >
                                <FiCheck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                                title="Cancel editing"
                              >
                                <FiX className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleEditFile}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                              title="Edit file"
                            >
                              <FiEdit className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {isLoadingFile ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                          <FiRefreshCw className="animate-spin mr-2" />
                          Loading file...
                        </div>
                      ) : (
                        isEditingFile ? (
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full h-[500px] bg-dark-200 text-gray-300 font-mono text-sm p-4 border-0 focus:outline-none resize-none"
                            spellCheck={false}
                          />
                        ) : (
                          <CodeEditor 
                            code={fileContent} 
                            language={getLanguage(selectedFile)}
                            readOnly={true}
                          />
                        )
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500 p-4 text-center">
                      <div>
                        <FiCode className="h-12 w-12 mb-4 mx-auto text-accent-500/30" />
                        <p>Select a file from the explorer to view or edit</p>
                      </div>
                    </div>
                  )}
                </motion.div>
                
                {/* Agent interface */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-dark-200 rounded-xl border border-gray-800 p-4"
                >
                  <h3 className="text-lg font-medium text-white mb-3">AI Agent Assistant</h3>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <textarea
                        value={agentPrompt}
                        onChange={(e) => setAgentPrompt(e.target.value)}
                        placeholder="What would you like me to help you with? (e.g., 'Analyze this code for bugs', 'Generate a new utility function', 'Refactor this file')"
                        className="w-full min-h-[100px] bg-dark-100 border border-gray-700 rounded-md px-4 py-3 text-gray-100 focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all resize-y"
                        disabled={isAgentProcessing}
                      />
                      <button
                        onClick={handleAgentSubmit}
                        disabled={!agentPrompt.trim() || isAgentProcessing}
                        className="absolute right-3 bottom-3 px-4 py-1.5 bg-accent-500 text-white rounded-md hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isAgentProcessing ? (
                          <>
                            <FiRefreshCw className="animate-spin mr-2 h-4 w-4" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FiRotateCw className="mr-2 h-4 w-4" />
                            Run
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {agentResponse && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-300">Agent Response</h4>
                        {selectedFile && (
                          <button
                            onClick={applyAgentResponseAsEdit}
                            className="px-3 py-1 text-xs bg-accent-500 text-white rounded-md hover:bg-accent-600"
                          >
                            Apply as Edit
                          </button>
                        )}
                      </div>
                      <div className="bg-dark-300 rounded-md p-4 text-gray-300 font-mono text-sm max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {agentResponse}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <FiCode className="h-16 w-16 mb-6 text-accent-500/30" />
            <h2 className="text-2xl font-semibold text-white mb-2">No Repository Loaded</h2>
            <p className="text-gray-400 max-w-md mb-6">
              Please load a GitHub repository from the Repository page to enable the AI Agent for code exploration and generation.
            </p>
            <a 
              href="/repository" 
              className="px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors"
            >
              Go to Repository Page
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
} 