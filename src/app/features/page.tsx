'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { FiCode, FiCpu, FiFeather, FiZap, FiShield, FiDownload } from 'react-icons/fi';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function FeaturesPage() {
  const features = [
    {
      icon: <FiCpu />,
      title: 'Cutting-Edge AI Models',
      description: 'Access to the latest AI models via OpenRouter API, including Claude and GPT models.'
    },
    {
      icon: <FiCode />,
      title: 'Professional Python Code',
      description: 'Generate clean, efficient, and production-ready Python code without comments.'
    },
    {
      icon: <FiFeather />,
      title: 'Lightweight Solution',
      description: 'Optimized for performance and simplicity without unnecessary complexity.'
    },
    {
      icon: <FiZap />,
      title: 'Instant Results',
      description: 'Get immediate code generation with streaming responses for better user experience.'
    },
    {
      icon: <FiShield />,
      title: 'Best Practices',
      description: 'All generated code follows Python best practices and conventions for readability.'
    },
    {
      icon: <FiDownload />,
      title: 'Easy Export',
      description: 'Download your generated code with automatic meaningful file naming.'
    }
  ];

  return (
    <Layout title="Features | M31-Mini" description="Explore the features of M31-Mini Python code generator">
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-blue-500 text-transparent bg-clip-text">
              Powerful Features
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              M31-Mini comes packed with capabilities designed to streamline your Python development workflow.
            </p>
          </motion.div>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              variants={item}
              className="bg-gradient-to-br from-dark-100 to-dark-200 p-8 rounded-xl border border-gray-800 hover:border-primary-600 transition-all duration-300 hover:shadow-lg hover:shadow-primary-900/20 group"
            >
              <div className="p-4 bg-primary-600/10 rounded-lg inline-block mb-6 text-primary-400 group-hover:bg-primary-600/20 transition-all duration-300">
                <span className="text-3xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-20 p-10 bg-gradient-to-r from-primary-900/30 to-blue-900/30 rounded-xl border border-primary-800/50 max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-6 md:mb-0 md:mr-10">
              <div className="p-5 bg-primary-600/20 text-primary-400 rounded-full">
                <FiCode className="h-10 w-10" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-white">Ready to generate Python code?</h3>
              <p className="text-gray-300 mb-6">
                Start creating professional Python code without comments in seconds.
              </p>
              <a 
                href="/"
                className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Try It Now
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
} 