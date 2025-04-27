'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { FiCode, FiGithub, FiExternalLink, FiStar } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <Layout title="About | M31-Mini" description="Learn about the M31-Mini Python code generator">
      <section className="py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center mb-8 shadow-xl shadow-primary-900/20">
              <FiCode className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-blue-500 text-transparent bg-clip-text">
              About M31-Mini
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              A powerful Python code generator built with Next.js and React, 
              designed to create professional, comment-free code using OpenRouter API.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-12"
          >
            <div className="bg-gradient-to-br from-dark-100 to-dark-200 p-8 rounded-xl border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 text-white">Our Mission</h2>
              <p className="text-gray-300 mb-4">
                M31-Mini was created to help developers quickly generate clean, efficient, 
                and production-ready Python code. We believe that great code should be 
                self-explanatory and follow best practices, eliminating the need for 
                excessive comments.
              </p>
              <p className="text-gray-300">
                By leveraging the latest AI models through OpenRouter, we provide access 
                to cutting-edge code generation capabilities in an easy-to-use interface.
              </p>
            </div>

            <div className="bg-gradient-to-br from-dark-100 to-dark-200 p-8 rounded-xl border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 text-white">Technology Stack</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-primary-400">Frontend</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                      Next.js with App Router
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                      React with TypeScript
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                      TailwindCSS for styling
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                      Framer Motion for animations
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                      Zustand for state management
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-primary-400">Backend & APIs</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                      OpenRouter API integration
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                      Access to Claude and GPT models
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                      Optimized system prompts
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                      Streaming responses
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-dark-100 to-dark-200 p-8 rounded-xl border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 text-white">Open Source</h2>
              <p className="text-gray-300 mb-6">
                M31-Mini is an open-source project inspired by Blackbox.ai. We believe in the power 
                of community-driven development and welcome contributions from developers around the world.
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <a 
                  href="https://github.com/yourusername/m31-mini"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  <FiGithub className="mr-2 h-5 w-5" />
                  View on GitHub
                </a>
                <a 
                  href="https://github.com/yourusername/m31-mini/stargazers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  <FiStar className="mr-2 h-5 w-5 text-yellow-400" />
                  Star the Project
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-900/30 to-blue-900/30 p-8 rounded-xl border border-primary-800/50">
              <h2 className="text-2xl font-bold mb-4 text-white">Inspiration</h2>
              <p className="text-gray-300 mb-6">
                M31-Mini was inspired by <a href="https://www.blackbox.ai" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 underline">Blackbox.ai</a>, 
                a powerful AI code generation tool. While we share similar goals of 
                helping developers create high-quality code, M31-Mini focuses specifically on 
                Python and leverages the OpenRouter API for model flexibility.
              </p>
              <a 
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary-400 hover:text-primary-300"
              >
                Learn more about OpenRouter
                <FiExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <h3 className="text-2xl font-bold mb-4 text-white">
              Ready to try M31-Mini?
            </h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Start generating professional Python code without comments in just a few clicks.
            </p>
            <a
              href="/"
              className="inline-flex items-center bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg hover:shadow-primary-600/20"
            >
              Try It Now
            </a>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
} 