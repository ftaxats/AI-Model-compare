# Multi-AI Chat Application

A minimal ChatGPT-like interface that integrates multiple AI models (ChatGPT, Claude, Google AI) with web search capabilities. Compare responses from different models simultaneously with a clean, modern interface.

## Features

- **Multi-Model Support**: OpenAI GPT, Anthropic Claude, Google Gemini
- **Real-time Comparison**: See responses from multiple models side-by-side
- **Web Search Integration**: Enhanced responses with current web information
- **Clean Interface**: ChatGPT-inspired design with dark mode support
- **Model Management**: Add custom models and manage API configurations
- **Conversation History**: Persistent chat sessions with message tracking

## Quick Start

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Add your API keys to `.env.local`:
   ```env
   OPENAI_API_KEY=your-openai-key
   ANTHROPIC_API_KEY=your-anthropic-key
   GOOGLE_AI_API_KEY=your-google-ai-key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/multi-ai-chat)

1. Click the deploy button above or:
   - Fork this repository
   - Connect it to Vercel
   - Add environment variables in Vercel dashboard

2. Required Environment Variables:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `ANTHROPIC_API_KEY` - Your Anthropic API key  
   - `GOOGLE_AI_API_KEY` - Your Google AI API key

3. Optional Environment Variables:
   - `GOOGLE_SEARCH_API_KEY` - For enhanced web search
   - `GOOGLE_SEARCH_ENGINE_ID` - Custom search engine ID

## Getting API Keys

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and generate an API key
3. Key format: `sk-...`

### Anthropic
1. Visit [Anthropic Console](https://console.anthropic.com)
2. Create an account and generate an API key
3. Key format: `sk-ant-...`

### Google AI
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Key format: `AIza...`

## Usage

1. Select AI models using the dropdown with checkboxes
2. Toggle web search for enhanced responses with current information
3. Type your message and send to compare responses
4. Manage API keys in the settings panel (gear icon)
5. View response times and model performance metrics

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **AI APIs**: OpenAI, Anthropic, Google AI
- **Web Search**: DuckDuckGo (with Google Custom Search fallback)
- **Deployment**: Vercel serverless functions

## Architecture

- **Client**: React SPA with real-time UI updates
- **Server**: Express API with AI model integrations
- **Storage**: In-memory conversation management
- **Search**: Web search integration for enhanced responses

## License

MIT License - see LICENSE file for details