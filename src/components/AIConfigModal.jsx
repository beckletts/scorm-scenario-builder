import { useState, useEffect } from 'react';
import styled from 'styled-components';

const pearsonColors = {
  purple: '#0B004A',
  amethyst: '#6C2EB7',
  lightPurple: '#E6E6F2',
  white: '#FFFFFF',
  success: '#28a745',
  danger: '#dc3545'
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${pearsonColors.purple};
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0.25rem;
  
  &:hover {
    color: ${pearsonColors.purple};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: ${pearsonColors.purple};
  margin-bottom: 0.5rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${pearsonColors.lightPurple};
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${pearsonColors.amethyst};
    box-shadow: 0 0 0 3px ${pearsonColors.amethyst}20;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${pearsonColors.lightPurple};
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${pearsonColors.amethyst};
    box-shadow: 0 0 0 3px ${pearsonColors.amethyst}20;
  }
  
  &[type="password"] {
    font-family: monospace;
  }
`;

const HelpText = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
  line-height: 1.4;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &.primary {
    background: ${pearsonColors.amethyst};
    color: white;
    
    &:hover {
      background: ${pearsonColors.purple};
    }
  }
  
  &.secondary {
    background: #f8f9fa;
    color: ${pearsonColors.purple};
    border: 2px solid ${pearsonColors.lightPurple};
    
    &:hover {
      background: ${pearsonColors.lightPurple};
    }
  }
  
  &.test {
    background: ${pearsonColors.success};
    color: white;
    
    &:hover {
      background: #218838;
    }
    
    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }
`;

const StatusMessage = styled.div`
  padding: 0.75rem;
  border-radius: 8px;
  margin: 1rem 0;
  
  &.success {
    background: ${pearsonColors.success}20;
    color: ${pearsonColors.success};
    border: 1px solid ${pearsonColors.success}40;
  }
  
  &.error {
    background: ${pearsonColors.danger}20;
    color: ${pearsonColors.danger};
    border: 1px solid ${pearsonColors.danger}40;
  }
`;

const ProviderInfo = styled.div`
  background: ${pearsonColors.lightPurple}40;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: ${pearsonColors.purple};
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
    line-height: 1.4;
  }
  
  a {
    color: ${pearsonColors.amethyst};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const AIConfigModal = ({ isOpen, onClose, onSave, currentConfig }) => {
  const [provider, setProvider] = useState(currentConfig?.provider || 'openai');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [customUrl, setCustomUrl] = useState(currentConfig?.customUrl || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (currentConfig) {
      setProvider(currentConfig.provider || 'openai');
      setApiKey(currentConfig.apiKey || '');
      setCustomUrl(currentConfig.customUrl || '');
    }
  }, [currentConfig]);

  const handleSave = () => {
    if (!apiKey.trim() && provider !== 'ollama') {
      setTestResult({ type: 'error', message: 'API key is required' });
      return;
    }

    onSave({
      provider,
      apiKey: apiKey.trim(),
      customUrl: customUrl.trim()
    });

    setTestResult({ type: 'success', message: 'Configuration saved successfully!' });
    setTimeout(() => {
      onClose();
      setTestResult(null);
    }, 1500);
  };

  const handleTest = async () => {
    if (!apiKey.trim() && provider !== 'ollama') {
      setTestResult({ type: 'error', message: 'Please enter an API key first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Import and test the AI service
      const { initializeAI } = await import('../services/aiService.js');
      const aiService = initializeAI(apiKey, provider);
      
      // Simple test prompt
      await aiService.callAPI({
        model: aiService.getModel(),
        messages: [{ role: 'user', content: 'Say "Hello" to test the connection.' }],
        temperature: 0.1
      });

      setTestResult({ type: 'success', message: 'Connection successful! API is working.' });
    } catch (error) {
      setTestResult({ 
        type: 'error', 
        message: `Connection failed: ${error.message}` 
      });
    } finally {
      setTesting(false);
    }
  };

  const getProviderInfo = () => {
    switch (provider) {
      case 'openai':
        return {
          title: 'OpenAI',
          description: 'Most reliable option with GPT-4. Requires an OpenAI API key.',
          link: 'https://platform.openai.com/api-keys'
        };
      case 'anthropic':
        return {
          title: 'Anthropic Claude',
          description: 'High-quality responses with Claude models. Requires an Anthropic API key.',
          link: 'https://console.anthropic.com/'
        };
      case 'ollama':
        return {
          title: 'Ollama (Local)',
          description: 'Run models locally on your machine. Requires Ollama to be installed and running.',
          link: 'https://ollama.ai/'
        };
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const providerInfo = getProviderInfo();

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>AI Configuration</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <FormGroup>
          <Label>AI Provider</Label>
          <Select 
            value={provider} 
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="openai">OpenAI (GPT-4)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="ollama">Ollama (Local)</option>
          </Select>
          
          {providerInfo && (
            <ProviderInfo>
              <h4>{providerInfo.title}</h4>
              <p>
                {providerInfo.description}
                {providerInfo.link && (
                  <>
                    {' '}
                    <a href={providerInfo.link} target="_blank" rel="noopener noreferrer">
                      Get API key →
                    </a>
                  </>
                )}
              </p>
            </ProviderInfo>
          )}
        </FormGroup>

        {provider !== 'ollama' && (
          <FormGroup>
            <Label>API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key..."
            />
            <HelpText>
              Your API key is stored locally in your browser and never sent to our servers.
            </HelpText>
          </FormGroup>
        )}

        {provider === 'ollama' && (
          <FormGroup>
            <Label>Ollama URL (Optional)</Label>
            <Input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://localhost:11434"
            />
            <HelpText>
              Leave empty to use default localhost:11434. Make sure Ollama is running.
            </HelpText>
          </FormGroup>
        )}

        {testResult && (
          <StatusMessage className={testResult.type}>
            {testResult.message}
          </StatusMessage>
        )}

        <ButtonGroup>
          <Button 
            className="test" 
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button className="primary" onClick={handleSave}>
            Save Configuration
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AIConfigModal;