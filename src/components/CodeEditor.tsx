import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { FiCopy, FiDownload, FiCheck, FiCode, FiClipboard, FiShare2, FiSave, FiEdit, FiX } from 'react-icons/fi';
import { formatFileName } from '@/utils/format-code';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface CodeEditorProps {
  code: string;
  language?: string;
  readOnly?: boolean;
}

export default function CodeEditor({ code, language = 'python', readOnly = false }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [savedCodes, setSavedCodes] = useState<{id: string, name: string, code: string, date: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  
  // Load saved codes on mount
  useEffect(() => {
    const saved = localStorage.getItem('m31_saved_codes');
    if (saved) {
      try {
        setSavedCodes(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved codes', e);
      }
    }
  }, []);

  // Update edited code when original code changes
  useEffect(() => {
    if (!isEditing) {
      setEditedCode(code);
    }
  }, [code, isEditing]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(isEditing ? editedCode : code);
    setCopied(true);
    showToast('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const downloadCode = () => {
    const fileName = formatFileName(isEditing ? editedCode : code);
    const blob = new Blob([isEditing ? editedCode : code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded as ${fileName}`);
  };

  const shareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Python Code from M31-Mini',
        text: isEditing ? editedCode : code,
      })
      .then(() => showToast('Code shared successfully!'))
      .catch(() => showToast('Sharing failed'));
    } else {
      copyToClipboard();
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const toggleSaveModal = () => {
    setIsSaving(!isSaving);
    if (!isSaving) {
      setSaveName(formatFileName(isEditing ? editedCode : code));
    }
  };

  const handleSaveCode = () => {
    if (!saveName.trim()) return;

    const newSaved = [
      ...savedCodes,
      {
        id: Date.now().toString(),
        name: saveName,
        code: isEditing ? editedCode : code,
        date: new Date().toISOString()
      }
    ];
    
    setSavedCodes(newSaved);
    localStorage.setItem('m31_saved_codes', JSON.stringify(newSaved));
    setIsSaving(false);
    showToast(`Saved as "${saveName}"`);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      showToast('Edit mode enabled');
    } else {
      showToast('Edit mode disabled');
    }
  };
  
  return (
    <div className="relative">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mt-[-10px] bg-accent-500 text-white px-4 py-2 rounded-md z-50 shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-dark-100 to-dark-200 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 bg-dark-200 border-b border-gray-800">
          <div className="flex items-center">
            <div className="p-1.5 bg-accent-600/20 rounded-md mr-3">
              <FiCode className="h-5 w-5 text-accent-400" />
            </div>
            <span className="text-sm font-mono text-accent-300">{formatFileName(isEditing ? editedCode : code)}</span>
          </div>
          
          <div className="flex space-x-1">
            {/* Edit button - only if not readOnly */}
            {!readOnly && (
              <button
                onClick={toggleEditMode}
                className={`p-2 rounded-md transition-colors group relative ${
                  isEditing ? 'text-accent-400 bg-accent-900/30' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                title={isEditing ? "Exit edit mode" : "Edit code"}
              >
                {isEditing ? <FiX className="h-5 w-5" /> : <FiEdit className="h-5 w-5" />}
                <span className="absolute top-full right-0 mt-2 w-24 bg-gray-800 text-xs text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center pointer-events-none">
                  {isEditing ? "Exit edit mode" : "Edit code"}
                </span>
              </button>
            )}
            
            {/* Copy button */}
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors group relative"
              title="Copy to clipboard"
            >
              {copied ? <FiCheck className="h-5 w-5 text-green-500" /> : <FiClipboard className="h-5 w-5" />}
              <span className="absolute top-full right-0 mt-2 w-32 bg-gray-800 text-xs text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center pointer-events-none">
                Copy to clipboard
              </span>
            </button>
            
            {/* Download button */}
            <button
              onClick={downloadCode}
              className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors group relative"
              title="Download code"
            >
              <FiDownload className="h-5 w-5" />
              <span className="absolute top-full right-0 mt-2 w-32 bg-gray-800 text-xs text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center pointer-events-none">
                Download code
              </span>
            </button>
            
            {/* Save button - only if not readOnly */}
            {!readOnly && (
              <button
                onClick={toggleSaveModal}
                className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors group relative"
                title="Save code"
              >
                <FiSave className="h-5 w-5" />
                <span className="absolute top-full right-0 mt-2 w-20 bg-gray-800 text-xs text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center pointer-events-none">
                  Save code
                </span>
              </button>
            )}
            
            {/* Share button */}
            <button
              onClick={shareCode}
              className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors group relative"
              title="Share code"
            >
              <FiShare2 className="h-5 w-5" />
              <span className="absolute top-full right-0 mt-2 w-20 bg-gray-800 text-xs text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center pointer-events-none">
                Share code
              </span>
            </button>
          </div>
        </div>
        
        <div className="overflow-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-dark-300 relative">
          {/* Line numbers */}
          <div className="absolute top-0 left-0 pl-3 pt-4 flex flex-col text-gray-600 font-mono text-xs space-y-[0.14rem] select-none">
            {(isEditing ? editedCode : code).split('\n').map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          
          {isEditing && !readOnly ? (
            <textarea
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              className="w-full h-full min-h-[300px] bg-transparent font-mono text-sm text-gray-300 p-4 pl-10 focus:outline-none resize-none"
              spellCheck={false}
              style={{
                lineHeight: 1.7,
                tabSize: 2,
              }}
            />
          ) : (
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1rem 1rem 1rem 3rem',
                backgroundColor: 'transparent',
                fontSize: '0.875rem',
                lineHeight: 1.7,
              }}
              showLineNumbers={false}
            >
              {code || '# Your generated Python code will appear here'}
            </SyntaxHighlighter>
          )}
        </div>
        
        <div className="px-4 py-2 border-t border-gray-800 flex justify-between items-center bg-dark-200/50 text-xs text-gray-500">
          <div>
            <span>{(isEditing ? editedCode : code).split('\n').length} lines</span>
            <span className="mx-2">•</span>
            <span>{(isEditing ? editedCode : code).length} characters</span>
          </div>
          <div className="flex items-center">
            <span>Generated with M31-Mini</span>
            {savedCodes.length > 0 && (
              <Link
                href="/saved"
                className="ml-3 text-xs text-accent-400 hover:text-accent-300 flex items-center"
              >
                <FiSave className="mr-1 h-3 w-3" /> View saved snippets
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) toggleSaveModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-200 rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-medium text-white mb-4">Save Code</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="input w-full"
                  placeholder="Enter a name for this code"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={toggleSaveModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCode}
                  className="btn btn-primary"
                  disabled={!saveName.trim()}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}