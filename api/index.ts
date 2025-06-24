import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// In-memory storage for demo
const conversations = new Map();
const messages = new Map();
let conversationIdCounter = 1;
let messageIdCounter = 1;

// Default models
const DEFAULT_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", isLatest: true },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic", isLatest: true },
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "anthropic" },
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", provider: "google", isLatest: true },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "google" }
];

// Simple web search using DuckDuckGo instant answer API
async function searchWeb(query: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    const data = await response.json();
    return data.RelatedTopics?.slice(0, 3) || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const googleAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_API_KEY || ""
);

// Helper functions
function getModelProvider(modelId: string): string {
  if (modelId.startsWith('gpt-')) return 'openai';
  if (modelId.startsWith('claude-')) return 'anthropic';
  if (modelId.startsWith('gemini-')) return 'google';
  
  const model = DEFAULT_MODELS.find(m => m.id === modelId);
  return model?.provider || 'unknown';
}

async function sendToModel(
  modelId: string, 
  message: string, 
  openaiClient: OpenAI, 
  anthropicClient: Anthropic,
  googleClient: GoogleGenerativeAI
): Promise<string> {
  const provider = getModelProvider(modelId);

  switch (provider) {
    case 'openai':
      const openaiResponse = await openaiClient.chat.completions.create({
        model: modelId,
        messages: [{ role: "user", content: message }],
        max_tokens: 2000,
      });
      return openaiResponse.choices[0]?.message?.content || "No response";

    case 'anthropic':
      const anthropicResponse = await anthropicClient.messages.create({
        model: modelId,
        max_tokens: 2000,
        messages: [{ role: 'user', content: message }],
      });
      return anthropicResponse.content[0]?.type === 'text' ? anthropicResponse.content[0].text : "No response";

    case 'google':
      const model = googleClient.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(message);
      return result.response.text() || "No response";

    default:
      throw new Error(`Unknown provider for model: ${modelId}`);
  }
}

// Export the handler for Vercel
export default async (req: VercelRequest, res: VercelResponse) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  
  try {
    // Handle different API routes
    if (url?.startsWith('/api/models')) {
      if (method === 'GET') {
        res.json(DEFAULT_MODELS);
        return;
      }
    }

    if (url?.startsWith('/api/conversations')) {
      if (method === 'GET') {
        res.json(Array.from(conversations.values()));
        return;
      }
    }

    if (url === '/api/chat' && method === 'POST') {
      const { message, modelIds, conversationId, enableWebSearch } = req.body;

      // Create or get conversation
      let conversation;
      if (conversationId) {
        conversation = conversations.get(conversationId);
        if (!conversation) {
          res.status(404).json({ error: "Conversation not found" });
          return;
        }
      } else {
        conversation = {
          id: conversationIdCounter++,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          createdAt: new Date().toISOString()
        };
        conversations.set(conversation.id, conversation);
      }

      // Perform web search if enabled
      let searchResults: any[] = [];
      if (enableWebSearch) {
        try {
          searchResults = await searchWeb(message);
        } catch (error) {
          console.error('Web search error:', error);
        }
      }

      // Send requests to all selected models
      const responses = await Promise.allSettled(
        modelIds.map(async (modelId) => {
          const startTime = Date.now();
          try {
            const enhancedMessage = enableWebSearch && searchResults.length > 0 
              ? `${message}\n\nContext from web search:\n${searchResults.map(r => r.Text || r.FirstURL || '').filter(Boolean).join('\n')}`
              : message;
              
            const response = await sendToModel(modelId, enhancedMessage, openai, anthropic, googleAI);
            const responseTime = Date.now() - startTime;

            return {
              modelId,
              content: response,
              responseTime,
              searchResults: enableWebSearch ? searchResults : undefined,
            };
          } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error(`Error with model ${modelId}:`, error);
            
            return {
              modelId,
              content: "",
              responseTime,
              error: (error as Error).message,
              searchResults: enableWebSearch ? searchResults : undefined,
            };
          }
        })
      );

      const chatResponse = {
        conversationId: conversation.id,
        responses: responses.map(result => 
          result.status === 'fulfilled' ? result.value : {
            modelId: '',
            content: '',
            responseTime: 0,
            error: result.reason?.message || 'Unknown error'
          }
        ),
      };

      res.json(chatResponse);
      return;
    }

    if (url === '/api/config/keys' && method === 'POST') {
      const { provider, apiKey } = req.body;
      
      if (!provider || !apiKey) {
        res.status(400).json({ error: "Provider and API key are required" });
        return;
      }

      let isValid = false;
      try {
        switch (provider) {
          case 'openai':
            const openaiTest = new OpenAI({ apiKey });
            await openaiTest.models.list();
            isValid = true;
            break;
          case 'anthropic':
            const anthropicTest = new Anthropic({ apiKey });
            await anthropicTest.messages.create({
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }],
            });
            isValid = true;
            break;
          case 'google':
            const googleTest = new GoogleGenerativeAI(apiKey);
            const model = googleTest.getGenerativeModel({ model: 'gemini-1.5-flash' });
            await model.generateContent('test');
            isValid = true;
            break;
        }
      } catch (error) {
        console.error(`API key validation failed for ${provider}:`, (error as Error).message);
      }

      res.json({ valid: isValid });
      return;
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};