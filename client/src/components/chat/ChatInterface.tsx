import { useState, useEffect } from "react";
import { Bot, Settings, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ModelSelector from "./ModelSelector";
import SettingsPanel from "./SettingsPanel";
import { useChat } from "@/hooks/useChat";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function ChatInterface() {
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModels, setSelectedModels] = useLocalStorage<string[]>("selectedModels", []);
  const [debugMode, setDebugMode] = useLocalStorage("debugMode", false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    sendMessage,
    createNewConversation,
  } = useChat();

  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages]);

  const handleSendMessage = async (message: string, enableWebSearch?: boolean) => {
    if (selectedModels.length === 0) {
      return;
    }

    if (debugMode) {
      console.log("Sending message:", message, "to models:", selectedModels, "with web search:", enableWebSearch);
    }

    setShowWelcome(false);
    await sendMessage(message, selectedModels, enableWebSearch);
  };

  const handlePresetSelection = (modelIds: string[]) => {
    setSelectedModels(modelIds);
    setShowWelcome(false);
  };

  const presetCombinations = [
    {
      name: "GPT-4.1 + Claude Sonnet 4",
      models: ["gpt-4.1", "claude-sonnet-4-20250514"],
    },
    {
      name: "All Premium Models",
      models: ["gpt-4.1", "claude-sonnet-4-20250514", "gemini-2.5-pro"],
    },
    {
      name: "Best Value Models",
      models: ["gpt-4.1-mini", "claude-3-5-haiku-20241022", "gemini-2.5-flash"],
    },
    {
      name: "Ultra Fast & Cheap",
      models: ["gpt-4.1-nano", "claude-3-5-haiku-20241022", "gemini-2.0-flash-lite"],
    },
    {
      name: "Balanced Performance",
      models: ["gpt-4o", "claude-3-5-sonnet-20241022", "gemini-2.0-flash"],
    },
    {
      name: "Flash Models Only",
      models: ["gemini-2.5-flash", "gemini-2.0-flash"],
    },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg text-foreground dark:text-dark-text transition-colors duration-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-border dark:border-dark-border z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="text-primary-foreground text-sm" />
            </div>
            <h1 className="text-xl font-semibold">Multi-AI Chat</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg"
            >
              {theme === 'dark' ? 
                <Sun className="h-4 w-4 text-yellow-400" /> : 
                <Moon className="h-4 w-4" />
              }
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-lg"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        debugMode={debugMode}
        onDebugModeChange={setDebugMode}
      />

      <div className="pt-20 pb-32 min-h-screen">
        <div className="max-w-4xl mx-auto px-4">
          {/* Welcome Message */}
          {showWelcome && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Bot className="text-primary-foreground text-2xl" />
              </div>
              <h2 className="text-3xl font-semibold mb-3">Multi-AI Assistant</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
                Compare responses from ChatGPT, Claude, and Google AI simultaneously. Select your preferred models and start chatting.
              </p>
              
              {/* Preset Model Combinations */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {presetCombinations.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => handlePresetSelection(preset.models)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {!showWelcome && (
            <MessageList messages={messages} isLoading={isLoading} />
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 dark:bg-dark-bg/80 backdrop-blur-md border-t border-border dark:border-dark-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <MessageInput
            selectedModels={selectedModels}
            onSelectedModelsChange={setSelectedModels}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
