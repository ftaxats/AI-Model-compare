export interface ModelConfig {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google";
  description?: string;
  isLatest?: boolean;
  isCustom?: boolean;
}

export const DEFAULT_MODELS: ModelConfig[] = [
  // OpenAI models - Latest GPT-4.1 series with improved performance and cost efficiency
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    description: "Latest flagship OpenAI model with enhanced reasoning",
    isLatest: true,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    description: "Cost-effective GPT-4.1 with excellent performance",
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "openai",
    description: "Ultra-fast and economical GPT-4.1 variant",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Multimodal OpenAI model with vision capabilities",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Affordable multimodal model",
  },

  // Anthropic models - Latest Claude 4 series
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "Latest and most capable Claude model",
    isLatest: true,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Advanced reasoning and code generation",
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    description: "Fast and efficient Claude model",
  },

  // Google models - Latest Gemini 2.5 and 2.0 series
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    description: "Most advanced Gemini model with thinking capabilities",
    isLatest: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Best price-performance ratio in Gemini lineup",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Low-latency multimodal model",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    provider: "google",
    description: "Most cost-efficient Gemini model",
  },
];

export const PRESET_COMBINATIONS = [
  {
    name: "GPT-4o + Claude Sonnet",
    description: "Best of OpenAI and Anthropic",
    models: ["gpt-4o", "claude-sonnet-4-20250514"],
  },
  {
    name: "All Premium Models",
    description: "Compare top models from all providers",
    models: ["gpt-4o", "claude-sonnet-4-20250514", "gemini-1.5-pro"],
  },
  {
    name: "Fast Models",
    description: "Quick responses for rapid testing",
    models: ["gpt-3.5-turbo", "claude-3-haiku-20240307", "gemini-1.5-flash"],
  },
  {
    name: "Reasoning Specialists",
    description: "Models optimized for complex reasoning",
    models: ["gpt-4o", "claude-3-opus-20240229", "gemini-1.5-pro"],
  },
];

export function getModelsByProvider(
  provider: string,
  models: ModelConfig[],
): ModelConfig[] {
  return models.filter((model) => model.provider === provider);
}

export function getModelConfig(
  modelId: string,
  models: ModelConfig[],
): ModelConfig | undefined {
  return models.find((model) => model.id === modelId);
}

export function getProviderColor(provider: string): string {
  switch (provider) {
    case "openai":
      return "bg-black";
    case "anthropic":
      return "bg-orange-500";
    case "google":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
}

export function getProviderIcon(provider: string): string {
  switch (provider) {
    case "openai":
      return "AI";
    case "anthropic":
      return "C";
    case "google":
      return "G";
    default:
      return "?";
  }
}
