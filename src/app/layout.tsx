import React from 'react';
import '@/styles/globals.css';
import { JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'M31-Mini | Professional Python Code Generator',
  description: 'Generate professional Python code without comments using OpenRouter API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="font-mono">
        {children}
      </body>
    </html>
  );
} 