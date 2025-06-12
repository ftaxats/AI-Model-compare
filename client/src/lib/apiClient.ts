import { apiRequest } from "./queryClient";
import type { ChatRequest, ChatResponse } from "@shared/schema";

export class ApiClient {
  async sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
    const response = await apiRequest("POST", "/api/chat", data);
    return response.json();
  }

  async validateApiKey(provider: string, apiKey: string): Promise<{ valid: boolean }> {
    const response = await apiRequest("POST", "/api/config/keys", { provider, apiKey });
    return response.json();
  }

  async getModels() {
    const response = await apiRequest("GET", "/api/models");
    return response.json();
  }

  async addCustomModel(data: { id: string; name: string; provider: string }) {
    const response = await apiRequest("POST", "/api/models", data);
    return response.json();
  }

  async deleteModel(modelId: string) {
    const response = await apiRequest("DELETE", `/api/models/${modelId}`);
    return response.json();
  }

  async getConversations() {
    const response = await apiRequest("GET", "/api/conversations");
    return response.json();
  }

  async getConversation(id: number) {
    const response = await apiRequest("GET", `/api/conversations/${id}`);
    return response.json();
  }
}

export const apiClient = new ApiClient();
