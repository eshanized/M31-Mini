'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { FiCode, FiSearch, FiFolder, FiFile, FiEdit, FiRefreshCw, FiSave, FiRotateCw, FiCheck, FiX, FiTerminal, FiTarget, FiZap, FiCpu, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import CodeEditor from '@/components/CodeEditor';
import Layout from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FileTree } from '@/services/github-service';

interface FileEdit {
  path: string;
  originalContent: string;
  editedContent: string;
}

export default function AgentPage() {
  const { aiService, githubRepo, fetchGithubRepo, isLoadingRepo, repoLoadingProgress, apiStatus, checkApiConnectivity } = useAppStore();
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
  
  // State for managing open directories
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({});
  
  // State for repository URL input
  const [repoUrl, setRepoUrl] = useState('');
  const [recentRepos, setRecentRepos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced agent modes with autonomous capabilities
  const [agentMode, setAgentMode] = useState<'analyze' | 'generate' | 'edit' | 'create' | 'solve' | 'autonomous' | 'search' | 'test'>('analyze');
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFilePath, setNewFilePath] = useState<string>('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [foundFiles, setFoundFiles] = useState<string[]>([]);
  const [selectedImplementationTab, setSelectedImplementationTab] = useState<'implementation' | 'tests'>('implementation');
  const [implementationCode, setImplementationCode] = useState<string>('');
  const [testCode, setTestCode] = useState<string>('');
  
  // Add error state for better error handling
  const [agentError, setAgentError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  
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
  
  // Add this effect to initialize the service
  useEffect(() => {
    // This ensures the service is initialized even if the API key is already in localStorage
    if (!aiService) {
      const { initializeAIService } = useAppStore.getState();
      initializeAIService();
      console.log("AI service initialized from agent page");
    }
  }, [aiService]);
  
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
        if (node.type === 'dir') {
          // Set the path as a property of initialOpenState
          initialOpenState[node.path] = depth === 0;
          
          // Process children
          if (node.children) {
            node.children.forEach((child: any) => processNode(child, depth + 1));
          }
        }
      };
      
      // Start processing from the root
      processNode(fileTree);
      
      // Set the initial state
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

  // Check API connectivity when component mounts or when API service changes
  useEffect(() => {
    if (aiService) {
      checkApiConnectivity();
    }
  }, [aiService, checkApiConnectivity]);

  // Process agent query - check API connectivity before submitting
  const handleAgentSubmit = async () => {
    if (!aiService || !agentPrompt.trim()) {
      setAgentResponse("Error: Please enter a prompt and ensure API key is set");
      return;
    }
    
    // Check API connectivity first
    await checkApiConnectivity();
    if (apiStatus.status === 'error') {
      setAgentError('API connectivity issue: ' + (apiStatus.message || 'Unknown error'));
      setAgentResponse("I'm having trouble connecting to the AI service. Please check your internet connection and API key.");
      return;
    }
    
    setAgentError(null);
    setIsAgentProcessing(true);
    setAgentResponse(null);
    setFoundFiles([]);
    setImplementationCode('');
    setTestCode('');
    
    try {
      // Track if we're analyzing a specific file or the whole repository
      const isFileAnalysis = selectedFile !== null && agentMode === 'analyze';
      
      let response;
      
      // Handle different agent modes
      switch (agentMode) {
        case 'analyze':
          const analysisPrompt = `
Analyze the following ${isFileAnalysis ? 'file' : 'repository'} and respond to this request:

${agentPrompt}

${isFileAnalysis ? 'Focus on the specific file provided.' : 'Consider the entire repository structure and patterns.'}
`;
          
          if (isFileAnalysis && selectedFile) {
            // For file-specific analysis
            response = await useAppStore.getState().analyzeCodeWithAgent(
              analysisPrompt,
              selectedFile,
              fileContent
            );
          } else if (githubRepo) {
            // For whole repository analysis
            response = await useAppStore.getState().analyzeCodeWithAgent(analysisPrompt);
          } else {
            throw new Error("No repository loaded. Please load a repository first.");
          }
          break;
          
        case 'generate':
          // Generate new code
          response = await useAppStore.getState().generateCodeWithAgent(agentPrompt, targetLanguage);
          break;
          
        case 'edit':
          // Edit the current file
          if (!selectedFile) {
            throw new Error("Please select a file to edit first.");
          }
          
          const relativePath = selectedFile.replace(`/${githubRepo?.owner}/${githubRepo?.name}/`, '');
          response = await useAppStore.getState().editFileWithAgent(relativePath, agentPrompt);
          
          // Set the edited content for immediate use
          setEditedContent(response);
          setIsEditingFile(true);
          break;
          
        case 'create':
          // Create a new file
          if (!newFilePath || !newFileName) {
            throw new Error("Please specify both file path and name.");
          }
          
          setIsCreatingFile(true);
          response = await useAppStore.getState().createFileWithAgent(
            newFilePath,
            newFileName,
            agentPrompt
          );
          
          // Add the new file to edits
          const newEdit: FileEdit = {
            path: `${newFilePath}/${newFileName}`,
            originalContent: '',
            editedContent: response
          };
          
          setFileEdits([...fileEdits, newEdit]);
          break;
          
        case 'solve':
          // Autonomous problem solving
          const solutionResult = await useAppStore.getState().solveCodeProblem(agentPrompt);
          response = solutionResult.explanation;
          
          // Display files that were created/modified
          if (solutionResult.files && solutionResult.files.length > 0) {
            response += "\n\nModified files:\n" + 
              solutionResult.files.map(file => `- ${file.path}`).join('\n');
          }
          break;
          
        case 'autonomous':
          // Autonomous search and modify
          const autonomousResult = await useAppStore.getState().autonomousSearchAndModify(agentPrompt);
          response = autonomousResult.explanation;
          
          // Display files that were modified
          if (autonomousResult.modifications && autonomousResult.modifications.length > 0) {
            response += "\n\nModified files:\n" + 
              autonomousResult.modifications.map(mod => `- ${mod.path}`).join('\n');
          }
          break;
          
        case 'search':
          // Search files by functionality
          const searchResults = await useAppStore.getState().searchFilesByFunctionality(agentPrompt);
          setFoundFiles(searchResults);
          response = `Found ${searchResults.length} relevant files for the specified functionality:\n\n` + 
            searchResults.map((file, index) => `${index + 1}. ${file}`).join('\n');
          break;
          
        case 'test':
          // Generate code with tests
          const testResult = await useAppStore.getState().generateCodeWithTests(agentPrompt, targetLanguage);
          setImplementationCode(testResult.implementation);
          setTestCode(testResult.tests);
          response = "Generated implementation and tests. See the tabs below to view each.";
          break;
      }
      
      if (!response) {
        throw new Error("No response received from the model");
      }
      
      setAgentResponse(response);
    } catch (error) {
      console.error('Error in agent processing:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setAgentError(errorMessage);
      
      // Set a more user-friendly error message based on the error
      if (errorMessage.includes('Invalid response structure') || 
          errorMessage.includes('Invalid response format') ||
          errorMessage.includes('API request failed')) {
        setAgentResponse(
          "I encountered an error communicating with the AI service. " +
          "This might be due to a temporary issue. Please try again in a moment."
        );
      } else if (errorMessage.includes('rate limit')) {
        setAgentResponse(
          "The AI service rate limit has been exceeded. " +
          "Please wait a moment before trying again."
        );
      } else if (errorMessage.includes('Authentication')) {
        setAgentResponse(
          "There seems to be an issue with the API key. " +
          "Please check your API key settings."
        );
      } else {
        setAgentResponse(`Error: ${errorMessage}`);
      }
    } finally {
      setIsAgentProcessing(false);
      setIsCreatingFile(false);
    }
  };
  
  // Function to retry with a fallback model
  const handleRetryWithFallback = async () => {
    if (!aiService || !agentPrompt.trim()) return;
    
    setIsRecovering(true);
    setAgentError(null);
    setAgentResponse("Retrying with a more stable model...");
    
    try {
      // Use a more stable model as fallback
      const fallbackModel = 'google/gemini-pro';
      let response;
      
      // Simplified retry with fallback model
      if (agentMode === 'analyze') {
        response = await aiService.analyzeRepositoryCode(agentPrompt, fallbackModel as any);
      } else if (agentMode === 'generate') {
        response = await aiService.generateCodeWithAgent(agentPrompt, targetLanguage, fallbackModel as any);
      } else if (agentMode === 'edit' && selectedFile) {
        const relativePath = selectedFile.replace(`/${githubRepo?.owner}/${githubRepo?.name}/`, '');
        response = await aiService.editFile(relativePath, agentPrompt, fallbackModel as any);
        setEditedContent(response);
        setIsEditingFile(true);
      } else {
        throw new Error("Cannot retry in current mode");
      }
      
      if (response) {
        setAgentResponse(response);
        setAgentError(null);
      }
    } catch (error) {
      console.error('Error in fallback processing:', error);
      setAgentError(error instanceof Error ? error.message : 'Fallback attempt failed');
    } finally {
      setIsRecovering(false);
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

  // UI for the Agent interface
  const renderAgentInterface = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-dark-200 rounded-xl border border-gray-800 p-4"
      >
        <h3 className="text-lg font-medium text-white mb-3">AI Agent Assistant</h3>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setAgentMode('analyze')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                agentMode === 'analyze' 
                  ? 'bg-accent-500 text-white' 
                  : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
              }`}
            >
              <FiSearch className="mr-1" />
              Analyze
            </button>
            <button
              onClick={() => setAgentMode('generate')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                agentMode === 'generate' 
                  ? 'bg-accent-500 text-white' 
                  : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
              }`}
            >
              <FiCode className="mr-1" />
              Generate
            </button>
            <button
              onClick={() => {
                if (selectedFile) setAgentMode('edit');
                else setAgentResponse("Please select a file to edit first.");
              }}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                agentMode === 'edit' 
                  ? 'bg-accent-500 text-white' 
                  : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
              }`}
              disabled={!selectedFile}
            >
              <FiEdit className="mr-1" />
              Edit
            </button>
            <button
              onClick={() => setAgentMode('create')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                agentMode === 'create' 
                  ? 'bg-accent-500 text-white' 
                  : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
              }`}
            >
              <FiFile className="mr-1" />
              Create
            </button>
            <button
              onClick={() => setAgentMode('solve')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                agentMode === 'solve' 
                  ? 'bg-accent-500 text-white' 
                  : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
              }`}
            >
              <FiTarget className="mr-1" />
              Solve
            </button>
            <button
              onClick={() => setAgentMode('autonomous')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                agentMode === 'autonomous' 
                  ? 'bg-accent-500 text-white' 
                  : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
              }`}
            >
              <FiCpu className="mr-1" />
              Auto-Mod
            </button>
            <button
              onClick={() => setAgentMode('search')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                agentMode === 'search' 
                  ? 'bg-accent-500 text-white' 
                  : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
              }`}
            >
              <FiSearch className="mr-1" />
              Search
            </button>
            <button
              onClick={() => setAgentMode('test')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                agentMode === 'test' 
                  ? 'bg-accent-500 text-white' 
                  : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
              }`}
            >
              <FiZap className="mr-1" />
              Test
            </button>
          </div>
          
          {/* Additional options based on mode */}
          {agentMode === 'generate' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Target Language
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full bg-dark-100 border border-gray-700 rounded-md px-3 py-2 text-gray-200"
              >
                <option value="">Auto-detect from repository</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="c++">C++</option>
                <option value="c#">C#</option>
              </select>
            </div>
          )}
          
          {agentMode === 'create' && (
            <div className="space-y-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Directory Path
                </label>
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  placeholder="e.g., src/components"
                  className="w-full bg-dark-100 border border-gray-700 rounded-md px-3 py-2 text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g., Button.tsx"
                  className="w-full bg-dark-100 border border-gray-700 rounded-md px-3 py-2 text-gray-200"
                />
              </div>
            </div>
          )}
          
          {agentMode === 'test' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Target Language
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full bg-dark-100 border border-gray-700 rounded-md px-3 py-2 text-gray-200"
              >
                <option value="">Auto-detect from repository</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="c++">C++</option>
                <option value="c#">C#</option>
              </select>
            </div>
          )}
          
          <div className="relative">
            <textarea
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              placeholder={getPromptPlaceholder()}
              className="w-full min-h-[100px] bg-dark-100 border border-gray-700 rounded-md px-4 py-3 text-gray-100 focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all resize-y"
              disabled={isAgentProcessing}
            />
            <button
              onClick={handleAgentSubmit}
              disabled={!agentPrompt.trim() || isAgentProcessing || (agentMode === 'create' && (!newFilePath || !newFileName))}
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
                  {getButtonText()}
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Error message display */}
        <AnimatePresence>
          {agentError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md"
            >
              <div className="flex items-start">
                <FiAlertTriangle className="text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-300 text-sm">{agentError}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={handleRetryWithFallback}
                      disabled={isRecovering}
                      className="px-3 py-1 text-xs bg-dark-100 text-gray-300 rounded-md hover:bg-dark-300 flex items-center"
                    >
                      {isRecovering ? (
                        <>
                          <FiRefreshCw className="animate-spin mr-1 h-3 w-3" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <FiRefreshCw className="mr-1 h-3 w-3" />
                          Retry with fallback model
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setAgentError(null)}
                      className="px-3 py-1 text-xs bg-dark-100 text-gray-300 rounded-md hover:bg-dark-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Display search results if available */}
        {agentMode === 'search' && foundFiles.length > 0 && (
          <div className="mb-4 p-4 bg-dark-300 rounded-md">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Found Files:</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {foundFiles.map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center text-sm text-accent-300 cursor-pointer hover:underline"
                  onClick={() => handleFileSelect(`/${githubRepo?.owner}/${githubRepo?.name}/${file}`)}
                >
                  <FiFile className="mr-2 h-3 w-3" />
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show implementation and test tabs for test mode */}
        {agentMode === 'test' && (implementationCode || testCode) && (
          <div className="mb-4">
            <div className="flex border-b border-gray-700 mb-2">
              <button
                className={`px-4 py-2 text-sm ${selectedImplementationTab === 'implementation' 
                  ? 'border-b-2 border-accent-500 text-accent-300' 
                  : 'text-gray-400'}`}
                onClick={() => setSelectedImplementationTab('implementation')}
              >
                Implementation
              </button>
              <button
                className={`px-4 py-2 text-sm ${selectedImplementationTab === 'tests' 
                  ? 'border-b-2 border-accent-500 text-accent-300' 
                  : 'text-gray-400'}`}
                onClick={() => setSelectedImplementationTab('tests')}
              >
                Tests
              </button>
            </div>
            <div className="bg-dark-300 rounded-md p-4 font-mono text-sm max-h-[300px] overflow-y-auto whitespace-pre-wrap">
              {selectedImplementationTab === 'implementation' 
                ? implementationCode 
                : testCode}
            </div>
          </div>
        )}
        
        {agentResponse && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-300">Agent Response</h4>
              <div className="flex gap-2">
                {selectedFile && agentMode === 'analyze' && !agentError && (
                  <button
                    onClick={applyAgentResponseAsEdit}
                    className="px-3 py-1 text-xs bg-accent-500 text-white rounded-md hover:bg-accent-600"
                  >
                    Apply as Edit
                  </button>
                )}
                {agentMode === 'create' && isCreatingFile && !agentError && (
                  <div className="text-xs text-green-400 flex items-center">
                    <FiCheck className="mr-1" /> File created
                  </div>
                )}
                {agentResponse.includes("Error:") && (
                  <div className="text-xs text-amber-400 flex items-center">
                    <FiInfo className="mr-1" /> Response contains errors
                  </div>
                )}
              </div>
            </div>
            <div className={`rounded-md p-4 font-mono text-sm max-h-[300px] overflow-y-auto whitespace-pre-wrap ${
              agentResponse.includes("Error:") ? 'bg-red-900/20 text-red-200' : 'bg-dark-300 text-gray-300'
            }`}>
              {agentResponse}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Helper function to get placeholder text based on mode
  const getPromptPlaceholder = () => {
    switch (agentMode) {
      case 'analyze':
        return "What would you like me to analyze? (e.g., 'Identify performance issues in this code', 'Explain what this function does')";
      case 'generate':
        return "Describe the code you want me to generate (e.g., 'Create a utility function to format dates', 'Generate a React component for a dropdown menu')";
      case 'edit':
        return "Describe the changes you want to make to this file (e.g., 'Add error handling to this function', 'Refactor this component to use hooks')";
      case 'create':
        return "Describe the file you want to create (e.g., 'A utility class for handling API requests', 'A React component for a modal dialog')";
      case 'solve':
        return "Describe the problem you want me to solve autonomously (e.g., 'Implement authentication for this application', 'Add dark mode support')";
      case 'autonomous':
        return "Describe what you want me to autonomously modify (e.g., 'Update all API calls to use the new fetch wrapper', 'Add type checking to all functions')";
      case 'search':
        return "Describe the functionality you're looking for (e.g., 'API authentication', 'State management', 'Database queries')";
      case 'test':
        return "Describe the functionality you want me to implement with tests (e.g., 'A function to validate email addresses', 'A component that shows a paginated list')";
      default:
        return "";
    }
  };

  // Helper function to get button text based on mode
  const getButtonText = () => {
    switch (agentMode) {
      case 'analyze':
        return "Analyze";
      case 'generate':
        return "Generate";
      case 'edit':
        return "Edit";
      case 'create':
        return "Create";
      case 'solve':
        return "Solve";
      case 'autonomous':
        return "Execute";
      case 'search':
        return "Search";
      case 'test':
        return "Generate";
      default:
        return "Run";
    }
  };

  // Status banner to show API status
  const renderStatusBanner = () => {
    if (!aiService) {
      return (
        <div className="mb-4 p-2 bg-amber-900/30 border border-amber-800 rounded-md">
          <div className="flex items-center">
            <FiInfo className="text-amber-400 mr-2" />
            <p className="text-amber-300 text-sm">
              Please configure your API key in the settings to enable all agent capabilities.
            </p>
          </div>
        </div>
      );
    }
    
    if (apiStatus.status === 'error') {
      return (
        <div className="mb-4 p-2 bg-red-900/30 border border-red-800 rounded-md">
          <div className="flex items-center">
            <FiAlertTriangle className="text-red-400 mr-2" />
            <div className="flex-1">
              <p className="text-red-300 text-sm">
                API connectivity issue: {apiStatus.message || 'Unknown error'}
              </p>
              <div className="mt-1">
                <button
                  onClick={() => checkApiConnectivity()}
                  className="px-3 py-1 text-xs bg-dark-100 text-gray-300 rounded-md hover:bg-dark-300 flex items-center"
                >
                  <FiRefreshCw className="mr-1 h-3 w-3" />
                  Retry connection
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {!githubRepo ? (
          <div className="bg-dark-200 rounded-xl border border-gray-800 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Load GitHub Repository</h2>
            
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
                  className="flex-1 bg-dark-100 border border-gray-700 rounded-md px-4 py-2 text-gray-200 
                    placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <button
                  onClick={() => handleRepoSubmit(repoUrl)}
                  disabled={isLoadingRepo || !repoUrl.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoadingRepo ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Loading...
                    </>
                  ) : (
                    "Load Repository"
                  )}
                </button>
              </div>
              {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
              
              {isLoadingRepo && (
                <div className="mt-4">
                  <div className="w-full bg-dark-300 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-primary-600 h-2.5 rounded-full" 
                      style={{ width: `${repoLoadingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    {repoLoadingProgress}% Complete
                  </p>
                </div>
              )}
            </div>
            
            {recentRepos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Recent Repositories</h3>
                <div className="space-y-2">
                  {recentRepos.map((repo, index) => (
                    <button
                      key={index}
                      onClick={() => handleRepoSubmit(repo)}
                      disabled={isLoadingRepo}
                      className="w-full text-left px-3 py-2 bg-dark-100 border border-gray-700 rounded-md text-gray-300 
                        hover:bg-dark-300 transition-colors text-sm truncate disabled:opacity-50"
                    >
                      {repo.replace('https://github.com/', '')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
        
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
                {/* Status banner */}
                {renderStatusBanner()}
                
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
                {renderAgentInterface()}
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