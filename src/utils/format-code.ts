export function extractPythonCode(text: string): string {
  const pythonCodeRegex = /```(?:python)?\s*([\s\S]*?)```/g;
  const matches = [...text.matchAll(pythonCodeRegex)];
  
  if (matches.length > 0) {
    return matches.map(match => match[1].trim()).join('\n\n');
  }
  
  return text.trim();
}

export function formatFileName(code: string): string {
  // Try to extract a class name or function name for the file name
  const classMatch = code.match(/class\s+(\w+)/);
  if (classMatch && classMatch[1]) {
    return `${classMatch[1].toLowerCase()}.py`;
  }
  
  const funcMatch = code.match(/def\s+(\w+)/);
  if (funcMatch && funcMatch[1]) {
    return `${funcMatch[1].toLowerCase()}.py`;
  }
  
  // Default name if no class or function is found
  return 'main.py';
}

export function indentCode(code: string, spaces: number = 4): string {
  return code
    .split('\n')
    .map(line => ' '.repeat(spaces) + line)
    .join('\n');
} 