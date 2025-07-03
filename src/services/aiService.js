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
    const systemPrompt = `Generate ${slideCount} educational slides based on the user prompt. Return a JSON array where each slide has: title, content (detailed explanation), keyPoints (array of 3-4 bullet points), and suggestedImage (description for image generation).`;
    
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
    const systemPrompt = `Generate an interactive learning scenario in JSON format. Include: title, description, scenes array with scene_id, title, content, choices array (each with choice_id, text, next_scene, feedback), and completion message. Make it engaging and educational.`;
    
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
    const systemPrompt = `Generate complete, professional HTML content based on the user prompt. Include proper DOCTYPE, responsive CSS styling, and ${includeInteractivity ? 'interactive JavaScript elements' : 'static content'}. Use modern web standards and ensure accessibility.`;
    
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
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

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
        return {
          model: payload.model,
          max_tokens: 4000,
          messages: payload.messages,
          temperature: payload.temperature
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
    switch (this.provider) {
      case 'openai':
        return 'gpt-4';
      case 'anthropic':
        return 'claude-3-sonnet-20240229';
      case 'ollama':
        return 'llama2'; // or any local model
      default:
        return 'gpt-4';
    }
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