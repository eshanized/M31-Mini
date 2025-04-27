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
}

export const useAppStore = create<AppState>((set, get) => ({
  apiKey: '',
  aiService: null,
  isStreaming: false,
  selectedModel: 'anthropic/claude-3-opus',
  availableModels: [],
  messages: [],
  currentPrompt: '',
  generatedCode: '',
  isGenerating: false,
  githubRepo: null,
  isLoadingRepo: false,
  repoLoadingProgress: 0,
  fileEdits: [],
  
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
  
  initializeAIService: () => {
    const { apiKey } = get();
    if (apiKey) {
      const service = new AIService(apiKey);
      set({ aiService: service });
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
    if (!aiService) return '';
    
    if (typeof window === 'undefined') {
      console.warn('GitHub repository features are only available in browser environments');
      return '';
    }
    
    set({ isGenerating: true });
    
    try {
      let fullPrompt = prompt;
      
      // Add file context if provided
      if (filePath && fileContent) {
        fullPrompt = `File: ${filePath}\n\n${fileContent}\n\n${prompt}`;
      }
      
      // Call the AI service to analyze the code
      const response = await aiService.analyzeRepositoryCode(
        `Act as an agentic AI assistant for code exploration and generation. ${fullPrompt}`, 
        selectedModel as any
      );
      
      return response;
    } catch (error) {
      console.error('Error analyzing code with agent:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      set({ isGenerating: false });
    }
  },
})); 