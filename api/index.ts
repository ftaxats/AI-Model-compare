// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { storage } from '../server/storage';
import { chatRequestSchema } from '../shared/schema';
import { z } from 'zod';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchWeb, type SearchResult } from '../server/webSearch';

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
  
  const models = Array.from((storage as any).modelConfigs.values());
  const model = models.find((m: any) => m.id === modelId);
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
        const models = await storage.getAllModelConfigs();
        res.json(models);
        return;
      }
      
      if (method === 'POST') {
        const { id, name, provider } = req.body;
        if (!id || !name || !provider) {
          res.status(400).json({ error: "ID, name, and provider are required" });
          return;
        }
        const model = await storage.createModelConfig({
          id, name, provider, isCustom: true,
        });
        res.json(model);
        return;
      }
    }

    if (url?.startsWith('/api/conversations')) {
      if (method === 'GET') {
        const conversations = await storage.getAllConversations();
        res.json(conversations);
        return;
      }
    }

    if (url === '/api/chat' && method === 'POST') {
      const validatedData = chatRequestSchema.parse(req.body);
      const { message, modelIds, conversationId, enableWebSearch } = validatedData;

      // Create or get conversation
      let conversation;
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          res.status(404).json({ error: "Conversation not found" });
          return;
        }
      } else {
        conversation = await storage.createConversation({
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        });
      }

      // Add user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message,
        modelId: null,
        provider: null,
        responseTime: null,
      });

      // Perform web search if enabled
      let searchResults: SearchResult[] = [];
      if (enableWebSearch) {
        try {
          searchResults = await searchWeb(message, 5);
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
              ? `${message}\n\nContext from web search:\n${searchResults.map(r => `${r.title}: ${r.snippet}`).join('\n')}`
              : message;
              
            const response = await sendToModel(modelId, enhancedMessage, openai, anthropic, googleAI);
            const responseTime = Date.now() - startTime;

            // Save assistant message
            await storage.createMessage({
              conversationId: conversation.id,
              role: "assistant",
              content: response,
              modelId,
              provider: getModelProvider(modelId),
              responseTime,
            });

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