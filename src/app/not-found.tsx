'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCode, FiHome, FiAlertCircle } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-300 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-primary-600/30 rounded-full blur-xl"></div>
            <div className="relative bg-gradient-to-br from-primary-600 to-blue-600 p-5 rounded-full shadow-lg flex items-center justify-center">
              <FiAlertCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <div className="bg-gradient-to-r from-primary-400 to-blue-500 text-transparent bg-clip-text text-2xl font-bold mb-6">
            Page Not Found
          </div>
          
          <p className="text-gray-300 mb-10">
            The page you are looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg shadow-primary-900/20"
            >
              <FiHome className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
            <Link 
              href="/examples"
              className="inline-flex items-center justify-center bg-dark-100 hover:bg-dark-200 text-white py-3 px-6 rounded-lg border border-gray-700 transition-colors duration-300"
            >
              <FiCode className="mr-2 h-5 w-5" />
              View Examples
            </Link>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-gray-500 text-sm"
        >
          <p>
            &copy; {new Date().getFullYear()} M31-Mini | Python Code Generator
          </p>
        </motion.div>
      </div>
      
      {/* Background decorations */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
} 