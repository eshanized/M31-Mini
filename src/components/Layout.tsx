import React, { ReactNode, useEffect, useState } from 'react';
import Navbar from './Navbar';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiGithub, FiExternalLink, FiHeart } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiCpu, FiClock, FiSave, FiSearch, FiBarChart2, FiBookOpen } from 'react-icons/fi';
import APIKeyInput from '../APIKeyInput';
import ModelSelector from './ModelSelector';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ 
  children, 
  title = 'M31-Mini | Professional Python Code Generator', 
  description = 'Generate professional Python code without comments using OpenRouter API'
}: LayoutProps) {
  // Animated gradient background colors
  const [gradientPosition, setGradientPosition] = useState({ x: 0, y: 0 });

  // Update gradient position based on mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setGradientPosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const gradientStyle = {
    backgroundImage: `radial-gradient(
      circle at ${gradientPosition.x}% ${gradientPosition.y}%,
      rgba(99, 102, 241, 0.05) 0%,
      rgba(99, 102, 241, 0.01) 25%,
      rgba(17, 24, 39, 1) 70%
    )`
  };

  // Loading animation
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark-300"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary-600/50 blur-xl rounded-full"></div>
                <motion.div
                  animate={{ 
                    rotate: 360,
                    boxShadow: [
                      "0 0 20px rgba(99, 102, 241, 0.3)",
                      "0 0 40px rgba(99, 102, 241, 0.5)",
                      "0 0 20px rgba(99, 102, 241, 0.3)"
                    ]
                  }}
                  transition={{ 
                    rotate: { duration: 2, ease: "linear", repeat: Infinity },
                    boxShadow: { duration: 1, repeat: Infinity } 
                  }}
                  className="relative bg-gradient-to-br from-primary-600 to-purple-600 p-5 rounded-full"
                >
                  <FiCode className="h-10 w-10 text-white" />
                </motion.div>
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mt-4 text-xl font-bold text-white"
              >
                M31-Mini
              </motion.h1>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex flex-col"
            style={{ background: "#111827" }}
          >
            {/* Animated gradient background */}
            <div 
              className="fixed inset-0 z-0 opacity-80 bg-dark-300" 
              style={gradientStyle}
            ></div>
            
            {/* Grid pattern overlay */}
            <div 
              className="fixed inset-0 z-0 opacity-10" 
              style={{ 
                backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            ></div>
            
            {/* Glow elements */}
            <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -z-10"></div>
            <div className="fixed bottom-1/3 right-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {children}
                </motion.div>
              </main>
              
              <footer className="relative bg-gradient-to-b from-transparent to-dark-300/80 backdrop-blur-sm border-t border-gray-800/30 pt-12 pb-8 z-10">
                <div className="container mx-auto px-4 max-w-6xl">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-gradient-to-br from-primary-600 to-purple-600 p-2 rounded-lg">
                          <FiCode className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">M31-Mini</span>
                      </div>
                      <p className="text-gray-300 mb-4 max-w-md">
                        A powerful Python code generator built with Next.js and React, 
                        designed to create professional, comment-free code using OpenRouter API.
                      </p>
                      <div className="flex items-center space-x-4">
                        <APIKeyInput />
                        <ModelSelector />
                        <a 
                          href="https://github.com/yourusername/M31-Mini" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center px-3 py-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <FiGithub className="mr-2" />
                          <span>GitHub</span>
                        </a>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-semibold mb-4">Navigation</h3>
                      <ul className="space-y-2">
                        {['Home', 'Features', 'Examples', 'About'].map((item, i) => (
                          <motion.li 
                            key={item}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.5 }}
                          >
                            <a 
                              href={item === 'Home' ? '/' : `/${item.toLowerCase()}`} 
                              className="text-gray-400 hover:text-primary-400 transition-colors"
                            >
                              {item}
                            </a>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-semibold mb-4">Resources</h3>
                      <ul className="space-y-2">
                        {[
                          { name: 'OpenRouter', url: 'https://openrouter.ai' },
                          { name: 'Next.js', url: 'https://nextjs.org' },
                          { name: 'Blackbox.ai', url: 'https://www.blackbox.ai' }
                        ].map((resource, i) => (
                          <motion.li 
                            key={resource.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i + 0.3, duration: 0.5 }}
                          >
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-primary-400 transition-colors flex items-center space-x-1"
                            >
                              <span>{resource.name}</span>
                              <FiExternalLink className="h-3 w-3" />
                            </a>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="border-t border-gray-800/50 pt-6 flex flex-col md:flex-row justify-between items-center"
                  >
                    <p className="text-gray-500 text-sm mb-4 md:mb-0">
                      &copy; {new Date().getFullYear()} M31-Mini | Python code generator
                    </p>
                    <p className="text-gray-500 text-sm flex items-center">
                      Made with <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      ><FiHeart className="h-3 w-3 mx-1 text-red-500" /></motion.span> using Next.js and OpenRouter
                    </p>
                  </motion.div>
                </div>
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 