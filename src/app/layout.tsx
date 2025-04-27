import React from 'react';
import '@/styles/globals.css';
import { Fira_Sans, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';

const firaSans = Fira_Sans({ 
  subsets: ['latin'],
  variable: '--font-fira-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

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
    <html lang="en" className={`${firaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
} 