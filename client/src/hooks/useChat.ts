import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Message, Conversation, ChatRequest } from "@shared/schema";
import { useToast } from "./use-toast";

export function useChat() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    queryFn: () => apiClient.getConversations(),
  });

  // Fetch current conversation messages
  const { data: conversationData } = useQuery({
    queryKey: ["/api/conversations", currentConversationId],
    queryFn: () => currentConversationId ? apiClient.getConversation(currentConversationId) : null,
    enabled: !!currentConversationId,
  });

  // Update messages when conversation data changes
  useState(() => {
    if (conversationData?.messages) {
      setMessages(conversationData.messages);
    }
  }, [conversationData]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: ChatRequest) => {
      return apiClient.sendChatMessage(data);
    },
    onSuccess: (response) => {
      setCurrentConversationId(response.conversationId);
      
      // Add responses to messages
      const newMessages: Message[] = response.responses.map((resp, index) => ({
        id: Date.now() + index, // Temporary ID
        conversationId: response.conversationId,
        role: 'assistant' as const,
        content: resp.error ? `Error: ${resp.error}` : resp.content,
        modelId: resp.modelId,
        provider: getProviderFromModelId(resp.modelId),
        responseTime: resp.responseTime,
        createdAt: new Date(),
      }));

      setMessages(prev => [...prev, ...newMessages]);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", response.conversationId] });
      
      // Show error toast if any responses failed
      const errorCount = response.responses.filter(r => r.error).length;
      if (errorCount > 0) {
        toast({
          title: "Some responses failed",
          description: `${errorCount} model(s) returned errors. Check your API configuration.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Please check your API configuration and try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = useCallback(async (content: string, modelIds: string[]) => {
    if (!content.trim() || modelIds.length === 0) return;

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now(),
      conversationId: currentConversationId || 0,
      role: 'user',
      content: content.trim(),
      modelId: null,
      provider: null,
      responseTime: null,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Send to API
    await sendMessageMutation.mutateAsync({
      message: content.trim(),
      modelIds,
      conversationId: currentConversationId || undefined,
    });
  }, [currentConversationId, sendMessageMutation]);

  const createNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
  }, []);

  return {
    messages,
    conversations,
    currentConversationId,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
    sendMessage,
    createNewConversation,
  };
}

function getProviderFromModelId(modelId: string): string {
  if (modelId.startsWith('gpt-')) return 'openai';
  if (modelId.startsWith('claude-')) return 'anthropic';
  if (modelId.startsWith('gemini-')) return 'google';
  return 'unknown';
}
