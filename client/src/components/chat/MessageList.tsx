import { useEffect, useRef } from "react";
import { Bot, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import type { ModelConfig } from "@shared/schema";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: models = [] } = useQuery<ModelConfig[]>({
    queryKey: ["/api/models"],
  });

  const getModelConfig = (modelId: string | null) => {
    if (!modelId) return null;
    return models.find(m => m.id === modelId);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs font-bold">AI</div>;
      case 'anthropic':
        return <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">C</div>;
      case 'google':
        return <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">G</div>;
      default:
        return <Bot className="w-8 h-8 p-2 bg-muted rounded-lg" />;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatResponseTime = (ms: number | null) => {
    if (!ms) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message-fade-in ${
            message.role === 'user' ? 'flex justify-end' : 'flex items-start space-x-3'
          }`}
        >
          {message.role === 'user' ? (
            <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-sm max-w-3xl">
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            </div>
          ) : (
            <>
              {message.provider && getProviderIcon(message.provider)}
              <Card className="flex-1 bg-muted/50 dark:bg-dark-card px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {getModelConfig(message.modelId)?.name || message.modelId}
                  </span>
                  {message.responseTime && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatResponseTime(message.responseTime)}</span>
                    </div>
                  )}
                </div>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </Card>
            </>
          )}
        </div>
      ))}
      
      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Card className="flex-1 p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          </div>
          <div className="flex items-start space-x-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Card className="flex-1 p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
