'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { FiCode, FiSearch, FiFolder, FiFile, FiEdit, FiRefreshCw, FiSave, FiRotateCw, FiCheck, FiX, FiGithub, FiDownload, FiArrowRight, FiBookOpen } from 'react-icons/fi';
import CodeEditor from '@/components/CodeEditor';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { FileTree } from '@/services/github-service';

interface FileEdit {
  path: string;
  originalContent: string;
  editedContent: string;
}

export default function RepositoryPage() {
  const { aiService, githubRepo, fetchGithubRepo, isLoadingRepo, repoLoadingProgress } = useAppStore();
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
  
  // State for tracking which directories are open
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({});
  
  // Repository URL input state
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recentRepos, setRecentRepos] = useState<string[]>([]);

  // Toggle directory open/closed state
  const toggleDirOpen = (path: string) => {
    setOpenDirs(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Load recent repositories from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRepos = localStorage.getItem('recentRepositories');
      if (savedRepos) {
        setRecentRepos(JSON.parse(savedRepos));
      }
    }
  }, []);

  // Add repository to recent list
  const addToRecentRepos = (url: string) => {
    const updatedRepos = [url, ...recentRepos.filter(repo => repo !== url)].slice(0, 5);
    setRecentRepos(updatedRepos);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentRepositories', JSON.stringify(updatedRepos));
    }
  };

  // Handle repository URL submission
  const handleRepoSubmit = async (url: string) => {
    setError(null);
    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }
    
    // Simple validation for GitHub URL format
    if (!url.includes('github.com')) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }
    
    try {
      await fetchGithubRepo(url);
      addToRecentRepos(url);
      setRepoUrl('');
    } catch (error) {
      setError(`Failed to load repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
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
      // Initialize directory state if it doesn't exist
      const isOpen = openDirs[node.path] === undefined 
        ? depth === 0  // Root directories are open by default
        : openDirs[node.path];
      
      return (
        <div key={node.path}>
          <div 
            className="py-1 px-2 flex items-center cursor-pointer hover:bg-dark-100 rounded text-gray-200"
            style={{ paddingLeft }}
            onClick={() => toggleDirOpen(node.path)}
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
  
  // Initialize directory states when file tree changes
  useEffect(() => {
    if (fileTree) {
      const initialOpenState: Record<string, boolean> = {};
      
      // Helper function to recursively set initial open state
      const processNode = (node: any, depth: number = 0) => {
        if (node.type === 'dir' && node.children) {
          // Only root directories are open by default
          initialOpenState[node.path] = depth === 0;
          
          // Process children
          node.children.forEach((child: any) => processNode(child, depth + 1));
        }
      };
      
      processNode(fileTree);
      setOpenDirs(initialOpenState);
    }
  }, [fileTree]);
  
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
    if (!agentPrompt.trim() || !aiService || !githubRepo || isAgentProcessing) return;
    
    setIsAgentProcessing(true);
    setAgentResponse(null);
    
    try {
      let contextFiles = '';
      
      // Add current file to context if one is selected
      if (selectedFile) {
        const relativePath = selectedFile.replace(`/${githubRepo.owner}/${githubRepo.name}/`, '');
        contextFiles = `Current open file: ${relativePath}\n\n${fileContent}\n\n`;
      }
      
      // Add existing edits to context
      if (fileEdits.length > 0) {
        contextFiles += 'Edited files:\n';
        for (const edit of fileEdits) {
          const relativePath = edit.path.replace(`/${githubRepo.owner}/${githubRepo.name}/`, '');
          contextFiles += `- ${relativePath}\n`;
        }
        contextFiles += '\n';
      }
      
      // Build prompt with repository context
      const fullPrompt = `Act as an agentic AI assistant for code exploration and generation. I'm exploring this repository and need help with the following:\n${agentPrompt}\n\n${contextFiles}`;
      
      // Call AI service to analyze code
      const response = await aiService.analyzeRepositoryCode(fullPrompt);
      setAgentResponse(response);
    } catch (error) {
      console.error('Error processing agent request:', error);
      setAgentResponse(`Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
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
        {/* Repository Input Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          {!githubRepo ? (
            <div className="bg-dark-200 rounded-xl border border-gray-800 p-6">
              <h1 className="text-2xl font-bold text-white mb-4 flex items-center">
                <FiGithub className="mr-3 text-primary-400" />
                GitHub Repository Explorer
              </h1>
              <p className="text-gray-300 mb-6">Enter a GitHub repository URL to explore, analyze, and generate code based on its contents.</p>
              
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full bg-dark-100 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 pr-28 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                  <button
                    onClick={() => handleRepoSubmit(repoUrl)}
                    disabled={isLoadingRepo || !repoUrl.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoadingRepo ? (
                      <>
                        <FiRotateCw className="animate-spin mr-2 h-4 w-4" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <FiDownload className="mr-2 h-4 w-4" />
                        Fetch
                      </>
                    )}
                  </button>
                </div>
                
                {error && (
                  <div className="mt-2 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                {isLoadingRepo && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Loading repository...</span>
                      <span className="text-sm text-gray-300">{repoLoadingProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-300 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-600 transition-all duration-300" 
                        style={{ width: `${repoLoadingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Recent Repositories */}
                {recentRepos.length > 0 && !isLoadingRepo && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                      <FiBookOpen className="mr-2 h-4 w-4" />
                      Recent Repositories
                    </h3>
                    <div className="space-y-2">
                      {recentRepos.map((repo, index) => (
                        <button
                          key={index}
                          onClick={() => handleRepoSubmit(repo)}
                          className="flex items-center w-full text-left p-2 rounded bg-dark-100 hover:bg-dark-300 transition-colors text-gray-300 text-sm group"
                        >
                          <FiGithub className="mr-2 text-gray-500" />
                          <span className="truncate">{repo.replace('https://github.com/', '')}</span>
                          <FiArrowRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Examples */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setRepoUrl('https://github.com/pandas-dev/pandas')}
                    className="bg-dark-100 rounded-lg p-4 cursor-pointer hover:bg-dark-300 transition-colors border border-gray-800 flex flex-col"
                  >
                    <h3 className="text-primary-400 font-medium mb-2">Data Science</h3>
                    <p className="text-sm text-gray-400">Explore pandas, a powerful data analysis library</p>
                  </div>
                  <div 
                    onClick={() => setRepoUrl('https://github.com/django/django')}
                    className="bg-dark-100 rounded-lg p-4 cursor-pointer hover:bg-dark-300 transition-colors border border-gray-800 flex flex-col"
                  >
                    <h3 className="text-primary-400 font-medium mb-2">Web Development</h3>
                    <p className="text-sm text-gray-400">Analyze Django, a high-level Python web framework</p>
                  </div>
                  <div 
                    onClick={() => setRepoUrl('https://github.com/pytorch/pytorch')}
                    className="bg-dark-100 rounded-lg p-4 cursor-pointer hover:bg-dark-300 transition-colors border border-gray-800 flex flex-col"
                  >
                    <h3 className="text-primary-400 font-medium mb-2">Machine Learning</h3>
                    <p className="text-sm text-gray-400">Explore PyTorch, an ML framework</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-dark-200 rounded-xl border border-gray-800 p-4 mb-4">
              <div className="flex items-center">
                <FiGithub className="text-primary-400 mr-3 h-5 w-5" />
                <div>
                  <h2 className="text-lg font-medium text-white">{githubRepo.owner}/{githubRepo.name}</h2>
                  <p className="text-sm text-gray-400">{githubRepo.description}</p>
                </div>
              </div>
              <button
                onClick={() => useAppStore.getState().setGithubRepo(null)}
                className="px-3 py-1.5 bg-dark-100 text-gray-300 rounded hover:bg-dark-300 transition-colors text-sm"
              >
                Change Repository
              </button>
            </div>
          )}
        </motion.div>

        {/* Repository Content Section */}
        {githubRepo && (
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
                    <p><span className="text-gray-500">Stars:</span> {githubRepo.stars}</p>
                    <p><span className="text-gray-500">Forks:</span> {githubRepo.forks}</p>
                  </div>
                  <div className="space-y-2">
                    <a 
                      href={`https://github.com/${githubRepo.owner}/${githubRepo.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center"
                    >
                      <FiGithub className="mr-1" /> View on GitHub
                    </a>
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
                    <div className="mt-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-dark-300">
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300">File Explorer</h3>
                    {fileTree && (
                      <button
                        onClick={async () => {
                          try {
                            const tree = await aiService?.getFileTree();
                            setFileTree(tree || null);
                          } catch (error) {
                            console.error('Error refreshing file tree:', error);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="Refresh file tree"
                      >
                        <FiRefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
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
                  <h3 className="text-lg font-medium text-white mb-3">AI Code Analysis</h3>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <textarea
                        value={agentPrompt}
                        onChange={(e) => setAgentPrompt(e.target.value)}
                        placeholder="What would you like me to help you with? (e.g., 'Analyze this code for bugs', 'Generate a new utility function', 'Refactor this file')"
                        className="w-full min-h-[100px] bg-dark-100 border border-gray-700 rounded-md px-4 py-3 text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-y"
                        disabled={isAgentProcessing}
                      />
                      <button
                        onClick={handleAgentSubmit}
                        disabled={!agentPrompt.trim() || isAgentProcessing}
                        className="absolute right-3 bottom-3 px-4 py-1.5 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isAgentProcessing ? (
                          <>
                            <FiRefreshCw className="animate-spin mr-2 h-4 w-4" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Analyze
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {agentResponse && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-300">AI Response</h4>
                        {selectedFile && (
                          <button
                            onClick={applyAgentResponseAsEdit}
                            className="text-xs text-primary-400 hover:text-primary-300 flex items-center"
                          >
                            Apply as edit
                          </button>
                        )}
                      </div>
                      <div className="bg-dark-100 border border-gray-800 rounded-md p-4 overflow-auto max-h-[400px] text-gray-300">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {agentResponse}
                        </pre>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 