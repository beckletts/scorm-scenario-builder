// Simple test function to verify Netlify Functions are working
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Test endpoint
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Netlify Functions are working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      })
    };
  }

  // Test API key validation
  if (event.httpMethod === 'POST') {
    try {
      const { provider, apiKey } = JSON.parse(event.body || '{}');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Test successful',
          provider: provider || 'none',
          hasApiKey: !!apiKey,
          keyLength: apiKey ? apiKey.length : 0
        })
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON in request body'
        })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({
      error: 'Method not allowed'
    })
  };
};