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

  async generateSlideContent(prompt, slideCount = 5, options = {}) {
    const { 
      applyBranding = true, 
      includeInteractive = true, 
      uploadedContent = null,
      elearningFocus = true 
    } = options;

    try {
      const systemPrompt = this.buildBrandAwareSlidePrompt(applyBranding, includeInteractive, elearningFocus);
      const enhancedPrompt = this.enhanceSlidePrompt(prompt, slideCount, uploadedContent, options);

      const response = await this.callAPI({
        model: this.getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enhancedPrompt }
        ],
        temperature: 0.7
      });

      // Try to parse JSON first
      try {
        const parsedSlides = JSON.parse(response.content);
        return this.applyBrandStyling(parsedSlides, applyBranding);
      } catch (parseError) {
        // If not JSON, convert plain text to slides format
        console.log('Converting plain text response to slides format');
        const slides = this.convertTextToSlides(response.content, slideCount);
        return this.applyBrandStyling(slides, applyBranding);
      }
    } catch (error) {
      console.error('AI slide generation failed:', error);
      // Fallback to basic slides with branding
      const fallbackSlides = this.generateFallbackSlides(prompt, slideCount);
      return this.applyBrandStyling(fallbackSlides, applyBranding);
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

  buildBrandAwareSlidePrompt(applyBranding, includeInteractive, elearningFocus) {
    const brandingGuidelines = applyBranding ? `
PEARSON BRAND GUIDELINES:
- Primary Color: #0B004A (Deep Purple)
- Secondary Color: #6C2EB7 (Medium Purple)
- Light Color: #E6E6F2 (Light Purple)
- Typography: Plus Jakarta Sans font family
- Design: Modern, clean, professional, educational
- Accessibility: High contrast, readable, inclusive
- Layout: Clean hierarchy, generous whitespace, rounded corners` : '';

    const interactiveElements = includeInteractive ? `
INTERACTIVE ELEMENTS:
- Include engagement prompts and reflection questions
- Add "Think About This" callout boxes
- Suggest interactive activities or exercises
- Include progress indicators and checkpoints
- Add clickable elements and hover effects` : '';

    const elearningFocusText = elearningFocus ? `
ELEARNING FOCUS:
- Structure content for self-paced learning
- Include clear learning objectives
- Add knowledge checks and assessments
- Design for mobile-responsive viewing
- Include accessibility features
- Focus on practical application and real-world scenarios` : '';

    return `You are an expert eLearning content creator specializing in slide-based training materials. Create engaging, educational slide content that follows modern instructional design principles.

${brandingGuidelines}${interactiveElements}${elearningFocusText}

SLIDE STRUCTURE:
Return slides in JSON format with the following structure:
[
  {
    "title": "Slide Title",
    "content": "Main content text",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "interactiveElements": ["Discussion prompt", "Reflection question"],
    "brandStyling": {
      "primaryColor": "#0B004A",
      "secondaryColor": "#6C2EB7",
      "lightColor": "#E6E6F2"
    }
  }
]

CONTENT REQUIREMENTS:
- Educational and engaging content
- Clear, concise language
- Professional tone appropriate for learners
- Practical examples and real-world applications
- Logical progression of concepts
- Accessibility-friendly descriptions`;
  }

  enhanceSlidePrompt(prompt, slideCount, uploadedContent, options) {
    let enhancedPrompt = `Create ${slideCount} educational slides about: ${prompt}`;

    if (uploadedContent && uploadedContent.length > 0) {
      enhancedPrompt += `\n\nEXISTING CONTENT TO ENHANCE:\n`;
      uploadedContent.forEach((slide, index) => {
        enhancedPrompt += `\nSlide ${index + 1}:\nTitle: ${slide.title}\nContent: ${slide.content}\n`;
      });
      enhancedPrompt += `\nPlease enhance and expand this content while maintaining the core information. Apply Pearson branding and make it more engaging for eLearning.`;
    }

    if (options.elearningFocus) {
      enhancedPrompt += `\n\nELEARNING REQUIREMENTS:
- Structure for self-paced learning
- Include clear learning objectives
- Add knowledge checks and interactive elements
- Design for mobile-responsive viewing
- Focus on practical application`;
    }

    if (options.applyBranding) {
      enhancedPrompt += `\n\nBRANDING REQUIREMENTS:
- Apply Pearson visual identity
- Use professional, educational tone
- Include accessibility features
- Modern, clean design approach`;
    }

    return enhancedPrompt;
  }

  applyBrandStyling(slides, applyBranding) {
    if (!applyBranding) return slides;

    return slides.map(slide => ({
      ...slide,
      brandStyling: {
        primaryColor: '#0B004A',
        secondaryColor: '#6C2EB7',
        lightColor: '#E6E6F2',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      // Add interactive elements if not present
      interactiveElements: slide.interactiveElements || [
        'What are your thoughts on this topic?',
        'How might you apply this in your work?'
      ]
    }));
  }

  async enhanceUploadedContent(uploadedContent, enhancementPrompt, options = {}) {
    const { applyBranding = true, includeInteractive = true } = options;

    try {
      const systemPrompt = `You are an expert content enhancer specializing in converting existing presentations into engaging eLearning materials. Enhance the provided content while maintaining its core message and structure.

ENHANCEMENT GOALS:
- Improve readability and engagement
- Add interactive elements and reflection prompts
- Apply modern instructional design principles
- Maintain educational focus
- Ensure accessibility compliance

${applyBranding ? `
PEARSON BRAND GUIDELINES:
- Colors: #0B004A (primary), #6C2EB7 (secondary), #E6E6F2 (light)
- Typography: Plus Jakarta Sans
- Design: Modern, clean, professional, educational` : ''}

Return enhanced content in the same JSON slide format.`;

      const contentText = uploadedContent.map((slide, index) => 
        `Slide ${index + 1}:\nTitle: ${slide.title}\nContent: ${slide.content}\n`
      ).join('\n');

      const enhancedPrompt = `${enhancementPrompt}\n\nEXISTING CONTENT:\n${contentText}\n\nPlease enhance this content for eLearning while maintaining the original structure and key information.`;

      const response = await this.callAPI({
        model: this.getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enhancedPrompt }
        ],
        temperature: 0.6
      });

      try {
        const enhancedSlides = JSON.parse(response.content);
        return this.applyBrandStyling(enhancedSlides, applyBranding);
      } catch (parseError) {
        console.log('Converting enhanced content to slides format');
        const slides = this.convertTextToSlides(response.content, uploadedContent.length);
        return this.applyBrandStyling(slides, applyBranding);
      }
    } catch (error) {
      console.error('Content enhancement failed:', error);
      // Return original content with branding applied
      return this.applyBrandStyling(uploadedContent, applyBranding);
    }
  }

  async generateScenario(prompt, options = {}) {
    const { requestCount = 5, isRefinement = false } = options;
    
    try {
      const scenarioPrompt = this.buildScenarioPrompt(prompt, requestCount, isRefinement);
      const systemPrompt = isRefinement ? 
        'You are a training scenario generator refining existing scenarios. Generate exactly 5 improved training scenarios in valid JSON format based on the provided context and refinement request.' :
        'You are a training scenario generator for Pearson customer service and educational staff. Generate exactly 5 valid training scenarios in the exact JSON format requested. Do not include explanations, examples, or template text.';
        
      const response = await this.callAPI({
        model: this.getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: scenarioPrompt }
        ],
        temperature: isRefinement ? 0.6 : 0.7
      });

      // Enhanced validation
      if (this.isInvalidResponse(response.content)) {
        console.log('Invalid AI response detected, using fallback');
        return this.generateFallbackScenario(prompt, requestCount);
      }

      // Try to parse JSON first
      try {
        const parsed = JSON.parse(response.content);
        const validated = this.validateScenarios(parsed, prompt);
        return validated;
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

  buildScenarioPrompt(prompt, requestCount = 5, isRefinement = false) {
    const action = isRefinement ? 'Refine and improve the scenarios based on' : 'Generate exactly 5 training scenarios for';
    
    return `${action}: ${prompt}

REQUIREMENTS:
- Each scenario must be a realistic, specific situation requiring problem-solving
- Focus on customer service, educational, or professional training contexts
- Include challenging but realistic situations staff might encounter
- Provide enough detail for meaningful analysis and response
- Generate exactly ${requestCount} unique scenarios

STRICT JSON FORMAT (respond with ONLY this JSON, no other text):
[
  {
    "id": 1,
    "title": "Specific scenario title (descriptive, not generic)",
    "description": "Detailed scenario description (100-300 words) presenting a specific situation that requires analysis and response. Include context, stakeholders, and the challenge to be addressed."
  },
  {
    "id": 2,
    "title": "Another specific scenario title",
    "description": "Another detailed scenario description presenting a different challenging situation requiring problem-solving skills."
  },
  {
    "id": 3,
    "title": "Third specific scenario title",
    "description": "Third detailed scenario description with different context and challenges."
  },
  {
    "id": 4,
    "title": "Fourth specific scenario title",
    "description": "Fourth detailed scenario description exploring different aspects of the topic."
  },
  {
    "id": 5,
    "title": "Fifth specific scenario title",
    "description": "Fifth detailed scenario description providing comprehensive coverage of different situations."
  }
]

AVOID:
- Generic titles like "Scenario 1" or "Training Example"
- Template language or meta-commentary
- References to examples or instructions
- API keys or technical references
- Overly simple or unrealistic situations`;
  }

  isInvalidResponse(content) {
    // Enhanced validation checks
    return (
      content.includes('sk-') ||
      content.includes('api') ||
      content.length < 50 ||
      content.toLowerCase().includes('i cannot') ||
      content.toLowerCase().includes('i am unable') ||
      content.toLowerCase().includes('template') ||
      content.toLowerCase().includes('example') ||
      content.toLowerCase().includes('here are') ||
      content.toLowerCase().includes('here is') ||
      !content.includes('"title"') ||
      !content.includes('"description"')
    );
  }

  validateScenarios(scenarios, originalPrompt = '') {
    // Ensure we have an array
    const scenarioArray = Array.isArray(scenarios) ? scenarios : [scenarios];
    
    // Filter and validate each scenario
    const validScenarios = scenarioArray.filter(scenario => {
      return (
        scenario &&
        typeof scenario === 'object' &&
        scenario.title &&
        scenario.description &&
        scenario.title.length > 10 &&
        scenario.description.length > 50 &&
        !scenario.title.toLowerCase().includes('scenario') &&
        !scenario.title.toLowerCase().includes('example') &&
        this.isActualScenario(scenario.description)
      );
    });

    // Add IDs if missing
    validScenarios.forEach((scenario, index) => {
      if (!scenario.id) {
        scenario.id = index + 1;
      }
    });

    return validScenarios.length > 0 ? validScenarios : this.generateFallbackScenario(originalPrompt);
  }

  isActualScenario(description) {
    // Check if description contains scenario-like content
    const scenarioKeywords = [
      'situation', 'customer', 'client', 'student', 'challenge', 'problem',
      'encounter', 'approaches', 'needs', 'requests', 'complains', 'asks',
      'issue', 'concern', 'difficulty', 'questions', 'confused', 'upset'
    ];
    
    const lowerDesc = description.toLowerCase();
    return scenarioKeywords.some(keyword => lowerDesc.includes(keyword));
  }

  convertTextToScenario(text, originalPrompt) {
    // Clean the response text first
    let cleanedText = text;
    
    // Remove API keys and sensitive data
    cleanedText = cleanedText.replace(/sk-[a-zA-Z0-9_-]+/g, '');
    cleanedText = cleanedText.replace(/api[_-]?key/gi, '');
    
    // Remove ID examples and template references
    cleanedText = cleanedText.replace(/\bid\s*:\s*[12]\b/gi, '');
    cleanedText = cleanedText.replace(/\b(id|ID)\s*[12]\b/g, '');
    cleanedText = cleanedText.replace(/example\s*\d*/gi, '');
    cleanedText = cleanedText.replace(/template/gi, '');
    
    const lines = cleanedText.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
             !trimmed.match(/^(here\s+(are|is)|this\s+is|below|above)/i) &&
             !trimmed.includes('sk-') &&
             !trimmed.match(/\bid\s*[12]\b/i);
    });
    
    // Look for scenario patterns or numbered items
    const scenarios = [];
    const scenarioPattern = /(?:scenario\s*\d*:\s*|task\s*\d*:\s*|\d+\.\s*|•\s*|-\s*)/i;
    
    let currentScenario = null;
    let scenarioId = 1;
    
    for (const line of lines) {
      const cleaned = line.trim();
      
      // Skip lines that look like metadata or examples
      if (cleaned.match(/^(note|example|template|format)/i) || cleaned.length < 15) {
        continue;
      }
      
      // Check if this looks like a new scenario
      if (cleaned.match(scenarioPattern) && cleaned.length > 20) {
        // Save previous scenario
        if (currentScenario && currentScenario.description.length > 20) {
          scenarios.push(currentScenario);
        }
        
        // Create new scenario
        const title = cleaned.replace(scenarioPattern, '').trim().slice(0, 100);
        currentScenario = {
          id: scenarioId++,
          title: title || `Scenario ${scenarioId - 1}`,
          description: ''
        };
      } else if (currentScenario && cleaned.length > 20) {
        // Add to description of current scenario
        if (currentScenario.description.length < 400) {
          currentScenario.description += (currentScenario.description ? ' ' : '') + cleaned;
        }
      } else if (!currentScenario && cleaned.length > 30) {
        // First meaningful line becomes a scenario
        currentScenario = {
          id: scenarioId++,
          title: `Training Scenario ${scenarioId - 1}`,
          description: cleaned.slice(0, 400)
        };
      }
    }
    
    // Add the last scenario if it has content
    if (currentScenario && currentScenario.description.length > 20) {
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
    
    // Clean up scenario content
    scenarios.forEach(scenario => {
      // Remove any remaining ID references
      scenario.title = scenario.title.replace(/\bid\s*[12]\b/gi, '').trim();
      scenario.description = scenario.description.replace(/\bid\s*[12]\b/gi, '').trim();
      
      // Ensure minimum description length
      if (scenario.description.length < 30) {
        scenario.description = `Consider this ${originalPrompt.toLowerCase()} scenario: ${scenario.title}. Provide a detailed analysis and response explaining your approach.`;
      }
    });
    
    return scenarios.slice(0, 4); // Limit to 4 scenarios max for better UX
  }

  generateFallbackScenario(prompt, requestCount = 5) {
    const topic = prompt.toLowerCase().includes('customer') ? 'Customer Service' : 
                  prompt.toLowerCase().includes('safety') ? 'Safety Training' :
                  prompt.toLowerCase().includes('sales') ? 'Sales Training' : 
                  prompt.toLowerCase().includes('exam') ? 'Exam Administration' : 'Training';
    
    const scenarios = [
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
      },
      {
        id: 4,
        title: `${topic} Problem Resolution`,
        description: `A complex problem has arisen in ${topic.toLowerCase()} that affects multiple people or departments. You need to identify the root cause, develop a solution, and implement it while managing stakeholder expectations. Describe your approach to problem-solving and how you would ensure the solution is effective.`
      },
      {
        id: 5,
        title: `${topic} Ethical Dilemma`,
        description: `You face an ethical dilemma related to ${topic.toLowerCase()} where different courses of action have various benefits and drawbacks. Competing interests and values must be balanced. Explain how you would analyze the ethical implications and arrive at a decision that upholds professional standards.`
      }
    ];
    
    return scenarios.slice(0, requestCount);
  }

  async generateHTML(prompt, options = {}) {
    const {
      includeInteractivity = false,
      contentType = 'general',
      includeBranding = true,
      isRefinement = false
    } = options;

    const systemPrompt = this.buildHTMLSystemPrompt(contentType, includeInteractivity, includeBranding, isRefinement);
    const enhancedPrompt = isRefinement ? prompt : this.enhanceHTMLPrompt(prompt, contentType);
    
    try {
      const response = await this.callAPI({
        model: this.getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enhancedPrompt }
        ],
        temperature: isRefinement ? 0.3 : 0.4,
        max_tokens: 4000
      });

      return this.postProcessHTML(response.content, contentType, includeBranding);
    } catch (error) {
      console.error('AI HTML generation failed:', error);
      
      // Try with simplified prompt if original fails
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        console.log('Retrying with simplified prompt...');
        try {
          const simplifiedPrompt = `Create ${contentType} training content: ${prompt}. Use Pearson colors #0B004A, #6C2EB7. Include basic interactivity.`;
          const response = await this.callAPI({
            model: this.getModel(),
            messages: [
              { role: 'system', content: `Generate HTML training content with Pearson branding.` },
              { role: 'user', content: simplifiedPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000
          });
          
          return this.postProcessHTML(response.content, contentType, includeBranding);
        } catch (retryError) {
          console.error('Simplified retry also failed:', retryError);
        }
      }
      
      throw new Error('Failed to generate HTML content');
    }
  }

  buildHTMLSystemPrompt(contentType, includeInteractivity, includeBranding, isRefinement = false) {
    const basePrompt = isRefinement ? 
      `Expert HTML developer refining existing ${contentType} training content. Improve the provided HTML based on user feedback while maintaining structure and functionality.` :
      `Expert HTML developer creating ${contentType} training content for Pearson Education. Generate complete HTML with modern CSS${includeInteractivity ? ' and interactive JavaScript' : ''}.`;
    
    const contentTypePrompts = {
      'quiz': 'Interactive quiz with multiple choice, drag & drop, feedback, and progress tracking.',
      'sandbox': 'System interface simulation with clickable elements and step-by-step guidance.',
      'walkthrough': 'Process guide with numbered steps, checkboxes, and progress indicators.',
      'interactive': 'Engaging content with hover effects, modals, animations, and user interactions.',
      'general': 'Professional training layout with clear hierarchy and responsive design.'
    };

    const requirements = includeBranding ? `
Use Pearson branding: #0B004A, #6C2EB7, #E6E6F2 colors, Plus Jakarta Sans font, rounded corners, gradients.
Include: HTML5 semantics, CSS Grid/Flexbox, vanilla JavaScript, ARIA labels, mobile-responsive design.` : `
Include: Modern CSS, responsive design, semantic HTML, accessibility features.`;

    return `${basePrompt} ${contentTypePrompts[contentType] || contentTypePrompts['general']}${requirements}`;
  }

  enhanceHTMLPrompt(prompt, contentType) {
    const contentTypeEnhancements = {
      'quiz': `Create an interactive quiz with multiple choice questions, drag & drop exercises, and immediate feedback. Include progress tracking and a results screen with Pearson branding.`,
      
      'sandbox': `Build a system interface sandbox with clickable buttons, simulated forms, and step-by-step guidance. Include reset functionality and help tooltips.`,
      
      'walkthrough': `Design an interactive process guide with numbered steps, checkboxes for completion, collapsible sections, and progress indicators.`,
      
      'interactive': `Create engaging content with hover effects, expandable sections, modal dialogs, animations, and interactive elements that respond to user actions.`,
      
      'general': `Build professional training content with clean layout, clear typography hierarchy, and responsive design.`
    };

    const enhancement = contentTypeEnhancements[contentType] || contentTypeEnhancements['general'];
    
    return `${enhancement}

Content Request: ${prompt}

TECHNICAL REQUIREMENTS:
- Use Pearson colors: #0B004A (primary), #6C2EB7 (secondary), #E6E6F2 (light)
- Plus Jakarta Sans font (include Google Fonts link)
- Responsive design with CSS Grid/Flexbox
- Interactive JavaScript for user engagement
- ARIA labels for accessibility
- Mobile-first approach
- Include complete HTML structure with DOCTYPE
- Generate comprehensive, detailed content with substantial sections
- Create full-featured implementation with multiple components and interactions

IMPORTANT: Return only the HTML code without any explanatory text, introductions, or descriptions. Start directly with <!DOCTYPE html> and end with </html>.`;
  }

  postProcessHTML(html, contentType, includeBranding) {
    let processedHTML = html;

    // Remove any markdown formatting that might have slipped through
    processedHTML = processedHTML.replace(/```html/g, '').replace(/```/g, '');
    processedHTML = processedHTML.replace(/```/g, '');
    
    // Remove any conversational text at the beginning or end
    processedHTML = processedHTML.replace(/^[^<]*(?=<!DOCTYPE|<html)/i, '');
    processedHTML = processedHTML.replace(/<\/html>[\s\S]*$/i, '</html>');
    
    // Remove common conversational phrases that might appear
    processedHTML = processedHTML.replace(/^(Here's|Here is|This is|I've created|I'll create|Below is).*?(?=<!DOCTYPE|<html)/is, '');
    processedHTML = processedHTML.replace(/^.*?(?=<!DOCTYPE html|<html)/is, '');
    
    // Remove any text after the closing html tag
    processedHTML = processedHTML.replace(/(<\/html>)[\s\S]*$/i, '$1');
    
    // Clean up any remaining whitespace
    processedHTML = processedHTML.trim();

    if (!includeBranding) {
      return processedHTML;
    }

    // Add Pearson font if not included
    if (!processedHTML.includes('Plus Jakarta Sans') && !processedHTML.includes('fonts.googleapis.com')) {
      processedHTML = processedHTML.replace(
        '<head>',
        `<head>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">`
      );
    }

    // Ensure proper title
    if (!processedHTML.includes('<title>') || processedHTML.includes('<title></title>')) {
      processedHTML = processedHTML.replace(
        /<title>.*?<\/title>/,
        '<title>Pearson Training Module</title>'
      );
    }

    return processedHTML;
  }

  getInteractiveComponentLibrary() {
    return {
      dragDrop: `
<!-- Drag & Drop Component -->
<div class="drag-drop-container" style="margin: 2rem 0;">
  <h3 style="color: #0B004A; margin-bottom: 1rem;">Drag items to the correct categories:</h3>
  <div class="drag-items" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; padding: 1rem; border: 2px dashed #6C2EB7; border-radius: 8px;">
    <div class="drag-item" draggable="true" style="padding: 0.5rem 1rem; background: #E6E6F2; border-radius: 6px; cursor: grab;">Item 1</div>
    <div class="drag-item" draggable="true" style="padding: 0.5rem 1rem; background: #E6E6F2; border-radius: 6px; cursor: grab;">Item 2</div>
  </div>
  <div class="drop-zones" style="display: flex; gap: 1rem;">
    <div class="drop-zone" style="flex: 1; min-height: 100px; border: 2px solid #6C2EB7; border-radius: 8px; padding: 1rem; background: #faf9ff;">
      <h4 style="margin: 0 0 0.5rem 0; color: #0B004A;">Category A</h4>
    </div>
    <div class="drop-zone" style="flex: 1; min-height: 100px; border: 2px solid #6C2EB7; border-radius: 8px; padding: 1rem; background: #faf9ff;">
      <h4 style="margin: 0 0 0.5rem 0; color: #0B004A;">Category B</h4>
    </div>
  </div>
</div>`,

      multipleChoice: `
<!-- Multiple Choice Component -->
<div class="quiz-question" style="margin: 2rem 0; padding: 1.5rem; border: 2px solid #E6E6F2; border-radius: 12px; background: white;">
  <h3 style="color: #0B004A; margin-bottom: 1rem;">Question: What is the best approach?</h3>
  <div class="quiz-options">
    <label style="display: block; margin: 0.5rem 0; padding: 0.75rem; border: 2px solid #E6E6F2; border-radius: 8px; cursor: pointer; transition: all 0.3s;">
      <input type="radio" name="q1" value="a" style="margin-right: 0.5rem;"> Option A: First approach
    </label>
    <label style="display: block; margin: 0.5rem 0; padding: 0.75rem; border: 2px solid #E6E6F2; border-radius: 8px; cursor: pointer; transition: all 0.3s;">
      <input type="radio" name="q1" value="b" style="margin-right: 0.5rem;"> Option B: Second approach
    </label>
    <label style="display: block; margin: 0.5rem 0; padding: 0.75rem; border: 2px solid #E6E6F2; border-radius: 8px; cursor: pointer; transition: all 0.3s;">
      <input type="radio" name="q1" value="c" style="margin-right: 0.5rem;"> Option C: Third approach
    </label>
  </div>
  <button onclick="checkAnswer('q1', 'b')" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #0B004A 0%, #6C2EB7 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Submit Answer</button>
  <div id="feedback-q1" style="margin-top: 1rem; padding: 1rem; border-radius: 8px; display: none;"></div>
</div>`,

      progressTracker: `
<!-- Progress Tracker Component -->
<div class="progress-container" style="margin: 2rem 0;">
  <div class="progress-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
    <h3 style="color: #0B004A; margin: 0;">Training Progress</h3>
    <span class="progress-text" style="color: #6C2EB7; font-weight: 600;">0% Complete</span>
  </div>
  <div class="progress-bar" style="width: 100%; height: 12px; background: #E6E6F2; border-radius: 6px; overflow: hidden;">
    <div class="progress-fill" style="width: 0%; height: 100%; background: linear-gradient(135deg, #0B004A 0%, #6C2EB7 100%); transition: width 0.5s ease;"></div>
  </div>
  <div class="progress-steps" style="margin-top: 1rem; display: flex; justify-content: space-between;">
    <div class="step active" style="flex: 1; text-align: center; padding: 0.5rem; border-radius: 6px; background: #faf9ff;">Step 1</div>
    <div class="step" style="flex: 1; text-align: center; padding: 0.5rem; margin-left: 0.5rem; border-radius: 6px; background: #f5f5f5;">Step 2</div>
    <div class="step" style="flex: 1; text-align: center; padding: 0.5rem; margin-left: 0.5rem; border-radius: 6px; background: #f5f5f5;">Step 3</div>
  </div>
</div>`,

      interactiveTimeline: `
<!-- Interactive Timeline Component -->
<div class="timeline-container" style="margin: 2rem 0;">
  <h3 style="color: #0B004A; margin-bottom: 2rem;">Process Timeline</h3>
  <div class="timeline" style="position: relative; padding-left: 2rem;">
    <div class="timeline-line" style="position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #6C2EB7;"></div>
    <div class="timeline-item" onclick="toggleStep(1)" style="position: relative; margin-bottom: 2rem; cursor: pointer;">
      <div class="timeline-marker" style="position: absolute; left: -23px; width: 16px; height: 16px; background: #6C2EB7; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 0 2px #6C2EB7;"></div>
      <div class="timeline-content" style="padding: 1rem; border: 2px solid #E6E6F2; border-radius: 8px; background: white;">
        <h4 style="color: #0B004A; margin: 0 0 0.5rem 0;">Step 1: Initial Assessment</h4>
        <div class="timeline-details" style="display: none; margin-top: 1rem; padding: 1rem; background: #faf9ff; border-radius: 6px;">
          <p style="margin: 0; color: #333;">Detailed explanation of the first step in the process...</p>
        </div>
      </div>
    </div>
  </div>
</div>`,

      sandboxInterface: `
<!-- Sandbox Interface Component -->
<div class="sandbox-container" style="margin: 2rem 0; border: 2px solid #6C2EB7; border-radius: 12px; background: white;">
  <div class="sandbox-header" style="padding: 1rem; background: linear-gradient(135deg, #0B004A 0%, #6C2EB7 100%); color: white; border-radius: 10px 10px 0 0;">
    <h3 style="margin: 0;">System Simulation</h3>
    <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Practice using the interface below</p>
  </div>
  <div class="sandbox-content" style="padding: 2rem;">
    <div class="simulated-interface" style="border: 1px solid #E6E6F2; border-radius: 8px; padding: 1.5rem; background: #fafafa;">
      <div class="interface-buttons" style="display: flex; gap: 1rem; margin-bottom: 1rem;">
        <button onclick="simulateAction('save')" style="padding: 0.75rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer;">Save</button>
        <button onclick="simulateAction('cancel')" style="padding: 0.75rem 1.5rem; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
        <button onclick="simulateAction('help')" style="padding: 0.75rem 1.5rem; background: #6C2EB7; color: white; border: none; border-radius: 6px; cursor: pointer;">Help</button>
      </div>
      <div class="interface-content" style="padding: 1rem; background: white; border: 1px solid #ddd; border-radius: 6px;">
        <p style="margin: 0; color: #666;">Click the buttons above to simulate different actions...</p>
      </div>
    </div>
  </div>
</div>`
    };
  }

  buildInteractiveJavaScript() {
    return `
<script>
// Drag and Drop Functionality
document.addEventListener('DOMContentLoaded', function() {
  const dragItems = document.querySelectorAll('.drag-item');
  const dropZones = document.querySelectorAll('.drop-zone');
  
  dragItems.forEach(item => {
    item.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', e.target.textContent);
      e.target.style.opacity = '0.5';
    });
    
    item.addEventListener('dragend', function(e) {
      e.target.style.opacity = '1';
    });
  });
  
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', function(e) {
      e.preventDefault();
      zone.style.background = '#f0f8ff';
    });
    
    zone.addEventListener('dragleave', function(e) {
      zone.style.background = '#faf9ff';
    });
    
    zone.addEventListener('drop', function(e) {
      e.preventDefault();
      const data = e.dataTransfer.getData('text/plain');
      const newItem = document.createElement('div');
      newItem.textContent = data;
      newItem.style.padding = '0.5rem';
      newItem.style.margin = '0.25rem 0';
      newItem.style.background = '#E6E6F2';
      newItem.style.borderRadius = '6px';
      zone.appendChild(newItem);
      zone.style.background = '#faf9ff';
    });
  });
});

// Quiz Answer Checking
function checkAnswer(questionName, correctAnswer) {
  const selected = document.querySelector('input[name="' + questionName + '"]:checked');
  const feedback = document.getElementById('feedback-' + questionName);
  
  if (!selected) {
    feedback.innerHTML = '<p style="color: #dc3545; margin: 0;">Please select an answer.</p>';
    feedback.style.display = 'block';
    return;
  }
  
  if (selected.value === correctAnswer) {
    feedback.innerHTML = '<p style="color: #28a745; margin: 0;">✅ Correct! Well done.</p>';
    feedback.style.background = '#d4edda';
    feedback.style.border = '2px solid #28a745';
  } else {
    feedback.innerHTML = '<p style="color: #dc3545; margin: 0;">❌ Incorrect. Please try again.</p>';
    feedback.style.background = '#f8d7da';
    feedback.style.border = '2px solid #dc3545';
  }
  feedback.style.display = 'block';
}

// Progress Tracking
function updateProgress(percentage) {
  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');
  
  if (progressFill) {
    progressFill.style.width = percentage + '%';
    progressText.textContent = percentage + '% Complete';
  }
}

// Timeline Interactions
function toggleStep(stepNumber) {
  const timelineItem = document.querySelector('.timeline-item:nth-child(' + (stepNumber + 1) + ') .timeline-details');
  if (timelineItem) {
    timelineItem.style.display = timelineItem.style.display === 'none' ? 'block' : 'none';
  }
}

// Sandbox Simulations
function simulateAction(action) {
  const content = document.querySelector('.interface-content p');
  const messages = {
    save: 'Data has been saved successfully! ✅',
    cancel: 'Operation cancelled. No changes made. ⚠️',
    help: 'Help documentation opened. View the user guide for assistance. 📚'
  };
  
  if (content) {
    content.textContent = messages[action] || 'Action completed.';
    content.style.color = action === 'save' ? '#28a745' : action === 'cancel' ? '#dc3545' : '#0B004A';
  }
}

// Enhanced Quiz Options Styling
document.addEventListener('DOMContentLoaded', function() {
  const labels = document.querySelectorAll('.quiz-options label');
  labels.forEach(label => {
    label.addEventListener('mouseenter', function() {
      this.style.borderColor = '#6C2EB7';
      this.style.background = '#faf9ff';
    });
    
    label.addEventListener('mouseleave', function() {
      if (!this.querySelector('input').checked) {
        this.style.borderColor = '#E6E6F2';
        this.style.background = 'white';
      }
    });
    
    label.querySelector('input').addEventListener('change', function() {
      labels.forEach(l => {
        l.style.borderColor = '#E6E6F2';
        l.style.background = 'white';
      });
      if (this.checked) {
        label.style.borderColor = '#6C2EB7';
        label.style.background = '#faf9ff';
      }
    });
  });
});
</script>`;
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