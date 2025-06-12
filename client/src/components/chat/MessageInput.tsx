import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ModelSelector from "./ModelSelector";

interface MessageInputProps {
  selectedModels: string[];
  onSelectedModelsChange: (models: string[]) => void;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function MessageInput({ 
  selectedModels, 
  onSelectedModelsChange, 
  onSendMessage, 
  isLoading 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || selectedModels.length === 0 || isLoading) return;
    
    onSendMessage(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const canSend = message.trim() && selectedModels.length > 0 && !isLoading;

  return (
    <div className="space-y-3">
      <ModelSelector
        selectedModels={selectedModels}
        onSelectedModelsChange={onSelectedModelsChange}
      />
      
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI models..."
            className="resize-none pr-12 rounded-xl border-border dark:border-dark-border bg-background dark:bg-dark-card min-h-[44px] max-h-[120px]"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            className="absolute right-2 bottom-2 h-8 w-8 rounded-md bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
