import { useState, useRef, useEffect } from "react";
import { Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ModelSelector from "./ModelSelector";

interface MessageInputProps {
  selectedModels: string[];
  onSelectedModelsChange: (models: string[]) => void;
  onSendMessage: (message: string, enableWebSearch?: boolean) => void;
  isLoading: boolean;
}

export default function MessageInput({ 
  selectedModels, 
  onSelectedModelsChange, 
  onSendMessage, 
  isLoading 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || selectedModels.length === 0 || isLoading) return;
    
    onSendMessage(message.trim(), enableWebSearch);
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
    <div className="space-y-4">
      <ModelSelector
        selectedModels={selectedModels}
        onSelectedModelsChange={onSelectedModelsChange}
      />
      
      {/* Web Search Toggle */}
      <div className="flex items-center space-x-3 px-2 py-2 bg-background/50 dark:bg-dark-card/50 rounded-lg border border-border/30 dark:border-dark-border/30">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="web-search" className="text-sm font-medium">Web Search</Label>
          <Switch
            id="web-search"
            checked={enableWebSearch}
            onCheckedChange={setEnableWebSearch}
          />
        </div>
        {enableWebSearch && (
          <span className="text-xs text-muted-foreground">
            Responses will include current web information
          </span>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI models..."
            className="resize-none pr-12 rounded-xl border-border dark:border-dark-border bg-background dark:bg-dark-card min-h-[48px] max-h-[120px] text-base leading-relaxed"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            className="absolute right-2 bottom-2 h-8 w-8 rounded-md bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
