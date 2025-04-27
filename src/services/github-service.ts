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
  private debug: boolean = true; // Enable debug logging

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
    if (this.debug) console.log('GitHubService initialized');
  }

  private async ensureInitialized(): Promise<boolean> {
    if (!isBrowser) {
      console.warn('GitHub service is only available in browser environments');
      return false;
    }

    if (this.debug) console.log('Ensuring GitHubService is initialized...');

    // Wait for imports to complete if they haven't already
    if (!git || !http || !fs) {
      if (this.debug) console.log('Loading required dependencies...');
      try {
        await Promise.all([
          import('isomorphic-git').then(module => { 
            git = module;
            if (this.debug) console.log('Loaded isomorphic-git');
          }),
          import('isomorphic-git/http/web').then(module => { 
            http = module.default;
            if (this.debug) console.log('Loaded isomorphic-git/http/web');
          }),
          import('@isomorphic-git/lightning-fs').then(module => {
            const LightningFS = module.default;
            fs = new LightningFS('m31-mini-fs');
            if (this.debug) console.log('Initialized LightningFS');
          })
        ]);
        this.isInitialized = true;
        if (this.debug) console.log('All dependencies loaded successfully');
        return true;
      } catch (error) {
        console.error('Failed to initialize GitHub service:', error);
        return false;
      }
    }

    this.isInitialized = true;
    if (this.debug) console.log('GitHubService already initialized');
    return true;
  }

  async cloneRepository(url: string, progressCallback?: (progress: any) => void): Promise<GitHubRepo> {
    if (this.debug) console.log(`Cloning repository: ${url}`);
    
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
    
    if (this.debug) console.log(`Repository info: owner=${owner}, repo=${repoName}, dir=${dir}`);

    try {
      // Make sure the directory exists
      try {
        await fs.promises.mkdir(dir);
        if (this.debug) console.log(`Created directory: ${dir}`);
      } catch (err) {
        // Directory might already exist, ignore error
        if (this.debug) console.log(`Directory may already exist: ${dir}`, err);
      }

      // Clone the repository
      if (this.debug) console.log(`Starting clone operation...`);
      await git.clone({
        fs: fs.promises,
        http,
        dir,
        url,
        corsProxy: this.corsProxy,
        singleBranch: true,
        depth: 1,
        onProgress: (progress: any) => {
          if (this.debug && progress.phase) console.log(`Clone progress: ${progress.phase} - ${progress.loaded}/${progress.total}`);
          if (progressCallback) progressCallback(progress);
        },
      });
      if (this.debug) console.log(`Clone operation completed successfully`);

      // Get repository details from GitHub API
      if (this.debug) console.log(`Fetching repository details from GitHub API...`);
      const repoDetails = await this.getRepoDetails(owner, repoName);

      // Count files and analyze file types
      if (this.debug) console.log(`Analyzing repository content...`);
      const { fileCount, fileTypes } = await this.analyzeRepoContent(dir);
      if (this.debug) console.log(`Repository analysis complete: ${fileCount} files found`);

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
    if (this.debug) console.log(`Getting file tree for: ${owner}/${repoName}`);
    
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      throw new Error('GitHub service could not be initialized');
    }

    const dir = `/${owner}/${repoName}`;
    if (this.debug) console.log(`Directory path: ${dir}`);
    
    const rootTree: FileTree = {
      type: 'dir',
      name: repoName,
      path: dir,
      children: [],
    };

    try {
      if (this.debug) console.log(`Building file tree...`);
      await this.buildFileTree(rootTree, dir);
      if (this.debug) console.log(`File tree built successfully`);
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

    console.log(`GitHub service getFileContent: owner=${owner}, repo=${repoName}, path=${filePath}`);
    
    // Normalize path to ensure it doesn't have leading slashes
    if (filePath.startsWith('/')) {
      filePath = filePath.slice(1);
    }
    
    // Construct the full path
    const fullPath = `/${owner}/${repoName}/${filePath}`;
    console.log("Full file path:", fullPath);
    
    try {
      // Check if file exists first
      try {
        const stats = await fs.promises.stat(fullPath);
        if (!stats.isFile()) {
          throw new Error(`Path is not a file: ${fullPath}`);
        }
      } catch (e) {
        console.error("File stat error:", e);
        throw new Error(`File not found: ${fullPath}`);
      }
      
      // Read file content
      const content = await fs.promises.readFile(fullPath, { encoding: 'utf8' });
      console.log(`File content read successfully, size: ${content.length} characters`);
      return content.toString();
    } catch (error) {
      console.error('Error reading file content:', error);
      throw error;
    }
  }

  private async buildFileTree(node: FileTree, path: string): Promise<void> {
    if (this.debug) console.log(`Building file tree for path: ${path}`);
    
    try {
      const entries = await fs.promises.readdir(path);
      if (this.debug) console.log(`Found ${entries.length} entries in ${path}`);
      
      for (const entry of entries) {
        if (entry === '.git') {
          if (this.debug) console.log(`Skipping .git directory`);
          continue; // Skip .git directory
        }
        
        const fullPath = `${path}/${entry}`;
        if (this.debug) console.log(`Processing entry: ${entry}, fullPath: ${fullPath}`);
        
        try {
          const stats = await fs.promises.stat(fullPath);
          
          if (stats.isDirectory()) {
            if (this.debug) console.log(`${entry} is a directory`);
            const childNode: FileTree = {
              type: 'dir',
              name: entry,
              path: fullPath,
              children: [],
            };
            node.children?.push(childNode);
            await this.buildFileTree(childNode, fullPath);
          } else {
            if (this.debug) console.log(`${entry} is a file`);
            node.children?.push({
              type: 'file',
              name: entry,
              path: fullPath,
            });
          }
        } catch (error) {
          console.error(`Error processing entry ${entry}:`, error);
          // Continue with other entries instead of failing the whole operation
        }
      }
      
      if (this.debug) console.log(`Completed file tree for: ${path}`);
    } catch (error) {
      console.error(`Error reading directory ${path}:`, error);
      throw error;
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