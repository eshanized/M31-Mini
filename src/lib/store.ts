import { create } from 'zustand';
import { AIService } from '../services/ai-service';
import { GitHubRepo } from '../services/github-service';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface FileEdit {
  path: string;
  originalContent: string;
  editedContent: string;
}

interface AppState {
  apiKey: string;
  aiService: AIService | null;
  isStreaming: boolean;
  selectedModel: string;
  availableModels: string[];
  messages: ChatMessage[];
  currentPrompt: string;
  generatedCode: string;
  isGenerating: boolean;
  githubRepo: GitHubRepo | null;
  isLoadingRepo: boolean;
  repoLoadingProgress: number;
  fileEdits: FileEdit[];
  apiStatus: { status: 'ok' | 'error' | 'unknown', message?: string };
  
  setApiKey: (key: string) => void;
  setCurrentPrompt: (prompt: string) => void;
  setSelectedModel: (model: string) => void;
  setAvailableModels: (models: string[]) => void;
  setGeneratedCode: (code: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  initializeAIService: () => void;
  fetchAvailableModels: () => Promise<void>;
  setGithubRepo: (repo: GitHubRepo | null) => void;
  setIsLoadingRepo: (isLoading: boolean) => void;
  setRepoLoadingProgress: (progress: number) => void;
  fetchGithubRepo: (repoUrl: string) => Promise<void>;
  analyzeRepositoryCode: (prompt: string) => Promise<void>;
  addFileEdit: (edit: FileEdit) => void;
  clearFileEdits: () => void;
  analyzeCodeWithAgent: (prompt: string, filePath?: string, fileContent?: string) => Promise<string>;
  generateCodeWithAgent: (prompt: string, language: string) => Promise<string>;
  editFileWithAgent: (filePath: string, editPrompt: string) => Promise<string>;
  createFileWithAgent: (directoryPath: string, fileName: string, fileDescription: string) => Promise<string>;
  solveCodeProblem: (problemDescription: string) => Promise<{solution: string, explanation: string, files: {path: string, content: string}[]}>;
  autonomousSearchAndModify: (task: string) => Promise<{explanation: string, modifications: {path: string, content: string}[]}>;
  searchFilesByFunctionality: (description: string) => Promise<string[]>;
  generateCodeWithTests: (specDescription: string, language?: string) => Promise<{implementation: string, tests: string}>;
  setApiStatus: (status: { status: 'ok' | 'error' | 'unknown', message?: string }) => void;
  checkApiConnectivity: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  apiKey: '',
  aiService: null,
  isStreaming: false,
  selectedModel: 'google/gemini-pro',
  availableModels: [],
  messages: [],
  currentPrompt: '',
  generatedCode: '',
  isGenerating: false,
  githubRepo: null,
  isLoadingRepo: false,
  repoLoadingProgress: 0,
  fileEdits: [],
  apiStatus: { status: 'unknown' },
  
  setApiKey: (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('openrouter_api_key', key);
    }
    set({ apiKey: key });
    get().initializeAIService();
  },
  
  setCurrentPrompt: (prompt: string) => set({ currentPrompt: prompt }),
  
  setSelectedModel: (model: string) => set({ selectedModel: model }),
  
  setAvailableModels: (models: string[]) => set({ availableModels: models }),
  
  setGeneratedCode: (code: string) => set({ generatedCode: code }),
  
  setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),
  
  addMessage: (message: ChatMessage) => 
    set(state => ({ messages: [...state.messages, message] })),
  
  clearMessages: () => set({ messages: [] }),
  
  setApiStatus: (apiStatus) => set({ apiStatus }),
  
  checkApiConnectivity: async () => {
    const { aiService } = get();
    if (!aiService) {
      set({ apiStatus: { status: 'error', message: 'AI service not initialized' } });
      return;
    }
    
    try {
      const status = await aiService.checkApiConnectivity();
      set({ apiStatus: status });
    } catch (error) {
      set({ 
        apiStatus: { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Failed to check API connectivity' 
        } 
      });
    }
  },
  
  initializeAIService: () => {
    const { apiKey } = get();
    if (apiKey) {
      const service = new AIService(apiKey);
      set({ aiService: service });
      
      // Initialize with available models
      if (typeof window !== 'undefined') {
        get().fetchAvailableModels();
        
        // Load API key from localStorage if available
        const savedKey = localStorage.getItem('openrouter_api_key');
        if (savedKey && !get().apiKey) {
          set({ apiKey: savedKey });
        }
        
        // Check API connectivity
        get().checkApiConnectivity();
      }
    }
  },
  
  fetchAvailableModels: async () => {
    const { aiService } = get();
    if (!aiService) return;
    
    try {
      const models = await aiService.getAvailableModels();
      set({ availableModels: models });
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  },
  
  setGithubRepo: (repo: GitHubRepo | null) => set({ githubRepo: repo }),
  
  setIsLoadingRepo: (isLoading: boolean) => set({ isLoadingRepo: isLoading }),
  
  setRepoLoadingProgress: (progress: number) => set({ repoLoadingProgress: progress }),
  
  fetchGithubRepo: async (repoUrl: string) => {
    const { aiService } = get();
    if (!aiService) return;
    
    if (typeof window === 'undefined') {
      console.warn('GitHub repository features are only available in browser environments');
      return;
    }
    
    set({ isLoadingRepo: true, repoLoadingProgress: 0 });
    
    try {
      const repo = await aiService.cloneAndAnalyzeRepository(
        repoUrl,
        (progress) => {
          const progressPercentage = Math.min(
            Math.floor((progress.loaded / Math.max(progress.total, 1)) * 100),
            99
          );
          set({ repoLoadingProgress: progressPercentage });
        }
      );
      
      set({ 
        githubRepo: repo,
        repoLoadingProgress: 100
      });
      
      get().addMessage({ 
        role: 'assistant', 
        content: `Repository ${repo.owner}/${repo.name} loaded successfully.` 
      });
    } catch (error) {
      console.error('Error fetching repository:', error);
      
      get().addMessage({ 
        role: 'assistant',
        content: `Failed to load repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      set({ isLoadingRepo: false });
    }
  },
  
  analyzeRepositoryCode: async (prompt: string) => {
    const { aiService, selectedModel } = get();
    if (!aiService) return;
    
    if (typeof window === 'undefined') {
      console.warn('GitHub repository features are only available in browser environments');
      return;
    }
    
    set({ isGenerating: true });
    
    try {
      get().addMessage({ role: 'user', content: prompt });
      
      const analysis = await aiService.analyzeRepositoryCode(prompt, selectedModel as any);
      
      set({ generatedCode: analysis });
      
      get().addMessage({ role: 'assistant', content: analysis });
    } catch (error) {
      console.error('Error analyzing repository code:', error);
      
      get().addMessage({
        role: 'assistant',
        content: `Error analyzing repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      set({ isGenerating: false });
    }
  },
  
  addFileEdit: (edit) => {
    const { fileEdits } = get();
    const existingEditIndex = fileEdits.findIndex(e => e.path === edit.path);
    
    if (existingEditIndex >= 0) {
      const updatedEdits = [...fileEdits];
      updatedEdits[existingEditIndex] = edit;
      set({ fileEdits: updatedEdits });
    } else {
      set({ fileEdits: [...fileEdits, edit] });
    }
  },
  
  clearFileEdits: () => {
    set({ fileEdits: [] });
  },
  
  analyzeCodeWithAgent: async (prompt, filePath, fileContent) => {
    const { aiService, selectedModel } = get();
    if (!aiService) return 'Error: AI service not initialized. Please set an API key first.';
    
    if (typeof window === 'undefined') {
      console.warn('GitHub repository features are only available in browser environments');
      return 'Error: This feature is only available in browser environments.';
    }
    
    set({ isGenerating: true });
    
    try {
      // Check if the model exists in available models, fall back to default if not
      const model = get().availableModels.includes(selectedModel)
        ? selectedModel
        : 'anthropic/claude-3-opus'; // Use Claude as default for better agent capabilities
        
      // Add system instructions to make it act like an agent
      const agentPrompt = `
You are an agentic coding assistant. Analyze the codebase and respond with a detailed plan and implementation.
When analyzing code, follow this structured approach:
1. First, understand the overall purpose of the code
2. Identify patterns, architecture, and key components
3. Pinpoint areas of improvement or potential issues
4. Provide specific, actionable recommendations
5. If asked to implement a feature, provide complete code that integrates well with existing structures

For the current request:
${prompt}

${filePath ? `Current file: ${filePath}\n\n${fileContent || 'File content not available'}\n\n` : ''}
`;
      
      // Call the AI service to analyze the code
      const response = await aiService.analyzeRepositoryCode(
        agentPrompt,
        model as any
      );
      
      return response || 'The AI model did not return a response. Please try again.';
    } catch (error) {
      console.error('Error analyzing code with agent:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred during analysis'}`;
    } finally {
      set({ isGenerating: false });
    }
  },
  
  // New functions for enhanced agent capabilities
  generateCodeWithAgent: async (prompt, language) => {
    const { aiService, selectedModel } = get();
    if (!aiService) return 'Error: AI service not initialized. Please set an API key first.';
    
    set({ isGenerating: true });
    
    try {
      // Use the best model for code generation
      const model = 'anthropic/claude-3-opus';
      
      // Call the AI service to generate code
      const response = await aiService.generateCodeWithAgent(
        prompt,
        language,
        model as any
      );
      
      return response || 'The AI model did not return a response. Please try again.';
    } catch (error) {
      console.error('Error generating code with agent:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred during code generation'}`;
    } finally {
      set({ isGenerating: false });
    }
  },
  
  editFileWithAgent: async (filePath, editPrompt) => {
    const { aiService, selectedModel } = get();
    if (!aiService) return 'Error: AI service not initialized. Please set an API key first.';
    
    set({ isGenerating: true });
    
    try {
      // Use the best model for code editing
      const model = 'anthropic/claude-3-opus';
      
      // Call the AI service to edit the file
      const response = await aiService.editFile(
        filePath,
        editPrompt,
        model as any
      );
      
      return response || 'The AI model did not return a response. Please try again.';
    } catch (error) {
      console.error('Error editing file with agent:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred during file editing'}`;
    } finally {
      set({ isGenerating: false });
    }
  },
  
  createFileWithAgent: async (directoryPath, fileName, fileDescription) => {
    const { aiService, selectedModel } = get();
    if (!aiService) return 'Error: AI service not initialized. Please set an API key first.';
    
    set({ isGenerating: true });
    
    try {
      // Use the best model for file creation
      const model = 'anthropic/claude-3-opus';
      
      // Call the AI service to create the file
      const response = await aiService.createFile(
        directoryPath,
        fileName,
        fileDescription,
        model as any
      );
      
      return response || 'The AI model did not return a response. Please try again.';
    } catch (error) {
      console.error('Error creating file with agent:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred during file creation'}`;
    } finally {
      set({ isGenerating: false });
    }
  },
  
  // New autonomous problem-solving capability
  solveCodeProblem: async (problemDescription: string) => {
    const { aiService } = get();
    if (!aiService) {
      throw new Error('AI service not initialized. Please set an API key first.');
    }
    
    set({ isGenerating: true });
    
    try {
      const result = await aiService.solveCodeProblem(problemDescription);
      
      // Add files to edits if they exist
      if (result.files && result.files.length > 0) {
        const updatedFileEdits = [...get().fileEdits];
        
        for (const file of result.files) {
          // Check if there's an existing file in the repository
          let originalContent = '';
          try {
            originalContent = await aiService.getFileContent(file.path);
          } catch (error) {
            // If file doesn't exist, treat as a new file with empty original content
            console.log(`Creating new file: ${file.path}`);
          }
          
          const fileEdit: FileEdit = {
            path: file.path,
            originalContent,
            editedContent: file.content
          };
          
          // Add or update the file edit
          const existingEditIndex = updatedFileEdits.findIndex(edit => edit.path === file.path);
          if (existingEditIndex >= 0) {
            updatedFileEdits[existingEditIndex] = fileEdit;
          } else {
            updatedFileEdits.push(fileEdit);
          }
        }
        
        set({ fileEdits: updatedFileEdits });
      }
      
      return result;
    } catch (error) {
      console.error('Error solving code problem:', error);
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },
  
  // Autonomous search and modify
  autonomousSearchAndModify: async (task: string) => {
    const { aiService } = get();
    if (!aiService) {
      throw new Error('AI service not initialized. Please set an API key first.');
    }
    
    set({ isGenerating: true });
    
    try {
      const result = await aiService.autonomousSearchAndModify(task);
      
      // Add files to edits if they exist
      if (result.modifications && result.modifications.length > 0) {
        const updatedFileEdits = [...get().fileEdits];
        
        for (const mod of result.modifications) {
          // Check if there's an existing file in the repository
          let originalContent = '';
          try {
            originalContent = await aiService.getFileContent(mod.path);
          } catch (error) {
            // If file doesn't exist, treat as a new file with empty original content
            console.log(`Creating new file: ${mod.path}`);
          }
          
          const fileEdit: FileEdit = {
            path: mod.path,
            originalContent,
            editedContent: mod.content
          };
          
          // Add or update the file edit
          const existingEditIndex = updatedFileEdits.findIndex(edit => edit.path === mod.path);
          if (existingEditIndex >= 0) {
            updatedFileEdits[existingEditIndex] = fileEdit;
          } else {
            updatedFileEdits.push(fileEdit);
          }
        }
        
        set({ fileEdits: updatedFileEdits });
      }
      
      return result;
    } catch (error) {
      console.error('Error performing autonomous search and modify:', error);
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },
  
  // Search files by functionality
  searchFilesByFunctionality: async (description: string) => {
    const { aiService } = get();
    if (!aiService) {
      throw new Error('AI service not initialized. Please set an API key first.');
    }
    
    set({ isGenerating: true });
    
    try {
      const result = await aiService.searchFilesByFunctionality(description);
      return result;
    } catch (error) {
      console.error('Error searching files by functionality:', error);
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },
  
  // Generate code with tests
  generateCodeWithTests: async (specDescription: string, language?: string) => {
    const { aiService } = get();
    if (!aiService) {
      throw new Error('AI service not initialized. Please set an API key first.');
    }
    
    set({ isGenerating: true });
    
    try {
      const result = await aiService.generateCodeWithTests(specDescription, language);
      return result;
    } catch (error) {
      console.error('Error generating code with tests:', error);
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },
})); 