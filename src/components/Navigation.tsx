import { FiGithub, FiCode, FiHome, FiBookmark, FiSearch, FiCpu } from 'react-icons/fi';
import { useState, Fragment } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  const navigationItems: NavigationItem[] = [
    {
      title: 'Home',
      href: '/',
      icon: <FiHome className="h-5 w-5" />
    },
    {
      title: 'Generate Code',
      href: '/code-generator',
      icon: <FiCode className="h-5 w-5" />
    },
    {
      title: 'Repository',
      href: '/repository',
      icon: <FiGithub className="h-5 w-5" />
    },
    {
      title: 'AI Agent',
      href: '/agent',
      icon: <FiCpu className="h-5 w-5" />
    },
    {
      title: 'Saved Code',
      href: '/saved',
      icon: <FiBookmark className="h-5 w-5" />
    }
  ];
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  // Close the menu when a navigation link is clicked
  const closeMenu = () => {
    setIsOpen(false);
  };
  
  return (
    <div className="sticky top-0 z-40 bg-dark-300/80 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <Link href="/" className="flex items-center">
              <div className="relative w-8 h-8 mr-2">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent-600 to-accent-400 rounded-full blur opacity-70"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiCode className="h-4 w-4 text-white" />
                </div>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">M31-Mini</span>
            </Link>
          </motion.div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex">
            <nav className="flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm flex items-center space-x-1 transition-colors ${
                    pathname === item.href
                      ? 'bg-accent-500/10 text-accent-400'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  onClick={closeMenu}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-dark-200 border-b border-gray-800">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-base ${
                  pathname === item.href
                    ? 'bg-accent-500/10 text-accent-400'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={closeMenu}
              >
                <span className="mr-2">{item.icon}</span>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}