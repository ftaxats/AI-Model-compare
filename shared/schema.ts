import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  modelId: text("model_id"), // null for user messages
  provider: text("provider"), // 'openai' | 'anthropic' | 'google'
  responseTime: integer("response_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modelConfigs = pgTable("model_configs", {
  id: text("id").primaryKey(), // model identifier
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  isCustom: boolean("is_custom").default(false).notNull(),
  config: jsonb("config"), // additional model configuration
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertModelConfigSchema = createInsertSchema(modelConfigs).omit({
  config: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertModelConfig = z.infer<typeof insertModelConfigSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ModelConfig = typeof modelConfigs.$inferSelect;

// API request/response types
export const chatRequestSchema = z.object({
  message: z.string().min(1),
  modelIds: z.array(z.string()).min(1),
  conversationId: z.number().optional(),
  enableWebSearch: z.boolean().optional().default(false),
});

export const chatResponseSchema = z.object({
  conversationId: z.number(),
  responses: z.array(z.object({
    modelId: z.string(),
    content: z.string(),
    responseTime: z.number(),
    error: z.string().optional(),
    searchResults: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })).optional(),
  })),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
