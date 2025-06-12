import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatRequestSchema, chatResponseSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchWeb, type SearchResult } from './webSearch';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize AI clients
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "",
  });

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY || "",
  });

  const googleAI = new GoogleGenerativeAI(
    process.env.GOOGLE_AI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY || ""
  );

  // API Key configuration endpoint
  app.post("/api/config/keys", async (req, res) => {
    try {
      const { provider, apiKey } = req.body;
      
      if (!provider || !apiKey) {
        return res.status(400).json({ error: "Provider and API key are required" });
      }

      // Validate API key by making a test request
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
    } catch (error) {
      console.error("Error validating API key:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all model configurations
  app.get("/api/models", async (req, res) => {
    try {
      const models = await storage.getAllModelConfigs();
      res.json(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add custom model
  app.post("/api/models", async (req, res) => {
    try {
      const { id, name, provider } = req.body;
      
      if (!id || !name || !provider) {
        return res.status(400).json({ error: "ID, name, and provider are required" });
      }

      const model = await storage.createModelConfig({
        id,
        name,
        provider,
        isCustom: true,
      });

      res.json(model);
    } catch (error) {
      console.error("Error creating model:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete custom model
  app.delete("/api/models/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteModelConfig(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Model not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting model:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get conversation with messages
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await storage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send message to AI models
  app.post("/api/chat", async (req, res) => {
    try {
      const validatedData = chatRequestSchema.parse(req.body);
      const { message, modelIds, conversationId, enableWebSearch } = validatedData;

      // Create or get conversation
      let conversation;
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

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
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const openaiResponse = await openaiClient.chat.completions.create({
          model: modelId,
          messages: [{ role: "user", content: message }],
          max_tokens: 2000,
        });
        return openaiResponse.choices[0]?.message?.content || "No response";

      case 'anthropic':
        // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
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

  function getModelProvider(modelId: string): string {
    if (modelId.startsWith('gpt-')) return 'openai';
    if (modelId.startsWith('claude-')) return 'anthropic';
    if (modelId.startsWith('gemini-')) return 'google';
    
    // Fallback: check in storage
    const models = Array.from(storage['modelConfigs'].values());
    const model = models.find(m => m.id === modelId);
    return model?.provider || 'unknown';
  }

  const httpServer = createServer(app);
  return httpServer;
}
