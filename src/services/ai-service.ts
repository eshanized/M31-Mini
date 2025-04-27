import axios from 'axios';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { GitHubService, GitHubRepo, FileTree } from './github-service';

export type OpenRouterModels = 
  'anthropic/claude-instant-1' | 
  'anthropic/claude-3-opus' |
  'anthropic/claude-3-sonnet' |
  'meta-llama/llama-2-13b-chat' | 
  'google/palm-2-chat-bison' | 
  'google/gemini-pro' | 
  'mistralai/mistral-7b-instruct' | 
  'mistralai/mixtral-8x7b-instruct';

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export interface CompletionRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface CompletionResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  model: string;
}

export interface StreamChunk {
  id: string;
  choices: {
    index: number;
    delta: {
      content?: string;
    };
    finish_reason: string | null;
  }[];
  model: string;
}

export class AIService {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private githubService: GitHubService | null = null;
  private models: OpenRouterModels[] = [
    'anthropic/claude-instant-1',
    'anthropic/claude-3-opus',
    'anthropic/claude-3-sonnet',
    'meta-llama/llama-2-13b-chat',
    'google/palm-2-chat-bison',
    'google/gemini-pro',
    'mistralai/mistral-7b-instruct',
    'mistralai/mixtral-8x7b-instruct'
  ];
  private repoData: GitHubRepo | null = null;
  private fileTree: FileTree | null = null;
  private lastApiCheck: { timestamp: number, status: 'ok' | 'error', message?: string } | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    
    // Only initialize GitHub service in browser environment
    if (typeof window !== 'undefined') {
      this.githubService = new GitHubService();
    }
  }

  public getModels(): OpenRouterModels[] {
    return this.models;
  }

  public getModelRecommendation(category: string): OpenRouterModels {
    // Model recommendations based on task category
    switch (category) {
      case 'data_analysis':
        return 'mistralai/mixtral-8x7b-instruct'; // Best for complex data analysis tasks
      case 'machine_learning':
        return 'mistralai/mixtral-8x7b-instruct'; // Best for ML code
      case 'web_development':
        return 'google/gemini-pro'; // Good for web and API development
      case 'automation':
        return 'anthropic/claude-instant-1'; // Good balance for automation scripts
      case 'algorithms':
        return 'meta-llama/llama-2-13b-chat'; // Good for algorithmic problems
      case 'simple_scripts':
        return 'mistralai/mistral-7b-instruct'; // Fast and efficient for simple tasks
      default:
        return 'google/gemini-pro'; // Good default option
    }
  }

  public getSystemPrompt(includeRepoContext: boolean = false): string {
    let prompt = `You are a world-class developer with expertise in data science, machine learning, web development, and automation.
You act as an agentic AI assistant capable of analyzing codebases, understanding repository structures, and generating high-quality code.
Provide detailed, thoughtful responses about the codebase and suggest actionable improvements.

CUSTOM RULES FOR CODE GENERATION:
1. Generate code in the requested language or match the repository's primary language.
2. Follow style guidelines appropriate to the language.
3. Always use proper type hints and documentation where appropriate.
4. Optimize for readability and performance.
5. Write code that's production-ready and robust to edge cases.
6. Use appropriate error handling.
7. Use the latest best practices for the language.`;

    if (includeRepoContext && this.repoData) {
      prompt += `\n\nREPOSITORY CONTEXT:
You are analyzing a GitHub repository named ${this.repoData.name} by ${this.repoData.owner}.
Repository Description: ${this.repoData.description}
Total Files: ${this.repoData.fileCount}
Main File Types: ${Object.entries(this.repoData.fileTypes)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([ext, count]) => `${ext} (${count})`)
  .join(', ')}

When providing solutions, ensure they align with the repository's structure and purpose.`;
    }

    return prompt;
  }

  public getUserPrompt(prompt: string): string {
    return prompt;
  }

  public async generatePythonCode(prompt: string, model: OpenRouterModels = 'google/gemini-pro'): Promise<string> {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(prompt);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://m31-mini.vercel.app/',
          'X-Title': 'M31 Mini'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed with status ${response.status}: ${
          errorData.error?.message || 'Unknown error'
        }`);
      }

      const data = await response.json();
      
      // Check that data and choices exist before accessing
      if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error('Invalid response structure from API');
      }
      
      // Check that the first choice has a message with content
      if (!data.choices[0].message || typeof data.choices[0].message.content !== 'string') {
        throw new Error('Response is missing content');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating code:', error);
      throw error;
    }
  }

  public async streamPythonCode(
    prompt: string, 
    model: OpenRouterModels = 'google/gemini-pro', 
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void
  ): Promise<void> {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(prompt);
    let fullResponse = '';

    try {
      await fetchEventSource(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://m31-mini.vercel.app/',
          'X-Title': 'M31 Mini'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: true
        }),
        onmessage(event) {
          if (event.data === '[DONE]') return;
          
          try {
            const parsedData = JSON.parse(event.data);
            const content = parsedData.choices[0]?.delta?.content || '';
            
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch (error) {
            console.error('Error parsing stream data:', error);
          }
        },
        onerror(error) {
          console.error('Stream error:', error);
          throw error;
        },
        onclose() {
          onComplete(fullResponse);
        }
      });
    } catch (error) {
      console.error('Error streaming response:', error);
      throw error;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          'X-Title': 'M31-Mini',
        }
      });
      
      // Filter to only include free models
      const freeModels = this.models;
      const availableModels = response.data.data
        .filter((model: any) => freeModels.includes(model.id))
        .map((model: any) => model.id);
      
      // Return the filtered list if it has items, otherwise return our predefined list
      return availableModels.length > 0 ? availableModels : freeModels;
    } catch (error) {
      console.error('Error fetching models:', error);
      // Return our predefined list of free models as fallback
      return this.models;
    }
  }

  public async cloneAndAnalyzeRepository(
    repoUrl: string, 
    progressCallback?: (progress: any) => void
  ): Promise<GitHubRepo> {
    if (!this.githubService) {
      throw new Error('GitHub service not initialized');
    }
    
    try {
      // Clone the repository
      const repo = await this.githubService.cloneRepository(repoUrl, progressCallback);
      this.repoData = repo;
      
      // Get file tree
      this.fileTree = await this.getFileTree();
      
      if (progressCallback) {
        progressCallback({ loaded: 95, total: 100 });
      }
      
      // Complete the analysis with additional data
      const importantFiles = this.identifyImportantFiles(this.fileTree!);
      
      if (progressCallback) {
        progressCallback({ loaded: 100, total: 100 });
      }
      
      return repo;
    } catch (error) {
      console.error('Error analyzing repository:', error);
      throw error;
    }
  }

  // Helper method to get current repository data
  public getCurrentRepo(): GitHubRepo | null {
    return this.repoData;
  }
  
  // Helper method to get file tree without parameters if repository is already loaded
  public async getFileTree(): Promise<FileTree | null> {
    if (!this.githubService || !this.repoData) {
      console.error('Cannot get file tree: Repository not loaded or GitHub service not initialized');
      throw new Error('Repository not loaded or service not initialized');
    }
    
    try {
      console.log(`Getting file tree for repository: ${this.repoData.owner}/${this.repoData.name}`);
      
      if (!this.fileTree) {
        console.log('File tree not cached, fetching from GitHub service...');
        this.fileTree = await this.githubService.getFileTree(this.repoData.owner, this.repoData.name);
        console.log('File tree fetched successfully');
      } else {
        console.log('Using cached file tree');
      }
      
      if (!this.fileTree) {
        console.error('File tree is null after fetching');
        throw new Error('Failed to retrieve file tree from repository');
      }
      
      return this.fileTree;
    } catch (error) {
      console.error('Error getting file tree:', error);
      throw error;
    }
  }
  
  // Helper method to get file content
  public async getFileContent(filePath: string): Promise<string> {
    if (!this.githubService || !this.repoData) {
      throw new Error('Repository not loaded');
    }
    
    console.log("AI Service getFileContent called with path:", filePath);
    
    // Make sure filePath doesn't start with a slash
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    try {
      const content = await this.githubService.getFileContent(
        this.repoData.owner, 
        this.repoData.name, 
        filePath
      );
      console.log("File content successfully retrieved");
      return content;
    } catch (error) {
      console.error("Error in AI Service getFileContent:", error);
      throw error;
    }
  }

  public async analyzeRepositoryCode(
    prompt: string,
    model: OpenRouterModels = 'mistralai/mixtral-8x7b-instruct'
  ): Promise<string> {
    if (!this.githubService) {
      throw new Error('GitHub service is not initialized. This feature is only available in browser environments.');
    }
    
    if (!this.repoData) {
      throw new Error('No repository is currently loaded.');
    }
    
    // Generate a summary of the repository
    const fileTree = await this.getFileTree();
    if (!fileTree) {
      throw new Error('Failed to retrieve file tree.');
    }
    
    const importantFiles = this.identifyImportantFiles(fileTree);
    
    // Get content of important files
    const fileContents: Record<string, string> = {};
    for (const filePath of importantFiles) {
      try {
        fileContents[filePath] = await this.getFileContent(filePath);
      } catch (error) {
        console.warn(`Failed to read file: ${filePath}`, error);
      }
    }
    
    // Build context
    const repoContext = this.buildRepositoryContext(this.repoData, fileTree, fileContents);
    
    // Generate completion
    const userPrompt = this.formatUserPrompt(prompt, repoContext);
    
    return this.generateCompletionWithFallback(
      this.getSystemPrompt(true), 
      [{ role: 'user', content: userPrompt }],
      model
    );
  }

  // Identify important files for analysis
  private identifyImportantFiles(fileTree: FileTree): string[] {
    const importantFiles: string[] = [];
    const maxFiles = 10; // Limit number of files to avoid token limits
    
    // Patterns for important files in most projects
    const importantPatterns = [
      /readme\.md$/i,
      /requirements\.txt$/i,
      /setup\.py$/i,
      /package\.json$/i,
      /main\.(py|js|ts)$/i,
      /index\.(py|js|ts)$/i,
      /app\.(py|js|ts)$/i
    ];
    
    const allFiles: string[] = [];
    
    // Helper function to collect files
    const collectFiles = (node: FileTree, path: string = '') => {
      if (node.type === 'file') {
        const filePath = path ? `${path}/${node.name}` : node.name;
        allFiles.push(filePath);
      } else if (node.children) {
        const newPath = path ? `${path}/${node.name}` : node.name;
        for (const child of node.children) {
          collectFiles(child, newPath);
        }
      }
    };
    
    collectFiles(fileTree);
    
    // First, add files matching important patterns
    for (const pattern of importantPatterns) {
      if (importantFiles.length >= maxFiles) break;
      
      const matches = allFiles.filter(file => pattern.test(file.toLowerCase()));
      for (const match of matches) {
        if (importantFiles.length >= maxFiles) break;
        if (!importantFiles.includes(match)) {
          importantFiles.push(match);
        }
      }
    }
    
    // Add more files up to the limit, preferring Python files
    const pythonFiles = allFiles.filter(file => file.endsWith('.py') && !importantFiles.includes(file));
    
    for (const file of pythonFiles) {
      if (importantFiles.length >= maxFiles) break;
      importantFiles.push(file);
    }
    
    // Fill remaining slots with other files
    for (const file of allFiles) {
      if (importantFiles.length >= maxFiles) break;
      if (!importantFiles.includes(file)) {
        importantFiles.push(file);
      }
    }
    
    return importantFiles;
  }

  // Build repository context for AI
  private buildRepositoryContext(
    repo: GitHubRepo,
    fileTree: FileTree,
    fileContents: Record<string, string>
  ): string {
    let context = `Repository Information:
- Name: ${repo.name}
- Owner: ${repo.owner}
- Description: ${repo.description || 'No description provided'}
- Files: ${repo.fileCount} files
- Main file types: ${Object.entries(repo.fileTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([ext, count]) => `${ext} (${count})`)
    .join(', ')}

File Structure:
${this.formatFileTreeForContext(fileTree, 0)}

Important Files:
`;

    // Add content of important files
    for (const [filePath, content] of Object.entries(fileContents)) {
      // Truncate content if it's too long to avoid context overflow
      const maxContentLength = 1000;
      const truncatedContent = content.length > maxContentLength 
        ? content.substring(0, maxContentLength) + '... [truncated]' 
        : content;
        
      context += `\n--- ${filePath} ---\n${truncatedContent}\n`;
    }
    
    return context;
  }

  // Format user prompt with repository context
  private formatUserPrompt(prompt: string, repoContext: string): string {
    return `
Repository Analysis Request:
${prompt}

${repoContext}

Please provide a Python solution that integrates well with this repository.`;
  }

  // Generate a completion from the API
  private async generateCompletion(
    systemPrompt: string, 
    messages: Message[], 
    model: OpenRouterModels
  ): Promise<string> {
    try {
      console.log(`Generating completion with model: ${model}`);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://m31-mini.vercel.app/',
          'X-Title': 'M31 Mini'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed with status ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += `: ${errorData.error?.message || errorData.message || 'Unknown error'}`;
        } catch (parseError) {
          errorMessage += `: ${errorText || 'No error details available'}`;
        }
        
        console.error('OpenRouter API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Improved validation for API response
      if (!data) {
        console.error('Empty response from API');
        throw new Error('Empty response received from API');
      }
      
      if (!data.choices || !Array.isArray(data.choices)) {
        console.error('Invalid response format - missing choices array:', data);
        throw new Error('Invalid response format: Missing choices array');
      }
      
      if (data.choices.length === 0) {
        console.error('Empty choices array in response:', data);
        throw new Error('No choices returned in API response');
      }
      
      const firstChoice = data.choices[0];
      if (!firstChoice.message) {
        console.error('Invalid choice format - missing message:', firstChoice);
        throw new Error('Invalid choice format: Missing message');
      }
      
      const content = firstChoice.message.content;
      if (typeof content !== 'string') {
        console.error('Invalid message format - content is not a string:', firstChoice.message);
        throw new Error('Invalid message format: Content is not a string');
      }

      return content;
    } catch (error) {
      console.error('Error generating completion:', error);
      // Provide a more helpful error message to the user
      if (error instanceof Error) {
        if (error.message.includes('429')) {
          throw new Error('API rate limit exceeded. Please try again in a few moments.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Authentication error. Please check your API key.');
        } else if (error.message.includes('502') || error.message.includes('503') || error.message.includes('504')) {
          throw new Error('The AI service is currently unavailable. Please try again later.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while generating completion');
    }
  }

  // Add a fallback method that uses a simpler model when the main model fails
  private async generateCompletionWithFallback(
    systemPrompt: string,
    messages: Message[],
    primaryModel: OpenRouterModels,
    maxRetries: number = 2
  ): Promise<string> {
    let lastError: Error | null = null;
    
    // Try the primary model first
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.generateCompletion(systemPrompt, messages, primaryModel);
      } catch (error) {
        console.warn(`Attempt ${attempt + 1} with ${primaryModel} failed:`, error);
        if (error instanceof Error) {
          lastError = error;
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // If primary model fails after retries, fall back to more reliable models
    const fallbackModels: OpenRouterModels[] = [
      'google/gemini-pro',
      'anthropic/claude-instant-1',
      'mistralai/mistral-7b-instruct'
    ];
    
    for (const fallbackModel of fallbackModels) {
      if (fallbackModel === primaryModel) continue;
      
      try {
        console.log(`Trying fallback model: ${fallbackModel}`);
        return await this.generateCompletion(systemPrompt, messages, fallbackModel);
      } catch (error) {
        console.warn(`Fallback to ${fallbackModel} failed:`, error);
      }
    }
    
    // If all fallbacks fail, throw the last error
    throw lastError || new Error('All models failed to generate completion');
  }

  private formatFileTreeForContext(node: FileTree, depth: number): string {
    const indent = '  '.repeat(depth);
    let result = '';
    
    if (node.type === 'dir') {
      result += `${indent}📁 ${node.name}/\n`;
      
      if (node.children) {
        // Sort directories first, then files
        const sortedChildren = [...node.children].sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'dir' ? -1 : 1;
        });
        
        // Limit number of entries per level to prevent context overflow
        const maxEntries = 10;
        const displayedChildren = sortedChildren.slice(0, maxEntries);
        
        for (const child of displayedChildren) {
          result += this.formatFileTreeForContext(child, depth + 1);
        }
        
        if (sortedChildren.length > maxEntries) {
          result += `${indent}  ... and ${sortedChildren.length - maxEntries} more items\n`;
        }
      }
    } else {
      result += `${indent}📄 ${node.name}\n`;
    }
    
    return result;
  }

  private async getSampleFiles(
    owner: string, 
    repoName: string, 
    maxFiles: number
  ): Promise<Record<string, string>> {
    if (!this.fileTree) {
      return {};
    }
    
    const result: Record<string, string> = {};
    const fileList: { path: string, name: string }[] = [];
    
    // Collect all files
    const collectFiles = (node: FileTree, currentPath: string = '') => {
      if (node.type === 'file') {
        const relativePath = currentPath ? `${currentPath}/${node.name}` : node.name;
        fileList.push({ path: relativePath, name: node.name });
      } else if (node.children) {
        const nextPath = currentPath ? `${currentPath}/${node.name}` : node.name;
        for (const child of node.children) {
          collectFiles(child, nextPath);
        }
      }
    };
    
    collectFiles(this.fileTree);
    
    // Prioritize important files (main entry points, configuration files, etc.)
    const importantPatterns = [
      /main\.(py|js|ts|java|cpp|go)$/i,
      /index\.(py|js|ts|java|cpp|go)$/i,
      /config\.(py|json|yaml|yml)$/i,
      /requirements\.txt$/i,
      /package\.json$/i,
      /readme\.md$/i,
      /setup\.py$/i
    ];
    
    const prioritizedFiles = fileList
      .sort((a, b) => {
        const aImportance = importantPatterns.findIndex(p => p.test(a.name));
        const bImportance = importantPatterns.findIndex(p => p.test(b.name));
        
        // If both match patterns, compare by pattern importance
        if (aImportance >= 0 && bImportance >= 0) {
          return aImportance - bImportance;
        }
        
        // Prioritize matching over non-matching
        if (aImportance >= 0) return -1;
        if (bImportance >= 0) return 1;
        
        // Otherwise sort alphabetically
        return a.path.localeCompare(b.path);
      })
      .slice(0, maxFiles);
    
    // Get content for prioritized files
    for (const file of prioritizedFiles) {
      try {
        if (this.githubService) {
          const content = await this.githubService.getFileContent(owner, repoName, file.path);
          result[file.path] = content;
        }
      } catch (error) {
        console.error(`Error reading file ${file.path}:`, error);
        // Skip this file if there's an error
      }
    }
    
    return result;
  }

  private async buildFullRepoContext(maxTokens: number = 15000): Promise<string> {
    if (!this.repoData || !this.fileTree) {
      throw new Error('Repository data or file tree not available');
    }
    
    try {
      // Extract owner and repo name from the clone result
      const { owner, name } = this.repoData;
      
      // Get the most important files
      const importantFiles = this.identifyImportantFiles(this.fileTree);
      
      // Get the content of important files
      const fileContents = await this.getSampleFiles(owner, name, 10);
      
      // Build the context
      return this.buildRepositoryContext(this.repoData, this.fileTree, fileContents);
    } catch (error) {
      console.error('Error building repository context:', error);
      throw error;
    }
  }

  public async generateCodeWithAgent(
    prompt: string,
    language?: string,
    model: OpenRouterModels = 'anthropic/claude-3-opus'
  ): Promise<string> {
    if (!this.githubService) {
      throw new Error('GitHub service is not initialized. This feature is only available in browser environments.');
    }
    
    if (!this.repoData) {
      throw new Error('No repository is currently loaded.');
    }
    
    const fileTree = await this.getFileTree();
    if (!fileTree) {
      throw new Error('Failed to retrieve file tree.');
    }
    
    const importantFiles = this.identifyImportantFiles(fileTree);
    
    // Get content of important files to provide context
    const fileContents: Record<string, string> = {};
    for (const filePath of importantFiles.slice(0, 5)) { // Limit to first 5 important files
      try {
        fileContents[filePath] = await this.getFileContent(filePath);
      } catch (error) {
        console.warn(`Failed to read file: ${filePath}`, error);
      }
    }
    
    // Build context
    const repoContext = this.buildRepositoryContext(this.repoData, fileTree, fileContents);
    
    // Enhanced prompt for code generation
    const generationPrompt = `
Act as an agentic programming assistant. You are tasked with generating high-quality code based on the following requirements:

USER REQUEST:
${prompt}

REPOSITORY CONTEXT:
${repoContext}

${language ? `The code should be written in ${language}.` : 'Use the appropriate language based on the repository context.'}

Your generated code should:
1. Follow best practices and patterns seen in the existing codebase
2. Be complete and ready to use
3. Include clear comments explaining complex logic
4. Handle edge cases and errors appropriately
5. Be optimized for performance and readability

Format your response as clean, properly formatted code that can be directly integrated into the codebase.
If you need to generate multiple files or file segments, clearly indicate each with file paths.
`;
    
    // Use a more powerful model for code generation with fallback
    return this.generateCompletionWithFallback(
      this.getSystemPrompt(true),
      [{ role: 'user', content: generationPrompt }],
      model
    );
  }
  
  public async editFile(
    filePath: string,
    editPrompt: string,
    model: OpenRouterModels = 'anthropic/claude-3-opus'
  ): Promise<string> {
    if (!this.githubService || !this.repoData) {
      throw new Error('Repository not loaded or service not initialized');
    }
    
    try {
      // Get the current file content
      const currentContent = await this.getFileContent(filePath);
      
      // Create a prompt that includes the current file and instructions for editing
      const editFilePrompt = `
Act as an expert code editor. You need to modify the following file according to these instructions:

FILE PATH: ${filePath}
EDIT REQUEST: ${editPrompt}

CURRENT FILE CONTENT:
\`\`\`
${currentContent}
\`\`\`

Please provide the COMPLETE updated file content that incorporates the requested changes.
Maintain the same style, formatting, and patterns found in the original code.
Do not omit any parts of the file - return the full content with your edits incorporated.
`;
      
      // Generate the edited content with fallback
      const editedContent = await this.generateCompletionWithFallback(
        this.getSystemPrompt(false),
        [{ role: 'user', content: editFilePrompt }],
        model
      );
      
      return editedContent;
    } catch (error) {
      console.error('Error editing file:', error);
      throw new Error(`Failed to edit file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  public async createFile(
    directoryPath: string,
    fileName: string,
    fileDescription: string,
    model: OpenRouterModels = 'anthropic/claude-3-opus'
  ): Promise<string> {
    if (!this.githubService || !this.repoData) {
      throw new Error('Repository not loaded or service not initialized');
    }
    
    // Get file tree for context
    const fileTree = await this.getFileTree();
    if (!fileTree) {
      throw new Error('Failed to retrieve file tree.');
    }
    
    // Identify some similar files to provide context
    const similarFiles: string[] = [];
    
    // Helper function to find files with similar extension
    const findSimilarFiles = (node: FileTree, path: string = '') => {
      const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';
      
      if (node.type === 'file' && extension) {
        const nodeExtension = node.name.includes('.') ? node.name.split('.').pop()?.toLowerCase() : '';
        if (nodeExtension === extension) {
          similarFiles.push(path ? `${path}/${node.name}` : node.name);
        }
      } else if (node.children) {
        const nextPath = path ? `${path}/${node.name}` : node.name;
        for (const child of node.children) {
          findSimilarFiles(child, nextPath);
        }
      }
    };
    
    findSimilarFiles(fileTree);
    
    // Get content of similar files for reference
    const similarFileContents: Record<string, string> = {};
    for (const filePath of similarFiles.slice(0, 3)) { // Limit to 3 similar files
      try {
        similarFileContents[filePath] = await this.getFileContent(filePath);
      } catch (error) {
        console.warn(`Failed to read similar file: ${filePath}`, error);
      }
    }
    
    // Create a prompt for file generation
    const createFilePrompt = `
Act as an expert code generator. You need to create a new file with the following specifications:

FILE PATH: ${directoryPath}/${fileName}
FILE DESCRIPTION: ${fileDescription}

REPOSITORY CONTEXT:
Repository: ${this.repoData.owner}/${this.repoData.name}
${Object.keys(similarFileContents).length > 0 ? 'Here are some similar files for reference:' : 'No similar files found for reference.'}

${Object.entries(similarFileContents).map(([path, content]) => `
FILE: ${path}
\`\`\`
${content}
\`\`\``).join('\n')}

Please create a complete, well-structured file that:
1. Follows the coding style and patterns of the similar files
2. Implements the functionality described in the file description
3. Includes appropriate imports, error handling, and documentation
4. Is ready to be integrated into the existing codebase

Return ONLY the file content without additional explanations.
`;
    
    // Generate the new file content with fallback
    const fileContent = await this.generateCompletionWithFallback(
      this.getSystemPrompt(false),
      [{ role: 'user', content: createFilePrompt }],
      model
    );
    
    return fileContent;
  }

  // New method for autonomous problem-solving
  public async solveCodeProblem(
    problemDescription: string,
    model: OpenRouterModels = 'anthropic/claude-3-opus'
  ): Promise<{solution: string, explanation: string, files: {path: string, content: string}[]}> {
    if (!this.githubService || !this.repoData) {
      throw new Error('Repository not loaded or service not initialized');
    }
    
    const fileTree = await this.getFileTree();
    if (!fileTree) {
      throw new Error('Failed to retrieve file tree.');
    }
    
    // Build comprehensive repository context
    const repoContext = await this.buildFullRepoContext();
    
    // Create a multi-stage problem-solving approach
    const planningPrompt = `
You are an autonomous coding agent with the ability to understand, plan, and implement solutions to complex coding problems.

PROBLEM DESCRIPTION:
${problemDescription}

REPOSITORY CONTEXT:
${repoContext}

Your task is to develop a comprehensive plan to solve this problem. Please proceed in the following stages:

STAGE 1: PROBLEM ANALYSIS
- Understand what the problem is asking
- Identify relevant parts of the codebase that need to be modified/extended
- List any constraints or requirements

STAGE 2: SOLUTION PLANNING
- Break down the solution into logical steps
- Identify which files need to be created or modified
- Outline the changes needed for each file
- Consider edge cases and potential issues

Please organize your response as follows:
1. Problem Analysis: (your detailed analysis)
2. Files to Modify: (list of files)
3. Files to Create: (list of files with purpose)
4. Implementation Plan: (step-by-step approach)
`;
    
    // Get the planning response with fallback
    const planningResponse = await this.generateCompletionWithFallback(
      this.getSystemPrompt(true),
      [{ role: 'user', content: planningPrompt }],
      model
    );
    
    // Implementation phase - create a detailed implementation based on the plan
    const implementationPrompt = `
You previously analyzed a coding problem and created a plan. Now, implement your solution based on the plan.

PROBLEM DESCRIPTION:
${problemDescription}

YOUR PLAN:
${planningResponse}

REPOSITORY CONTEXT:
${repoContext.substring(0, 3000)}... [truncated for brevity]

Now, please implement your solution by providing the complete code for each file that needs to be modified or created.
For each file, provide the full path and complete content of the file after your changes.

Format your response as follows:

SOLUTION EXPLANATION:
(Provide a concise explanation of your implemented solution)

IMPLEMENTATION:
[FILE: path/to/file1]
\`\`\`
(Full file content with changes)
\`\`\`

[FILE: path/to/file2]
\`\`\`
(Full file content with changes)
\`\`\`

(And so on for each file)
`;
    
    // Get the implementation response with fallback
    const implementationResponse = await this.generateCompletionWithFallback(
      this.getSystemPrompt(true),
      [{ role: 'user', content: implementationPrompt }],
      model
    );
    
    // Parse the implementation to extract files and explanation
    const result = this.parseImplementationResponse(implementationResponse);
    
    return result;
  }
  
  // Parse the implementation response to extract files and explanation
  private parseImplementationResponse(
    response: string
  ): {solution: string, explanation: string, files: {path: string, content: string}[]} {
    const files: {path: string, content: string}[] = [];
    let explanation = '';
    
    // Extract explanation
    const explanationMatch = response.match(/SOLUTION EXPLANATION:\s*\n([\s\S]*?)(?=IMPLEMENTATION:|$)/);
    if (explanationMatch && explanationMatch[1]) {
      explanation = explanationMatch[1].trim();
    }
    
    // Extract files
    const fileRegex = /\[FILE: (.+?)\]\s*```(?:\w*\n)?([\s\S]*?)```/g;
    let match;
    
    while ((match = fileRegex.exec(response)) !== null) {
      const path = match[1].trim();
      const content = match[2].trim();
      
      files.push({
        path,
        content
      });
    }
    
    return {
      solution: response,
      explanation,
      files
    };
  }
  
  // Autonomous multi-step search and modify
  public async autonomousSearchAndModify(
    task: string,
    model: OpenRouterModels = 'anthropic/claude-3-opus'
  ): Promise<{explanation: string, modifications: {path: string, content: string}[]}> {
    if (!this.githubService || !this.repoData) {
      throw new Error('Repository not loaded or service not initialized');
    }
    
    // Step 1: Search for relevant files
    const fileTree = await this.getFileTree();
    if (!fileTree) {
      throw new Error('Failed to retrieve file tree.');
    }

    const searchPrompt = `
You are an autonomous code search agent. Your task is to find relevant files for solving this problem:

TASK:
${task}

REPOSITORY STRUCTURE:
${this.formatFileTreeForContext(fileTree, 0)}

Please identify the most relevant files that would need to be examined to solve this task.
Return your answer as a JSON array of file paths, ordered by relevance:
["path/to/file1", "path/to/file2", ...]
`;
    
    const searchResponse = await this.generateCompletionWithFallback(
      this.getSystemPrompt(true),
      [{ role: 'user', content: searchPrompt }],
      model
    );
    
    // Extract file paths from the JSON response
    let relevantFilePaths: string[] = [];
    try {
      // Find a JSON array in the response
      const jsonMatch = searchResponse.match(/\[\s*".*"\s*\]/);
      if (jsonMatch) {
        relevantFilePaths = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to regex extraction if JSON parsing fails
        const filePathRegex = /"([^"]+)"/g;
        let match;
        while ((match = filePathRegex.exec(searchResponse)) !== null) {
          relevantFilePaths.push(match[1]);
        }
      }
    } catch (error) {
      console.error('Error parsing search response:', error);
      relevantFilePaths = [];
    }
    
    // Limit to maximum 5 files to avoid token limits
    relevantFilePaths = relevantFilePaths.slice(0, 5);
    
    // Step 2: Analyze relevant files
    const fileContents: Record<string, string> = {};
    for (const path of relevantFilePaths) {
      try {
        fileContents[path] = await this.getFileContent(path);
      } catch (error) {
        console.warn(`Failed to read file: ${path}`, error);
      }
    }
    
    // Step 3: Plan modifications
    const planPrompt = `
You are an autonomous code modification agent. You need to implement the following task:

TASK:
${task}

RELEVANT FILES:
${Object.entries(fileContents).map(([path, content]) => `
[FILE: ${path}]
\`\`\`
${content}
\`\`\``).join('\n')}

Based on these files, please provide a comprehensive plan for implementing the requested task.
Your plan should include:
1. Overall approach
2. Specific changes needed for each file
3. Any new files that need to be created
`;
    
    const planResponse = await this.generateCompletionWithFallback(
      this.getSystemPrompt(true),
      [{ role: 'user', content: planPrompt }],
      model
    );
    
    // Step 4: Implement changes
    const implementPrompt = `
You are an autonomous code implementation agent. You need to implement the following task according to your plan:

TASK:
${task}

YOUR PLAN:
${planResponse}

RELEVANT FILES:
${Object.entries(fileContents).map(([path, content]) => `
[FILE: ${path}]
\`\`\`
${content}
\`\`\``).join('\n')}

Please provide the full implementation of your changes. For each file you modify or create, provide:
1. The full file path
2. The complete content of the file after your changes

Format your response as follows:

EXPLANATION:
(Brief explanation of the changes made)

MODIFIED FILES:
[FILE: path/to/file1]
\`\`\`
(Full file content with changes)
\`\`\`

[FILE: path/to/file2]
\`\`\`
(Full file content with changes)
\`\`\`

[FILE: path/to/new_file]
\`\`\`
(Full file content)
\`\`\`
`;
    
    const implementResponse = await this.generateCompletionWithFallback(
      this.getSystemPrompt(true),
      [{ role: 'user', content: implementPrompt }],
      model
    );
    
    // Parse the implementation to extract files and explanation
    return this.parseAutonomousResponse(implementResponse);
  }
  
  // Parse the autonomous response to extract files and explanation
  private parseAutonomousResponse(
    response: string
  ): {explanation: string, modifications: {path: string, content: string}[]} {
    const modifications: {path: string, content: string}[] = [];
    let explanation = '';
    
    // Extract explanation
    const explanationMatch = response.match(/EXPLANATION:\s*\n([\s\S]*?)(?=MODIFIED FILES:|$)/);
    if (explanationMatch && explanationMatch[1]) {
      explanation = explanationMatch[1].trim();
    }
    
    // Extract files
    const fileRegex = /\[FILE: (.+?)\]\s*```(?:\w*\n)?([\s\S]*?)```/g;
    let match;
    
    while ((match = fileRegex.exec(response)) !== null) {
      const path = match[1].trim();
      const content = match[2].trim();
      
      modifications.push({
        path,
        content
      });
    }
    
    return {
      explanation,
      modifications
    };
  }

  // File search based on functionality description
  public async searchFilesByFunctionality(
    description: string,
    model: OpenRouterModels = 'anthropic/claude-3-opus'
  ): Promise<string[]> {
    if (!this.githubService || !this.repoData) {
      throw new Error('Repository not loaded or service not initialized');
    }
    
    const fileTree = await this.getFileTree();
    if (!fileTree) {
      throw new Error('Failed to retrieve file tree.');
    }
    
    const searchPrompt = `
You are a code search agent with semantic understanding of code. Your task is to find files that likely contain the functionality described below:

FUNCTIONALITY DESCRIPTION:
${description}

REPOSITORY STRUCTURE:
${this.formatFileTreeForContext(fileTree, 0)}

Based on the file names and structure, identify the most relevant files that would likely contain or be related to the described functionality.
Return your answer as a JSON array of file paths, ordered by likely relevance:
["path/to/file1", "path/to/file2", ...]

Explain your reasoning for each file selection briefly.
`;
    
    const searchResponse = await this.generateCompletionWithFallback(
      this.getSystemPrompt(true),
      [{ role: 'user', content: searchPrompt }],
      model
    );
    
    // Extract file paths from the JSON response
    let relevantFilePaths: string[] = [];
    try {
      // Find a JSON array in the response
      const jsonMatch = searchResponse.match(/\[\s*".*"\s*\]/);
      if (jsonMatch) {
        relevantFilePaths = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to regex extraction if JSON parsing fails
        const filePathRegex = /"([^"]+)"/g;
        let match;
        while ((match = filePathRegex.exec(searchResponse)) !== null) {
          relevantFilePaths.push(match[1]);
        }
      }
    } catch (error) {
      console.error('Error parsing search response:', error);
      relevantFilePaths = [];
    }
    
    return relevantFilePaths;
  }
  
  // Code generation with tests
  public async generateCodeWithTests(
    specDescription: string,
    language?: string,
    model: OpenRouterModels = 'anthropic/claude-3-opus'
  ): Promise<{implementation: string, tests: string}> {
    if (!this.githubService) {
      throw new Error('GitHub service is not initialized. This feature is only available in browser environments.');
    }
    
    if (!this.repoData) {
      throw new Error('No repository is currently loaded.');
    }
    
    // Build repository context
    const repoContext = await this.buildFullRepoContext(5000); // Limit context size
    
    // Enhanced prompt for code generation with tests
    const generationPrompt = `
Act as an expert software engineer with test-driven development expertise. You need to implement code according to this specification:

SPECIFICATION:
${specDescription}

REPOSITORY CONTEXT:
${repoContext}

${language ? `The code should be written in ${language}.` : 'Use the appropriate language based on the repository context.'}

Your task is to:
1. Create a high-quality implementation that meets the specification
2. Write comprehensive tests for this implementation

Please provide:
1. The implementation code
2. Test code that verifies the implementation works correctly

Format your response as follows:

IMPLEMENTATION:
\`\`\`
(Your implementation code here)
\`\`\`

TESTS:
\`\`\`
(Your test code here)
\`\`\`
`;
    
    const response = await this.generateCompletionWithFallback(
      this.getSystemPrompt(true),
      [{ role: 'user', content: generationPrompt }],
      model
    );
    
    // Parse the response to extract implementation and tests
    const implementationMatch = response.match(/IMPLEMENTATION:\s*```(?:\w*\n)?([\s\S]*?)```/);
    const testsMatch = response.match(/TESTS:\s*```(?:\w*\n)?([\s\S]*?)```/);
    
    return {
      implementation: implementationMatch ? implementationMatch[1].trim() : '',
      tests: testsMatch ? testsMatch[1].trim() : ''
    };
  }

  // Add a helper method to check API connectivity
  public async checkApiConnectivity(): Promise<{ status: 'ok' | 'error', message?: string }> {
    // Return cached result if checked within the last minute
    const now = Date.now();
    if (this.lastApiCheck && (now - this.lastApiCheck.timestamp) < 60000) {
      return { 
        status: this.lastApiCheck.status, 
        message: this.lastApiCheck.message 
      };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://m31-mini.vercel.app/',
          'X-Title': 'M31 Mini'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API connection check failed with status ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (parseError) {
          // Use the text response if parsing fails
        }
        
        this.lastApiCheck = {
          timestamp: now,
          status: 'error',
          message: errorMessage
        };
        
        return { status: 'error', message: errorMessage };
      }
      
      const data = await response.json();
      
      // Check if the data includes our required models
      const availableModels = data.data.map((model: any) => model.id);
      const ourRequiredModels = this.models;
      
      const missingModels = ourRequiredModels.filter(
        model => !availableModels.includes(model)
      );
      
      if (missingModels.length > 0) {
        const missingModelsMessage = `Some required models are unavailable: ${missingModels.join(', ')}`;
        console.warn(missingModelsMessage);
        
        // Even if some models are missing, if we have the fallbacks, consider the API okay
        const fallbackModels = ['google/gemini-pro', 'anthropic/claude-instant-1', 'mistralai/mistral-7b-instruct'];
        const hasFallbacks = fallbackModels.some(model => availableModels.includes(model));
        
        if (!hasFallbacks) {
          this.lastApiCheck = {
            timestamp: now,
            status: 'error',
            message: 'Critical models are unavailable. Some features may not work.'
          };
          
          return { 
            status: 'error', 
            message: 'Critical models are unavailable. Some features may not work.' 
          };
        }
      }
      
      this.lastApiCheck = {
        timestamp: now,
        status: 'ok'
      };
      
      return { status: 'ok' };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error checking API connectivity';
      
      this.lastApiCheck = {
        timestamp: now,
        status: 'error',
        message: errorMessage
      };
      
      return { status: 'error', message: errorMessage };
    }
  }

  // Helper method to get the best available model for a specific task
  public async getBestAvailableModel(
    preferredModel: OpenRouterModels,
    taskType: 'code' | 'analysis' | 'edit' | 'general' = 'general'
  ): Promise<OpenRouterModels> {
    try {
      const apiStatus = await this.checkApiConnectivity();
      
      if (apiStatus.status === 'ok') {
        // Try to use the preferred model
        return preferredModel;
      }
      
      // If API status check failed, use fallbacks based on task type
      switch (taskType) {
        case 'code':
          return 'google/gemini-pro';
        case 'analysis':
          return 'mistralai/mixtral-8x7b-instruct';
        case 'edit':
          return 'anthropic/claude-instant-1';
        case 'general':
        default:
          return 'mistralai/mistral-7b-instruct';
      }
    } catch (error) {
      console.error('Error getting best available model:', error);
      // Default fallback
      return 'google/gemini-pro';
    }
  }
} 