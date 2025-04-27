import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { FiCopy, FiDownload, FiCheck, FiCode, FiClipboard, FiShare2 } from 'react-icons/fi';
import { formatFileName } from '@/utils/format-code';
import { motion } from 'framer-motion';

interface CodeEditorProps {
  code: string;
  language?: string;
}

export default function CodeEditor({ code, language = 'python' }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const downloadCode = () => {
    const fileName = formatFileName(code);
    const blob = new Blob([code], { type: 'text/plain' });
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
        text: code,
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
  
  return (
    <div className="relative">
      {/* Success Toast */}
      {showSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mt-[-10px] bg-green-500 text-white px-4 py-2 rounded-md z-50 shadow-lg"
        >
          {toastMessage}
        </motion.div>
      )}
      
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-dark-100 to-dark-200 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 bg-dark-200 border-b border-gray-800">
          <div className="flex items-center">
            <div className="p-1.5 bg-primary-600/20 rounded-md mr-3">
              <FiCode className="h-5 w-5 text-primary-400" />
            </div>
            <span className="text-sm font-mono text-primary-300">{formatFileName(code)}</span>
          </div>
          
          <div className="flex space-x-1">
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
            {code.split('\n').map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          
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
        </div>
        
        <div className="px-4 py-2 border-t border-gray-800 flex justify-between items-center bg-dark-200/50 text-xs text-gray-500">
          <div>
            <span>{code.split('\n').length} lines</span>
            <span className="mx-2">•</span>
            <span>{code.length} characters</span>
          </div>
          <div>Generated with M31-Mini</div>
        </div>
      </div>
    </div>
  );
} 