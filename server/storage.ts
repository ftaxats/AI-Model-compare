import { conversations, messages, modelConfigs, type Conversation, type Message, type ModelConfig, type InsertConversation, type InsertMessage, type InsertModelConfig } from "@shared/schema";

export interface IStorage {
  // Conversations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  
  // Model Configs
  createModelConfig(config: InsertModelConfig): Promise<ModelConfig>;
  getAllModelConfigs(): Promise<ModelConfig[]>;
  deleteModelConfig(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private modelConfigs: Map<string, ModelConfig>;
  private conversationIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.conversations = new Map();
    this.messages = new Map();
    this.modelConfigs = new Map();
    this.conversationIdCounter = 1;
    this.messageIdCounter = 1;

    // Initialize default model configs
    this.initializeDefaultModels();
  }

  private initializeDefaultModels() {
    const defaultModels = [
      // OpenAI models
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', isCustom: false },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', isCustom: false },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', isCustom: false },
      
      // Anthropic models - the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', isCustom: false },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', isCustom: false },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', isCustom: false },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', isCustom: false },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', isCustom: false },
      
      // Google models
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', isCustom: false },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', isCustom: false },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', provider: 'google', isCustom: false },
    ];

    defaultModels.forEach(model => {
      this.modelConfigs.set(model.id, {
        ...model,
        config: null,
      });
    });
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationIdCounter++;
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const existing = this.conversations.get(id);
    if (!existing) return undefined;

    const updated: Conversation = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: number): Promise<boolean> {
    const deleted = this.conversations.delete(id);
    // Also delete associated messages
    Array.from(this.messages.entries()).forEach(([messageId, message]) => {
      if (message.conversationId === id) {
        this.messages.delete(messageId);
      }
    });
    return deleted;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createModelConfig(config: InsertModelConfig): Promise<ModelConfig> {
    const modelConfig: ModelConfig = {
      ...config,
      config: null,
    };
    this.modelConfigs.set(config.id, modelConfig);
    return modelConfig;
  }

  async getAllModelConfigs(): Promise<ModelConfig[]> {
    return Array.from(this.modelConfigs.values());
  }

  async deleteModelConfig(id: string): Promise<boolean> {
    return this.modelConfigs.delete(id);
  }
}

export const storage = new MemStorage();
