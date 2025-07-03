// Model configuration and validation
export const MODEL_CONFIG = {
  openai: {
    models: [
      'gpt-4o',
      'gpt-4o-mini', 
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo'
    ],
    default: 'gpt-4o-mini'
  },
  anthropic: {
    models: [
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20240620',
      'claude-3-sonnet-20240229',
      'claude-3-opus-20240229'
    ],
    default: 'claude-3-haiku-20240307' // Fastest model
  },
  ollama: {
    models: [
      'llama3.2:3b',
      'llama3.2:1b',
      'llama3.1:8b',
      'mistral:7b',
      'codellama:7b'
    ],
    default: 'llama3.2:3b'
  }
};

export function getValidModel(provider, requestedModel = null) {
  const config = MODEL_CONFIG[provider];
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  // If no model requested, use default
  if (!requestedModel) {
    return config.default;
  }

  // Check if requested model is valid
  if (config.models.includes(requestedModel)) {
    return requestedModel;
  }

  // Fall back to default if requested model is invalid
  console.warn(`Model ${requestedModel} not found for ${provider}, using ${config.default}`);
  return config.default;
}

export function getModelList(provider) {
  const config = MODEL_CONFIG[provider];
  return config ? config.models : [];
}