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
    try {
      const response = await this.callAPI({
        model: this.getModel(),
        messages: [
          { role: 'user', content: `Create ${slideCount} slides about: ${prompt}` }
        ],
        temperature: 0.7
      });

      // Try to parse JSON first
      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        // If not JSON, convert plain text to slides format
        console.log('Converting plain text response to slides format');
        return this.convertTextToSlides(response.content, slideCount);
      }
    } catch (error) {
      console.error('AI slide generation failed:', error);
      // Fallback to basic slides
      return this.generateFallbackSlides(prompt, slideCount);
    }
  }

  convertTextToSlides(text, slideCount) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const slides = [];
    
    // Try to extract slide-like content
    let currentSlide = null;
    let slideNumber = 1;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if this looks like a slide title
      if (trimmed.match(/^(slide\s+\d+|title|heading|\d+\.|\*\*|#)/i) && slideNumber <= slideCount) {
        if (currentSlide) {
          slides.push(currentSlide);
        }
        currentSlide = {
          title: trimmed.replace(/^(slide\s+\d+[:\-.\s]*|title[:\-.\s]*|heading[:\-.\s]*|\d+[:\-.\s]*|\*\*|#+\s*)/i, '').trim(),
          content: '',
          keyPoints: []
        };
        slideNumber++;
      } else if (currentSlide && trimmed.length > 10) {
        // Add content to current slide
        if (currentSlide.content.length < 200) {
          currentSlide.content += (currentSlide.content ? ' ' : '') + trimmed;
        }
      }
    }
    
    if (currentSlide) {
      slides.push(currentSlide);
    }
    
    // If we didn't get enough slides, fill with basic content
    while (slides.length < slideCount) {
      slides.push({
        title: `Slide ${slides.length + 1}`,
        content: `Content for slide ${slides.length + 1} about ${text.slice(0, 50)}...`,
        keyPoints: []
      });
    }
    
    return slides.slice(0, slideCount);
  }

  generateFallbackSlides(prompt, slideCount) {
    const slides = [];
    const topic = prompt.slice(0, 50);
    
    for (let i = 1; i <= slideCount; i++) {
      slides.push({
        title: i === 1 ? `Introduction to ${topic}` : 
               i === slideCount ? `Summary and Conclusion` : 
               `${topic} - Part ${i}`,
        content: i === 1 ? `Welcome to this presentation about ${topic}. We'll cover the key concepts and important information.` :
                 i === slideCount ? `Thank you for your attention. We've covered the essential aspects of ${topic}.` :
                 `This slide covers important aspects of ${topic}. Key concepts and details will be presented here.`,
        keyPoints: []
      });
    }
    
    return slides;
  }

  async generateScenario(prompt) {
    try {
      const response = await this.callAPI({
        model: this.getModel(),
        messages: [
          { role: 'user', content: `Create a simple training scenario about: ${prompt}` }
        ],
        temperature: 0.8
      });

      // Try to parse JSON first
      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        // If not JSON, convert plain text to scenario format
        console.log('Converting plain text response to scenario format');
        return this.convertTextToScenario(response.content, prompt);
      }
    } catch (error) {
      console.error('AI scenario generation failed:', error);
      
      // Always fallback to template
      console.log('Using fallback scenario template');
      return this.generateFallbackScenario(prompt);
    }
  }

  convertTextToScenario(text, originalPrompt) {
    // Extract meaningful content from the AI response
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Look for scenario patterns or numbered items
    const scenarios = [];
    const scenarioPattern = /(?:scenario\s*\d*:\s*|task\s*\d*:\s*|\d+\.\s*|•\s*|-\s*)/i;
    
    let currentScenario = null;
    let scenarioId = 1;
    
    for (const line of lines) {
      const cleaned = line.trim();
      
      // Check if this looks like a new scenario
      if (cleaned.match(scenarioPattern) && cleaned.length > 20) {
        // Save previous scenario
        if (currentScenario) {
          scenarios.push(currentScenario);
        }
        
        // Create new scenario
        const title = cleaned.replace(scenarioPattern, '').trim().slice(0, 100);
        currentScenario = {
          id: scenarioId++,
          title: title || `Scenario ${scenarioId - 1}`,
          description: ''
        };
      } else if (currentScenario && cleaned.length > 15) {
        // Add to description of current scenario
        if (currentScenario.description.length < 500) {
          currentScenario.description += (currentScenario.description ? ' ' : '') + cleaned;
        }
      } else if (!currentScenario && cleaned.length > 30) {
        // First meaningful line becomes a scenario
        currentScenario = {
          id: scenarioId++,
          title: `Training Scenario ${scenarioId - 1}`,
          description: cleaned.slice(0, 500)
        };
      }
    }
    
    // Add the last scenario
    if (currentScenario) {
      scenarios.push(currentScenario);
    }
    
    // If no scenarios found, create a basic one
    if (scenarios.length === 0) {
      scenarios.push({
        id: 1,
        title: `Training Scenario: ${originalPrompt.slice(0, 50)}`,
        description: `You are presented with a situation related to ${originalPrompt}. Analyze the scenario and provide a detailed response explaining how you would handle this situation, including the steps you would take and the reasoning behind your approach.`
      });
    }
    
    // Ensure all scenarios have proper descriptions
    scenarios.forEach(scenario => {
      if (!scenario.description || scenario.description.length < 20) {
        scenario.description = `Consider this ${originalPrompt.toLowerCase()} scenario: ${scenario.title}. Provide a detailed analysis and response.`;
      }
    });
    
    return scenarios.slice(0, 5); // Limit to 5 scenarios max
  }

  generateFallbackScenario(prompt) {
    const topic = prompt.toLowerCase().includes('customer') ? 'Customer Service' : 
                  prompt.toLowerCase().includes('safety') ? 'Safety Training' :
                  prompt.toLowerCase().includes('sales') ? 'Sales Training' : 
                  prompt.toLowerCase().includes('exam') ? 'Exam Administration' : 'Training';
    
    return [
      {
        id: 1,
        title: `${topic} Challenge`,
        description: `You encounter a challenging situation in ${topic.toLowerCase()}. A client/student approaches you with a complex issue that requires careful handling. Analyze the situation and provide a detailed response explaining how you would address their concerns, what steps you would take, and what resources you might use to ensure a positive outcome.`
      },
      {
        id: 2,
        title: `${topic} Decision Making`,
        description: `You need to make an important decision related to ${topic.toLowerCase()}. Multiple factors need to be considered, and different stakeholders have varying priorities. Explain your decision-making process, how you would weigh the different factors, and justify your final recommendation.`
      },
      {
        id: 3,
        title: `${topic} Communication`,
        description: `You must communicate difficult or complex information related to ${topic.toLowerCase()} to someone who may not be familiar with the procedures or policies. Describe how you would structure your communication, what key points you would emphasize, and how you would ensure understanding.`
      }
    ];
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
          max_tokens: 1000, // Further reduced for speed
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