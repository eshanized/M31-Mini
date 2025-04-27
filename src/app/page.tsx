'use client';

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCode, FiCpu, FiGithub, FiZap } from 'react-icons/fi';
import Link from 'next/link';
import { useAppStore } from '../lib/store';

export default function Home() {
  const { 
    apiKey, 
    setApiKey,
    initializeAIService,
    fetchAvailableModels
  } = useAppStore();
  
  const [hasHydrated, setHasHydrated] = useState(false);
  
  useEffect(() => {
    // Check for saved API key in localStorage
    const savedApiKey = localStorage.getItem('openrouter_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    setHasHydrated(true);
  }, [setApiKey]);
  
  useEffect(() => {
    if (apiKey && hasHydrated) {
      initializeAIService();
      fetchAvailableModels();
    }
  }, [apiKey, hasHydrated, initializeAIService, fetchAvailableModels]);
  
  return (
    <Layout>
      <HeroSection />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Generate Professional Python Code</h2>
          <p className="text-gray-300 mb-8 max-w-3xl mx-auto">
            M31-Mini helps you create clean, efficient, and production-ready Python code for data science, 
            machine learning, web development, and automation tasks.
          </p>
          
          <Link href="/generate" className="btn btn-primary inline-flex items-center text-lg px-8 py-3">
            <FiCode className="mr-2" /> Open Code Generator
            <FiArrowRight className="ml-2" />
          </Link>
        </motion.div>
        
        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card p-6"
          >
            <div className="bg-primary-600/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <FiCpu className="h-6 w-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Advanced AI Models</h3>
            <p className="text-gray-400">
              Leverages the latest AI models from OpenRouter to generate high-quality, optimized Python code.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card p-6"
          >
            <div className="bg-primary-600/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <FiGithub className="h-6 w-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">GitHub Integration</h3>
            <p className="text-gray-400">
              Clone and analyze GitHub repositories to generate context-aware code that fits your project.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card p-6"
          >
            <div className="bg-primary-600/10 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <FiZap className="h-6 w-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Optimized Output</h3>
            <p className="text-gray-400">
              Get clean, efficient code with no unnecessary comments or explanations - just production-ready Python.
            </p>
          </motion.div>
        </div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to start coding?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/generate" 
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all"
              >
                <span>Go to Generator</span>
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/examples" 
                className="inline-flex items-center space-x-2 px-6 py-3 bg-dark-100 hover:bg-dark-200 text-white font-medium rounded-lg border border-gray-700 hover:border-primary-500 transition-all"
              >
                <span>Browse Examples</span>
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/about" 
                className="inline-flex items-center space-x-2 px-6 py-3 bg-dark-100 hover:bg-dark-200 text-white font-medium rounded-lg border border-gray-700 hover:border-primary-500 transition-all"
              >
                <span>Learn More</span>
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
} 