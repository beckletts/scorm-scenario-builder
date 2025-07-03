// Netlify Function for AI API proxy
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { provider, apiKey, payload } = JSON.parse(event.body || '{}');
    
    console.log('Received request:', { provider, hasApiKey: !!apiKey, hasPayload: !!payload });
    
    if (!provider || !payload) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: provider and payload are required' })
      };
    }

    if (!apiKey && provider !== 'ollama') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'API key is required for this provider' })
      };
    }

    let url, apiHeaders, body;

    // Configure for different providers
    switch (provider) {
      case 'openai':
        url = 'https://api.openai.com/v1/chat/completions';
        apiHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        body = JSON.stringify(payload);
        break;

      case 'anthropic':
        url = 'https://api.anthropic.com/v1/messages';
        apiHeaders = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        };
        // Convert OpenAI format to Anthropic format
        const anthropicPayload = {
          model: payload.model || 'claude-3-5-sonnet-20240620',
          max_tokens: 4000,
          messages: payload.messages.map(msg => ({
            role: msg.role === 'system' ? 'user' : msg.role,
            content: msg.content
          })),
          temperature: payload.temperature || 0.7
        };
        
        // Handle system message by prepending to first user message
        const systemMessage = payload.messages.find(m => m.role === 'system');
        if (systemMessage) {
          const firstUserIndex = anthropicPayload.messages.findIndex(m => m.role === 'user');
          if (firstUserIndex >= 0) {
            anthropicPayload.messages[firstUserIndex].content = 
              systemMessage.content + '\n\n' + anthropicPayload.messages[firstUserIndex].content;
          }
          // Remove system message as Anthropic doesn't support it in messages array
          anthropicPayload.messages = anthropicPayload.messages.filter(m => m.role !== 'system');
        }
        
        body = JSON.stringify(anthropicPayload);
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Unsupported provider' })
        };
    }

    // Make the API call
    console.log(`Making ${provider} API call to:`, url);
    console.log('Headers:', JSON.stringify(apiHeaders, null, 2));
    console.log('Body:', body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: apiHeaders,
      body
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify([...response.headers.entries()], null, 2));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Normalize response format
    let content;
    if (provider === 'anthropic') {
      content = data.content[0].text;
    } else {
      content = data.choices[0].message.content;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content })
    };

  } catch (error) {
    console.error('AI proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};