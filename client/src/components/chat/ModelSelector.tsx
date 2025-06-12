import { useState, useEffect } from "react";
import { ChevronDown, Brain, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ModelConfig } from "@shared/schema";

interface ModelSelectorProps {
  selectedModels: string[];
  onSelectedModelsChange: (models: string[]) => void;
}

export default function ModelSelector({ selectedModels, onSelectedModelsChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customModelName, setCustomModelName] = useState("");
  const [customProvider, setCustomProvider] = useState("openai");
  const queryClient = useQueryClient();

  const { data: models = [], isLoading } = useQuery<ModelConfig[]>({
    queryKey: ["/api/models"],
  });

  const addModelMutation = useMutation({
    mutationFn: async (modelData: { id: string; name: string; provider: string }) => {
      const response = await apiRequest("POST", "/api/models", modelData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      setCustomModelName("");
    },
  });

  const removeModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await apiRequest("DELETE", `/api/models/${modelId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
    },
  });

  const handleModelToggle = (modelId: string, checked: boolean) => {
    if (checked) {
      onSelectedModelsChange([...selectedModels, modelId]);
    } else {
      onSelectedModelsChange(selectedModels.filter(id => id !== modelId));
    }
  };

  const handleClearAll = () => {
    onSelectedModelsChange([]);
  };

  const handleAddCustomModel = () => {
    if (!customModelName.trim()) return;
    
    addModelMutation.mutate({
      id: customModelName.trim(),
      name: customModelName.trim(),
      provider: customProvider,
    });
  };

  const handleRemoveModel = (modelId: string) => {
    onSelectedModelsChange(selectedModels.filter(id => id !== modelId));
    
    const model = models.find(m => m.id === modelId);
    if (model?.isCustom) {
      removeModelMutation.mutate(modelId);
    }
  };

  const getModelsByProvider = (provider: string) => {
    return models.filter(model => model.provider === provider);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return <div className="w-4 h-4 bg-black rounded text-white text-xs flex items-center justify-center font-bold">AI</div>;
      case 'anthropic':
        return <div className="w-4 h-4 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">C</div>;
      case 'google':
        return <div className="w-4 h-4 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">G</div>;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getSelectedModelConfig = (modelId: string) => {
    return models.find(m => m.id === modelId);
  };

  return (
    <div className="space-y-3">
      {/* Active Models Chips */}
      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedModels.map(modelId => {
            const config = getSelectedModelConfig(modelId);
            if (!config) return null;
            
            return (
              <Badge
                key={modelId}
                variant="secondary"
                className="flex items-center space-x-2 px-3 py-1"
              >
                {getProviderIcon(config.provider)}
                <span className="text-sm">{config.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveModel(modelId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Model Selection Dropdown */}
      <div className="flex items-end space-x-3">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center space-x-2 rounded-xl"
            >
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Models</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">Select AI Models</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              </div>
              
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading models...</div>
              ) : (
                <div className="space-y-4">
                  {/* OpenAI Models */}
                  <div>
                    <div className="flex items-center mb-2">
                      {getProviderIcon('openai')}
                      <span className="ml-2 text-sm font-medium">OpenAI</span>
                    </div>
                    <div className="space-y-2 ml-6">
                      {getModelsByProvider('openai').map(model => (
                        <div key={model.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={model.id}
                            checked={selectedModels.includes(model.id)}
                            onCheckedChange={(checked) => handleModelToggle(model.id, checked as boolean)}
                          />
                          <label
                            htmlFor={model.id}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {model.name}
                          </label>
                          {model.id === 'gpt-4o' && (
                            <span className="text-xs text-green-600 dark:text-green-400">Latest</span>
                          )}
                          {model.isCustom && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">Custom</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Anthropic Models */}
                  <div>
                    <div className="flex items-center mb-2">
                      {getProviderIcon('anthropic')}
                      <span className="ml-2 text-sm font-medium">Anthropic</span>
                    </div>
                    <div className="space-y-2 ml-6">
                      {getModelsByProvider('anthropic').map(model => (
                        <div key={model.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={model.id}
                            checked={selectedModels.includes(model.id)}
                            onCheckedChange={(checked) => handleModelToggle(model.id, checked as boolean)}
                          />
                          <label
                            htmlFor={model.id}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {model.name}
                          </label>
                          {model.id === 'claude-sonnet-4-20250514' && (
                            <span className="text-xs text-green-600 dark:text-green-400">Latest</span>
                          )}
                          {model.isCustom && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">Custom</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Google AI Models */}
                  <div>
                    <div className="flex items-center mb-2">
                      {getProviderIcon('google')}
                      <span className="ml-2 text-sm font-medium">Google AI</span>
                    </div>
                    <div className="space-y-2 ml-6">
                      {getModelsByProvider('google').map(model => (
                        <div key={model.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={model.id}
                            checked={selectedModels.includes(model.id)}
                            onCheckedChange={(checked) => handleModelToggle(model.id, checked as boolean)}
                          />
                          <label
                            htmlFor={model.id}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {model.name}
                          </label>
                          {model.id === 'gemini-1.5-pro' && (
                            <span className="text-xs text-green-600 dark:text-green-400">Latest</span>
                          )}
                          {model.isCustom && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">Custom</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Model Addition */}
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Select value={customProvider} onValueChange={setCustomProvider}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Model name"
                        value={customModelName}
                        onChange={(e) => setCustomModelName(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCustomModel();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddCustomModel}
                        disabled={!customModelName.trim() || addModelMutation.isPending}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
