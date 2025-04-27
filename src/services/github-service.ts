import axios from 'axios';

// These will be initialized dynamically on the client-side
let git: any;
let http: any;
let fs: any;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Dynamically import browser-only modules
if (isBrowser) {
  import('isomorphic-git').then(module => {
    git = module;
  });
  
  import('isomorphic-git/http/web').then(module => {
    http = module.default;
  });
  
  // Import and initialize the file system
  import('@isomorphic-git/lightning-fs').then(module => {
    const LightningFS = module.default;
    fs = new LightningFS('m31-mini-fs');
  });
}

export interface GitHubRepo {
  name: string;
  owner: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  cloned: boolean;
  fileCount: number;
  fileTypes: Record<string, number>;
}

export interface FileTree {
  type: 'file' | 'dir';
  name: string;
  path: string;
  content?: string;
  children?: FileTree[];
}

export class GitHubService {
  private apiKey: string;
  private readonly corsProxy: string = 'https://cors.isomorphic-git.org';
  private isInitialized: boolean = false;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  private async ensureInitialized(): Promise<boolean> {
    if (!isBrowser) {
      console.warn('GitHub service is only available in browser environments');
      return false;
    }

    // Wait for imports to complete if they haven't already
    if (!git || !http || !fs) {
      try {
        await Promise.all([
          import('isomorphic-git').then(module => { git = module }),
          import('isomorphic-git/http/web').then(module => { http = module.default }),
          import('@isomorphic-git/lightning-fs').then(module => {
            const LightningFS = module.default;
            fs = new LightningFS('m31-mini-fs');
          })
        ]);
        this.isInitialized = true;
        return true;
      } catch (error) {
        console.error('Failed to initialize GitHub service:', error);
        return false;
      }
    }

    this.isInitialized = true;
    return true;
  }

  async cloneRepository(url: string, progressCallback?: (progress: any) => void): Promise<GitHubRepo> {
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      throw new Error('GitHub service could not be initialized');
    }

    // Extract owner and repo name from GitHub URL
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repoName] = match;
    const dir = `/${owner}/${repoName}`;

    try {
      // Make sure the directory exists
      try {
        await fs.promises.mkdir(dir);
      } catch (err) {
        // Directory might already exist, ignore error
      }

      // Clone the repository
      await git.clone({
        fs: fs.promises,
        http,
        dir,
        url,
        corsProxy: this.corsProxy,
        singleBranch: true,
        depth: 1,
        onProgress: progressCallback,
      });

      // Get repository details from GitHub API
      const repoDetails = await this.getRepoDetails(owner, repoName);

      // Count files and analyze file types
      const { fileCount, fileTypes } = await this.analyzeRepoContent(dir);

      return {
        name: repoName,
        owner,
        url,
        description: repoDetails.description || 'No description',
        stars: repoDetails.stars,
        forks: repoDetails.forks,
        cloned: true,
        fileCount,
        fileTypes,
      };
    } catch (error) {
      console.error('Error cloning repository:', error);
      throw error;
    }
  }

  async getFileTree(owner: string, repoName: string): Promise<FileTree> {
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      throw new Error('GitHub service could not be initialized');
    }

    const dir = `/${owner}/${repoName}`;
    const rootTree: FileTree = {
      type: 'dir',
      name: repoName,
      path: dir,
      children: [],
    };

    try {
      await this.buildFileTree(rootTree, dir);
      return rootTree;
    } catch (error) {
      console.error('Error getting file tree:', error);
      throw error;
    }
  }

  async getFileContent(owner: string, repoName: string, filePath: string): Promise<string> {
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      throw new Error('GitHub service could not be initialized');
    }

    const fullPath = `/${owner}/${repoName}/${filePath}`;
    
    try {
      const content = await fs.promises.readFile(fullPath, { encoding: 'utf8' });
      return content.toString();
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  private async buildFileTree(node: FileTree, path: string): Promise<void> {
    const entries = await fs.promises.readdir(path);
    
    for (const entry of entries) {
      if (entry === '.git') continue; // Skip .git directory
      
      const fullPath = `${path}/${entry}`;
      const stats = await fs.promises.stat(fullPath);
      
      if (stats.isDirectory()) {
        const childNode: FileTree = {
          type: 'dir',
          name: entry,
          path: fullPath,
          children: [],
        };
        node.children?.push(childNode);
        await this.buildFileTree(childNode, fullPath);
      } else {
        node.children?.push({
          type: 'file',
          name: entry,
          path: fullPath,
        });
      }
    }
  }

  private async analyzeRepoContent(dir: string): Promise<{ fileCount: number, fileTypes: Record<string, number> }> {
    let fileCount = 0;
    const fileTypes: Record<string, number> = {};

    const analyzeDir = async (path: string) => {
      const entries = await fs.promises.readdir(path);
      
      for (const entry of entries) {
        if (entry === '.git') continue; // Skip .git directory
        
        const fullPath = `${path}/${entry}`;
        const stats = await fs.promises.stat(fullPath);
        
        if (stats.isDirectory()) {
          await analyzeDir(fullPath);
        } else {
          fileCount++;
          
          // Get file extension
          const ext = entry.includes('.') ? entry.split('.').pop()?.toLowerCase() || 'unknown' : 'no-extension';
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        }
      }
    };

    await analyzeDir(dir);
    return { fileCount, fileTypes };
  }

  private async getRepoDetails(owner: string, repoName: string): Promise<{ description: string, stars: number, forks: number }> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `token ${this.apiKey}`;
      }

      const response = await axios.get(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
      
      return {
        description: response.data.description || '',
        stars: response.data.stargazers_count || 0,
        forks: response.data.forks_count || 0,
      };
    } catch (error) {
      console.error('Error fetching repository details:', error);
      return {
        description: '',
        stars: 0,
        forks: 0,
      };
    }
  }
} 