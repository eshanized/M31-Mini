import React, { useEffect, useRef, useState } from 'react';
import { FiCode, FiCheckCircle, FiZap, FiArrowRight, FiGithub, FiStar, FiCpu } from 'react-icons/fi';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';

const ParticleEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
    }> = [];
    
    const colors = ['#6366f1', '#8b5cf6', '#d946ef', '#f97316', '#0ea5e9'];
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((particle, i) => {
        // Update
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x > width || particle.x < 0) {
          particle.speedX *= -1;
        }
        
        if (particle.y > height || particle.y < 0) {
          particle.speedY *= -1;
        }
        
        // Draw
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        
        // Draw connections
        particles.forEach((particle2, j) => {
          if (i === j) return;
          
          const dx = particle.x - particle2.x;
          const dy = particle.y - particle2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            ctx.beginPath();
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = 0.1 * (1 - distance / 200);
            ctx.lineWidth = 1;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle2.x, particle2.y);
            ctx.stroke();
          }
        });
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full z-0 opacity-60"
    />
  );
};

const FeatureCard = ({ icon, title, description, delay = 0 }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } }
      }}
      whileHover={{ 
        scale: 1.05, 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        borderColor: '#6366f1' 
      }}
      className="flex-1 max-w-xs w-full bg-gradient-to-br from-dark-100 to-dark-200 p-6 rounded-xl border border-gray-800 transition-all duration-300 transform"
    >
      <div className="rounded-full bg-primary-600/10 w-14 h-14 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
};

export default function HeroSection() {
  const codeExample = `from typing import List, Optional

def fibonacci(n: int) -> List[int]:
    """Generate fibonacci sequence up to n items."""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

class CodeAnalyzer:
    def __init__(self, code: str):
        self.code = code
        self.tokens = self._tokenize()
    
    def _tokenize(self) -> List[str]:
        return self.code.split()
    
    def analyze(self) -> dict:
        return {
            "length": len(self.code),
            "tokens": len(self.tokens),
            "lines": self.code.count('\\n') + 1
        }`;
  
  const typingControls = useAnimation();
  const [typingContent, setTypingContent] = useState('');
  
  useEffect(() => {
    const startTypingAnimation = async () => {
      await typingControls.start({ opacity: 1, transition: { duration: 0.5 } });
      
      let visibleText = '';
      const fullText = codeExample;
      
      for (let i = 0; i < fullText.length; i++) {
        visibleText += fullText[i];
        setTypingContent(visibleText);
        
        // Vary typing speed slightly for realism
        const delay = fullText[i] === '\n' ? 150 : Math.random() * 10 + 5;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    };
    
    startTypingAnimation();
  }, [typingControls, codeExample]);
  
  return (
    <div className="relative overflow-hidden">
      {/* Particle background */}
      <ParticleEffect />
      
      {/* Hero content */}
      <div className="py-16 md:py-28 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center relative">
            {/* Background glow effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary-600/20 blur-[120px] rounded-full -z-10 opacity-60"></div>
            <div className="absolute top-20 left-1/4 w-40 h-40 bg-purple-600/20 blur-[100px] rounded-full -z-10 opacity-60"></div>
            <div className="absolute top-40 right-1/4 w-56 h-56 bg-pink-600/20 blur-[100px] rounded-full -z-10 opacity-60"></div>
            
            {/* Floating elements */}
            <div className="hidden lg:block">
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 1,
                  ease: "easeOut",
                }}
                className="absolute -left-24 top-20 bg-dark-100/80 backdrop-blur-lg p-4 rounded-xl border border-gray-800 shadow-xl"
              >
                <div className="flex items-center space-x-2">
                  <FiCpu className="text-primary-400 h-5 w-5" />
                  <span className="text-gray-300 text-sm">AI-Powered</span>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 1,
                  delay: 0.2,
                  ease: "easeOut",
                }}
                className="absolute -right-20 top-40 bg-dark-100/80 backdrop-blur-lg p-4 rounded-xl border border-gray-800 shadow-xl"
              >
                <div className="flex items-center space-x-2">
                  <FiGithub className="text-primary-400 h-5 w-5" />
                  <span className="text-gray-300 text-sm">Repo Analysis</span>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 1,
                  delay: 0.4,
                  ease: "easeOut",
                }}
                className="absolute right-28 bottom-20 bg-dark-100/80 backdrop-blur-lg p-4 rounded-xl border border-gray-800 shadow-xl"
              >
                <div className="flex items-center space-x-2">
                  <FiStar className="text-yellow-400 h-5 w-5" />
                  <span className="text-gray-300 text-sm">Production Ready</span>
                </div>
              </motion.div>
            </div>
            
            {/* Logo icon with animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary-600/50 blur-xl rounded-full"></div>
                <motion.div
                  animate={{ 
                    rotate: 360,
                    boxShadow: [
                      "0 0 20px rgba(99, 102, 241, 0.3)",
                      "0 0 40px rgba(99, 102, 241, 0.5)",
                      "0 0 20px rgba(99, 102, 241, 0.3)"
                    ]
                  }}
                  transition={{ 
                    rotate: { duration: 20, ease: "linear", repeat: Infinity },
                    boxShadow: { duration: 2, repeat: Infinity } 
                  }}
                  className="relative bg-gradient-to-br from-primary-600 to-purple-600 p-6 rounded-full shadow-2xl"
                >
                  <FiCode className="h-14 w-14 text-white" />
                </motion.div>
              </div>
            </motion.div>
            
            {/* Headline with text animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-6"
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-2">
                <AnimatePresence>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-purple-500 to-pink-500"
                  >
                    M31-Mini
                  </motion.span>
                </AnimatePresence>
              </h1>
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-2xl sm:text-3xl md:text-4xl text-white"
              >
                AI-Powered Code Generator
              </motion.h2>
            </motion.div>
            
            {/* Description with word-by-word animation */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10"
            >
              Generate professional, production-ready Python code
              {' '}
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-primary-400"
              >
                without comments
              </motion.span>
              {' '}
              using cutting-edge AI models and GitHub repository analysis.
            </motion.p>
            
            {/* CTA Buttons with hover effects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap justify-center gap-4 mb-16"
            >
              <motion.a 
                href="/generate" 
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-medium rounded-lg shadow-lg shadow-primary-900/30 transition-all flex items-center space-x-2"
              >
                <span>Get Started</span>
                <FiArrowRight className="h-5 w-5" />
              </motion.a>
              <motion.a 
                href="/examples" 
                whileHover={{ scale: 1.05, y: -3, borderColor: '#6366f1' }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-dark-100/50 backdrop-blur-lg hover:bg-dark-200 text-white font-medium rounded-lg border border-gray-700 transition-all"
              >
                View Examples
              </motion.a>
            </motion.div>
            
            {/* Feature cards with staggered animation */}
            <div className="flex flex-col md:flex-row justify-center items-center md:items-stretch space-y-8 md:space-y-0 md:space-x-6 mb-20">
              <FeatureCard 
                icon={<FiCheckCircle className="h-7 w-7 text-primary-400" />}
                title="Clean Code"
                description="Professional, production-ready Python code with no unnecessary comments."
                delay={0.9}
              />
              
              <FeatureCard 
                icon={<FiZap className="h-7 w-7 text-primary-400" />}
                title="Instant Results"
                description="Get high-quality code instantly with streaming responses for better UX."
                delay={1.1}
              />
              
              <FeatureCard 
                icon={<FiGithub className="h-7 w-7 text-primary-400" />}
                title="GitHub Analysis"
                description="Clone repositories and get AI-powered insights and suggestions."
                delay={1.3}
              />
            </div>
          </div>
          
          {/* Code window with typing animation */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="relative mx-auto max-w-4xl mb-16"
          >
            {/* Glowing border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 animate-pulse"></div>
            
            <div className="relative bg-dark-100/90 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center px-4 py-3 bg-dark-200/90 border-b border-gray-800">
                <div className="flex space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="ml-4 text-sm text-gray-400 font-mono flex-1 text-center">python_code_example.py</div>
                <div className="flex-1"></div>
              </div>
              
              <div className="p-6 overflow-hidden relative">
                {/* Cursor animation */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [1, 0, 1], 
                    transition: { repeat: Infinity, duration: 1 } 
                  }}
                  className="absolute h-5 w-2 bg-primary-400 right-7 bottom-7"
                ></motion.div>
                
                <motion.pre 
                  animate={typingControls}
                  initial={{ opacity: 0 }}
                  className="text-left text-sm md:text-base text-gray-300 font-mono overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
                >
                  <code className="language-python">
                    {typingContent}
                  </code>
                </motion.pre>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div id="generate" className="h-20"></div>
      </div>
    </div>
  );
} 