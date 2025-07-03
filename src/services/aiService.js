import { getValidModel } from '../utils/modelConfig.js';

// AI Content Generation Service
class AIService {
  constructor(apiKey, provider = 'openai') {
    this.apiKey = apiKey;
    this.provider = provider;
    this.baseUrls = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      ollama: 'http://localhost:11434/api'
    };
  }

  async generateSlideContent(prompt, slideCount = 5) {
    const systemPrompt = `Generate ${slideCount} educational slides as JSON array. Each slide: {title, content, keyPoints}. Keep content concise.`;
    
    try {
      const response = await this.callAPI({
        model: this.getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error('AI slide generation failed:', error);
      throw new Error('Failed to generate slide content');
    }
  }

  async generateScenario(prompt) {
    const systemPrompt = `Generate learning scenario JSON: {title, description, scenes: [{scene_id, title, content, choices: [{choice_id, text, next_scene, feedback}]}]}. Keep concise.`;
    
    try {
      const response = await this.callAPI({
        model: this.getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error('AI scenario generation failed:', error);
      throw new Error('Failed to generate scenario');
    }
  }

  async generateHTML(prompt, includeInteractivity = false) {
    const systemPrompt = `Generate complete HTML with CSS. Include DOCTYPE, responsive styling${includeInteractivity ? ', JavaScript' : ''}. Keep concise.`;
    
    try {
      const response = await this.callAPI({
        model: this.getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6
      });

      return response.content;
    } catch (error) {
      console.error('AI HTML generation failed:', error);
      throw new Error('Failed to generate HTML content');
    }
  }

  async generateProjectStructure(prompt) {
    const systemPrompt = `Generate a multi-content eLearning project structure based on the user prompt. Return JSON with: title, description, blocks array. Each block should have: type ('slide', 'video', 'scenario', 'html'), title, content/prompt for that block type, and order. Create 3-6 blocks for a complete learning experience.`;
    
    try {
      const response = await this.callAPI({
        model: this.getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error('AI project generation failed:', error);
      throw new Error('Failed to generate project structure');
    }
  }

  async callAPI(payload) {
    if (!this.apiKey && this.provider !== 'ollama') {
      throw new Error('API key not configured');
    }

    // Check if we're in browser environment and use proxy
    if (typeof window !== 'undefined' && this.provider !== 'ollama') {
      return this.callViaProxy(payload);
    }

    // Direct API call (for Node.js environments or local Ollama)
    const url = this.provider === 'ollama' 
      ? `${this.baseUrls[this.provider]}/generate`
      : `${this.baseUrls[this.provider]}/chat/completions`;

    const headers = this.getHeaders();
    const body = this.formatPayload(payload);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  async callViaProxy(payload) {
    // Use Netlify function proxy to avoid CORS issues
    const proxyUrl = '/.netlify/functions/ai-proxy';
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: this.provider,
        apiKey: this.apiKey,
        payload: this.formatPayload(payload)
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Proxy request failed: ${errorData}`);
    }

    const data = await response.json();
    return data; // Proxy already returns normalized format
  }

  getHeaders() {
    const commonHeaders = { 'Content-Type': 'application/json' };
    
    switch (this.provider) {
      case 'openai':
        return { ...commonHeaders, 'Authorization': `Bearer ${this.apiKey}` };
      case 'anthropic':
        return { 
          ...commonHeaders, 
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        };
      case 'ollama':
        return commonHeaders;
      default:
        return commonHeaders;
    }
  }

  formatPayload(payload) {
    switch (this.provider) {
      case 'anthropic':
        // Anthropic uses a different message format
        const messages = payload.messages.filter(m => m.role !== 'system');
        const systemMessage = payload.messages.find(m => m.role === 'system');
        
        // If there's a system message, prepend it to the first user message
        if (systemMessage && messages.length > 0 && messages[0].role === 'user') {
          messages[0] = {
            ...messages[0],
            content: systemMessage.content + '\n\n' + messages[0].content
          };
        }
        
        return {
          model: getValidModel(this.provider, payload.model),
          max_tokens: 2000, // Reduced for faster responses
          messages: messages,
          temperature: payload.temperature || 0.7
        };
      case 'ollama':
        return {
          model: payload.model,
          prompt: payload.messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          stream: false
        };
      default: // OpenAI format
        return payload;
    }
  }

  parseResponse(data) {
    switch (this.provider) {
      case 'anthropic':
        return { content: data.content[0].text };
      case 'ollama':
        return { content: data.response };
      default: // OpenAI format
        return { content: data.choices[0].message.content };
    }
  }

  getModel() {
    return getValidModel(this.provider);
  }
}

// Export singleton instance
let aiServiceInstance = null;

export const initializeAI = (apiKey, provider = 'openai') => {
  aiServiceInstance = new AIService(apiKey, provider);
  return aiServiceInstance;
};

export const getAIService = () => {
  if (!aiServiceInstance) {
    throw new Error('AI service not initialized. Call initializeAI first.');
  }
  return aiServiceInstance;
};

export default AIService;