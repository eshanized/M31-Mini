import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { FiGithub, FiKey, FiCode, FiMenu, FiX, FiGitBranch } from 'react-icons/fi';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { apiKey, setApiKey } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const handleApiKeyChange = () => {
    const key = prompt('Enter your OpenRouter API key:');
    if (key) {
      setApiKey(key);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/generate', label: 'Generator', icon: <FiCode className="h-4 w-4 mr-1" /> },
    { href: '/repository', label: 'Repository', icon: <FiGitBranch className="h-4 w-4 mr-1" /> },
    { href: '/features', label: 'Features' },
    { href: '/examples', label: 'Examples' },
    { href: '/about', label: 'About' },
  ];

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-dark-200/90 backdrop-blur-lg shadow-lg' 
          : 'bg-dark-200 border-b border-gray-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-3 text-xl font-bold text-white"
            >
              <motion.div
                whileHover={{ rotate: 10 }}
                transition={{ duration: 0.3 }}
              >
                <FiCode className="h-7 w-7 text-primary-500" />
              </motion.div>
              <span className="bg-gradient-to-r from-primary-500 to-blue-500 text-transparent bg-clip-text">
                M31-Mini
              </span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    pathname === link.href
                      ? 'bg-primary-700/20 text-primary-400'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center pl-4 border-l border-gray-700">
              <button
                onClick={handleApiKeyChange}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors px-3 py-2"
              >
                <FiKey className="h-5 w-5" />
                <span>{apiKey ? 'API Key Set' : 'Set API Key'}</span>
              </button>
              
              <a
                href="https://github.com/yourusername/m31-mini"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors ml-4 px-3 py-2"
              >
                <FiGithub className="h-5 w-5" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-dark-200 border-t border-gray-800"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? 'bg-primary-700/20 text-primary-400'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-800">
            <div className="px-2 space-y-1">
              <button
                onClick={() => {
                  handleApiKeyChange();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors w-full px-3 py-2 rounded-md text-base font-medium"
              >
                <FiKey className="h-5 w-5" />
                <span>{apiKey ? 'API Key Set' : 'Set API Key'}</span>
              </button>
              
              <a
                href="https://github.com/yourusername/m31-mini"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors w-full px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiGithub className="h-5 w-5" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
} 