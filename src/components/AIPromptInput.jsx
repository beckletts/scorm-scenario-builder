import { useState } from 'react';
import styled from 'styled-components';

const pearsonColors = {
  purple: '#0B004A',
  amethyst: '#6C2EB7',
  lightPurple: '#E6E6F2',
  white: '#FFFFFF',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545'
};

const AISection = styled.div`
  background: linear-gradient(135deg, ${pearsonColors.amethyst}15, ${pearsonColors.lightPurple}30);
  border: 2px dashed ${pearsonColors.amethyst};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const AIHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const AIIcon = styled.div`
  background: ${pearsonColors.amethyst};
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  font-weight: bold;
`;

const AITitle = styled.h3`
  margin: 0;
  color: ${pearsonColors.purple};
  font-size: 1.1rem;
  font-weight: 600;
`;

const PromptTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 2px solid ${pearsonColors.lightPurple};
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${pearsonColors.amethyst};
    box-shadow: 0 0 0 3px ${pearsonColors.amethyst}20;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const AIControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const GenerateButton = styled.button`
  background: ${({ $loading }) => $loading ? '#ccc' : pearsonColors.amethyst};
  color: white;
  border: none;
  border-radius: 24px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background: ${pearsonColors.purple};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const SlideCountSelect = styled.select`
  padding: 0.5rem;
  border: 2px solid ${pearsonColors.lightPurple};
  border-radius: 8px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${pearsonColors.amethyst};
  }
`;

const StatusMessage = styled.div`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-top: 1rem;
  
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
  
  &.warning {
    background: ${pearsonColors.warning}20;
    color: #856404;
    border: 1px solid ${pearsonColors.warning}40;
  }
`;

const ConfigButton = styled.button`
  background: transparent;
  color: ${pearsonColors.amethyst};
  border: 2px solid ${pearsonColors.amethyst};
  border-radius: 20px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${pearsonColors.amethyst};
    color: white;
  }
`;

const AIPromptInput = ({ 
  type = 'slides', 
  onGenerate, 
  placeholder,
  showSlideCount = false,
  showConfig = true,
  isConfigured = false 
}) => {
  const [prompt, setPrompt] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setStatus({ type: 'warning', message: 'Please enter a prompt to generate content.' });
      return;
    }

    if (!isConfigured) {
      setStatus({ type: 'warning', message: 'Please configure your AI API key first.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const options = showSlideCount ? { slideCount } : {};
      await onGenerate(prompt, options);
      setStatus({ type: 'success', message: 'Content generated successfully!' });
      setPrompt(''); // Clear prompt after successful generation
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.message || 'Failed to generate content. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'slides': return 'AI Slide Generator';
      case 'scenario': return 'AI Scenario Generator';
      case 'html': return 'AI HTML Generator';
      case 'project': return 'AI Project Generator';
      default: return 'AI Content Generator';
    }
  };

  const getDefaultPlaceholder = () => {
    switch (type) {
      case 'slides': 
        return 'Describe the topic for your slides (e.g., "Introduction to Machine Learning for beginners")';
      case 'scenario': 
        return 'Describe the learning scenario (e.g., "Customer service training for handling complaints")';
      case 'html': 
        return 'Describe the HTML content you want to create (e.g., "Interactive timeline of World War II")';
      case 'project': 
        return 'Describe the complete learning project (e.g., "Comprehensive cybersecurity awareness training")';
      default: 
        return 'Describe what you want to generate...';
    }
  };

  return (
    <AISection>
      <AIHeader>
        <AIIcon>AI</AIIcon>
        <AITitle>{getTitle()}</AITitle>
        {showConfig && (
          <ConfigButton 
            style={{ marginLeft: 'auto' }}
            onClick={() => window.showAIConfig?.()}
          >
            {isConfigured ? '⚙️ Configured' : '⚙️ Setup API'}
          </ConfigButton>
        )}
      </AIHeader>
      
      <PromptTextarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder || getDefaultPlaceholder()}
        disabled={loading}
      />
      
      <AIControls>
        <GenerateButton 
          onClick={handleGenerate}
          disabled={loading || !isConfigured}
          $loading={loading}
        >
          {loading ? (
            <>
              <span>⏳</span>
              Generating...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate Content
            </>
          )}
        </GenerateButton>
        
        {showSlideCount && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label>Slides:</label>
            <SlideCountSelect
              value={slideCount}
              onChange={(e) => setSlideCount(parseInt(e.target.value))}
              disabled={loading}
            >
              <option value={3}>3 slides</option>
              <option value={5}>5 slides</option>
              <option value={8}>8 slides</option>
              <option value={10}>10 slides</option>
              <option value={15}>15 slides</option>
            </SlideCountSelect>
          </div>
        )}
      </AIControls>
      
      {status && (
        <StatusMessage className={status.type}>
          {status.message}
        </StatusMessage>
      )}
    </AISection>
  );
};

export default AIPromptInput;