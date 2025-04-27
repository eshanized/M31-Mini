# M31-Mini - AI-Powered Code Assistant

M31-Mini is an intelligent code assistant that uses agentic AI capabilities to analyze repositories, understand codebases, and generate high-quality code. Similar to tools like Blackbox and Cline, it can index entire repositories and provide comprehensive code assistance.

## Features

- **Repository Analysis**: Clone and analyze GitHub repositories, understanding their structure and purpose
- **Code Generation**: Generate code in multiple languages with proper syntax highlighting
- **AI-Powered Agent**: Act as an agentic assistant to help with code exploration and generation
- **OpenRouter Integration**: Uses free models from OpenRouter's API for AI functionality
- **Syntax highlighting** for better code readability
- **File tree navigation** for repository exploration
- **Multiple model support** with different capabilities for various tasks

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Key Setup

M31-Mini requires an OpenRouter API key to function. You can get a free API key from [OpenRouter](https://openrouter.ai/keys).

1. Click on the "API Key" button in the app header
2. Enter your OpenRouter API key
3. Click "Save Key"

## Models Used

The application uses several free models from OpenRouter:

- Claude Instant (Anthropic)
- Llama 2 (Meta)
- PaLM 2 (Google)
- Gemini Pro (Google)
- Mistral (7B)
- Mixtral (8x7B)

## Repository Analysis

M31-Mini can index and analyze entire codebases:

1. Navigate to the Repository page
2. Enter a GitHub repository URL
3. Click "Load Repository"
4. Once loaded, you can browse files or use the Agent to ask questions about the codebase

## Technology Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [OpenRouter API](https://openrouter.ai/) - AI model provider
- [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) - Syntax highlighting for code
- [Framer Motion](https://www.framer.com/motion/) - Animation library

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [Blackbox.ai](https://www.blackbox.ai/) 