import React, { useRef, useEffect } from 'react';
import { FiUser, FiCode } from 'react-icons/fi';
import { useAppStore } from '@/lib/store';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { extractPythonCode } from '@/utils/format-code';

export default function ChatHistory() {
  const { messages } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  if (messages.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-6 pb-4">
      {messages.map((message, index) => (
        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`
            flex max-w-[85%] rounded-lg p-4
            ${message.role === 'user' 
              ? 'bg-primary-700 text-white ml-4' 
              : 'bg-dark-100 border border-gray-800'}
          `}>
            <div className={`
              flex-shrink-0 mr-3 mt-1
              ${message.role === 'user' ? 'order-last ml-3 mr-0' : ''}
            `}>
              {message.role === 'user' 
                ? <FiUser className="h-5 w-5" /> 
                : <FiCode className="h-5 w-5 text-primary-500" />}
            </div>
            
            <div className="flex-1 overflow-hidden">
              {message.role === 'assistant' ? (
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    fontSize: '0.875rem',
                    lineHeight: 1.7,
                  }}
                  wrapLines={true}
                >
                  {extractPythonCode(message.content) || '# No code generated'}
                </SyntaxHighlighter>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
} 