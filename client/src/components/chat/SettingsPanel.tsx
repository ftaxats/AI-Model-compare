import { useState, useEffect } from "react";
import { X, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  debugMode: boolean;
  onDebugModeChange: (enabled: boolean) => void;
}

interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
}

export default function SettingsPanel({ 
  isOpen, 
  onClose, 
  debugMode, 
  onDebugModeChange 
}: SettingsPanelProps) {
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>("apiKeys", {});
  const [tempKeys, setTempKeys] = useState<ApiKeys>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, 'valid' | 'invalid' | 'unchecked'>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTempKeys(apiKeys);
      setKeyStatus({});
    }
  }, [isOpen, apiKeys]);

  const validateKeyMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const response = await apiRequest("POST", "/api/config/keys", { provider, apiKey });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setKeyStatus(prev => ({
        ...prev,
        [variables.provider]: data.valid ? 'valid' : 'invalid'
      }));
    },
    onError: (error, variables) => {
      console.error(`Error validating ${variables.provider} key:`, error);
      setKeyStatus(prev => ({
        ...prev,
        [variables.provider]: 'invalid'
      }));
    },
  });

  const handleKeyChange = (provider: string, value: string) => {
    setTempKeys(prev => ({
      ...prev,
      [provider]: value,
    }));
    
    // Reset status when key changes
    setKeyStatus(prev => ({
      ...prev,
      [provider]: 'unchecked'
    }));
  };

  const handleValidateKey = (provider: string) => {
    const key = tempKeys[provider as keyof ApiKeys];
    if (!key) return;
    
    validateKeyMutation.mutate({ provider, apiKey: key });
  };

  const handleSaveSettings = () => {
    // Only save keys that are valid or unchecked (user might want to save even without validation)
    const keysToSave = Object.entries(tempKeys).reduce((acc, [provider, key]) => {
      if (key && key.trim()) {
        acc[provider as keyof ApiKeys] = key.trim();
      }
      return acc;
    }, {} as ApiKeys);

    setApiKeys(keysToSave);
    
    toast({
      title: "Settings saved",
      description: "Your API configuration has been saved successfully.",
    });

    onClose();
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const getStatusBadge = (provider: string) => {
    const status = keyStatus[provider];
    const isValidating = validateKeyMutation.isPending && validateKeyMutation.variables?.provider === provider;
    
    if (isValidating) {
      return <Badge variant="secondary" className="animate-pulse">Validating...</Badge>;
    }
    
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Valid</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Invalid</Badge>;
      default:
        const hasKey = !!apiKeys[provider as keyof ApiKeys];
        return hasKey ? 
          <Badge variant="secondary">Configured</Badge> : 
          <Badge variant="outline">Not configured</Badge>;
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'openai':
        return {
          name: 'OpenAI',
          icon: <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-xs font-bold">AI</div>,
          placeholder: 'sk-...',
          description: 'Required for GPT models'
        };
      case 'anthropic':
        return {
          name: 'Anthropic',
          icon: <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">C</div>,
          placeholder: 'sk-ant-...',
          description: 'Required for Claude models'
        };
      case 'google':
        return {
          name: 'Google AI',
          icon: <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">G</div>,
          placeholder: 'AIza...',
          description: 'Required for Gemini models'
        };
      default:
        return {
          name: provider,
          icon: <div className="w-6 h-6 bg-gray-500 rounded flex items-center justify-center text-white text-xs font-bold">?</div>,
          placeholder: '...',
          description: ''
        };
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>API Configuration</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* API Keys Configuration */}
          {['openai', 'anthropic', 'google'].map((provider) => {
            const info = getProviderInfo(provider);
            return (
              <Card key={provider}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    {info.icon}
                    <span>{info.name}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${provider}-key`}>API Key</Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id={`${provider}-key`}
                          type={showKeys[provider] ? "text" : "password"}
                          value={tempKeys[provider as keyof ApiKeys] || ""}
                          onChange={(e) => handleKeyChange(provider, e.target.value)}
                          placeholder={info.placeholder}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleShowKey(provider)}
                        >
                          {showKeys[provider] ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidateKey(provider)}
                        disabled={!tempKeys[provider as keyof ApiKeys] || validateKeyMutation.isPending}
                        className="shrink-0"
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(provider)}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Debug Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Debugging</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="debug-mode">Console Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed logging for debugging
                  </p>
                </div>
                <Switch
                  id="debug-mode"
                  checked={debugMode}
                  onCheckedChange={onDebugModeChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSaveSettings}
            className="w-full"
            size="lg"
          >
            Save Configuration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
