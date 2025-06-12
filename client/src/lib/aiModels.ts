export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  description?: string;
  isLatest?: boolean;
  isCustom?: boolean;
}

export const DEFAULT_MODELS: ModelConfig[] = [
  // OpenAI models - the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable OpenAI model',
    isLatest: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Fast and efficient version of GPT-4',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast and cost-effective model',
  },
  
  // Anthropic models - the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    description: 'Latest and most capable Claude model',
    isLatest: true,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Advanced reasoning and analysis',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Fast and efficient Claude model',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Most capable Claude 3 model',
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fastest Claude 3 model',
  },
  
  // Google models
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Most capable Gemini model',
    isLatest: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    description: 'Fast and efficient Gemini model',
  },
  {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    provider: 'google',
    description: 'Original Gemini Pro model',
  },
];

export const PRESET_COMBINATIONS = [
  {
    name: 'GPT-4o + Claude Sonnet',
    description: 'Best of OpenAI and Anthropic',
    models: ['gpt-4o', 'claude-sonnet-4-20250514'],
  },
  {
    name: 'All Premium Models',
    description: 'Compare top models from all providers',
    models: ['gpt-4o', 'claude-sonnet-4-20250514', 'gemini-1.5-pro'],
  },
  {
    name: 'Fast Models',
    description: 'Quick responses for rapid testing',
    models: ['gpt-3.5-turbo', 'claude-3-haiku-20240307', 'gemini-1.5-flash'],
  },
  {
    name: 'Reasoning Specialists',
    description: 'Models optimized for complex reasoning',
    models: ['gpt-4o', 'claude-3-opus-20240229', 'gemini-1.5-pro'],
  },
];

export function getModelsByProvider(provider: string, models: ModelConfig[]): ModelConfig[] {
  return models.filter(model => model.provider === provider);
}

export function getModelConfig(modelId: string, models: ModelConfig[]): ModelConfig | undefined {
  return models.find(model => model.id === modelId);
}

export function getProviderColor(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'bg-black';
    case 'anthropic':
      return 'bg-orange-500';
    case 'google':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

export function getProviderIcon(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'AI';
    case 'anthropic':
      return 'C';
    case 'google':
      return 'G';
    default:
      return '?';
  }
}
