"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiEye, FiArrowLeft } from 'react-icons/fi';
import CodeEditor from '@/components/CodeEditor';
import Link from 'next/link';

interface SavedCode {
  id: string;
  name: string;
  code: string;
  language: string;
  date: string;
}

export default function SavedCodePage() {
  const router = useRouter();
  const [savedCodes, setSavedCodes] = useState<SavedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<SavedCode | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // Load saved codes from localStorage
    const loadSavedCodes = () => {
      try {
        const saved = localStorage.getItem('m31_saved_codes');
        if (saved) {
          const parsedCodes = JSON.parse(saved);
          setSavedCodes(parsedCodes);
        }
      } catch (error) {
        console.error('Error loading saved codes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedCodes();
  }, []);

  const handleDelete = (id: string) => {
    const updatedCodes = savedCodes.filter(code => code.id !== id);
    setSavedCodes(updatedCodes);
    localStorage.setItem('m31_saved_codes', JSON.stringify(updatedCodes));
    setShowDeleteConfirm(null);
    
    // If we're deleting the currently selected code, clear the selection
    if (selectedCode && selectedCode.id === id) {
      setSelectedCode(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/" className="text-gray-400 hover:text-white mr-4">
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white">Saved Code Snippets</h1>
        </div>

        {savedCodes.length === 0 ? (
          <div className="text-center py-16 bg-dark-200 rounded-xl border border-gray-800">
            <p className="text-gray-400 mb-4">You don't have any saved code snippets yet.</p>
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors"
            >
              Go Back to Create Some
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 bg-dark-200 rounded-xl border border-gray-800 p-4 h-min">
              <h2 className="text-white text-lg font-semibold mb-4">Your Snippets</h2>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {savedCodes.map((code) => (
                  <div 
                    key={code.id}
                    className={`p-3 rounded-lg transition-colors cursor-pointer ${
                      selectedCode?.id === code.id 
                        ? 'bg-accent-500/20 border border-accent-500/40' 
                        : 'bg-dark-300 border border-gray-800 hover:bg-dark-400'
                    }`}
                    onClick={() => setSelectedCode(code)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium truncate">{code.name}</h3>
                        <p className="text-gray-400 text-xs mt-1">{formatDate(code.date)}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCode(code);
                          }}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                          title="View code"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(code.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Delete code"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {showDeleteConfirm === code.id && (
                      <div className="mt-2 p-2 bg-red-500/10 rounded-md">
                        <p className="text-white text-sm mb-2">Delete this snippet?</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(code.id);
                            }}
                            className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(null);
                            }}
                            className="px-2 py-1 text-xs text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-1 lg:col-span-2">
              {selectedCode ? (
                <div className="mb-4">
                  <div className="bg-dark-200 rounded-xl border border-gray-800 mb-4">
                    <div className="p-4 border-b border-gray-800">
                      <h2 className="text-white text-lg font-semibold">{selectedCode.name}</h2>
                      <p className="text-gray-400 text-xs mt-1">Saved on {formatDate(selectedCode.date)}</p>
                    </div>
                    <CodeEditor 
                      code={selectedCode.code}
                      language={selectedCode.language || 'python'}
                      readOnly={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 flex items-center justify-center min-h-[400px]">
                  <p className="text-gray-400 text-center">
                    Select a code snippet from the list to view it here
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}