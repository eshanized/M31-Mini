import React, { useState, useRef } from 'react';
import { FiGithub, FiLoader, FiCheckCircle, FiXCircle, FiCode, FiFileText, FiFolder } from 'react-icons/fi';
import { useAppStore } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function GitHubRepoInput() {
  const {
    apiKey,
    githubRepo,
    isLoadingRepo,
    repoLoadingProgress,
    fetchGithubRepo
  } = useAppStore();
  
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
    setError('');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      setError('Please set your API key first');
      return;
    }
    
    if (!repoUrl) {
      setError('Please enter a GitHub repository URL');
      return;
    }
    
    // Validate GitHub URL format
    const githubRegex = /^https?:\/\/github\.com\/[\w-]+\/[\w.-]+(\/?|\.git)?$/;
    if (!githubRegex.test(repoUrl)) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }
    
    try {
      await fetchGithubRepo(repoUrl);
      setRepoUrl('');
    } catch (error) {
      setError(`Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-6"
    >
      <motion.div 
        whileHover={{ 
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
          borderColor: "#6366f1" 
        }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden bg-dark-100/70 backdrop-blur-md rounded-xl border border-gray-800 p-6"
      >
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-purple-600/20 to-pink-600/20 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <motion.div 
            className="flex items-center mb-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-br from-primary-600 to-purple-600 p-2 rounded-lg mr-3"
            >
              <FiGithub className="h-6 w-6 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">GitHub Repository Analysis</h2>
          </motion.div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <label htmlFor="repo-url" className="block text-sm font-medium text-gray-300 mb-2">
                Repository URL
              </label>
              <div className="flex relative">
                <motion.span 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  animate={{ scale: isHovered ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiGithub className="h-5 w-5" />
                </motion.span>
                <input
                  ref={inputRef}
                  type="text"
                  id="repo-url"
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={handleInputChange}
                  onFocus={() => setIsHovered(true)}
                  onBlur={() => setIsHovered(false)}
                  className="flex-grow pl-10 pr-4 py-3 bg-dark-200/70 backdrop-blur-sm border border-gray-700 focus:border-primary-500 rounded-lg text-white transition-all duration-300 outline-none focus:ring-2 focus:ring-primary-500/40"
                  disabled={isLoadingRepo}
                />
                <motion.button
                  type="submit"
                  disabled={isLoadingRepo || !apiKey}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="ml-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-primary-600 disabled:hover:to-purple-600"
                >
                  {isLoadingRepo ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <FiLoader className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    'Analyze'
                  )}
                </motion.button>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 text-sm text-red-400 flex items-center"
                  >
                    <FiXCircle className="mr-1" /> {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </form>
          
          {/* Loading Progress Animation */}
          <AnimatePresence>
            {isLoadingRepo && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <div className="flex items-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <FiLoader className="h-4 w-4 text-primary-400" />
                    </motion.div>
                    <span>Cloning repository...</span>
                  </div>
                  <span className="font-mono">{repoLoadingProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-600 to-purple-600"
                    initial={{ width: '0%' }}
                    animate={{ width: `${repoLoadingProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <motion.div 
                  className="mt-4 text-xs text-gray-400 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  This may take a moment depending on repository size...
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Repository Info with Animation */}
          <AnimatePresence>
            {githubRepo && !isLoadingRepo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mt-6 bg-dark-200/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <motion.h3 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="font-medium text-primary-400 flex items-center"
                  >
                    <FiGithub className="mr-2" />
                    {githubRepo.owner}/{githubRepo.name}
                  </motion.h3>
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="flex items-center text-green-500"
                  >
                    <FiCheckCircle className="mr-1" /> 
                    <span className="text-sm">Ready for analysis</span>
                  </motion.div>
                </div>
                
                {githubRepo.description && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-gray-300 mb-3 italic border-l-2 border-primary-500/30 pl-2"
                  >
                    {githubRepo.description}
                  </motion.p>
                )}
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-3 gap-2 text-center text-xs"
                >
                  {[
                    { icon: <FiFileText className="h-4 w-4" />, label: 'Files', value: githubRepo.fileCount },
                    { icon: <FiCode className="h-4 w-4" />, label: 'Stars', value: githubRepo.stars },
                    { icon: <FiFolder className="h-4 w-4" />, label: 'Forks', value: githubRepo.forks }
                  ].map((item, index) => (
                    <motion.div 
                      key={item.label}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 + (index * 0.1) }}
                      whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
                      className="bg-dark-300/70 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50 transition-all duration-300"
                    >
                      <div className="font-semibold text-gray-300 flex justify-center mb-1">{item.icon}</div>
                      <div className="font-semibold text-gray-400">{item.label}</div>
                      <div className="text-primary-300 font-mono mt-1">{item.value}</div>
                    </motion.div>
                  ))}
                </motion.div>
                
                {/* File Types */}
                {Object.keys(githubRepo.fileTypes).length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mt-4"
                  >
                    <h4 className="text-xs font-medium text-gray-300 mb-2">File types:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(githubRepo.fileTypes)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([ext, count], index) => (
                          <motion.span 
                            key={ext}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + (index * 0.1) }}
                            whileHover={{ scale: 1.1 }}
                            className="bg-gradient-to-r from-primary-900/50 to-purple-900/50 text-xs px-3 py-1 rounded-full border border-primary-500/30 flex items-center"
                          >
                            <FiFileText className="h-3 w-3 mr-1 text-primary-400" />
                            {ext}: <span className="font-mono ml-1">{count as number}</span>
                          </motion.span>
                        ))
                      }
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Instructions */}
          <AnimatePresence>
            {githubRepo && !isLoadingRepo && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="mt-4 text-sm text-gray-400 bg-primary-900/10 p-3 rounded-lg border border-primary-500/20"
              >
                <div className="flex items-center text-primary-300 mb-1">
                  <FiCheckCircle className="h-4 w-4 mr-1" />
                  <span className="font-medium">Repository ready for AI analysis</span>
                </div>
                <p>
                  Use the prompt input below to ask questions about the code or 
                  request the AI to analyze specific aspects of the repository.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
} 