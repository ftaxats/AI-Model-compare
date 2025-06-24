# Multi-AI Chat Application

## Overview
A minimal ChatGPT-like interface that integrates multiple AI models (ChatGPT, Claude, Google AI) with web search capabilities. Users can select and compare responses from different models simultaneously with a clean, modern interface.

## Project Architecture

### Frontend (React + TypeScript)
- **Components**: Modular chat interface with model selection, message display, and settings
- **State Management**: React Query for API calls, local storage for preferences
- **Styling**: Tailwind CSS with dark mode support
- **Key Features**:
  - Multi-model selection with removable chips
  - Real-time response comparison
  - Web search integration toggle
  - API key configuration panel

### Backend (Express + TypeScript)
- **API Routes**: Chat endpoints, model management, API key validation
- **Storage**: In-memory storage for conversations and messages
- **AI Integration**: OpenAI, Anthropic, and Google AI clients
- **Web Search**: DuckDuckGo fallback with optional Google Custom Search

### Database Schema
- Conversations: Basic chat history tracking
- Messages: User and assistant messages with model attribution
- Model Configs: Available AI models (default + custom)

## Recent Changes
- **2025-06-24**: Fixed Vercel deployment runtime error and configuration
- **2025-06-24**: Updated deployment button with correct repository URL and environment variables
- **2025-06-24**: Rewrote serverless function handler for proper Vercel compatibility
- **2025-06-24**: Added @vercel/node dependency and proper TypeScript types
- **2025-06-24**: Added Vercel deployment configuration with serverless functions
- **2025-06-24**: Created comprehensive deployment documentation and setup
- **2025-06-24**: Added web search capabilities with DuckDuckGo integration
- **2025-06-24**: Implemented multi-AI response comparison system
- **2025-06-24**: Created settings panel for API key management
- **2025-06-24**: Fixed Google AI model compatibility issues

## User Preferences
- Prefers clean, minimal interface similar to ChatGPT
- Values real-time model comparison functionality
- Wants comprehensive debugging and error handling
- Requires proper API key validation and management

## Technical Notes
- Using latest model versions: GPT-4o, Claude Sonnet 4, Gemini 2.0 Flash
- Web search enhances AI responses with current information
- All API keys stored securely as environment variables
- Responsive design with mobile support

## Current Status
- Core functionality implemented and working
- All API integrations functioning properly with proper error handling
- Web search integration operational with DuckDuckGo fallback
- Vercel deployment configuration fixed and tested
- Environment variable prompting working in deployment button
- One-click deployment ready with comprehensive documentation
- All runtime errors resolved

## Deployment
- **Vercel Ready**: One-click deployment with environment variable setup
- **Environment Variables**: Clear documentation for required API keys
- **Serverless Functions**: Optimized for Vercel's platform
- **Static Assets**: Client-side application properly configured