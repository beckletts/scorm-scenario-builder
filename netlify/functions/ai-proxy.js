// Netlify Function for AI API proxy
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { provider, apiKey, payload } = JSON.parse(event.body);
    
    if (!apiKey || !provider || !payload) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    let url, headers, body;

    // Configure for different providers
    switch (provider) {
      case 'openai':
        url = 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        body = JSON.stringify(payload);
        break;

      case 'anthropic':
        url = 'https://api.anthropic.com/v1/messages';
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        };
        body = JSON.stringify({
          model: payload.model,
          max_tokens: 4000,
          messages: payload.messages,
          temperature: payload.temperature
        });
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Unsupported provider' })
        };
    }

    // Make the API call
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({ content })
    };

  } catch (error) {
    console.error('AI proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};