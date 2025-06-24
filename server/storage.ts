import {
  conversations,
  messages,
  modelConfigs,
  type Conversation,
  type Message,
  type ModelConfig,
  type InsertConversation,
  type InsertMessage,
  type InsertModelConfig,
} from "@shared/schema";

export interface IStorage {
  // Conversations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  updateConversation(
    id: number,
    updates: Partial<InsertConversation>,
  ): Promise<Conversation | undefined>;
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
      // OpenAI models - Latest GPT-4.1 series
      { id: "gpt-4.1", name: "GPT-4.1", provider: "openai", isCustom: false },
      {
        id: "gpt-4.1-mini",
        name: "GPT-4.1 Mini",
        provider: "openai",
        isCustom: false,
      },
      {
        id: "gpt-4.1-nano",
        name: "GPT-4.1 Nano",
        provider: "openai",
        isCustom: false,
      },
      { id: "gpt-4o", name: "GPT-4o", provider: "openai", isCustom: false },

      // Anthropic models - Latest Claude series
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        provider: "anthropic",
        isCustom: false,
      },
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        provider: "anthropic",
        isCustom: false,
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        provider: "anthropic",
        isCustom: false,
      },

      // Google models - Latest Gemini 2.5 and 2.0 series
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        provider: "google",
        isCustom: false,
      },
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        provider: "google",
        isCustom: false,
      },
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        provider: "google",
        isCustom: false,
      },
      {
        id: "gemini-2.0-flash-lite",
        name: "Gemini 2.0 Flash Lite",
        provider: "google",
        isCustom: false,
      },
    ];

    // Store each model in the modelConfigs map
    defaultModels.forEach((model) => {
      this.modelConfigs.set(model.id, {
        ...model,
        config: null,
      });
    });
  }

  async createConversation(
    insertConversation: InsertConversation,
  ): Promise<Conversation> {
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
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  async updateConversation(
    id: number,
    updates: Partial<InsertConversation>,
  ): Promise<Conversation | undefined> {
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
      modelId: insertMessage.modelId ?? null,
      provider: insertMessage.provider ?? null,
      responseTime: insertMessage.responseTime ?? null,
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createModelConfig(config: InsertModelConfig): Promise<ModelConfig> {
    const modelConfig: ModelConfig = {
      ...config,
      config: null,
      isCustom: config.isCustom ?? false,
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
