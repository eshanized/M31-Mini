import axios from 'axios';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { GitHubService, GitHubRepo, FileTree } from './github-service';

export type OpenRouterModels = 'anthropic/claude-3-opus-20240229' | 
  'anthropic/claude-3-sonnet-20240229' | 
  'meta-llama/llama-3-70b-instruct' | 
  'meta-llama/llama-3-8b-instruct' | 
  'google/gemini-pro' | 
  'openai/gpt-4o';

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
    'anthropic/claude-3-opus-20240229',
    'anthropic/claude-3-sonnet-20240229',
    'meta-llama/llama-3-70b-instruct',
    'meta-llama/llama-3-8b-instruct',
    'google/gemini-pro',
    'openai/gpt-4o'
  ];
  private repoData: GitHubRepo | null = null;
  private fileTree: FileTree | null = null;

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
        return 'anthropic/claude-3-opus-20240229'; // Best for complex data analysis tasks
      case 'machine_learning':
        return 'anthropic/claude-3-opus-20240229'; // Best for ML code
      case 'web_development':
        return 'meta-llama/llama-3-70b-instruct'; // Good for web and API development
      case 'automation':
        return 'anthropic/claude-3-sonnet-20240229'; // Good balance for automation scripts
      case 'algorithms':
        return 'meta-llama/llama-3-70b-instruct'; // Good for algorithmic problems
      case 'simple_scripts':
        return 'meta-llama/llama-3-8b-instruct'; // Fast and efficient for simple tasks
      default:
        return 'anthropic/claude-3-sonnet-20240229'; // Good default option
    }
  }

  public getSystemPrompt(includeRepoContext: boolean = false): string {
    let prompt = `You are a world-class Python developer with expertise in data science, machine learning, web development, and automation.

CUSTOM RULES FOR CODE GENERATION:
1. Generate ONLY Python code. Do not include any explanations, comments, or documentation.
2. Follow PEP 8 style guidelines strictly.
3. Always use proper type hints in function signatures.
4. Optimize for readability and performance.
5. Write code that's production-ready and robust to edge cases.
6. Use appropriate error handling.
7. Use the latest Python best practices.
8. Do not include installation instructions or how to run the code.
9. Include only the implementation, no docstrings, comments, or explanations.`;

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

    prompt += `\n\nRESPONSE FORMAT:
In response to user's request, provide ONLY the Python code implementation, with no explanation.

EXAMPLE USER PROMPT:
Write a function to find the most frequent element in a list.

EXAMPLE RESPONSE:
from typing import TypeVar, List, Dict, Any
from collections import Counter

T = TypeVar('T')

def find_most_frequent(items: List[T]) -> T:
    if not items:
        raise ValueError("Input list cannot be empty")
    counter = Counter(items)
    return counter.most_common(1)[0][0]`;

    return prompt;
  }

  public getUserPrompt(prompt: string): string {
    return `Generate professional Python code for the following request: ${prompt}`;
  }

  public async generatePythonCode(prompt: string, model: OpenRouterModels = 'anthropic/claude-3-sonnet-20240229'): Promise<string> {
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
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating code:', error);
      throw error;
    }
  }

  public async streamPythonCode(
    prompt: string, 
    model: OpenRouterModels = 'anthropic/claude-3-sonnet-20240229', 
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
      
      return response.data.data
        .filter((model: any) => model.id.includes('anthropic') || model.id.includes('openai'))
        .map((model: any) => model.id);
    } catch (error) {
      console.error('Error fetching models:', error);
      return [
        'anthropic/claude-3-opus',
        'anthropic/claude-3-sonnet',
        'anthropic/claude-3-haiku',
        'openai/gpt-4o'
      ];
    }
  }

  public async cloneAndAnalyzeRepository(
    repoUrl: string, 
    progressCallback?: (progress: any) => void
  ): Promise<GitHubRepo> {
    if (!this.githubService) {
      throw new Error('GitHub service is only available in browser environments');
    }
    
    try {
      this.repoData = await this.githubService.cloneRepository(repoUrl, progressCallback);
      
      // Extract owner and repo name from the clone result
      const { owner, name } = this.repoData;
      
      // Get the file tree
      this.fileTree = await this.githubService.getFileTree(owner, name);
      
      return this.repoData;
    } catch (error) {
      console.error('Error cloning repository:', error);
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
      throw new Error('Repository not loaded');
    }
    
    if (!this.fileTree) {
      this.fileTree = await this.githubService.getFileTree(this.repoData.owner, this.repoData.name);
    }
    
    return this.fileTree;
  }
  
  // Helper method to get file content
  public async getFileContent(filePath: string): Promise<string> {
    if (!this.githubService || !this.repoData) {
      throw new Error('Repository not loaded');
    }
    
    return await this.githubService.getFileContent(this.repoData.owner, this.repoData.name, filePath);
  }

  public async analyzeRepositoryCode(
    prompt: string,
    model: OpenRouterModels = 'anthropic/claude-3-opus-20240229'
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
    
    return this.generateCompletion(this.getSystemPrompt(true), [
      { role: 'user', content: userPrompt }
    ], model);
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
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating completion:', error);
      throw error;
    }
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
} 