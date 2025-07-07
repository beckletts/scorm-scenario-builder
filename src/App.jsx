import { useState, useEffect } from 'react'
import logo from '../logos/logo.webp'
import wave from '../logos/homepage-banner-image.webp'
import '../logos/pearson-favicon.svg'
import '@fontsource/plus-jakarta-sans'
import styled, { createGlobalStyle } from 'styled-components'
import JSZip from 'jszip'
import AIPromptInput from './components/AIPromptInput'
import AIConfigModal from './components/AIConfigModal'
import { initializeAI, getAIService } from './services/aiService'

const pearsonColors = {
  purple: '#0B004A',
  amethyst: '#6C2EB7',
  lightPurple: '#E6E6F2',
  white: '#FFFFFF',
}

const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Plus Jakarta Sans', Arial, sans-serif;
    background: ${pearsonColors.lightPurple};
    margin: 0;
    color: ${pearsonColors.purple};
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 1.5rem 2rem 1rem 2rem;
  background: ${pearsonColors.white};
  box-shadow: 0 2px 8px rgba(11,0,74,0.05);
  position: relative;
  z-index: 2;
`;

const Logo = styled.img`
  height: 48px;
  margin-right: 1.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -1px;
  margin: 0;
`;

const Wave = styled.img`
  width: 100%;
  max-height: 120px;
  object-fit: cover;
  margin-bottom: -4rem;
  z-index: 1;
`;

const Tabs = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0 1rem 0;
  gap: 1.5rem;
`;

const Tab = styled.button`
  background: ${({ $active }) => ($active ? pearsonColors.purple : pearsonColors.white)};
  color: ${({ $active }) => ($active ? pearsonColors.white : pearsonColors.purple)};
  border: none;
  border-radius: 24px;
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${({ $active }) => ($active ? '0 2px 8px rgba(11,0,74,0.10)' : 'none')};
  transition: background 0.2s, color 0.2s;
  outline: ${({ $active }) => ($active ? '2px solid #6C2EB7' : 'none')};
`;

const TabPanel = styled.div`
  background: ${pearsonColors.white};
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(11,0,74,0.07);
  padding: 2rem;
  margin: 0 auto 2rem auto;
  max-width: 800px;
`;

const UploadLabel = styled.label`
  display: inline-block;
  background: ${pearsonColors.amethyst};
  color: ${pearsonColors.white};
  border-radius: 24px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-right: 1rem;
  margin-bottom: 1rem;
  transition: background 0.2s;
  &:hover, &:focus {
    background: ${pearsonColors.purple};
    outline: 2px solid ${pearsonColors.purple};
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const tabNames = [
  'Video/Storylane',
  'Scenario',
  'HTML Code',
  'Slide Builder',
  'SCORM Builder',
  'Project Builder',
];

function VideoTab() {
  const [input, setInput] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [file, setFile] = useState(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [previewType, setPreviewType] = useState(''); // 'iframe', 'video', or 'embed'
  const [embedContent, setEmbedContent] = useState('');

  function handleInputChange(e) {
    setInput(e.target.value);
    setFile(null);
    setEmbedCode('');
  }

  function handleEmbedCodeChange(e) {
    setEmbedCode(e.target.value);
    setInput('');
    setFile(null);
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f);
    setInput('');
    setEmbedCode('');
  }

  function handlePreview() {
    if (file) {
      setPreviewType('video');
      setEmbedUrl(URL.createObjectURL(file));
      setEmbedContent('');
    } else if (embedCode.trim()) {
      // Handle Storylane or other embed codes
      setPreviewType('embed');
      setEmbedContent(embedCode.trim());
      setEmbedUrl('');
    } else if (input) {
      // YouTube, Storylane URL, or other embed
      let url = input.trim();
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Convert to embed URL
        const match = url.match(/(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
        if (match) {
          url = `https://www.youtube.com/embed/${match[1]}`;
        }
      } else if (url.includes('storylane.io')) {
        // Storylane embed - extract iframe src if it's just a URL
        if (!url.includes('embed=inline')) {
          url = url.replace('/demo/', '/demo/').includes('?') ? url + '&embed=inline' : url + '?embed=inline';
        }
      }
      setPreviewType('iframe');
      setEmbedUrl(url);
      setEmbedContent('');
    }
  }

  async function handleDownloadZip() {
    const zip = new JSZip();
    let html = '';
    
    if (previewType === 'iframe') {
      html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Embedded Content</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .responsive-container {
            position: relative;
            width: 100%;
            max-width: 100%;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            overflow: hidden;
        }
        .responsive-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        @media (max-width: 768px) {
            .responsive-container {
                padding-bottom: 75%; /* Adjust aspect ratio for mobile */
            }
        }
    </style>
</head>
<body>
    <div class="responsive-container">
        <iframe class="responsive-iframe" src="${embedUrl}" allowfullscreen loading="lazy"></iframe>
    </div>
</body>
</html>`;
      zip.file('index.html', html);
      
    } else if (previewType === 'embed') {
      // For Storylane embed codes, create a responsive wrapper
      const isStorylaneFull = embedContent.includes('<!DOCTYPE html') || embedContent.includes('<html');
      
      if (isStorylaneFull) {
        // If it's a full HTML document, create a responsive iframe wrapper
        html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Storylane Interactive Demo</title>
    <style>
        body { 
            margin: 0; 
            padding: 10px; 
            font-family: 'Plus Jakarta Sans', Arial, sans-serif; 
            background-color: #f5f5f5;
        }
        .storylane-wrapper {
            position: relative;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .storylane-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 62.5%; /* Storylane typical aspect ratio */
        }
        .storylane-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
        }
        .loading-message {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #666;
            font-size: 16px;
        }
        @media (max-width: 768px) {
            body { padding: 5px; }
            .storylane-container { padding-bottom: 75%; }
            .storylane-wrapper { border-radius: 4px; }
        }
        @media (max-width: 480px) {
            .storylane-container { padding-bottom: 90%; }
        }
    </style>
</head>
<body>
    <div class="storylane-wrapper">
        <div class="storylane-container">
            <div class="loading-message">Loading interactive demo...</div>
            <iframe class="storylane-iframe" srcdoc='${embedContent.replace(/'/g, "&#39;")}' allowfullscreen loading="lazy"></iframe>
        </div>
    </div>
    <script>
        // Ensure iframe loads properly
        document.addEventListener('DOMContentLoaded', function() {
            const iframe = document.querySelector('.storylane-iframe');
            const loading = document.querySelector('.loading-message');
            
            iframe.onload = function() {
                loading.style.display = 'none';
            };
            
            // Fallback to hide loading message after 3 seconds
            setTimeout(function() {
                loading.style.display = 'none';
            }, 3000);
        });
    </script>
</body>
</html>`;
        
        // Also create the full storylane content as a separate file
        zip.file('storylane-full.html', embedContent);
        
      } else {
        // For embed snippets, wrap them responsively
        html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Content</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: 'Plus Jakarta Sans', Arial, sans-serif; 
            background-color: #f5f5f5;
        }
        .content-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .embed-container {
            position: relative;
            width: 100%;
            overflow: hidden;
        }
        /* Make Storylane embeds responsive */
        .sl-embed {
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            padding-bottom: 62.5% !important;
        }
        .sl-demo {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            border: none !important;
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .content-wrapper { padding: 15px; }
            .sl-embed { padding-bottom: 75% !important; }
        }
        @media (max-width: 480px) {
            body { padding: 5px; }
            .content-wrapper { padding: 10px; }
            .sl-embed { padding-bottom: 90% !important; }
        }
    </style>
</head>
<body>
    <div class="content-wrapper">
        <div class="embed-container">
            ${embedContent}
        </div>
    </div>
</body>
</html>`;
      }
      
      zip.file('index.html', html);
      
    } else if (previewType === 'video' && file) {
      html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Content</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .video-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .video-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
        }
        .responsive-video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 4px;
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .video-wrapper { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="video-wrapper">
        <div class="video-container">
            <video class="responsive-video" src="video/${file.name}" controls></video>
        </div>
    </div>
</body>
</html>`;
      zip.file('index.html', html);
      zip.folder('video').file(file.name, file);
    }
    
    // Add a README with instructions for LMS integration
    const readme = `# LMS Integration Instructions

## Files Included:
- index.html: Main responsive HTML file optimized for LMS integration
${previewType === 'embed' && embedContent.includes('<!DOCTYPE html') ? '- storylane-full.html: Original full Storylane content (for reference)' : ''}

## LMS Integration Tips:

### For Adobe Learning Manager:
1. Upload the index.html file to your course content
2. The content is designed to be responsive and work within LMS containers
3. If the content appears too large, you can adjust the container size in your LMS settings

### For Canvas/Blackboard/Moodle:
1. Use the HTML content from index.html
2. Copy and paste the content into an HTML block or embed widget
3. The responsive design will adapt to your LMS container

### Troubleshooting:
- If content appears too large: Check your LMS container settings
- If interactive elements don't work: Ensure your LMS allows iframes and JavaScript
- For mobile optimization: The content automatically adjusts for smaller screens

### Technical Notes:
- The content uses responsive CSS with flexible containers
- Aspect ratios automatically adjust based on screen size
- Loading indicators provide better user experience
- All external resources are properly referenced

## Support:
Generated by Omnicron - Pearson's Content Creation Tool
`;
    
    zip.file('README.txt', readme);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'responsive_content.zip';
    a.click();
  }

  async function handleDownloadWebsite() {
    const zip = new JSZip();
    let html = '';
    
    if (previewType === 'iframe') {
      html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Embedded Content</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            background: linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%);
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #0B004A 0%, #6C2EB7 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 16px rgba(11,0,74,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
        }
        .content-wrapper {
            padding: 2rem;
        }
        .responsive-container {
            position: relative;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(11,0,74,0.08);
            overflow: hidden;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
        }
        .responsive-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        @media (max-width: 768px) {
            .content-wrapper { padding: 1rem; }
            .responsive-container {
                padding-bottom: 75%; /* Adjust aspect ratio for mobile */
                border-radius: 12px;
            }
            .header { padding: 1rem; }
            .header h1 { font-size: 1.25rem; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Interactive Content</h1>
    </div>
    <div class="content-wrapper">
        <div class="responsive-container">
            <iframe class="responsive-iframe" src="${embedUrl}" allowfullscreen loading="lazy"></iframe>
        </div>
    </div>
</body>
</html>`;
      
    } else if (previewType === 'embed') {
      const isStorylaneFull = embedContent.includes('<!DOCTYPE html') || embedContent.includes('<html');
      
      if (isStorylaneFull) {
        html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Storylane Interactive Demo</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Plus Jakarta Sans', Arial, sans-serif; 
            background: linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%);
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #0B004A 0%, #6C2EB7 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 16px rgba(11,0,74,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
        }
        .content-wrapper {
            padding: 2rem;
        }
        .storylane-wrapper {
            position: relative;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(11,0,74,0.08);
            overflow: hidden;
        }
        .storylane-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 62.5%;
        }
        .storylane-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        .loading-message {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #666;
            font-size: 16px;
        }
        @media (max-width: 768px) {
            .content-wrapper { padding: 1rem; }
            .storylane-container { padding-bottom: 75%; }
            .storylane-wrapper { border-radius: 12px; }
            .header { padding: 1rem; }
            .header h1 { font-size: 1.25rem; }
        }
        @media (max-width: 480px) {
            .storylane-container { padding-bottom: 90%; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Storylane Interactive Demo</h1>
    </div>
    <div class="content-wrapper">
        <div class="storylane-wrapper">
            <div class="storylane-container">
                <div class="loading-message">Loading interactive demo...</div>
                <iframe class="storylane-iframe" srcdoc='${embedContent.replace(/'/g, "&#39;")}' allowfullscreen loading="lazy"></iframe>
            </div>
        </div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const iframe = document.querySelector('.storylane-iframe');
            const loading = document.querySelector('.loading-message');
            
            iframe.onload = function() {
                loading.style.display = 'none';
            };
            
            setTimeout(function() {
                loading.style.display = 'none';
            }, 3000);
        });
    </script>
</body>
</html>`;
        
        zip.file('storylane-full.html', embedContent);
        
      } else {
        html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Content</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Plus Jakarta Sans', Arial, sans-serif; 
            background: linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%);
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #0B004A 0%, #6C2EB7 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 16px rgba(11,0,74,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
        }
        .content-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .content-container {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(11,0,74,0.08);
        }
        .embed-container {
            position: relative;
            width: 100%;
            overflow: hidden;
        }
        .sl-embed {
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            padding-bottom: 62.5% !important;
        }
        .sl-demo {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            border: none !important;
        }
        @media (max-width: 768px) {
            .content-wrapper { padding: 1rem; }
            .content-container { padding: 1rem; }
            .sl-embed { padding-bottom: 75% !important; }
            .header { padding: 1rem; }
            .header h1 { font-size: 1.25rem; }
        }
        @media (max-width: 480px) {
            .sl-embed { padding-bottom: 90% !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Interactive Content</h1>
    </div>
    <div class="content-wrapper">
        <div class="content-container">
            <div class="embed-container">
                ${embedContent}
            </div>
        </div>
    </div>
</body>
</html>`;
      }
      
    } else if (previewType === 'video' && file) {
      html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Content</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Plus Jakarta Sans', Arial, sans-serif; 
            background: linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%);
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #0B004A 0%, #6C2EB7 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 16px rgba(11,0,74,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
        }
        .content-wrapper {
            padding: 2rem;
        }
        .video-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(11,0,74,0.08);
        }
        .video-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 56.25%;
        }
        .responsive-video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 8px;
        }
        @media (max-width: 768px) {
            .content-wrapper { padding: 1rem; }
            .video-wrapper { padding: 1rem; }
            .header { padding: 1rem; }
            .header h1 { font-size: 1.25rem; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Video Content</h1>
    </div>
    <div class="content-wrapper">
        <div class="video-wrapper">
            <div class="video-container">
                <video class="responsive-video" src="assets/video/${file.name}" controls></video>
            </div>
        </div>
    </div>
</body>
</html>`;
      zip.folder('assets').folder('video').file(file.name, file);
    }
    
    zip.file('index.html', html);
    
    // Add Netlify configuration
    const netlifyToml = `[build]
  publish = "."
  
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "ALLOWALL"
    X-Content-Type-Options = "nosniff"
    
[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    
[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    
[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    
[[headers]]
  for = "*.mp4"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    
[[headers]]
  for = "*.webm"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"`;
    
    const redirects = `# Netlify redirects file
/*    /index.html   200
/home /index.html   200`;
    
    const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#6C2EB7"/>
  <text x="50" y="60" text-anchor="middle" fill="white" font-family="Plus Jakarta Sans" font-size="40" font-weight="bold">P</text>
</svg>`;
    
    const readme = `# Website Deployment Guide

This folder contains a complete website ready for deployment to any web hosting service.

## Quick Deploy to Netlify:
1. Drag and drop this entire folder onto netlify.com/drop
2. Your site will be live instantly with a random URL
3. You can customize the domain in your Netlify dashboard

## Manual Upload Instructions:
1. Extract all files from this folder
2. Upload to your web hosting service
3. Set index.html as your homepage
4. The site will work immediately

## Included Files:
- index.html: Main webpage with responsive design
- netlify.toml: Optimized configuration for Netlify hosting
- _redirects: Routing configuration for single-page applications
- favicon.svg: Pearson-branded favicon
${previewType === 'video' && file ? '- assets/video/: Video files folder' : ''}
${previewType === 'embed' && embedContent.includes('<!DOCTYPE html') ? '- storylane-full.html: Original full Storylane content' : ''}

## Features:
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Pearson brand styling with Plus Jakarta Sans font
- ✅ Optimized for web hosting platforms
- ✅ SEO-friendly HTML structure
- ✅ Cross-browser compatibility
- ✅ Fast loading with optimized assets

## Hosting Platforms Tested:
- ✅ Netlify (recommended)
- ✅ Vercel
- ✅ GitHub Pages
- ✅ AWS S3 + CloudFront
- ✅ Traditional web hosting (cPanel, etc.)

Generated by HTMLwiz - Pearson Education
`;
    
    zip.file('netlify.toml', netlifyToml);
    zip.file('_redirects', redirects);
    zip.file('favicon.svg', favicon);
    zip.file('README.md', readme);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'website-ready-for-hosting.zip';
    a.click();
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handlePreview(); }} aria-label="Video or Storyline Submission">
      <label htmlFor="video-link" style={{ fontWeight: 600 }}>Paste YouTube/Storylane URL:</label>
      <input
        id="video-link"
        type="url"
        value={input}
        onChange={handleInputChange}
        placeholder="https://youtube.com/... or https://storylane.io/..."
        style={{ width: '100%', margin: '0.5rem 0 1rem 0', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}
        aria-describedby="video-link-desc"
      />
      <div id="video-link-desc" style={{ fontSize: '0.9rem', color: pearsonColors.amethyst, marginBottom: '1rem' }}>
        Or paste Storylane embed code:
      </div>
      <label htmlFor="embed-code" style={{ fontWeight: 600 }}>Storylane Embed Code:</label>
      <textarea
        id="embed-code"
        value={embedCode}
        onChange={handleEmbedCodeChange}
        rows={6}
        placeholder={`<div>\n  <script async src="https://js.storylane.io/js/v2/storylane.js"></script>\n  <div class="sl-embed" style="position:relative;padding-bottom:calc(63.02% + 25px);width:100%;height:0;transform:scale(1)">\n    <iframe loading="lazy" class="sl-demo" src="https://storylane.io/demo/..." allowfullscreen></iframe>\n  </div>\n</div>`}
        style={{ 
          width: '100%', 
          margin: '0.5rem 0 1rem 0', 
          padding: '0.5rem', 
          borderRadius: 8, 
          border: '1px solid #ccc',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}
        aria-describedby="embed-code-desc"
      />
      <div id="embed-code-desc" style={{ fontSize: '0.9rem', color: pearsonColors.amethyst, marginBottom: '1rem' }}>
        Or upload a video file:
      </div>
      <UploadLabel tabIndex={0} htmlFor="video-upload">Upload Video File
        <HiddenInput
          id="video-upload"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          aria-label="Upload video file"
        />
      </UploadLabel>
      <div style={{ margin: '1.5rem 0' }}>
        <button type="submit" style={{ ...buttonStyle }}>Preview</button>
        {(embedUrl || embedContent) && (
          <>
            <button type="button" style={{ ...buttonStyle, marginLeft: 16 }} onClick={handleDownloadZip} aria-label="Download as zip">Download as Zip</button>
            <button type="button" style={{ ...buttonStyle, marginLeft: 16, background: pearsonColors.amethyst }} onClick={handleDownloadWebsite} aria-label="Download as website">Download as Website</button>
          </>
        )}
      </div>
      <div style={{ marginTop: 24 }}>
        {embedUrl && previewType === 'iframe' && (
          <iframe
            src={embedUrl}
            title="Embedded Video or Storylane"
            width="100%"
            height="400"
            style={{ border: '2px solid ' + pearsonColors.amethyst, borderRadius: 12 }}
            allowFullScreen
          />
        )}
        {embedContent && previewType === 'embed' && (
          <div 
            style={{ 
              border: '2px solid ' + pearsonColors.amethyst, 
              borderRadius: 12, 
              padding: '1rem',
              minHeight: '400px',
              backgroundColor: '#fafafa'
            }}
            dangerouslySetInnerHTML={{ __html: embedContent }}
          />
        )}
        {embedUrl && previewType === 'video' && (
          <video
            src={embedUrl}
            controls
            width="100%"
            height="400"
            style={{ border: '2px solid ' + pearsonColors.amethyst, borderRadius: 12 }}
          />
        )}
      </div>
    </form>
  );
}

function ScenarioTab() {
  const [json, setJson] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [error, setError] = useState('');
  const [reviewScenarios, setReviewScenarios] = useState([]);
  const [showReview, setShowReview] = useState(false);

  function handlePreview() {
    try {
      const parsed = JSON.parse(json);
      // Support both old format {"scenarios": [...]} and new direct array format
      let scenariosArray;
      if (Array.isArray(parsed)) {
        scenariosArray = parsed;
      } else if (parsed.scenarios && Array.isArray(parsed.scenarios)) {
        scenariosArray = parsed.scenarios;
      } else {
        throw new Error('Invalid schema');
      }
      
      // Validate each scenario has required fields
      const isValid = scenariosArray.every(scenario => 
        scenario.id && scenario.title && scenario.description
      );
      
      if (!isValid) {
        throw new Error('Each scenario must have id, title, and description fields');
      }
      
      setScenarios(scenariosArray);
      setError('');
    } catch (e) {
      setError('Invalid JSON or schema. ' + e.message);
      setScenarios([]);
    }
  }

  // AI-powered scenario generation handler
  const handleAIScenarioGeneration = async (prompt, options = {}) => {
    if (!window.aiConfig?.apiKey && window.aiConfig?.provider !== 'ollama') {
      throw new Error('AI service not configured. Please set up your API key.');
    }

    try {
      const aiService = getAIService();
      const scenarioData = await aiService.generateScenario(prompt);
      
      // Handle both single scenario and array of scenarios
      let scenariosArray;
      if (Array.isArray(scenarioData)) {
        scenariosArray = scenarioData;
      } else if (scenarioData.scenarios && Array.isArray(scenarioData.scenarios)) {
        scenariosArray = scenarioData.scenarios;
      } else {
        // Single scenario - wrap in array
        scenariosArray = [scenarioData];
      }
      
      // Add enabled flag to each scenario for review interface
      const reviewableScenarios = scenariosArray.map(scenario => ({
        ...scenario,
        enabled: true,
        originalTitle: scenario.title,
        originalDescription: scenario.description
      }));
      
      // Show review interface instead of directly setting scenarios
      setReviewScenarios(reviewableScenarios);
      setShowReview(true);
      setError('');
      
    } catch (error) {
      console.error('AI scenario generation failed:', error);
      throw error;
    }
  };

  // Review interface handlers
  const handleScenarioToggle = (index) => {
    setReviewScenarios(prev => prev.map((scenario, i) => 
      i === index ? { ...scenario, enabled: !scenario.enabled } : scenario
    ));
  };

  const handleScenarioEdit = (index, field, value) => {
    setReviewScenarios(prev => prev.map((scenario, i) => 
      i === index ? { ...scenario, [field]: value } : scenario
    ));
  };

  const handleApproveScenarios = () => {
    const approvedScenarios = reviewScenarios
      .filter(scenario => scenario.enabled)
      .map(({ enabled, originalTitle, originalDescription, ...scenario }) => scenario);
    
    setJson(JSON.stringify(approvedScenarios, null, 2));
    setScenarios(approvedScenarios);
    setShowReview(false);
    setError('');
  };

  const handleCancelReview = () => {
    setShowReview(false);
    setReviewScenarios([]);
  };

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setJson(evt.target.result);
      // Optionally auto-preview
      try {
        const parsed = JSON.parse(evt.target.result);
        // Support both old format {"scenarios": [...]} and new direct array format
        let scenariosArray;
        if (Array.isArray(parsed)) {
          scenariosArray = parsed;
        } else if (parsed.scenarios && Array.isArray(parsed.scenarios)) {
          scenariosArray = parsed.scenarios;
        } else {
          throw new Error('Invalid schema');
        }
        
        // Validate each scenario has required fields
        const isValid = scenariosArray.every(scenario => 
          scenario.id && scenario.title && scenario.description
        );
        
        if (!isValid) {
          throw new Error('Each scenario must have id, title, and description fields');
        }
        
        setScenarios(scenariosArray);
        setError('');
      } catch (e) {
        setError('Invalid JSON or schema. ' + e.message);
        setScenarios([]);
      }
    };
    reader.readAsText(file);
  }

  async function handleDownloadZip() {
    const zip = new JSZip();
    
    // Generate HTML with interactive scenario form for Adobe LMS
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scenario Assessment</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            background: linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%);
            min-height: 100vh;
            padding: 2rem 1rem;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(11,0,74,0.08);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0B004A 0%, #663399 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .header h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        .content {
            padding: 2rem;
        }
        .scenario {
            background: #f8f7ff;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            border-left: 4px solid #663399;
        }
        .scenario-title {
            color: #0B004A;
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        .scenario-text {
            font-size: 1.1rem;
            line-height: 1.6;
            color: #333;
            margin-bottom: 1.5rem;
        }
        .response-section {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            border: 2px solid #e0dde9;
        }
        .response-label {
            font-weight: 600;
            color: #0B004A;
            margin-bottom: 0.5rem;
            display: block;
        }
        .response-textarea {
            width: 100%;
            min-height: 200px;
            padding: 1rem;
            border: 2px solid #e0dde9;
            border-radius: 8px;
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            font-size: 1rem;
            line-height: 1.5;
            resize: vertical;
            transition: border-color 0.3s ease;
        }
        .response-textarea:focus {
            outline: none;
            border-color: #663399;
            box-shadow: 0 0 0 3px rgba(102, 51, 153, 0.1);
        }
        .instructor-section {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 2px dashed #e0dde9;
        }
        .instructor-label {
            font-weight: 600;
            color: #663399;
            margin-bottom: 0.5rem;
            display: block;
        }
        .instructor-textarea {
            width: 100%;
            min-height: 120px;
            padding: 1rem;
            border: 2px dashed #663399;
            border-radius: 8px;
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            font-size: 1rem;
            background: #faf9ff;
            resize: vertical;
        }
        .instruction-text {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 2rem;
            text-align: center;
            font-style: italic;
        }
        .submit-section {
            text-align: center;
            padding: 2rem;
            background: #f8f7ff;
            border-top: 1px solid #e0dde9;
        }
        .submit-btn {
            background: linear-gradient(135deg, #0B004A 0%, #663399 100%);
            color: white;
            border: none;
            border-radius: 24px;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(11,0,74,0.2);
            transition: transform 0.2s ease;
        }
        .submit-btn:hover {
            transform: translateY(-2px);
        }
        @media (max-width: 768px) {
            .container {
                margin: 1rem;
                border-radius: 12px;
            }
            .header, .content {
                padding: 1.5rem;
            }
            .scenario {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Scenario Assessment</h1>
            <p>Please read each scenario carefully and provide your detailed response</p>
        </div>
        
        <div class="content">
            <div class="instruction-text">
                Complete your responses below. Your instructor will review and provide feedback on each scenario.
            </div>
            
            <form>`;
    
    scenarios.forEach((scenario, index) => {
      html += `
                <div class="scenario">
                    <div class="scenario-title">${scenario.title}</div>
                    <div class="scenario-text">${scenario.description}</div>
                    
                    <div class="response-section">
                        <label for="response-${index}" class="response-label">Your Response:</label>
                        <textarea 
                            id="response-${index}" 
                            name="response-${index}" 
                            class="response-textarea"
                            placeholder="Type your detailed response here..."
                            required
                        ></textarea>
                        
                        <div class="instructor-section">
                            <label for="feedback-${index}" class="instructor-label">Instructor Feedback:</label>
                            <textarea 
                                id="feedback-${index}" 
                                name="feedback-${index}" 
                                class="instructor-textarea"
                                placeholder="(This section will be completed by your instructor)"
                                readonly
                            ></textarea>
                        </div>
                    </div>
                </div>`;
    });
    
    html += `
            </form>
        </div>
        
        <div class="submit-section">
            <button type="submit" class="submit-btn">Submit Assessment</button>
        </div>
    </div>
    
    <script>
        // Simple form handling for LMS integration
        document.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check if all required fields are filled
            const textareas = document.querySelectorAll('textarea[required]');
            let allFilled = true;
            
            textareas.forEach(textarea => {
                if (!textarea.value.trim()) {
                    allFilled = false;
                    textarea.style.borderColor = '#ff4444';
                } else {
                    textarea.style.borderColor = '#e0dde9';
                }
            });
            
            if (allFilled) {
                alert('Assessment submitted successfully! Your instructor will provide feedback soon.');
                // Here you would typically submit to your LMS
                // window.parent.postMessage({type: 'submit', data: formData}, '*');
            } else {
                alert('Please complete all scenarios before submitting.');
            }
        });
        
        // Reset border color on focus
        document.querySelectorAll('textarea[required]').forEach(textarea => {
            textarea.addEventListener('focus', function() {
                this.style.borderColor = '#663399';
            });
        });
    </script>
</body>
</html>`;
    
    zip.file('scenario_assessment.html', html);
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scenario_assessment.zip';
    a.click();
  }

  async function handleDownloadWebsite() {
    const zip = new JSZip();
    
    // Generate enhanced HTML for web hosting
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scenario Assessment</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            background: linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%);
            min-height: 100vh;
            padding: 2rem 1rem;
            color: #333;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 12px 40px rgba(11,0,74,0.12);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0B004A 0%, #6C2EB7 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 4s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
        }
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            position: relative;
            z-index: 2;
        }
        .header p {
            font-size: 1.2rem;
            opacity: 0.95;
            position: relative;
            z-index: 2;
        }
        .content {
            padding: 3rem 2rem;
        }
        .scenario {
            background: linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%);
            border-radius: 16px;
            padding: 2.5rem;
            margin-bottom: 2.5rem;
            border-left: 6px solid #6C2EB7;
            position: relative;
            box-shadow: 0 4px 20px rgba(11,0,74,0.06);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .scenario:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(11,0,74,0.12);
        }
        .scenario-title {
            color: #0B004A;
            font-size: 1.6rem;
            font-weight: 700;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .scenario-title::before {
            content: "📋";
            font-size: 1.4rem;
        }
        .scenario-text {
            font-size: 1.1rem;
            line-height: 1.7;
            color: #444;
            margin-bottom: 2rem;
            text-align: justify;
        }
        .response-section {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            border: 2px solid #e6e6f2;
            position: relative;
            transition: border-color 0.3s ease;
        }
        .response-section:hover {
            border-color: #6C2EB7;
        }
        .response-label {
            font-weight: 600;
            color: #0B004A;
            margin-bottom: 0.75rem;
            display: block;
            font-size: 1.1rem;
        }
        .response-textarea {
            width: 100%;
            min-height: 220px;
            padding: 1.25rem;
            border: 2px solid #e6e6f2;
            border-radius: 10px;
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            font-size: 1rem;
            line-height: 1.6;
            resize: vertical;
            transition: all 0.3s ease;
            background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
        }
        .response-textarea:focus {
            outline: none;
            border-color: #6C2EB7;
            box-shadow: 0 0 0 4px rgba(108, 46, 183, 0.15);
            background: white;
        }
        .instructor-section {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 2px dashed #e6e6f2;
        }
        .instructor-label {
            font-weight: 600;
            color: #6C2EB7;
            margin-bottom: 0.75rem;
            display: block;
            font-size: 1rem;
        }
        .instructor-textarea {
            width: 100%;
            min-height: 140px;
            padding: 1.25rem;
            border: 2px dashed #6C2EB7;
            border-radius: 10px;
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            font-size: 1rem;
            background: linear-gradient(135deg, #faf9ff 0%, #f8f7ff 100%);
            resize: vertical;
            transition: all 0.3s ease;
        }
        .instructor-textarea:focus {
            outline: none;
            background: #faf9ff;
            box-shadow: 0 0 0 4px rgba(108, 46, 183, 0.15);
        }
        .instruction-text {
            font-size: 1rem;
            color: #666;
            margin-bottom: 2.5rem;
            text-align: center;
            font-style: italic;
            padding: 1.5rem;
            background: linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%);
            border-radius: 12px;
            border-left: 4px solid #6C2EB7;
        }
        .submit-section {
            text-align: center;
            padding: 3rem 2rem;
            background: linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%);
            border-top: 1px solid #e6e6f2;
        }
        .submit-btn {
            background: linear-gradient(135deg, #0B004A 0%, #6C2EB7 100%);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 1.25rem 3rem;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(11,0,74,0.25);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .submit-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(11,0,74,0.35);
        }
        .submit-btn:active {
            transform: translateY(-1px);
        }
        .progress-indicator {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 2rem;
            padding: 1rem;
            background: white;
            border-radius: 50px;
            box-shadow: 0 2px 10px rgba(11,0,74,0.06);
        }
        .progress-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #e6e6f2;
            transition: background 0.3s ease;
        }
        .progress-dot.active {
            background: #6C2EB7;
        }
        @media (max-width: 768px) {
            body { padding: 1rem 0.5rem; }
            .container {
                margin: 0;
                border-radius: 16px;
            }
            .header, .content {
                padding: 2rem 1.5rem;
            }
            .scenario {
                padding: 2rem 1.5rem;
            }
            .header h1 {
                font-size: 2rem;
            }
            .scenario-title {
                font-size: 1.4rem;
            }
        }
        @media (max-width: 480px) {
            .header, .content {
                padding: 1.5rem 1rem;
            }
            .scenario {
                padding: 1.5rem 1rem;
            }
            .header h1 {
                font-size: 1.75rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Scenario Assessment</h1>
            <p>Interactive learning scenarios designed to enhance critical thinking and problem-solving skills</p>
        </div>
        
        <div class="content">
            <div class="instruction-text">
                💡 <strong>Instructions:</strong> Complete your responses below with detailed analysis and reasoning. Your instructor will review and provide personalized feedback on each scenario.
            </div>
            
            <div class="progress-indicator">
                ${scenarios.map((_, i) => `<div class="progress-dot" id="dot-${i}"></div>`).join('')}
            </div>
            
            <form id="assessment-form">`;
    
    scenarios.forEach((scenario, index) => {
      html += `
                <div class="scenario" id="scenario-${index}">
                    <div class="scenario-title">Scenario ${index + 1}: ${scenario.title}</div>
                    <div class="scenario-text">${scenario.description}</div>
                    
                    <div class="response-section">
                        <label for="response-${index}" class="response-label">📝 Your Detailed Response:</label>
                        <textarea 
                            id="response-${index}" 
                            name="response-${index}" 
                            class="response-textarea"
                            placeholder="Provide your detailed analysis, reasoning, and conclusions here..."
                            required
                            data-scenario="${index}"
                        ></textarea>
                        
                        <div class="instructor-section">
                            <label for="feedback-${index}" class="instructor-label">👨‍🏫 Instructor Feedback:</label>
                            <textarea 
                                id="feedback-${index}" 
                                name="feedback-${index}" 
                                class="instructor-textarea"
                                placeholder="This section will be completed by your instructor with personalized feedback, grades, and suggestions for improvement."
                                readonly
                            ></textarea>
                        </div>
                    </div>
                </div>`;
    });
    
    html += `
            </form>
        </div>
        
        <div class="submit-section">
            <button type="submit" class="submit-btn" form="assessment-form">🚀 Submit Assessment</button>
            <div style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
                Make sure all scenarios are completed before submitting
            </div>
        </div>
    </div>
    
    <script>
        // Enhanced form handling with progress tracking
        const form = document.getElementById('assessment-form');
        const textareas = document.querySelectorAll('textarea[required]');
        const progressDots = document.querySelectorAll('.progress-dot');
        
        // Update progress indicators
        function updateProgress() {
            textareas.forEach((textarea, index) => {
                const dot = progressDots[index];
                if (textarea.value.trim().length > 20) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
        
        // Add event listeners for real-time progress tracking
        textareas.forEach((textarea, index) => {
            textarea.addEventListener('input', updateProgress);
            textarea.addEventListener('focus', function() {
                this.style.borderColor = '#6C2EB7';
                document.getElementById(\`scenario-\${index}\`).scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            });
        });
        
        // Form submission handling
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validation with detailed feedback
            let allFilled = true;
            let emptyScenarios = [];
            
            textareas.forEach((textarea, index) => {
                if (!textarea.value.trim() || textarea.value.trim().length < 20) {
                    allFilled = false;
                    emptyScenarios.push(index + 1);
                    textarea.style.borderColor = '#ff4444';
                    textarea.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.15)';
                } else {
                    textarea.style.borderColor = '#28a745';
                    textarea.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.15)';
                }
            });
            
            if (allFilled) {
                // Success animation
                const submitBtn = document.querySelector('.submit-btn');
                submitBtn.innerHTML = '✅ Assessment Submitted Successfully!';
                submitBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                
                setTimeout(() => {
                    alert('🎉 Assessment submitted successfully!\\n\\nYour instructor will review your responses and provide detailed feedback soon. Check back in 24-48 hours for results.');
                }, 500);
                
                // Here you would typically submit to your LMS or server
                // fetch('/api/submit-assessment', { method: 'POST', body: new FormData(form) });
            } else {
                alert(\`⚠️ Please complete the following scenarios before submitting:\\n\\nScenario(s): \${emptyScenarios.join(', ')}\\n\\nEach response should be at least 20 characters long with meaningful content.\`);
                
                // Scroll to first incomplete scenario
                const firstEmpty = document.querySelector('textarea[style*="rgb(255, 68, 68)"]');
                if (firstEmpty) {
                    firstEmpty.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstEmpty.focus();
                }
            }
        });
        
        // Auto-save functionality (localStorage)
        function autoSave() {
            const responses = {};
            textareas.forEach((textarea, index) => {
                responses[\`scenario-\${index}\`] = textarea.value;
            });
            localStorage.setItem('scenario-assessment-draft', JSON.stringify(responses));
        }
        
        // Load saved responses
        function loadSavedResponses() {
            const saved = localStorage.getItem('scenario-assessment-draft');
            if (saved) {
                const responses = JSON.parse(saved);
                textareas.forEach((textarea, index) => {
                    const savedValue = responses[\`scenario-\${index}\`];
                    if (savedValue) {
                        textarea.value = savedValue;
                    }
                });
                updateProgress();
            }
        }
        
        // Auto-save every 30 seconds
        textareas.forEach(textarea => {
            textarea.addEventListener('input', () => {
                clearTimeout(textarea.saveTimeout);
                textarea.saveTimeout = setTimeout(autoSave, 2000);
            });
        });
        
        // Load saved data on page load
        window.addEventListener('load', loadSavedResponses);
        
        // Initial progress update
        updateProgress();
        
        // Smooth scroll for better UX
        document.addEventListener('DOMContentLoaded', function() {
            const scenarios = document.querySelectorAll('.scenario');
            scenarios.forEach((scenario, index) => {
                scenario.style.opacity = '0';
                scenario.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    scenario.style.transition = 'all 0.6s ease';
                    scenario.style.opacity = '1';
                    scenario.style.transform = 'translateY(0)';
                }, index * 200);
            });
        });
    </script>
</body>
</html>`;
    
    zip.file('index.html', html);
    
    // Add Netlify configuration
    const netlifyToml = `[build]
  publish = "."
  
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "ALLOWALL"
    X-Content-Type-Options = "nosniff"
    
[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    
[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    
[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"`;
    
    const redirects = `# Netlify redirects file
/*    /index.html   200
/assessment /index.html   200
/scenarios /index.html   200`;
    
    const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#6C2EB7"/>
  <text x="50" y="60" text-anchor="middle" fill="white" font-family="Plus Jakarta Sans" font-size="40" font-weight="bold">S</text>
</svg>`;
    
    const readme = `# Scenario Assessment Website

This folder contains a complete interactive scenario assessment website ready for deployment.

## Quick Deploy to Netlify:
1. Drag and drop this entire folder onto netlify.com/drop
2. Your assessment site will be live instantly
3. Share the URL with students for immediate access

## Features:
- ✅ Interactive scenario-based learning
- ✅ Real-time progress tracking
- ✅ Auto-save functionality (localStorage)
- ✅ Mobile-responsive design
- ✅ Enhanced UX with animations
- ✅ Detailed form validation
- ✅ Instructor feedback sections
- ✅ Pearson brand styling

## Student Experience:
- Students can complete scenarios at their own pace
- Responses are auto-saved every 2 seconds
- Progress indicators show completion status
- Smooth animations enhance engagement
- Mobile-friendly interface

## Instructor Features:
- Read-only feedback sections for grading
- Built-in validation ensures quality responses
- Professional presentation of student work
- Easy integration with LMS systems

## Hosting Platforms Tested:
- ✅ Netlify (recommended)
- ✅ Vercel
- ✅ GitHub Pages
- ✅ Traditional web hosting

Generated by HTMLwiz - Pearson Education
Total Scenarios: ${scenarios.length}
`;
    
    zip.file('netlify.toml', netlifyToml);
    zip.file('_redirects', redirects);
    zip.file('favicon.svg', favicon);
    zip.file('README.md', readme);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scenario-assessment-website.zip';
    a.click();
  }

  // Review interface component
  if (showReview) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '2px solid #e6e6f2'
        }}>
          <h2 style={{ 
            color: pearsonColors.purple, 
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
            🔍 Review AI-Generated Scenarios
          </h2>
          <p style={{ 
            color: '#666',
            marginBottom: '1.5rem',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Review and edit the AI-generated scenarios below. You can toggle scenarios on/off, edit titles and descriptions, or make other adjustments before adding them to your training.
          </p>
          
          {reviewScenarios.map((scenario, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem',
              border: `2px solid ${scenario.enabled ? pearsonColors.amethyst : '#e6e6f2'}`,
              opacity: scenario.enabled ? 1 : 0.6,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: scenario.enabled ? pearsonColors.purple : '#999'
                }}>
                  <input
                    type="checkbox"
                    checked={scenario.enabled}
                    onChange={() => handleScenarioToggle(index)}
                    style={{ 
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  Include Scenario {index + 1}
                </label>
                <span style={{
                  fontSize: '0.8rem',
                  color: '#666',
                  padding: '0.25rem 0.5rem',
                  background: '#f0f0f0',
                  borderRadius: '4px'
                }}>
                  ID: {scenario.id}
                </span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block',
                  fontWeight: '600',
                  color: pearsonColors.purple,
                  marginBottom: '0.5rem'
                }}>
                  Title:
                </label>
                <input
                  type="text"
                  value={scenario.title}
                  onChange={(e) => handleScenarioEdit(index, 'title', e.target.value)}
                  disabled={!scenario.enabled}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e6e6f2',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    background: scenario.enabled ? 'white' : '#f5f5f5',
                    color: scenario.enabled ? '#333' : '#999'
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block',
                  fontWeight: '600',
                  color: pearsonColors.purple,
                  marginBottom: '0.5rem'
                }}>
                  Description:
                </label>
                <textarea
                  value={scenario.description}
                  onChange={(e) => handleScenarioEdit(index, 'description', e.target.value)}
                  disabled={!scenario.enabled}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e6e6f2',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    background: scenario.enabled ? 'white' : '#f5f5f5',
                    color: scenario.enabled ? '#333' : '#999'
                  }}
                />
              </div>
            </div>
          ))}
          
          <div style={{ 
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            marginTop: '2rem'
          }}>
            <button
              onClick={handleApproveScenarios}
              disabled={!reviewScenarios.some(s => s.enabled)}
              style={{
                background: reviewScenarios.some(s => s.enabled) 
                  ? `linear-gradient(135deg, ${pearsonColors.purple} 0%, ${pearsonColors.amethyst} 100%)` 
                  : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: reviewScenarios.some(s => s.enabled) ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease'
              }}
            >
              ✅ Approve & Continue ({reviewScenarios.filter(s => s.enabled).length} scenarios)
            </button>
            <button
              onClick={handleCancelReview}
              style={{
                background: '#f5f5f5',
                color: '#666',
                border: '2px solid #e6e6f2',
                borderRadius: '8px',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handlePreview(); }} aria-label="Scenario Submission">
      {/* AI-powered scenario generation */}
      <AIPromptInput
        type="scenario"
        onGenerate={handleAIScenarioGeneration}
        showSlideCount={false}
        isConfigured={!!(window.aiConfig?.apiKey || window.aiConfig?.provider === 'ollama')}
        placeholder="Describe the scenario you want to create (e.g., 'Customer service training for handling difficult customers, include multiple decision points and realistic dialogue')"
      />
      
      <label htmlFor="scenario-json" style={{ fontWeight: 600 }}>Paste Scenario JSON:</label>
      <textarea
        id="scenario-json"
        value={json}
        onChange={e => setJson(e.target.value)}
        rows={8}
        style={{ width: '100%', margin: '0.5rem 0 1rem 0', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc', fontFamily: 'monospace' }}
        aria-describedby="scenario-json-desc"
        placeholder={'[{"id": 1, "title": "Sample Scenario", "description": "A detailed description of the scenario situation that students need to respond to..."}]'}
      />
      <div id="scenario-json-desc" style={{ fontSize: '0.9rem', color: pearsonColors.amethyst, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span>Use the schema: Array with {`{"id": number, "title": "...", "description": "..."}`} - Students will provide responses for instructor evaluation.</span>
        <button 
          type="button"
          onClick={() => {
            const schema = `[
    {
        "id": 1,
        "title": "Sample Scenario",
        "description": "A detailed description of the scenario situation that students need to respond to and analyze."
    }
]`;
            navigator.clipboard.writeText(schema);
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.style.background = '#28a745';
            setTimeout(() => {
              btn.textContent = originalText;
              btn.style.background = pearsonColors.amethyst;
            }, 2000);
          }}
          style={{
            background: pearsonColors.amethyst,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '0.25rem 0.5rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}
          title="Copy JSON schema template"
        >
          📋 Copy Schema
        </button>
      </div>
      <UploadLabel tabIndex={0} htmlFor="scenario-upload">Upload JSON File
        <HiddenInput
          id="scenario-upload"
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          aria-label="Upload scenario JSON file"
        />
      </UploadLabel>
      <button type="submit" style={{ ...buttonStyle }}>Preview</button>
      {scenarios.length > 0 && (
        <>
          <button type="button" style={{ ...buttonStyle, marginLeft: 16 }} onClick={handleDownloadZip} aria-label="Download as zip">Download as Zip</button>
          <button type="button" style={{ ...buttonStyle, marginLeft: 16, background: pearsonColors.amethyst }} onClick={handleDownloadWebsite} aria-label="Download as website">Download as Website</button>
        </>
      )}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <div style={{ marginTop: 24 }}>
        {scenarios.length > 0 && (
          <div style={{ border: '2px solid ' + pearsonColors.amethyst, borderRadius: 12, padding: '1.5rem', backgroundColor: '#fafafa' }}>
            <h3 style={{ color: pearsonColors.purple, marginBottom: '1rem', fontSize: '1.2rem' }}>Preview: Interactive Scenario Assessment</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem', fontStyle: 'italic' }}>
              This shows how the assessment will look for students. Each scenario includes a large text area for responses and space for instructor feedback.
            </p>
            {scenarios.map((scenario, i) => (
              <div key={i} style={{ 
                marginBottom: '2rem', 
                background: 'white', 
                borderRadius: 8, 
                padding: '1.5rem',
                border: '1px solid #e0dde9',
                borderLeft: '4px solid ' + pearsonColors.amethyst
              }}>
                <div style={{ 
                  color: pearsonColors.purple, 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  marginBottom: '0.75rem'
                }}>
                  {scenario.title}
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  lineHeight: 1.6, 
                  marginBottom: '1rem',
                  color: '#333'
                }}>
                  {scenario.description}
                </div>
                <div style={{ 
                  background: '#f8f7ff', 
                  padding: '1rem', 
                  borderRadius: 6,
                  border: '1px dashed ' + pearsonColors.amethyst
                }}>
                  <div style={{ fontSize: '0.9rem', color: pearsonColors.purple, fontWeight: 600, marginBottom: '0.5rem' }}>
                    Student Response Area:
                  </div>
                  <div style={{ 
                    background: 'white',
                    border: '1px solid #e0dde9',
                    borderRadius: 4,
                    padding: '0.75rem',
                    minHeight: '100px',
                    fontSize: '0.9rem',
                    color: '#999',
                    fontStyle: 'italic'
                  }}>
                    Large text area for student response (200px minimum height)
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                    + Instructor feedback section below for marking and comments
                  </div>
                </div>
              </div>
            ))}
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              background: pearsonColors.lightPurple,
              borderRadius: 6,
              fontSize: '0.9rem',
              color: pearsonColors.purple,
              fontWeight: 600
            }}>
              📝 Ready for Adobe LMS Integration
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

function HtmlTab() {
  const [html, setHtml] = useState('');
  const [preview, setPreview] = useState('');
  const [contentType, setContentType] = useState('general');
  const [includeInteractivity, setIncludeInteractivity] = useState(true);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  function handlePreview() {
    setPreview(html);
  }


  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setHtml(evt.target.result);
      setPreview(evt.target.result);
    };
    reader.readAsText(file);
  }

  async function handleDownloadZip() {
    const zip = new JSZip();
    zip.file('index.html', html);
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'html_content.zip';
    a.click();
  }

  async function handleDownloadWebsite() {
    const zip = new JSZip();
    
    // Create enhanced HTML with proper website structure
    const enhancedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Content</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%);
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #0B004A 0%, #6C2EB7 100%);
            color: white;
            padding: 1.5rem 2rem;
            box-shadow: 0 2px 16px rgba(11,0,74,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 1.75rem;
            font-weight: 700;
        }
        .content-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .content-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(11,0,74,0.08);
            padding: 2rem;
            overflow: hidden;
        }
        /* Enhance any existing styles in the HTML */
        .content-container * {
            max-width: 100%;
        }
        .content-container img {
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .content-container table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        .content-container th,
        .content-container td {
            padding: 0.75rem;
            border: 1px solid #e6e6f2;
            text-align: left;
        }
        .content-container th {
            background: #f8f7ff;
            font-weight: 600;
            color: #0B004A;
        }
        @media (max-width: 768px) {
            .content-wrapper {
                padding: 1rem;
            }
            .content-container {
                padding: 1rem;
                border-radius: 12px;
            }
            .header {
                padding: 1rem;
            }
            .header h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 HTML Content</h1>
    </div>
    <div class="content-wrapper">
        <div class="content-container">
${html.replace(/<html[^>]*>|<\/html>|<head[^>]*>.*?<\/head>|<body[^>]*>|<\/body>/gis, '').trim()}
        </div>
    </div>
</body>
</html>`;
    
    zip.file('index.html', enhancedHtml);
    
    // Add original HTML as backup
    zip.file('original.html', html);
    
    // Add Netlify configuration
    const netlifyToml = `[build]
  publish = "."
  
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "ALLOWALL"
    X-Content-Type-Options = "nosniff"
    
[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    
[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    
[[headers]]
  for = "*.css"  
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"`;
    
    const redirects = `# Netlify redirects file
/*    /index.html   200
/content /index.html   200`;
    
    const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#6C2EB7"/>
  <text x="50" y="60" text-anchor="middle" fill="white" font-family="Plus Jakarta Sans" font-size="35" font-weight="bold">H</text>
</svg>`;
    
    const readme = `# HTML Content Website

This folder contains your HTML content formatted as a complete website ready for deployment.

## Quick Deploy to Netlify:
1. Drag and drop this entire folder onto netlify.com/drop
2. Your content will be live instantly with a random URL
3. Share the URL with colleagues for easy access

## Files Included:
- **index.html**: Main website with enhanced styling and Pearson branding
- **original.html**: Your original HTML content (for reference)
- **netlify.toml**: Optimized hosting configuration
- **_redirects**: URL routing configuration
- **favicon.svg**: Pearson-branded favicon
- **README.md**: This deployment guide

## Features:
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Pearson brand styling with Plus Jakarta Sans font
- ✅ Enhanced typography and spacing
- ✅ Mobile-optimized layout
- ✅ Professional header and navigation
- ✅ Optimized for web hosting platforms

## Hosting Platforms Tested:
- ✅ Netlify (recommended)
- ✅ Vercel  
- ✅ GitHub Pages
- ✅ Traditional web hosting (cPanel, etc.)

## LMS Integration:
While this is formatted for standalone hosting, you can also:
1. Copy the content from index.html for LMS embedding
2. Use the original.html file for direct LMS upload
3. Link to the hosted version from your LMS

Generated by HTMLwiz - Pearson Education
`;
    
    zip.file('netlify.toml', netlifyToml);
    zip.file('_redirects', redirects);
    zip.file('favicon.svg', favicon);
    zip.file('README.md', readme);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'html-content-website.zip';
    a.click();
  }

  // AI-powered HTML generation handler
  const handleAIHtmlGeneration = async (prompt, options = {}) => {
    if (!window.aiConfig?.apiKey && window.aiConfig?.provider !== 'ollama') {
      throw new Error('AI service not configured. Please set up your API key.');
    }

    try {
      const aiService = getAIService();
      const htmlContent = await aiService.generateHTML(prompt, {
        includeInteractivity,
        contentType,
        includeBranding: true,
        ...options
      });
      
      // Add to conversation history
      const historyEntry = {
        id: Date.now(),
        prompt,
        html: htmlContent,
        contentType,
        timestamp: new Date().toISOString()
      };
      setConversationHistory(prev => [...prev, historyEntry]);
      
      // Update the HTML textarea with generated content
      setHtml(htmlContent);
      
      // Auto-preview the generated HTML
      setPreview(htmlContent);
      
    } catch (error) {
      console.error('AI HTML generation failed:', error);
      throw error;
    }
  };

  // Handle refinement of existing HTML
  const handleRefinement = async (refinementPrompt) => {
    if (!window.aiConfig?.apiKey && window.aiConfig?.provider !== 'ollama') {
      throw new Error('AI service not configured. Please set up your API key.');
    }

    if (!refinementPrompt.trim()) {
      throw new Error('Please enter a refinement request.');
    }

    setIsRefining(true);
    try {
      const aiService = getAIService();
      
      // Build context from conversation history
      const context = conversationHistory.slice(-3).map(entry => 
        `Previous request: ${entry.prompt}\nGenerated HTML: ${entry.html.substring(0, 300)}...`
      ).join('\n\n');
      
      const contextualPrompt = context ? 
        `Context from previous generations:\n${context}\n\nCurrent HTML:\n${html.substring(0, 500)}...\n\nRefinement request: ${refinementPrompt}` :
        `Current HTML:\n${html.substring(0, 500)}...\n\nRefinement request: ${refinementPrompt}`;
      
      const refinedHtml = await aiService.generateHTML(contextualPrompt, {
        includeInteractivity,
        contentType,
        includeBranding: true,
        isRefinement: true
      });
      
      // Add refinement to conversation history
      const historyEntry = {
        id: Date.now(),
        prompt: refinementPrompt,
        html: refinedHtml,
        contentType,
        timestamp: new Date().toISOString(),
        isRefinement: true,
        previousHtml: html
      };
      setConversationHistory(prev => [...prev, historyEntry]);
      
      // Update the HTML textarea with refined content
      setHtml(refinedHtml);
      
      // Auto-preview the refined HTML
      setPreview(refinedHtml);
      
      // Clear refinement prompt
      setRefinementPrompt('');
      
    } catch (error) {
      console.error('HTML refinement failed:', error);
      throw error;
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <form onSubmit={e => { e.preventDefault(); handlePreview(); }} aria-label="HTML Code Submission">
      {/* AI-powered HTML generation */}
      <AIPromptInput
        type="html"
        onGenerate={handleAIHtmlGeneration}
        showSlideCount={false}
        isConfigured={!!(window.aiConfig?.apiKey || window.aiConfig?.provider === 'ollama')}
        placeholder="Describe the training content you want to create (e.g., 'Interactive quiz about customer service best practices with multiple choice questions and drag-drop exercises')"
      />

      {/* HTML Refinement Interface */}
      {html && (
        <div style={{
          background: 'linear-gradient(135deg, #fff7e6 0%, #ffffff 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '2px solid #f0e6ff'
        }}>
          <h3 style={{
            color: pearsonColors.purple,
            marginBottom: '1rem',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            🎨 Refine Your HTML
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <textarea
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              placeholder="Describe how you want to improve the HTML (e.g., 'Add more questions', 'Change the color scheme', 'Make it more interactive')"
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: '2px solid #e6e6f2',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                resize: 'vertical',
                backgroundColor: 'white'
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <button
              type="button"
              onClick={() => handleRefinement(refinementPrompt)}
              disabled={isRefining || !refinementPrompt.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: isRefining ? '#cccccc' : pearsonColors.amethyst,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isRefining ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                fontFamily: 'Plus Jakarta Sans, sans-serif'
              }}
            >
              {isRefining ? '🔄 Refining...' : '✨ Refine HTML'}
            </button>
            
            {/* Quick action buttons */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {[
                { label: 'Add More Questions', prompt: 'Add 2-3 more questions to make it more comprehensive' },
                { label: 'Change Colors', prompt: 'Use a different color scheme while keeping it professional' },
                { label: 'More Interactive', prompt: 'Add more interactive elements like animations and hover effects' },
                { label: 'Simplify', prompt: 'Make the design cleaner and simpler' }
              ].map(action => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    setRefinementPrompt(action.prompt);
                    handleRefinement(action.prompt);
                  }}
                  disabled={isRefining}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    color: pearsonColors.purple,
                    border: `1px solid ${pearsonColors.purple}`,
                    borderRadius: '20px',
                    cursor: isRefining ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    opacity: isRefining ? 0.5 : 1
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '2px solid #e6f3ff'
        }}>
          <h3 style={{
            color: pearsonColors.purple,
            marginBottom: '1rem',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            📝 Generation History
          </h3>
          
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {conversationHistory.slice().reverse().map((entry, index) => (
              <div key={entry.id} style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #e6e6f2',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#666',
                    fontWeight: '500'
                  }}>
                    {entry.isRefinement ? '🎨 Refinement' : '✨ Initial Generation'} • {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setHtml(entry.html);
                      setPreview(entry.html);
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: pearsonColors.amethyst,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    Restore
                  </button>
                </div>
                
                <div style={{
                  fontSize: '14px',
                  color: '#333',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  "{entry.prompt}"
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  fontFamily: 'monospace',
                  backgroundColor: '#f8f9fa',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {entry.html.substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
          
          {conversationHistory.length > 3 && (
            <div style={{
              textAlign: 'center',
              marginTop: '1rem'
            }}>
              <button
                type="button"
                onClick={() => setConversationHistory([])}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Clear History
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Training Content Type Selection */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '2px solid #e6e6f2'
      }}>
        <h3 style={{ 
          color: pearsonColors.purple, 
          marginBottom: '1rem',
          fontSize: '1.1rem',
          fontWeight: '600'
        }}>
          🎯 Training Content Type
        </h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {[
            { value: 'quiz', icon: '📝', label: 'Interactive Quiz', desc: 'Multiple choice, drag & drop, true/false questions' },
            { value: 'sandbox', icon: '🔧', label: 'System Sandbox', desc: 'Simulated interface for process training' },
            { value: 'walkthrough', icon: '👣', label: 'Step-by-Step Guide', desc: 'Interactive process walkthrough with checkboxes' },
            { value: 'interactive', icon: '⚡', label: 'Interactive Content', desc: 'Engaging elements with animations and feedback' },
            { value: 'general', icon: '📄', label: 'General Training', desc: 'Professional layout with clean design' }
          ].map(type => (
            <label key={type.value} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1rem',
              border: `2px solid ${contentType === type.value ? pearsonColors.amethyst : '#e6e6f2'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              background: contentType === type.value ? '#faf9ff' : 'white',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}>
              <input
                type="radio"
                name="contentType"
                value={type.value}
                checked={contentType === type.value}
                onChange={(e) => setContentType(e.target.value)}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{type.icon}</div>
              <div style={{ 
                fontWeight: '600',
                color: contentType === type.value ? pearsonColors.purple : '#333',
                marginBottom: '0.25rem'
              }}>
                {type.label}
              </div>
              <div style={{ 
                fontSize: '0.8rem',
                color: '#666',
                lineHeight: '1.3'
              }}>
                {type.desc}
              </div>
            </label>
          ))}
        </div>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1rem'
        }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600',
            color: pearsonColors.purple
          }}>
            <input
              type="checkbox"
              checked={includeInteractivity}
              onChange={(e) => setIncludeInteractivity(e.target.checked)}
              style={{ 
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            ⚡ Include Advanced Interactivity & JavaScript
          </label>
        </div>
        
        <div style={{ 
          fontSize: '0.9rem',
          color: '#666',
          marginTop: '0.5rem',
          fontStyle: 'italic'
        }}>
          All content automatically includes Pearson branding and accessibility features
        </div>
      </div>
      
      <label htmlFor="html-code" style={{ fontWeight: 600 }}>Paste HTML Code:</label>
      <textarea
        id="html-code"
        value={html}
        onChange={e => setHtml(e.target.value)}
        rows={8}
        style={{ width: '100%', margin: '0.5rem 0 1rem 0', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc', fontFamily: 'monospace' }}
        aria-describedby="html-code-desc"
        placeholder="<html>...</html>"
      />
      <div id="html-code-desc" style={{ fontSize: '0.9rem', color: pearsonColors.amethyst, marginBottom: '1rem' }}>
        Enter valid HTML code to preview and download as a zip.
      </div>
      <UploadLabel tabIndex={0} htmlFor="html-upload">Upload HTML File
        <HiddenInput
          id="html-upload"
          type="file"
          accept="text/html"
          onChange={handleFileChange}
          aria-label="Upload HTML file"
        />
      </UploadLabel>
      <button type="submit" style={{ ...buttonStyle }}>Preview</button>
      {preview && (
        <>
          <button type="button" style={{ ...buttonStyle, marginLeft: 16 }} onClick={handleDownloadZip} aria-label="Download as zip">Download as Zip</button>
          <button type="button" style={{ ...buttonStyle, marginLeft: 16, background: pearsonColors.amethyst }} onClick={handleDownloadWebsite} aria-label="Download as website">Download as Website</button>
        </>
      )}
      <div style={{ marginTop: 24 }}>
        {preview && (
          <iframe
            srcDoc={preview}
            title="HTML Preview"
            width="100%"
            height="400"
            style={{ border: '2px solid ' + pearsonColors.amethyst, borderRadius: 12 }}
          />
        )}
      </div>
    </form>
  );
}

const buttonStyle = {
  background: pearsonColors.purple,
  color: pearsonColors.white,
  border: 'none',
  borderRadius: 24,
  padding: '0.75rem 2rem',
  fontSize: '1.1rem',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(11,0,74,0.10)',
  outline: 'none',
  marginTop: 8,
};



function SlideBuilderTab() {
  const [slideCount, setSlideCount] = useState(1);
  const [slides, setSlides] = useState([{
    id: 1,
    title: '',
    content: '',
    images: [],
    audioFile: null,
    audioUrl: '',
    hyperlinks: []
  }]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showAudioChunker, setShowAudioChunker] = useState(false);
  const [masterAudioFile, setMasterAudioFile] = useState(null);
  const [masterAudioUrl, setMasterAudioUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [showManualTimestamps, setShowManualTimestamps] = useState(false);
  const [manualTimestamps, setManualTimestamps] = useState('');

  // Initialize slides when count changes
  useEffect(() => {
    setSlides(prevSlides => {
      const newSlides = Array.from({ length: slideCount }, (_, index) => {
        const existingSlide = prevSlides[index];
        return existingSlide || {
          id: index + 1,
          title: '',
          content: '',
          images: [],
          audioFile: null,
          audioUrl: '',
          hyperlinks: []
        };
      });
      return newSlides;
    });
    setCurrentSlide(prevCurrent => prevCurrent >= slideCount ? Math.max(0, slideCount - 1) : prevCurrent);
  }, [slideCount]);

  function updateSlide(field, value) {
    const updatedSlides = [...slides];
    updatedSlides[currentSlide] = {
      ...updatedSlides[currentSlide],
      [field]: value
    };
    setSlides(updatedSlides);
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    
    // Validate file sizes
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum file size is 10MB.`);
        return;
      }
    }
    
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            file,
            url: event.target.result,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(images => {
      const updatedSlides = [...slides];
      updatedSlides[currentSlide].images = [...updatedSlides[currentSlide].images, ...images];
      setSlides(updatedSlides);
    });
  }

  function removeImage(imageIndex) {
    const updatedSlides = [...slides];
    updatedSlides[currentSlide].images.splice(imageIndex, 1);
    setSlides(updatedSlides);
  }

  function handleAudioUpload(e) {
    const file = e.target.files[0];
    if (file) {
      // Validate audio file size (max 50MB)
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxFileSize) {
        alert(`Audio file is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum file size is 50MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        updateSlide('audioFile', file);
        updateSlide('audioUrl', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleMasterAudioUpload(e) {
    const file = e.target.files[0];
    if (file) {
      // Validate audio file size (max 50MB)
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxFileSize) {
        alert(`Audio file is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum file size is 50MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setMasterAudioFile(file);
        setMasterAudioUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeSlideAudio() {
    updateSlide('audioFile', null);
    updateSlide('audioUrl', '');
  }

  async function processAudioChunks() {
    if (!masterAudioFile || !transcript.trim()) {
      alert('Please upload an audio file and provide a transcript');
      return;
    }

    if (slides.length === 0) {
      alert('Please create some slides first before adding audio');
      return;
    }

    setIsProcessingAudio(true);
    
    try {
      // Split transcript by various break markers (more flexible)
      let transcriptSections = [];
      let splittingMethod = '';
      
      // Try different splitting methods in order of preference
      if (/\[\d{1,2}:\d{2}(:\d{2})?\]/.test(transcript)) {
        // Split by timestamp markers like [00:00], [02:15], [1:30:45]
        transcriptSections = transcript
          .split(/\[\d{1,2}:\d{2}(:\d{2})?\]/)
          .map(section => section && typeof section === 'string' ? section.trim() : '')
          .filter(section => section && section.length > 0);
        splittingMethod = 'timestamp markers like [MM:SS]';
      } else if (transcript.includes('---')) {
        // Split by --- (with or without line breaks around it)
        transcriptSections = transcript
          .split(/\s*---\s*/)
          .map(section => section && typeof section === 'string' ? section.trim() : '')
          .filter(section => section && section.length > 0);
        splittingMethod = '--- markers';
      } else if (/\n\s*\n/.test(transcript)) {
        // Split by double line breaks
        transcriptSections = transcript
          .split(/\n\s*\n/)
          .map(section => section && typeof section === 'string' ? section.trim() : '')
          .filter(section => section && section.length > 0);
        splittingMethod = 'double line breaks';
      } else if (/\[Slide \d+\]/.test(transcript)) {
        // Split by [Slide X] markers
        transcriptSections = transcript
          .split(/\[Slide \d+\]/)
          .map(section => section && typeof section === 'string' ? section.trim() : '')
          .filter(section => section && section.length > 0);
        splittingMethod = '[Slide X] markers';
      } else {
        // Fallback: no clear breaks found, treat as single section
        transcriptSections = [transcript.trim()];
        splittingMethod = 'single section (no breaks detected)';
      }
      
      console.log(`Found ${transcriptSections.length} transcript sections using: ${splittingMethod}`);
      console.log('Section previews:', transcriptSections.map((section, i) => 
        `${i + 1}: "${section.substring(0, 50)}..."`
      ));
      
      // Show user what was detected for debugging
      const sectionsPreview = transcriptSections.slice(0, 10).map((section, i) => 
        `Section ${i + 1}: "${section.substring(0, 100)}..."`
      ).join('\n\n');
      
      const previewText = transcriptSections.length > 10 
        ? `${sectionsPreview}\n\n... and ${transcriptSections.length - 10} more sections`
        : sectionsPreview;
      
      const confirmed = confirm(`🔍 DEBUG: Found ${transcriptSections.length} sections using ${splittingMethod}:\n\n${previewText}\n\nDoes this look correct? Click OK to continue or Cancel to try Manual Timestamps.`);
      
      if (!confirmed) {
        alert('Try the Manual Timestamp option for precise control, or use Individual Audio Mode.');
        setIsProcessingAudio(false);
        return;
      }

      // Extract titles from various text patterns at the beginning of each section
      const extractedTitles = transcriptSections.map((section, index) => {
        if (!section || typeof section !== 'string') {
          console.warn(`Section ${index + 1} is invalid:`, section);
          return `Slide ${index + 1}`;
        }
        console.log(`Processing section ${index + 1}:`, section.substring(0, 100) + '...');
        
        // Look for title patterns that can be typed in plain text
        const titlePatterns = [
          /^TITLE:\s*(.*?)$/m,           // TITLE: Text Here
          /^Title:\s*(.*?)$/m,           // Title: Text Here  
          /^\*\*(.*?)\*\*/,              // **Bold Text** (markdown style)
          /^__(.*?)__/,                  // __Bold Text__ (markdown style)
          /^\[(.*?)\]/,                  // [Title in brackets]
          /^#\s+(.*?)$/m,                // # Heading style
          /^\d+\.\s+(.*?)$/m,            // 1. Numbered title
          /^-\s+(.*?)$/m,                // - Dash title
          /^>\s+(.*?)$/m,                // > Quote style title
          /^SLIDE\s*\d*:?\s*(.*?)$/im,   // SLIDE 1: Title or SLIDE: Title
          /^PART\s*\d*:?\s*(.*?)$/im,    // PART 1: Title or PART: Title
          /^SECTION\s*\d*:?\s*(.*?)$/im, // SECTION 1: Title
          /^TOPIC\s*\d*:?\s*(.*?)$/im,   // TOPIC 1: Title
          /^MODULE\s*\d*:?\s*(.*?)$/im,  // MODULE 1: Title
        ];
        
        for (const pattern of titlePatterns) {
          const match = section.match(pattern);
          if (match && match[1] && match[1].trim()) {
            const extractedTitle = match[1].trim();
            console.log(`Found title for section ${index + 1}:`, extractedTitle);
            return extractedTitle;
          }
        }
        
        // Smart fallback: use first line if it's short and looks like a title
        const firstLine = section.split('\n')[0].trim();
        if (firstLine.length <= 60 && firstLine.length > 3) {
          // Check if first line looks like a title (short, not ending with period)
          if (!firstLine.endsWith('.') || firstLine.split(' ').length <= 6) {
            console.log(`Using first line as title for section ${index + 1}:`, firstLine);
            return firstLine;
          }
        }
        
        // Final fallback: use first few words
        const words = firstLine.split(' ').slice(0, 4).join(' ');
        const fallbackTitle = words.length > 30 ? words.substring(0, 30) + '...' : words;
        console.log(`Using fallback title for section ${index + 1}:`, fallbackTitle);
        return fallbackTitle;
      });
      
      console.log('Extracted titles:', extractedTitles);

      if (transcriptSections.length === 0) {
        alert('No valid transcript sections found. Please check your transcript format.');
        setIsProcessingAudio(false);
        return;
            }

      // Additional validation to prevent undefined errors
      const validSections = transcriptSections.filter(section => section && typeof section === 'string' && section.length > 0);
      if (validSections.length === 0) {
        alert('No valid content found in transcript sections. Please check your transcript format.');
        setIsProcessingAudio(false);
        return;
      }

      // Calculate audio duration per section based on word count proportions
      const sectionsToProcess = Math.min(transcriptSections.length, slides.length);
      
      // Calculate word counts for each section
      const sectionWordCounts = transcriptSections.slice(0, sectionsToProcess).map(section => {
        if (!section || typeof section !== 'string') {
          console.warn('Invalid section found:', section);
          return 1; // Default to 1 word to avoid division by zero
        }
        return section.split(/\s+/).filter(word => word && word.length > 0).length;
      });
      const totalWords = sectionWordCounts.reduce((sum, count) => sum + count, 0);
      
      console.log(`Section word counts:`, sectionWordCounts);
      console.log(`Total words: ${totalWords}`);
      
      // Create audio context for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Convert file to array buffer
      const arrayBuffer = await masterAudioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const actualDuration = audioBuffer.duration;
      
      // Calculate cumulative durations based on word count proportions
      const sectionDurations = sectionWordCounts.map(wordCount => 
        (wordCount / totalWords) * actualDuration
      );
      
      let cumulativeTime = 0;
      const sectionStartTimes = [0];
      for (let i = 0; i < sectionDurations.length - 1; i++) {
        cumulativeTime += sectionDurations[i];
        sectionStartTimes.push(cumulativeTime);
      }
      
      console.log(`Section durations:`, sectionDurations.map(d => d.toFixed(2) + 's'));
      console.log(`Section start times:`, sectionStartTimes.map(t => t.toFixed(2) + 's'));
      
      const updatedSlides = [...slides];
      const audioChunks = [];
      
      // Create audio chunks for each section based on content proportions
      for (let i = 0; i < sectionsToProcess; i++) {
        const startTime = sectionStartTimes[i];
        const endTime = i === sectionsToProcess - 1 ? actualDuration : sectionStartTimes[i + 1];
        const chunkDuration = endTime - startTime;
        
        if (chunkDuration <= 0) continue;
        
        // Create a new buffer for this chunk
        const chunkBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          Math.floor(chunkDuration * audioBuffer.sampleRate),
          audioBuffer.sampleRate
        );
        
        // Copy the audio data for this time segment
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const sourceData = audioBuffer.getChannelData(channel);
          const targetData = chunkBuffer.getChannelData(channel);
          const startSample = Math.floor(startTime * audioBuffer.sampleRate);
          
          for (let sample = 0; sample < targetData.length; sample++) {
            targetData[sample] = sourceData[startSample + sample] || 0;
          }
        }
        
        // Convert buffer to WAV blob
        const wavBlob = audioBufferToWav(chunkBuffer);
        const chunkFile = new File([wavBlob], `slide_${i + 1}_audio.wav`, { type: 'audio/wav' });
        
        // Create object URL for preview
        const chunkUrl = URL.createObjectURL(wavBlob);
        
        audioChunks.push({
          file: chunkFile,
          url: chunkUrl,
          duration: chunkDuration
        });
        
                 // Update slide with chunk
         if (i < updatedSlides.length) {
           // Prioritize extracted titles over existing slide titles
           const newTitle = extractedTitles[i] || updatedSlides[i].title || `Slide ${i + 1}`;
           console.log(`Setting slide ${i + 1} title to:`, newTitle);
           
           updatedSlides[i] = {
             ...updatedSlides[i],
             title: newTitle, // Use extracted title first, fallback to existing or default
             audioFile: chunkFile,
             audioUrl: chunkUrl,
             transcriptSection: transcriptSections[i] || '',
             audioStartTime: 0, // Each chunk starts from 0
             audioDuration: chunkDuration
           };
         }
      }

      setSlides(updatedSlides);
      setIsProcessingAudio(false);
      setShowAudioChunker(false);
      
      // Show success message
      alert(`Successfully created ${audioChunks.length} audio chunks for ${sectionsToProcess} slides!`);
      console.log('Audio chunks created:', audioChunks);
      
    } catch (error) {
      console.error('Error processing audio chunks:', error);
      alert('There was an error processing the audio. This feature requires a modern browser with Web Audio API support.');
      setIsProcessingAudio(false);
    }
  }

  // Helper function to convert AudioBuffer to WAV
  function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const arrayBuffer = new ArrayBuffer(44 + buffer.length * blockAlign);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * blockAlign, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, buffer.length * blockAlign, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText) {
      setSelectedText(selectedText);
      setLinkText(selectedText);
      setShowLinkModal(true);
    }
  }

  function addHyperlink() {
    if (linkText && linkUrl) {
      const updatedSlides = [...slides];
      const slide = updatedSlides[currentSlide];
      
      // If there was selected text, replace it with hyperlink markup
      if (selectedText && slide.content.includes(selectedText)) {
        const linkMarkup = `<a href="${linkUrl}" target="_blank" class="slide-link">${linkText}</a>`;
        slide.content = slide.content.replace(selectedText, linkMarkup);
      }
      
      // Store hyperlink for reference (always add to the list)
      if (!slide.hyperlinks) {
        slide.hyperlinks = [];
      }
      slide.hyperlinks.push({
        text: linkText,
        url: linkUrl
      });
      
      setSlides(updatedSlides);
      setShowLinkModal(false);
      setLinkText('');
      setLinkUrl('');
      setSelectedText('');
    }
  }

  function generateCustomHTML() {
    // Build slides HTML using safer string concatenation to avoid RangeError
    let slideHTML = '';
    for (let index = 0; index < slides.length; index++) {
      const slide = slides[index];
      
      let slideContent = `
      <div class="slide" id="slide-${index}" ${index === 0 ? 'style="display: block;"' : 'style="display: none;"'}>
        <div class="slide-header">
          <h2>${slide.title || `Slide ${slide.id}`}</h2>
          <span class="slide-number">${slide.id} / ${slides.length}</span>
        </div>
        <div class="slide-content">
          <div class="slide-text">`;
      
      // Add paragraphs safely
      if (slide.content) {
        const paragraphs = slide.content.split('\n');
        for (const paragraph of paragraphs) {
          slideContent += `<p>${paragraph}</p>`;
        }
      }
      
      slideContent += `</div>`;
      
      // Add images safely using file references instead of data URLs
      if (slide.images.length > 0) {
        slideContent += `<div class="slide-images">`;
        for (const img of slide.images) {
          slideContent += `
                <div class="image-container">
                  <img src="images/${img.name}" alt="${img.name}" class="slide-image" />
                </div>`;
        }
        slideContent += `</div>`;
      }
      
      // Add audio safely
      if (slide.audioUrl && slide.audioFile) {
        slideContent += `
            <div class="audio-container">
              <audio controls class="slide-audio" id="audio-${index}" ${slide.audioStartTime ? `data-start="${slide.audioStartTime}" data-duration="${slide.audioDuration}"` : ''}>
                <source src="audio/${slide.audioFile.name}" type="${slide.audioFile.type}">
                Your browser does not support the audio element.
              </audio>`;
        
        if (slide.transcriptSection) {
          slideContent += `
                <div class="transcript-section">
                  <h4>Transcript:</h4>
                  <p>${slide.transcriptSection}</p>
                </div>`;
        }
        slideContent += `</div>`;
      }
      
      // Add hyperlinks section
      if (slide.hyperlinks && slide.hyperlinks.length > 0) {
        slideContent += `
            <div class="hyperlinks-container">
              <h4>Related Links:</h4>
              <div class="hyperlinks-list">`;
        for (const link of slide.hyperlinks) {
          slideContent += `
                <a href="${link.url}" target="_blank" class="slide-hyperlink">
                  🔗 ${link.text}
                </a>`;
        }
        slideContent += `
              </div>
            </div>`;
      }
      
      slideContent += `</div>
        <div class="slide-navigation">`;
      
      if (index > 0) {
        slideContent += `<button onclick="showSlide(${index - 1})" class="nav-btn prev-btn">← Previous</button>`;
      }
      if (index < slides.length - 1) {
        slideContent += `<button onclick="showSlide(${index + 1})" class="nav-btn next-btn">Next →</button>`;
      }
      
      slideContent += `</div></div>`;
      slideHTML += slideContent;
    }

    // Build thumbnails HTML safely
    let thumbnailHTML = '';
    for (let index = 0; index < slides.length; index++) {
      const slide = slides[index];
      thumbnailHTML += `
      <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="showSlide(${index})">
        <div class="thumb-number">${slide.id}</div>
        <div class="thumb-title">${slide.title || `Slide ${slide.id}`}</div>
        ${slide.images.length > 0 ? '<div class="thumb-indicator">📷</div>' : ''}
        ${slide.audioUrl ? '<div class="thumb-indicator">🔊</div>' : ''}
      </div>`;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom Interactive Presentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            background: #E6E6F2;
            color: #0B004A;
        }
        
        .presentation-container {
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 250px;
            background: #fff;
            box-shadow: 2px 0 8px rgba(11,0,74,0.1);
            overflow-y: auto;
            padding: 1rem;
        }
        
        .sidebar h3 {
            color: #6C2EB7;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }
        
        .thumbnail {
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
            border: 2px solid transparent;
            position: relative;
        }
        
        .thumbnail:hover {
            background: #E6E6F2;
        }
        
        .thumbnail.active {
            background: #6C2EB7;
            color: white;
            border-color: #0B004A;
        }
        
        .thumb-number {
            font-weight: bold;
            font-size: 0.9rem;
        }
        
        .thumb-title {
            font-size: 0.8rem;
            margin-top: 0.25rem;
            opacity: 0.8;
        }
        
        .thumb-indicator {
            position: absolute;
            top: 4px;
            right: 4px;
            font-size: 0.7rem;
        }
        
        .main-content {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
        }
        
        .slide {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 4px 16px rgba(11,0,74,0.1);
            max-width: 900px;
            margin: 0 auto;
            min-height: 500px;
        }
        
        .slide-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            border-bottom: 2px solid #E6E6F2;
            padding-bottom: 1rem;
        }
        
        .slide-header h2 {
            color: #0B004A;
            font-size: 1.8rem;
        }
        
        .slide-number {
            color: #6C2EB7;
            font-weight: 600;
        }
        
        .slide-content {
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        
        .slide-text p {
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }
        
        .slide-link {
            color: #6C2EB7;
            text-decoration: none;
            font-weight: 600;
            border-bottom: 2px solid #6C2EB7;
            transition: all 0.2s;
        }
        
        .slide-link:hover {
            color: #0B004A;
            border-bottom-color: #0B004A;
        }
        
        .hyperlinks-container {
            margin: 2rem 0;
            padding: 1.5rem;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #6C2EB7;
        }
        
        .hyperlinks-container h4 {
            color: #6C2EB7;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }
        
        .hyperlinks-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .slide-hyperlink {
            display: inline-block;
            color: #6C2EB7;
            text-decoration: none;
            font-weight: 600;
            padding: 0.75rem 1rem;
            background: white;
            border-radius: 8px;
            border: 2px solid #6C2EB7;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(108, 46, 183, 0.1);
        }
        
        .slide-hyperlink:hover {
            background: #6C2EB7;
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(108, 46, 183, 0.2);
        }
        
        .slide-images {
            margin: 2rem 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        .image-container {
            text-align: center;
        }
        
        .slide-image {
            max-width: 100%;
            max-height: 400px;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(11,0,74,0.1);
            object-fit: contain;
        }
        
        .audio-container {
            margin: 2rem 0;
            text-align: center;
        }
        
        .slide-audio {
            width: 100%;
            max-width: 500px;
            border-radius: 8px;
        }
        
        .transcript-section {
            margin-top: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #6C2EB7;
        }
        
        .transcript-section h4 {
            color: #6C2EB7;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
        }
        
        .transcript-section p {
            font-size: 0.9rem;
            line-height: 1.4;
            color: #555;
            margin: 0;
        }
        
        .slide-navigation {
            display: flex;
            justify-content: space-between;
            margin-top: 2rem;
        }
        
        .nav-btn {
            background: #6C2EB7;
            color: white;
            border: none;
            border-radius: 24px;
            padding: 0.75rem 2rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .nav-btn:hover {
            background: #0B004A;
        }
        
        .progress-bar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: #E6E6F2;
            z-index: 1000;
        }
        
        .progress-fill {
            height: 100%;
            background: #6C2EB7;
            transition: width 0.3s ease;
        }
        
        .learning-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(11,0,74,0.15);
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            min-width: 200px;
            z-index: 1001;
        }
        
        .timer-display {
            font-size: 1.1rem;
            font-weight: 600;
            color: #6C2EB7;
            text-align: center;
        }
        
        .completion-status {
            font-size: 0.9rem;
            color: #0B004A;
            text-align: center;
        }
        
        .complete-btn {
            background: #28a745;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
            margin-top: 0.5rem;
        }
        
        .complete-btn:hover {
            background: #218838;
        }
        
        .complete-btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
        
        .completion-message {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 0.75rem;
            font-size: 0.9rem;
            text-align: center;
            margin-top: 0.5rem;
        }
        
        @media (max-width: 768px) {
            .presentation-container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                height: auto;
                max-height: 150px;
                order: 2;
            }
            
            .main-content {
                order: 1;
                padding: 1rem;
            }
            
            .slide-images {
                grid-template-columns: 1fr;
            }
            
            .learning-controls {
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 0.75rem;
                min-width: 160px;
                font-size: 0.85rem;
            }
            
            .timer-display {
                font-size: 0.95rem;
            }
            
            .completion-status {
                font-size: 0.8rem;
            }
            
            .complete-btn {
                padding: 0.5rem 0.75rem;
                font-size: 0.8rem;
            }
        }
    </style>
</head>
<body>
    <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
    </div>
    
    <div class="learning-controls">
        <div class="timer-display" id="timerDisplay">⏱️ 00:00:00</div>
        <div class="completion-status" id="completionStatus">Slide 1 of ${slides.length}</div>
        <button class="complete-btn" id="completeBtn" onclick="completePresentation()" disabled>
            Complete Presentation
        </button>
        <div class="completion-message" id="completionMessage" style="display: none;">
            ✅ Presentation completed successfully!
        </div>
    </div>
    
    <div class="presentation-container">
        <div class="sidebar">
            <h3>Slides</h3>
            ${thumbnailHTML}
        </div>
        
        <div class="main-content">
            ${slideHTML}
        </div>
    </div>
    
    <script>
        let currentSlide = 0;
        const totalSlides = ${slides.length};
        let startTime = new Date();
        let timerInterval;
        let visitedSlides = new Set([0]); // Track which slides have been visited
        let isCompleted = false;
        
        // Timer functionality
        function startTimer() {
            timerInterval = setInterval(updateTimer, 1000);
        }
        
        function updateTimer() {
            const now = new Date();
            const elapsed = Math.floor((now - startTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            
            const timeString = \`⏱️ \${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
            document.getElementById('timerDisplay').textContent = timeString;
            
            // Update SCORM time tracking if available
            if (typeof saveProgress === 'function' && !isCompleted) {
                const progressData = {
                    timeSpent: elapsed,
                    currentSlide: currentSlide,
                    visitedSlides: Array.from(visitedSlides),
                    totalSlides: totalSlides,
                    progress: Math.round((visitedSlides.size / totalSlides) * 100),
                    timestamp: new Date().toISOString()
                };
                
                // Silent save every 30 seconds for time tracking
                if (elapsed % 30 === 0) {
                    if (typeof scormSaveProgress === 'function') {
                        scormSaveProgress(false); // Silent save
                    }
                }
            }
        }
        
        function showSlide(slideIndex) {
            // Stop current audio if playing
            const currentAudio = document.getElementById('audio-' + currentSlide);
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            
            // Hide current slide
            document.getElementById('slide-' + currentSlide).style.display = 'none';
            document.querySelector('.thumbnail.active').classList.remove('active');
            
            // Show new slide
            currentSlide = slideIndex;
            visitedSlides.add(currentSlide);
            document.getElementById('slide-' + currentSlide).style.display = 'block';
            document.querySelectorAll('.thumbnail')[currentSlide].classList.add('active');
            
            // Auto-play new slide audio
            const newAudio = document.getElementById('audio-' + currentSlide);
            if (newAudio) {
                setTimeout(() => {
                    newAudio.play().catch(e => {
                        console.log('Auto-play prevented by browser policy');
                    });
                }, 100);
            }
            
            // Update progress and completion status
            updateProgress();
            updateCompletionStatus();
            
            // Update SCORM progress
            updateSCORMProgress();
        }
        
        function updateProgress() {
            const progress = ((currentSlide + 1) / totalSlides) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
        }
        
        function updateCompletionStatus() {
            const statusEl = document.getElementById('completionStatus');
            const completeBtn = document.getElementById('completeBtn');
            
            statusEl.textContent = \`Slide \${currentSlide + 1} of \${totalSlides}\`;
            
            // Enable completion button if all slides have been visited
            if (visitedSlides.size === totalSlides && !isCompleted) {
                completeBtn.disabled = false;
                completeBtn.textContent = 'Complete Presentation';
                statusEl.textContent += ' - Ready to complete!';
            } else if (!isCompleted) {
                const remaining = totalSlides - visitedSlides.size;
                statusEl.textContent += \` (\${remaining} not viewed)\`;
            }
        }
        
        function updateSCORMProgress() {
            if (typeof scormProgress !== 'undefined') {
                // Update global SCORM progress variable
                window.scormProgress = Math.round((visitedSlides.size / totalSlides) * 100);
                
                // Update SCORM completion status
                if (typeof setSCORMData === 'function') {
                    setSCORMData('cmi.core.lesson_location', currentSlide.toString());
                    setSCORMData('cmi.suspend_data', JSON.stringify({
                        currentSlide: currentSlide,
                        visitedSlides: Array.from(visitedSlides),
                        startTime: startTime.toISOString(),
                        isCompleted: isCompleted
                    }));
                }
            }
        }
        
        function completePresentation() {
            if (visitedSlides.size !== totalSlides) {
                alert('Please view all slides before completing the presentation.');
                return;
            }
            
            isCompleted = true;
            const completeBtn = document.getElementById('completeBtn');
            const completionMsg = document.getElementById('completionMessage');
            
            completeBtn.disabled = true;
            completeBtn.textContent = 'Completed';
            completionMsg.style.display = 'block';
            
            // Update SCORM completion
            if (typeof window.scormIsCompleted !== 'undefined') {
                window.scormIsCompleted = true;
                window.scormProgress = 100;
            }
            
            if (typeof completeSCORM === 'function') {
                completeSCORM();
            } else if (typeof scormSaveProgress === 'function') {
                scormSaveProgress(false); // Final silent save
            }
            
            console.log('Presentation completed successfully');
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' && currentSlide > 0) {
                showSlide(currentSlide - 1);
            } else if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
                showSlide(currentSlide + 1);
            } else if (e.key === 'Enter' || e.key === ' ') {
                if (currentSlide < totalSlides - 1) {
                    showSlide(currentSlide + 1);
                } else if (visitedSlides.size === totalSlides && !isCompleted) {
                    completePresentation();
                }
            }
        });
        
        // Initialize on page load
        window.addEventListener('load', function() {
            startTimer();
            updateProgress();
            updateCompletionStatus();
            
            // Load saved progress from SCORM if available
            if (typeof loadProgress === 'function') {
                const savedData = loadProgress();
                if (savedData && savedData.currentSlide !== undefined) {
                    console.log('Loading saved progress:', savedData);
                    if (savedData.visitedSlides) {
                        visitedSlides = new Set(savedData.visitedSlides);
                    }
                    if (savedData.startTime) {
                        startTime = new Date(savedData.startTime);
                    }
                    if (savedData.isCompleted) {
                        isCompleted = savedData.isCompleted;
                        if (isCompleted) {
                            document.getElementById('completeBtn').disabled = true;
                            document.getElementById('completeBtn').textContent = 'Completed';
                            document.getElementById('completionMessage').style.display = 'block';
                        }
                    }
                    
                    // Navigate to saved slide
                    if (savedData.currentSlide > 0) {
                        showSlide(savedData.currentSlide);
                    }
                }
            }
            
            // Auto-play first slide audio
            const firstAudio = document.getElementById('audio-0');
            if (firstAudio) {
                setTimeout(() => {
                    firstAudio.play().catch(e => {
                        console.log('Auto-play prevented by browser policy for first slide');
                    });
                }, 500);
            }
        });
    </script>
</body>
</html>`;
  }

  async function handleDownloadZip() {
    if (slides.length === 0) return;
    
    setIsBuilding(true);
    
    try {
      const zip = new JSZip();
      const html = generateCustomHTML();
      
      zip.file('index.html', html);
      zip.file('README.txt', `Custom Interactive Presentation

Total slides: ${slides.length}
Created with: Omnicron Slide Builder

Features:
- Interactive navigation
- Images and audio support
- Hyperlinks
- Responsive design
- Keyboard navigation (arrow keys)

Instructions:
1. Open index.html in a web browser
2. Use the sidebar to navigate between slides
3. Use arrow keys for keyboard navigation
4. Upload to your LMS as a zip file

Created with Omnicron - Pearson Education`);

      // Add image files to zip separately to avoid string length issues
      const imageFolder = zip.folder('images');
      const audioFolder = zip.folder('audio');
      
      // Process each slide to add files
      let audioFilesFound = 0;
      let imageFilesFound = 0;
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        console.log(`Processing slide ${i + 1}:`, {
          hasAudioFile: !!slide.audioFile,
          audioFileName: slide.audioFile?.name,
          hasImages: slide.images?.length > 0,
          imageCount: slide.images?.length || 0
        });
        
        // Add images
        if (slide.images && Array.isArray(slide.images)) {
          for (const img of slide.images) {
            if (img.file) {
              imageFolder.file(img.name, img.file);
              imageFilesFound++;
              console.log(`Added image: ${img.name}`);
            }
          }
        }
        
        // Add audio files with comprehensive checking
        if (slide.audioFile && slide.audioFile instanceof File) {
          try {
            audioFolder.file(slide.audioFile.name, slide.audioFile);
            audioFilesFound++;
            console.log(`Added audio file: ${slide.audioFile.name} (${Math.round(slide.audioFile.size / 1024)}KB)`);
          } catch (error) {
            console.error(`Error adding audio file for slide ${i + 1}:`, error);
          }
        } else if (slide.audioFile) {
          console.warn(`Slide ${i + 1} has audioFile but it's not a valid File object:`, typeof slide.audioFile, slide.audioFile);
        }
      }
      
      console.log(`ZIP Generation Summary:
        - Total slides: ${slides.length}
        - Audio files added: ${audioFilesFound}
        - Image files added: ${imageFilesFound}
      `);
      
      // Show user feedback about what was included
      if (audioFilesFound === 0 && slides.some(slide => slide.audioUrl)) {
        console.warn('Some slides have audioUrl but no audioFile was found for ZIP inclusion');
        alert(`Note: ${slides.filter(slide => slide.audioUrl).length} slide(s) have audio preview but the original audio files may not be properly saved. Audio might not be included in the download.`);
      }

      // Generate zip with chunked processing to handle large files
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `custom_presentation_${slides.length}_slides.zip`;
      a.click();
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(a.href), 100);
      
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('There was an error creating the presentation. This might be due to large file sizes. Try reducing image sizes or number of slides.');
    } finally {
      setIsBuilding(false);
    }
  }

  async function handleDownloadWebsite() {
    if (slides.length === 0) return;
    
    setIsBuilding(true);
    
    try {
      const zip = new JSZip();
      
      // Create an enhanced HTML with modern web hosting features
      const websiteHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Presentation</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <meta name="description" content="Interactive presentation with ${slides.length} slides, featuring multimedia content and responsive design.">
    <meta property="og:title" content="Interactive Presentation">
    <meta property="og:description" content="Explore this interactive presentation with multimedia content and navigation.">
    <meta property="og:type" content="website">
    <style>
        :root {
            --primary-color: #0B004A;
            --secondary-color: #6C2EB7;
            --light-bg: #f8f7ff;
            --white: #ffffff;
            --text-color: #333;
            --border-color: #E6E6F2;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            background: linear-gradient(135deg, var(--light-bg) 0%, var(--white) 100%);
            color: var(--text-color);
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .presentation-container {
            display: flex;
            min-height: 100vh;
            max-width: 1400px;
            margin: 0 auto;
            box-shadow: 0 0 40px rgba(11,0,74,0.1);
            background: var(--white);
        }
        
        .header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: var(--white);
            padding: 1.5rem 2rem;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            box-shadow: 0 2px 20px rgba(11,0,74,0.15);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 1.5rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .header h1::before {
            content: "🎯";
            font-size: 1.25rem;
        }
        
        .slide-counter {
            font-size: 1rem;
            background: rgba(255,255,255,0.2);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
        }
        
        .sidebar {
            width: 280px;
            background: linear-gradient(180deg, var(--light-bg) 0%, var(--white) 100%);
            border-right: 2px solid var(--border-color);
            padding: 2rem 1rem;
            margin-top: 80px;
            overflow-y: auto;
            height: calc(100vh - 80px);
        }
        
        .sidebar h3 {
            color: var(--primary-color);
            margin-bottom: 1.5rem;
            font-size: 1.2rem;
            text-align: center;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--border-color);
        }
        
        .thumbnail {
            padding: 1rem;
            margin-bottom: 0.75rem;
            background: var(--white);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            position: relative;
            box-shadow: 0 2px 8px rgba(11,0,74,0.06);
        }
        
        .thumbnail:hover {
            background: var(--light-bg);
            transform: translateX(4px);
            box-shadow: 0 4px 16px rgba(11,0,74,0.12);
        }
        
        .thumbnail.active {
            background: var(--secondary-color);
            color: var(--white);
            border-color: var(--primary-color);
            transform: translateX(8px);
            box-shadow: 0 6px 20px rgba(108, 46, 183, 0.25);
        }
        
        .thumb-number {
            font-weight: bold;
            font-size: 1rem;
        }
        
        .thumb-title {
            font-size: 0.85rem;
            margin-top: 0.5rem;
            opacity: 0.85;
            line-height: 1.3;
        }
        
        .thumb-indicator {
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 0.75rem;
            display: flex;
            gap: 2px;
        }
        
        .main-content {
            flex: 1;
            padding: 2rem;
            margin-top: 80px;
            overflow-y: auto;
            height: calc(100vh - 80px);
        }
        
        .slide {
            background: var(--white);
            border-radius: 20px;
            padding: 3rem;
            box-shadow: 0 8px 32px rgba(11,0,74,0.08);
            max-width: 900px;
            margin: 0 auto 2rem auto;
            min-height: 600px;
            position: relative;
            border: 1px solid var(--border-color);
        }
        
        .slide-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2.5rem;
            border-bottom: 3px solid var(--border-color);
            padding-bottom: 1.5rem;
        }
        
        .slide-header h2 {
            color: var(--primary-color);
            font-size: 2rem;
            font-weight: 700;
            flex: 1;
            margin-right: 1rem;
        }
        
        .slide-number {
            color: var(--secondary-color);
            font-weight: 600;
            font-size: 1.1rem;
            background: var(--light-bg);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            border: 2px solid var(--secondary-color);
        }
        
        .slide-content {
            margin-bottom: 2.5rem;
            line-height: 1.7;
        }
        
        .slide-text p {
            margin-bottom: 1.25rem;
            font-size: 1.1rem;
        }
        
        .slide-link {
            color: var(--secondary-color);
            text-decoration: none;
            font-weight: 600;
            border-bottom: 2px solid var(--secondary-color);
            transition: all 0.3s ease;
            padding: 2px 0;
        }
        
        .slide-link:hover {
            color: var(--primary-color);
            border-bottom-color: var(--primary-color);
            background: var(--light-bg);
            padding: 4px 8px;
            border-radius: 4px;
            margin: 0 -8px;
        }
        
        .hyperlinks-container {
            margin: 2.5rem 0;
            padding: 2rem;
            background: linear-gradient(135deg, var(--light-bg) 0%, var(--white) 100%);
            border-radius: 16px;
            border-left: 6px solid var(--secondary-color);
            box-shadow: 0 4px 16px rgba(11,0,74,0.06);
        }
        
        .hyperlinks-container h4 {
            color: var(--primary-color);
            margin-bottom: 1.5rem;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .hyperlinks-container h4::before {
            content: "🔗";
        }
        
        .hyperlinks-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }
        
        .slide-hyperlink {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--secondary-color);
            text-decoration: none;
            font-weight: 600;
            padding: 1rem 1.5rem;
            background: var(--white);
            border-radius: 12px;
            border: 2px solid var(--secondary-color);
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(108, 46, 183, 0.1);
        }
        
        .slide-hyperlink::before {
            content: "↗";
            font-size: 1.1rem;
        }
        
        .slide-hyperlink:hover {
            background: var(--secondary-color);
            color: var(--white);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(108, 46, 183, 0.25);
        }
        
        .slide-images {
            margin: 2.5rem 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
        }
        
        .image-container {
            text-align: center;
            background: var(--white);
            padding: 1rem;
            border-radius: 16px;
            border: 2px solid var(--border-color);
            box-shadow: 0 4px 16px rgba(11,0,74,0.06);
            transition: all 0.3s ease;
        }
        
        .image-container:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(11,0,74,0.12);
        }
        
        .slide-image {
            max-width: 100%;
            max-height: 400px;
            height: auto;
            border-radius: 12px;
            object-fit: contain;
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        
        .slide-image:hover {
            transform: scale(1.02);
        }
        
        .audio-container {
            margin: 2.5rem 0;
            text-align: center;
            background: linear-gradient(135deg, var(--light-bg) 0%, var(--white) 100%);
            padding: 2rem;
            border-radius: 16px;
            border: 2px solid var(--border-color);
            box-shadow: 0 4px 16px rgba(11,0,74,0.06);
        }
        
        .audio-container h4 {
            color: var(--primary-color);
            margin-bottom: 1rem;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .audio-container h4::before {
            content: "🎵";
        }
        
        .slide-audio {
            width: 100%;
            max-width: 600px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(11,0,74,0.1);
        }
        
        .transcript-section {
            margin-top: 1.5rem;
            padding: 1.5rem;
            background: var(--white);
            border-radius: 12px;
            border-left: 4px solid var(--secondary-color);
            box-shadow: 0 2px 8px rgba(11,0,74,0.06);
        }
        
        .transcript-section h4 {
            color: var(--secondary-color);
            margin-bottom: 0.75rem;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .transcript-section h4::before {
            content: "📝";
        }
        
        .transcript-section p {
            font-size: 0.95rem;
            line-height: 1.5;
            color: #555;
            margin: 0;
        }
        
        .slide-navigation {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 2px solid var(--border-color);
        }
        
        .nav-btn {
            background: linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%);
            color: var(--white);
            border: none;
            border-radius: 30px;
            padding: 1rem 2rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 16px rgba(108, 46, 183, 0.2);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .nav-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(108, 46, 183, 0.3);
        }
        
        .nav-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .nav-btn.prev::before {
            content: "←";
        }
        
        .nav-btn.next::after {
            content: "→";
        }
        
        .progress-bar {
            position: fixed;
            top: 80px;
            left: 0;
            height: 4px;
            background: var(--secondary-color);
            transition: width 0.3s ease;
            z-index: 999;
        }
        
        .slide-progress {
            text-align: center;
            color: var(--secondary-color);
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .presentation-container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                height: auto;
                max-height: 200px;
                margin-top: 0;
            }
            
            .main-content {
                margin-top: 0;
                height: auto;
            }
            
            .slide {
                padding: 2rem 1.5rem;
                margin: 1rem 0;
                border-radius: 16px;
            }
            
            .slide-header h2 {
                font-size: 1.5rem;
            }
            
            .hyperlinks-list {
                grid-template-columns: 1fr;
            }
            
            .slide-images {
                grid-template-columns: 1fr;
            }
            
            .header {
                padding: 1rem;
            }
            
            .header h1 {
                font-size: 1.25rem;
            }
        }
        
        @media (max-width: 480px) {
            .slide {
                padding: 1.5rem 1rem;
            }
            
            .slide-header {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
            
            .slide-navigation {
                flex-direction: column;
                gap: 1rem;
            }
            
            .nav-btn {
                width: 100%;
                justify-content: center;
            }
        }
        
        /* Loading and animation states */
        .loading {
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }
        
        .fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Print styles */
        @media print {
            .sidebar,
            .header,
            .slide-navigation,
            .nav-btn {
                display: none !important;
            }
            
            .main-content {
                margin-top: 0;
            }
            
            .slide {
                break-inside: avoid;
                page-break-inside: avoid;
                margin-bottom: 2rem;
                box-shadow: none;
                border: 1px solid #ccc;
            }
        }
    </style>
</head>
<body>
    <div class="progress-bar" id="progressBar"></div>
    
    <div class="header">
        <h1>Interactive Presentation</h1>
        <div class="slide-counter">
            <span id="currentSlideNum">1</span> / <span id="totalSlides">${slides.length}</span>
        </div>
    </div>
    
    <div class="presentation-container">
        <div class="sidebar">
            <h3>📑 Slides</h3>
            <div class="thumbnails">
                ${slides.map((slide, index) => `
                    <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})" data-slide="${index}">
                        <div class="thumb-number">Slide ${index + 1}</div>
                        <div class="thumb-title">${slide.title || 'Untitled'}</div>
                        <div class="thumb-indicator">
                            ${slide.images.length > 0 ? '🖼️' : ''}
                            ${slide.audioFile ? '🎵' : ''}
                            ${slide.hyperlinks && slide.hyperlinks.length > 0 ? '🔗' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="main-content">
            ${slides.map((slide, index) => `
                <div class="slide ${index === 0 ? 'active fade-in' : ''}" id="slide-${index}" style="${index === 0 ? '' : 'display: none;'}">
                    <div class="slide-header">
                        <h2>${slide.title || `Slide ${index + 1}`}</h2>
                        <div class="slide-number">Slide ${index + 1}</div>
                    </div>
                    
                    <div class="slide-content">
                        ${slide.content ? `
                            <div class="slide-text">
                                ${slide.content.split('\\n').map(p => p.trim() ? `<p>${p.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>').replace(/\\*(.*?)\\*/g, '<em>$1</em>')}</p>` : '').join('')}
                            </div>
                        ` : ''}
                        
                        ${slide.hyperlinks && slide.hyperlinks.length > 0 ? `
                            <div class="hyperlinks-container">
                                <h4>Resources & Links</h4>
                                <div class="hyperlinks-list">
                                    ${slide.hyperlinks.map(link => `
                                        <a href="${link.url}" class="slide-hyperlink" target="_blank" rel="noopener noreferrer">
                                            ${link.text}
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${slide.images && slide.images.length > 0 ? `
                            <div class="slide-images">
                                ${slide.images.map(img => `
                                    <div class="image-container">
                                        <img src="assets/images/${img.name}" alt="${img.name}" class="slide-image" onclick="openImageModal(this)">
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${slide.audioFile ? `
                            <div class="audio-container">
                                <h4>Audio Content</h4>
                                <audio controls class="slide-audio" preload="metadata">
                                    <source src="assets/audio/${slide.audioFile.name}" type="audio/mpeg">
                                    <source src="assets/audio/${slide.audioFile.name}" type="audio/wav">
                                    Your browser does not support the audio element.
                                </audio>
                                ${slide.transcriptSection ? `
                                    <div class="transcript-section">
                                        <h4>Transcript</h4>
                                        <p>${slide.transcriptSection}</p>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="slide-navigation">
                        <button class="nav-btn prev" onclick="previousSlide()" ${index === 0 ? 'disabled' : ''}>
                            Previous
                        </button>
                        <div class="slide-progress">
                            ${Math.round(((index + 1) / slides.length) * 100)}% Complete
                        </div>
                        <button class="nav-btn next" onclick="nextSlide()" ${index === slides.length - 1 ? 'disabled' : ''}>
                            Next
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        let currentSlide = 0;
        const totalSlides = ${slides.length};
        
        function updateProgressBar() {
            const progress = ((currentSlide + 1) / totalSlides) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
        }
        
        function updateSlideCounter() {
            document.getElementById('currentSlideNum').textContent = currentSlide + 1;
        }
        
        function showSlide(slideIndex) {
            // Hide all slides
            document.querySelectorAll('.slide').forEach(slide => {
                slide.style.display = 'none';
                slide.classList.remove('active', 'fade-in');
            });
            
            // Show current slide
            const currentSlideEl = document.getElementById(\`slide-\${slideIndex}\`);
            if (currentSlideEl) {
                currentSlideEl.style.display = 'block';
                currentSlideEl.classList.add('active');
                
                // Add fade in animation
                setTimeout(() => {
                    currentSlideEl.classList.add('fade-in');
                }, 10);
            }
            
            // Update thumbnails
            document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
                thumb.classList.toggle('active', index === slideIndex);
            });
            
            // Update navigation buttons
            const prevBtn = document.querySelector('.nav-btn.prev');
            const nextBtn = document.querySelector('.nav-btn.next');
            
            if (prevBtn) prevBtn.disabled = slideIndex === 0;
            if (nextBtn) nextBtn.disabled = slideIndex === totalSlides - 1;
            
            updateProgressBar();
            updateSlideCounter();
            
            // Scroll to top of slide
            currentSlideEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        function goToSlide(slideIndex) {
            if (slideIndex >= 0 && slideIndex < totalSlides) {
                currentSlide = slideIndex;
                showSlide(currentSlide);
            }
        }
        
        function nextSlide() {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                showSlide(currentSlide);
            }
        }
        
        function previousSlide() {
            if (currentSlide > 0) {
                currentSlide--;
                showSlide(currentSlide);
            }
        }
        
        function openImageModal(img) {
            const modal = document.createElement('div');
            modal.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                cursor: pointer;
            \`;
            
            const modalImg = document.createElement('img');
            modalImg.src = img.src;
            modalImg.style.cssText = \`
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
                border-radius: 8px;
            \`;
            
            modal.appendChild(modalImg);
            document.body.appendChild(modal);
            
            modal.onclick = () => document.body.removeChild(modal);
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            switch(e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    previousSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    goToSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    goToSlide(totalSlides - 1);
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Close any open modals
                    document.querySelectorAll('[style*="position: fixed"]').forEach(modal => {
                        if (modal.style.zIndex === '10000') {
                            document.body.removeChild(modal);
                        }
                    });
                    break;
            }
        });
        
        // Touch/swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                nextSlide(); // Swipe left - next slide
            }
            if (touchEndX > touchStartX + swipeThreshold) {
                previousSlide(); // Swipe right - previous slide
            }
        }
        
        // Auto-play audio when slide becomes active
        function autoPlayAudio() {
            const currentSlideEl = document.getElementById(\`slide-\${currentSlide}\`);
            const audioEl = currentSlideEl?.querySelector('audio');
            if (audioEl) {
                // Only auto-play if user has interacted with the page
                audioEl.play().catch(() => {
                    // Auto-play failed, which is expected in many browsers
                    console.log('Auto-play prevented by browser');
                });
            }
        }
        
        // Initialize presentation
        document.addEventListener('DOMContentLoaded', function() {
            updateProgressBar();
            updateSlideCounter();
            
            // Add loading animation to slides
            document.querySelectorAll('.slide').forEach((slide, index) => {
                slide.style.opacity = '0';
                slide.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    slide.style.transition = 'all 0.6s ease';
                    slide.style.opacity = '1';
                    slide.style.transform = 'translateY(0)';
                }, index * 100);
            });
            
            // Show first slide
            showSlide(0);
        });
        
        // Accessibility improvements
        document.addEventListener('DOMContentLoaded', function() {
            // Add ARIA labels
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.setAttribute('aria-label', btn.textContent.trim());
            });
            
            document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
                thumb.setAttribute('role', 'button');
                thumb.setAttribute('aria-label', \`Go to slide \${index + 1}\`);
                thumb.setAttribute('tabindex', '0');
                
                // Add keyboard support for thumbnails
                thumb.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goToSlide(index);
                    }
                });
            });
        });
    </script>
</body>
</html>`;
      
      zip.file('index.html', websiteHtml);
      
      // Add assets with organized folder structure
      const assetsFolder = zip.folder('assets');
      const imagesFolder = assetsFolder.folder('images');
      const audioFolder = assetsFolder.folder('audio');
      
      // Process each slide to add files with debugging
      let audioFilesFound = 0;
      let imageFilesFound = 0;
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // Add images
        if (slide.images && Array.isArray(slide.images)) {
          for (const img of slide.images) {
            if (img.file) {
              imagesFolder.file(img.name, img.file);
              imageFilesFound++;
            }
          }
        }
        
        // Add audio files with comprehensive checking
        if (slide.audioFile && slide.audioFile instanceof File) {
          try {
            audioFolder.file(slide.audioFile.name, slide.audioFile);
            audioFilesFound++;
          } catch (error) {
            console.error(`Error adding audio file for slide ${i + 1}:`, error);
          }
        }
      }
      
      console.log(`Website ZIP Summary: ${audioFilesFound} audio files, ${imageFilesFound} images added`);
      
      // Add Netlify configuration
      const netlifyToml = `[build]
  publish = "."
  
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "ALLOWALL"
    X-Content-Type-Options = "nosniff"
    
[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"`;
      
      const redirects = `# Netlify redirects file
/*    /index.html   200
/presentation /index.html   200
/slides /index.html   200`;
      
      const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#6C2EB7"/>
  <text x="50" y="60" text-anchor="middle" fill="white" font-family="Plus Jakarta Sans" font-size="35" font-weight="bold">📊</text>
</svg>`;
      
      const readme = `# Interactive Presentation Website

This folder contains a complete interactive presentation website ready for deployment.

## Quick Deploy to Netlify:
1. Drag and drop this entire folder onto netlify.com/drop
2. Your presentation will be live instantly with a random URL
3. Share the URL with colleagues for immediate access

## Features:
- ✅ Interactive slide navigation with sidebar thumbnails
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Keyboard navigation (arrow keys, home, end)
- ✅ Touch/swipe support for mobile devices
- ✅ Progress bar and slide counter
- ✅ Image modal/lightbox functionality
- ✅ Audio support with controls
- ✅ Hyperlinks and rich content
- ✅ Print-friendly styles
- ✅ Accessibility features (ARIA labels, keyboard support)
- ✅ SEO optimized with meta tags
- ✅ Pearson brand styling with Plus Jakarta Sans font

## Navigation:
- **Arrow Keys**: Navigate between slides
- **Space Bar**: Next slide
- **Home/End**: Jump to first/last slide
- **Click Thumbnails**: Jump to any slide
- **Touch/Swipe**: Mobile navigation
- **Escape**: Close image modals

## Content:
- **Total Slides**: ${slides.length}
- **Images**: ${slides.reduce((total, slide) => total + slide.images.length, 0)} assets
- **Audio Files**: ${slides.filter(slide => slide.audioFile).length} tracks
- **Hyperlinks**: ${slides.reduce((total, slide) => total + (slide.hyperlinks?.length || 0), 0)} external links

## Files Structure:
- **index.html**: Main presentation website
- **assets/images/**: All slide images
- **assets/audio/**: All audio files
- **netlify.toml**: Hosting configuration
- **_redirects**: URL routing
- **favicon.svg**: Site icon
- **README.md**: This guide

## Hosting Platforms Tested:
- ✅ Netlify (recommended - drag & drop deployment)
- ✅ Vercel (GitHub integration)
- ✅ GitHub Pages (free hosting)
- ✅ AWS S3 + CloudFront
- ✅ Traditional web hosting (cPanel, etc.)

## Sharing & Collaboration:
Perfect for sharing with colleagues before importing into your LMS:
- Send the live URL for instant preview
- Colleagues can navigate through slides independently
- Works on all devices and browsers
- No software installation required

Generated by HTMLwiz - Pearson Education
Created: ${new Date().toLocaleDateString()}
`;
      
      zip.file('netlify.toml', netlifyToml);
      zip.file('_redirects', redirects);
      zip.file('favicon.svg', favicon);
      zip.file('README.md', readme);
      
      // Generate zip with optimized settings
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `interactive-presentation-website-${slides.length}-slides.zip`;
      a.click();
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(a.href), 100);
      
    } catch (error) {
      console.error('Error creating website:', error);
      alert('There was an error creating the website. This might be due to large file sizes. Try reducing image sizes or number of slides.');
    } finally {
      setIsBuilding(false);
    }
  }

  const currentSlideData = slides[currentSlide] || {};

  async function processManualTimestamps() {
    if (!masterAudioFile || !manualTimestamps.trim()) {
      alert('Please upload an audio file and provide timestamps');
      return;
    }

    if (slides.length === 0) {
      alert('Please create some slides first before adding audio');
      return;
    }

    setIsProcessingAudio(true);
    
    try {
      // Parse timestamps (format: "0:00, 1:30, 3:45" or "0, 90, 225")
      const timestamps = manualTimestamps
        .split(/[,\n]/)
        .map(time => time.trim())
        .filter(time => time.length > 0)
        .map(time => {
          if (time.includes(':')) {
            // Format: "1:30" (minutes:seconds)
            const [minutes, seconds] = time.split(':').map(Number);
            return (minutes * 60) + seconds;
          } else {
            // Format: "90" (seconds)
            return Number(time);
          }
        })
        .filter(time => !isNaN(time) && time >= 0)
        .sort((a, b) => a - b);

      if (timestamps.length === 0) {
        alert('No valid timestamps found. Use format like "0:00, 1:30, 3:45" or "0, 90, 225"');
        setIsProcessingAudio(false);
        return;
      }

      // Create audio context for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Convert file to array buffer
      const arrayBuffer = await masterAudioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const actualDuration = audioBuffer.duration;
      
      // Add 0 at start and duration at end if not present
      const allTimestamps = [0, ...timestamps.filter(t => t > 0 && t < actualDuration), actualDuration];
      const sectionsToProcess = Math.min(allTimestamps.length - 1, slides.length);
      
      console.log(`Manual timestamps: ${allTimestamps.map(t => t.toFixed(2) + 's').join(', ')}`);
      
      const updatedSlides = [...slides];
      const audioChunks = [];
      
      // Create audio chunks based on manual timestamps
      for (let i = 0; i < sectionsToProcess; i++) {
        const startTime = allTimestamps[i];
        const endTime = allTimestamps[i + 1];
        const chunkDuration = endTime - startTime;
        
        if (chunkDuration <= 0) continue;
        
        // Create a new buffer for this chunk
        const chunkBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          Math.floor(chunkDuration * audioBuffer.sampleRate),
          audioBuffer.sampleRate
        );
        
        // Copy the audio data for this time segment
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const sourceData = audioBuffer.getChannelData(channel);
          const targetData = chunkBuffer.getChannelData(channel);
          const startSample = Math.floor(startTime * audioBuffer.sampleRate);
          
          for (let sample = 0; sample < targetData.length; sample++) {
            targetData[sample] = sourceData[startSample + sample] || 0;
          }
        }
        
        // Convert buffer to WAV blob
        const wavBlob = audioBufferToWav(chunkBuffer);
        const chunkFile = new File([wavBlob], `slide_${i + 1}_audio.wav`, { type: 'audio/wav' });
        
        // Create object URL for preview
        const chunkUrl = URL.createObjectURL(wavBlob);
        
        audioChunks.push({
          file: chunkFile,
          url: chunkUrl,
          duration: chunkDuration
        });
        
        // Update slide with chunk
        if (i < updatedSlides.length) {
          updatedSlides[i] = {
            ...updatedSlides[i],
            audioFile: chunkFile,
            audioUrl: chunkUrl,
            transcriptSection: `Manual timestamp: ${Math.floor(startTime/60)}:${(startTime%60).toFixed(0).padStart(2,'0')} - ${Math.floor(endTime/60)}:${(endTime%60).toFixed(0).padStart(2,'0')}`,
            audioStartTime: 0,
            audioDuration: chunkDuration
          };
        }
      }

      setSlides(updatedSlides);
      setIsProcessingAudio(false);
      setShowManualTimestamps(false);
      
      // Show success message
      alert(`Successfully created ${audioChunks.length} audio chunks using manual timestamps!`);
      console.log('Manual audio chunks created:', audioChunks);
      
    } catch (error) {
      console.error('Error processing manual timestamps:', error);
      alert('There was an error processing the audio with manual timestamps.');
      setIsProcessingAudio(false);
    }
  }

  // AI-powered slide generation handler
  const handleAISlideGeneration = async (prompt, options = {}) => {
    if (!window.aiConfig?.apiKey && window.aiConfig?.provider !== 'ollama') {
      throw new Error('AI service not configured. Please set up your API key.');
    }

    setIsBuilding(true);
    try {
      const aiService = getAIService();
      const slideData = await aiService.generateSlideContent(prompt, options.slideCount || 5);
      
      // Update slide count and slides with AI-generated content
      setSlideCount(slideData.length);
      setSlides(slideData.map((slide, index) => ({
        id: index + 1,
        title: slide.title || `Slide ${index + 1}`,
        content: slide.content || '',
        images: [],
        audioFile: null,
        audioUrl: '',
        hyperlinks: []
      })));
      
      // Reset to first slide
      setCurrentSlide(0);
      
    } catch (error) {
      console.error('AI slide generation failed:', error);
      throw error;
    } finally {
      setIsBuilding(false);
    }
  };

  function handleBulkIndividualAudioUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validate audio file sizes (max 50MB per file)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    for (const file of files) {
      if (file.size > maxFileSize) {
        alert(`Audio file "${file.name}" is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum file size is 50MB.`);
        return;
      }
    }
    
    if (files.length > slides.length) {
      alert(`You selected ${files.length} audio files but only have ${slides.length} slides. Only the first ${slides.length} files will be used.`);
    }
    
    setIsBuilding(true);
    
    const audioPromises = files.slice(0, slides.length).map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            file,
            url: event.target.result,
            index
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(audioPromises).then(audioFiles => {
      const updatedSlides = [...slides];
      
      audioFiles.forEach((audio, index) => {
        if (index < updatedSlides.length) {
          updatedSlides[index] = {
            ...updatedSlides[index],
            audioFile: audio.file,
            audioUrl: audio.url,
            transcriptSection: '' // Clear any bulk setup data
          };
        }
      });
      
      setSlides(updatedSlides);
      setIsBuilding(false);
      
      alert(`Successfully added ${audioFiles.length} audio files to slides!`);
      
      // Clear the file input
      e.target.value = '';
    });
  }

  function handleBulkImageUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validate file sizes (max 10MB per image, max 100MB total)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxTotalSize = 100 * 1024 * 1024; // 100MB
    let totalSize = 0;
    
    for (const file of files) {
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum file size is 10MB.`);
        return;
      }
      totalSize += file.size;
    }
    
    if (totalSize > maxTotalSize) {
      alert(`Total file size is too large (${Math.round(totalSize / 1024 / 1024)}MB). Maximum total size is 100MB.`);
      return;
    }
    
    if (files.length > 50) {
      alert('Too many files selected. Maximum is 50 images.');
      return;
    }
    
    setIsBuilding(true);
    
    const imagePromises = files.map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            file,
            url: event.target.result,
            name: file.name,
            index
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(images => {
      // Create slides based on uploaded images
      const newSlides = images.map((img, index) => ({
        id: index + 1,
        title: img.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        content: `Image: ${img.name}`,
        images: [{
          ...img,
          file: img.file // Store the original file object for zip generation
        }],
        audioFile: null,
        audioUrl: '',
        hyperlinks: [],
        transcriptSection: ''
      }));
      
      setSlides(newSlides);
      setSlideCount(newSlides.length);
      setCurrentSlide(0);
      setIsBuilding(false);
      
      // Clear the file input
      e.target.value = '';
    });
  }

  return (
    <div aria-label="Custom Slide Builder">
      <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Build Custom Interactive Presentation:</h3>
      
      {/* AI-powered slide generation */}
      <AIPromptInput
        type="slides"
        onGenerate={handleAISlideGeneration}
        showSlideCount={true}
        isConfigured={!!(window.aiConfig?.apiKey || window.aiConfig?.provider === 'ollama')}
        placeholder="Describe the topic for your slides (e.g., 'Introduction to Machine Learning for beginners, cover basics, algorithms, and applications')"
      />
      
      {/* Bulk image upload feature */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: pearsonColors.amethyst, borderRadius: 8, color: 'white' }}>
        <h4 style={{ marginBottom: '1rem', color: 'white' }}>🚀 Quick Start: Create Slides from Images</h4>
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
          Upload multiple images to automatically create a slide for each image. You can then add text, audio, and hyperlinks to each slide.
        </p>
        <input
          type="file"
          multiple
          accept="image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.JPG,.JPEG,.PNG,.GIF,.BMP,.WEBP,.SVG"
          onChange={handleBulkImageUpload}
          disabled={isBuilding}
          style={{
            padding: '0.75rem',
            borderRadius: 8,
            border: 'none',
            background: 'white',
            width: '100%',
            fontSize: '1rem'
          }}
        />
        {isBuilding && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            ⏳ Processing images and creating slides... This may take a moment for large files.
          </div>
        )}
      </div>
      
      {/* Bulk individual audio upload */}
      {slides.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e8f5e8', borderRadius: 8, border: '2px solid #27ae60' }}>
          <h4 style={{ marginBottom: '1rem', color: '#27ae60' }}>🎧 Alternative: Upload Individual Audio Files</h4>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#2c3e50' }}>
            If bulk audio setup isn't working as expected, upload individual audio files here. 
            Select multiple audio files and they'll be assigned to slides in order.
          </p>
          <input
            type="file"
            multiple
            accept="audio/*"
            onChange={handleBulkIndividualAudioUpload}
            disabled={isBuilding}
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              border: '2px solid #27ae60',
              background: 'white',
              width: '100%',
              fontSize: '1rem'
            }}
          />
          {isBuilding && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#27ae60' }}>
              ⏳ Processing audio files...
            </div>
          )}
          <div style={{ fontSize: '0.8rem', color: '#27ae60', marginTop: '0.5rem' }}>
            💡 File names should ideally match slide order (e.g., slide1.mp3, slide2.mp3, etc.)
          </div>
        </div>
      )}

      {/* Manual slide creation */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: pearsonColors.lightPurple, borderRadius: 8 }}>
        <h4 style={{ marginBottom: '1rem', color: pearsonColors.purple }}>📝 Manual Slide Creation</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Number of Slides:
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={slideCount}
              onChange={(e) => setSlideCount(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                padding: '0.5rem',
                borderRadius: 4,
                border: `1px solid ${pearsonColors.amethyst}`,
                width: 100
              }}
            />
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAudioChunker(true)}
              style={{
                ...buttonStyle,
                background: pearsonColors.amethyst,
                fontSize: '0.9rem',
                padding: '0.75rem 1rem'
              }}
            >
              🎵 Bulk Audio Setup
            </button>
            <button
              onClick={() => setShowManualTimestamps(true)}
              style={{
                ...buttonStyle,
                background: '#e67e22',
                fontSize: '0.9rem',
                padding: '0.75rem 1rem'
              }}
            >
              ⏱️ Manual Timestamps
            </button>
            <button
              onClick={() => {
                // Clear all slide audio
                const updatedSlides = slides.map(slide => ({
                  ...slide,
                  audioFile: null,
                  audioUrl: '',
                  transcriptSection: ''
                }));
                setSlides(updatedSlides);
                alert('All slide audio cleared. You can now upload individual audio files for each slide.');
              }}
              style={{
                ...buttonStyle,
                background: '#27ae60',
                fontSize: '0.9rem',
                padding: '0.75rem 1rem'
              }}
            >
              🎧 Individual Audio Mode
            </button>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: pearsonColors.amethyst }}>
          💡 <strong>Bulk Audio Setup:</strong> Split one audio file using transcript breaks (---) - may need debugging<br/>
          💡 <strong>Manual Timestamps:</strong> Specify exact times to cut audio (most reliable)<br/>
          💡 <strong>Individual Audio Mode:</strong> Upload separate audio files for each slide (simplest)
        </div>
      </div>

      {/* Slide navigation */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            style={{
              ...buttonStyle,
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              background: currentSlide === index ? pearsonColors.purple : pearsonColors.amethyst,
              opacity: currentSlide === index ? 1 : 0.7
            }}
          >
            Slide {index + 1}
          </button>
        ))}
      </div>

      {/* Current slide editor */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: 12, marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: pearsonColors.purple }}>
          Editing Slide {currentSlide + 1}
        </h4>

        {/* Slide title */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Slide Title:
          </label>
          <input
            type="text"
            value={currentSlideData.title || ''}
            onChange={(e) => updateSlide('title', e.target.value)}
            placeholder={`Slide ${currentSlide + 1} Title`}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 8,
              border: `2px solid ${pearsonColors.lightPurple}`,
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Slide content */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Slide Content:
          </label>
          <div style={{ fontSize: '0.8rem', color: pearsonColors.amethyst, marginBottom: '0.5rem' }}>
            💡 Tip: Select text and it will become clickable to add hyperlinks
          </div>
          <textarea
            value={currentSlideData.content || ''}
            onChange={(e) => updateSlide('content', e.target.value)}
            onMouseUp={handleTextSelection}
            placeholder="Enter your slide content here..."
            style={{
              width: '100%',
              height: 120,
              padding: '0.75rem',
              borderRadius: 8,
              border: `2px solid ${pearsonColors.lightPurple}`,
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>

                 {/* Image upload */}
         <div style={{ marginBottom: '1rem' }}>
           <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
             Add More Images:
           </label>
           <div style={{ fontSize: '0.8rem', color: pearsonColors.amethyst, marginBottom: '0.5rem' }}>
             {currentSlideData.images && currentSlideData.images.length > 0 
               ? `Current slide has ${currentSlideData.images.length} image(s). Add more below.`
               : 'No images on this slide yet. Upload some below.'
             }
           </div>
           <input
             type="file"
             multiple
             accept="image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.JPG,.JPEG,.PNG,.GIF,.BMP,.WEBP,.SVG"
             onChange={handleImageUpload}
             style={{
               padding: '0.5rem',
               borderRadius: 4,
               border: `1px solid ${pearsonColors.amethyst}`,
               width: '100%'
             }}
           />
           
           {currentSlideData.images && currentSlideData.images.length > 0 && (
             <div style={{ marginTop: '1rem' }}>
               <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: pearsonColors.purple }}>
                 Current Images:
               </div>
               <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                 {currentSlideData.images.map((img, index) => (
                   <div key={index} style={{ position: 'relative' }}>
                     <img
                       src={img.url}
                       alt={img.name}
                       title={img.name}
                       style={{ 
                         width: 100, 
                         height: 80, 
                         objectFit: 'cover', 
                         borderRadius: 4,
                         border: `2px solid ${pearsonColors.amethyst}`,
                         cursor: 'pointer'
                       }}
                       onClick={() => {
                         // Create a larger preview
                         const preview = window.open('', '_blank');
                         preview.document.write(`
                           <html>
                             <head><title>${img.name}</title></head>
                             <body style="margin:0;padding:20px;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                               <img src="${img.url}" alt="${img.name}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
                             </body>
                           </html>
                         `);
                       }}
                     />
                     <button
                       onClick={() => removeImage(index)}
                       title="Remove image"
                       style={{
                         position: 'absolute',
                         top: -8,
                         right: -8,
                         background: '#ff4757',
                         color: 'white',
                         border: 'none',
                         borderRadius: '50%',
                         width: 24,
                         height: 24,
                         fontSize: '0.8rem',
                         cursor: 'pointer',
                         fontWeight: 'bold',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                       }}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
               <div style={{ fontSize: '0.8rem', color: pearsonColors.amethyst, marginTop: '0.5rem' }}>
                 💡 Click on any image to view full size
               </div>
             </div>
           )}
         </div>

        {/* Audio upload */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>
              Add Audio (optional):
            </label>
            {currentSlideData.audioUrl && (
              <button
                onClick={removeSlideAudio}
                style={{
                  ...buttonStyle,
                  background: '#ff4757',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.8rem'
                }}
              >
                🗑️ Remove Audio
              </button>
            )}
          </div>
          
          {currentSlideData.transcriptSection && (
            <div style={{ fontSize: '0.8rem', color: pearsonColors.amethyst, marginBottom: '0.5rem', padding: '0.5rem', background: '#f0f8ff', borderRadius: 4 }}>
              🎯 This slide has auto-assigned audio from bulk setup. Upload individual audio below to override.
            </div>
          )}
          
          <div style={{ fontSize: '0.8rem', color: pearsonColors.purple, marginBottom: '0.5rem', fontStyle: 'italic' }}>
            💡 Upload individual audio file for this specific slide:
          </div>
          
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            style={{
              padding: '0.5rem',
              borderRadius: 4,
              border: `1px solid ${pearsonColors.amethyst}`,
              width: '100%'
            }}
          />
          
          {currentSlideData.audioUrl && (
            <div style={{ marginTop: '0.5rem' }}>
              <audio controls style={{ width: '100%', maxWidth: 400 }}>
                <source src={currentSlideData.audioUrl} type={currentSlideData.audioFile?.type} />
              </audio>
              {currentSlideData.transcriptSection && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: pearsonColors.purple, fontStyle: 'italic' }}>
                  📝 Transcript: {currentSlideData.transcriptSection.substring(0, 100)}...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hyperlink modal */}
      {showLinkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: 12,
            maxWidth: 500,
            width: '90%'
          }}>
            <h4 style={{ marginBottom: '1rem', color: pearsonColors.purple }}>Add Hyperlink</h4>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem', lineHeight: 1.4 }}>
              Add a clickable link that will appear in the "Related Links" section of this slide.
              {selectedText && <span style={{ color: pearsonColors.amethyst }}> The selected text "{selectedText}" will also be made clickable in the slide content.</span>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Link Text:
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 4,
                  border: `1px solid ${pearsonColors.amethyst}`
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                URL:
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 4,
                  border: `1px solid ${pearsonColors.amethyst}`
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLinkModal(false)}
                style={{
                  ...buttonStyle,
                  background: pearsonColors.lightPurple,
                  color: pearsonColors.purple
                }}
              >
                Cancel
              </button>
              <button
                onClick={addHyperlink}
                style={buttonStyle}
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          type="button" 
          style={{ ...buttonStyle }} 
          onClick={handleDownloadZip}
          disabled={isBuilding || slides.length === 0}
          aria-label="Download custom presentation as zip"
        >
          {isBuilding ? 'Building Presentation...' : 'Download Interactive Presentation'}
        </button>
        <button 
          type="button" 
          style={{ ...buttonStyle, background: pearsonColors.amethyst }} 
          onClick={handleDownloadWebsite}
          disabled={isBuilding || slides.length === 0}
          aria-label="Download as website ready for hosting"
        >
          {isBuilding ? 'Building Website...' : 'Download as Website'}
        </button>
      </div>

             {/* Preview */}
       {slides.length > 0 && (
         <div style={{ marginTop: '2rem' }}>
           <h4 style={{ marginBottom: '1rem' }}>Presentation Preview: {slides.length} slide(s)</h4>
           <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: pearsonColors.amethyst }}>
             📊 Total Content: {slides.reduce((acc, slide) => acc + slide.images.length, 0)} images, {slides.filter(slide => slide.audioUrl).length} audio files, {slides.reduce((acc, slide) => acc + slide.hyperlinks.length, 0)} hyperlinks
           </div>
           <div style={{ background: pearsonColors.lightPurple, borderRadius: 8, padding: 16, maxHeight: 400, overflowY: 'auto' }}>
             {slides.map((slide, index) => (
               <div key={index} style={{ 
                 marginBottom: 16, 
                 padding: 12, 
                 background: 'white', 
                 borderRadius: 8,
                 border: currentSlide === index ? `3px solid ${pearsonColors.purple}` : '1px solid #ddd',
                 cursor: 'pointer',
                 transition: 'all 0.2s ease'
               }}
               onClick={() => setCurrentSlide(index)}
               title={`Click to edit Slide ${slide.id}`}
               >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <strong style={{ color: currentSlide === index ? pearsonColors.purple : '#333' }}>
                     Slide {slide.id}: {slide.title || `Untitled Slide`}
                     {currentSlide === index && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>✏️ Editing</span>}
                   </strong>
                   {slide.images.length > 0 && (
                     <img 
                       src={slide.images[0].url} 
                       alt="Slide thumbnail"
                       style={{ 
                         width: 40, 
                         height: 30, 
                         objectFit: 'cover', 
                         borderRadius: 4,
                         border: `1px solid ${pearsonColors.amethyst}`
                       }}
                     />
                   )}
                 </div>
                 <div style={{ marginTop: 8, fontSize: '0.9rem' }}>
                   {slide.content && <p style={{ margin: '4px 0', color: '#666' }}>{slide.content.substring(0, 100)}{slide.content.length > 100 ? '...' : ''}</p>}
                   <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                     {slide.images.length > 0 && (
                       <div style={{ color: pearsonColors.amethyst, fontSize: '0.8rem' }}>
                         📷 {slide.images.length} image{slide.images.length !== 1 ? 's' : ''}
                       </div>
                     )}
                     {slide.audioUrl && (
                       <div style={{ color: pearsonColors.amethyst, fontSize: '0.8rem' }}>
                         🔊 Audio
                       </div>
                     )}
                     {slide.hyperlinks.length > 0 && (
                       <div style={{ color: pearsonColors.amethyst, fontSize: '0.8rem' }}>
                         🔗 {slide.hyperlinks.length} link{slide.hyperlinks.length !== 1 ? 's' : ''}
                       </div>
                                 )}
          </div>
        </div>

        {/* Hyperlinks management */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>
              Hyperlinks:
            </label>
            <button
              onClick={() => setShowLinkModal(true)}
              style={{
                ...buttonStyle,
                background: pearsonColors.amethyst,
                fontSize: '0.8rem',
                padding: '0.4rem 0.8rem'
              }}
            >
              ➕ Add Link
            </button>
          </div>
          
          <div style={{ fontSize: '0.8rem', color: pearsonColors.amethyst, marginBottom: '0.5rem' }}>
            💡 Add clickable links to external websites or resources
          </div>
          
          {currentSlideData.hyperlinks && currentSlideData.hyperlinks.length > 0 ? (
            <div style={{ background: pearsonColors.lightPurple, borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: pearsonColors.purple }}>
                Current Links ({currentSlideData.hyperlinks.length}):
              </div>
              {currentSlideData.hyperlinks.map((link, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: 'white',
                  borderRadius: 4,
                  marginBottom: index < currentSlideData.hyperlinks.length - 1 ? '0.5rem' : 0,
                  border: `1px solid ${pearsonColors.amethyst}`
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: pearsonColors.purple }}>{link.text}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', wordBreak: 'break-all' }}>{link.url}</div>
                  </div>
                  <button
                    onClick={() => {
                      const updatedSlides = [...slides];
                      updatedSlides[currentSlide].hyperlinks.splice(index, 1);
                      setSlides(updatedSlides);
                    }}
                    style={{
                      background: '#ff4757',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      marginLeft: '0.5rem'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: 4, color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>
              No hyperlinks added yet. Click "Add Link" to get started.
            </div>
          )}
        </div>
      </div>
             ))}
           </div>
           <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: pearsonColors.amethyst }}>
             💡 Click on any slide in the preview to edit it
                     </div>
        </div>
      )}

      {/* Manual Timestamps Modal */}
      {showManualTimestamps && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: 12,
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#e67e22' }}>⏱️ Manual Timestamp Audio Splitting</h3>
            <p style={{ marginBottom: '1.5rem', color: '#666', lineHeight: 1.5 }}>
              The most reliable method! Specify exactly where to cut the audio. Listen to your audio file and note the times where each slide should start.
            </p>
            
            {/* Audio file upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Master Audio File:
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleMasterAudioUpload}
                style={{
                  padding: '0.75rem',
                  borderRadius: 8,
                  border: `2px solid #e67e22`,
                  width: '100%',
                  fontSize: '1rem'
                }}
              />
              {masterAudioUrl && (
                <div style={{ marginTop: '0.5rem' }}>
                  <audio controls style={{ width: '100%', maxWidth: 400 }}>
                    <source src={masterAudioUrl} type={masterAudioFile?.type} />
                  </audio>
                  <div style={{ fontSize: '0.8rem', color: '#e67e22', marginTop: '0.5rem' }}>
                    🎧 Listen and note the times where each new slide should start
                  </div>
                </div>
              )}
            </div>

            {/* Timestamp input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Timestamps (where each slide starts):
              </label>
              <div style={{ fontSize: '0.8rem', color: '#e67e22', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                📝 <strong>Format:</strong> "1:30, 3:45, 5:20" (minutes:seconds) or "90, 225, 320" (seconds)<br/>
                💡 <strong>Tip:</strong> Don't include 0:00 (automatically added) or the end time
              </div>
              <textarea
                value={manualTimestamps}
                onChange={(e) => setManualTimestamps(e.target.value)}
                placeholder={`Examples:

Using minutes:seconds format:
1:30, 3:45, 5:20

Using seconds only:
90, 225, 320

This will create chunks:
- Slide 1: 0:00 to 1:30
- Slide 2: 1:30 to 3:45  
- Slide 3: 3:45 to 5:20
- Slide 4: 5:20 to end`}
                style={{
                  width: '100%',
                  height: 150,
                  padding: '0.75rem',
                  borderRadius: 8,
                  border: `2px solid #e67e22`,
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowManualTimestamps(false);
                  setManualTimestamps('');
                }}
                style={{
                  ...buttonStyle,
                  background: '#95a5a6',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={processManualTimestamps}
                disabled={!masterAudioFile || !manualTimestamps.trim() || isProcessingAudio}
                style={{
                  ...buttonStyle,
                  background: isProcessingAudio ? '#95a5a6' : '#e67e22',
                  fontSize: '0.9rem',
                  opacity: (!masterAudioFile || !manualTimestamps.trim() || isProcessingAudio) ? 0.6 : 1,
                  cursor: (!masterAudioFile || !manualTimestamps.trim() || isProcessingAudio) ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessingAudio ? '⏳ Processing...' : '⏱️ Split Audio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Chunker Modal */}
      {showAudioChunker && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: 12,
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '1rem', color: pearsonColors.purple }}>🎵 Bulk Audio Setup</h3>
            <p style={{ marginBottom: '1.5rem', color: '#666', lineHeight: 1.5 }}>
              Upload a single audio file and provide a transcript. The tool will automatically split the content 
              across your slides. Use markers like double line breaks, "---", or "[Slide 1]" to indicate slide breaks in your transcript.
            </p>
            
            {/* Audio file upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Master Audio File:
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleMasterAudioUpload}
                style={{
                  padding: '0.75rem',
                  borderRadius: 8,
                  border: `2px solid ${pearsonColors.lightPurple}`,
                  width: '100%',
                  fontSize: '1rem'
                }}
              />
              {masterAudioUrl && (
                <div style={{ marginTop: '0.5rem' }}>
                  <audio controls style={{ width: '100%', maxWidth: 400 }}>
                    <source src={masterAudioUrl} type={masterAudioFile?.type} />
                  </audio>
                </div>
              )}
            </div>

            {/* Transcript input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Transcript:
              </label>
              <div style={{ fontSize: '0.8rem', color: pearsonColors.amethyst, marginBottom: '0.5rem', lineHeight: 1.4 }}>
                💡 <strong>For auto-titles:</strong> Start each section with TITLE: text, [Title], 1. Title, or just a short line<br/>
                📝 <strong>For slide breaks:</strong> Use timestamps like [00:00], [02:15] (best), "---", double line breaks, or "[Slide X]"<br/>
                ⚠️ <strong>Alternative:</strong> Use Manual Timestamps or Individual Audio Mode for guaranteed results
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={`Example transcript with auto-titles:

TITLE: Introduction to Learning
Welcome to our presentation. This is the introduction slide content.
---
1. Key Concepts
Now let's look at the main topic. This content will be on slide 2.
---
TITLE: Advanced Topics
Here are some advanced concepts to consider.
---
TITLE: Conclusion
Here's the conclusion and final thoughts for our presentation.`}
                style={{
                  width: '100%',
                  height: 200,
                  padding: '0.75rem',
                  borderRadius: 8,
                  border: `2px solid ${pearsonColors.lightPurple}`,
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAudioChunker(false);
                  setMasterAudioFile(null);
                  setMasterAudioUrl('');
                  setTranscript('');
                }}
                style={{
                  ...buttonStyle,
                  background: '#95a5a6',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={processAudioChunks}
                disabled={!masterAudioFile || !transcript.trim() || isProcessingAudio}
                style={{
                  ...buttonStyle,
                  background: isProcessingAudio ? '#95a5a6' : pearsonColors.purple,
                  fontSize: '0.9rem',
                  opacity: (!masterAudioFile || !transcript.trim() || isProcessingAudio) ? 0.6 : 1,
                  cursor: (!masterAudioFile || !transcript.trim() || isProcessingAudio) ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessingAudio ? '⏳ Processing...' : '🎯 Apply to Slides'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScormTab() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadType, setUploadType] = useState('zip'); // 'zip' or 'folder'
  const [isProcessing, setIsProcessing] = useState(false);
  const [scormSettings, setScormSettings] = useState({
    title: 'SCORM Learning Content',
    identifier: 'scorm_content_' + Date.now(),
    description: 'Interactive learning content created with HTMLwiz',
    version: '1.2',
    masteryScore: 80,
    enableTracking: true,
    enableProgress: true,
    enableTimeTracking: true
  });

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/zip') {
      setUploadedFile(file);
      setUploadType('zip');
      setUploadedFiles([]);
    }
  }

  function handleFolderUpload(e) {
    const files = Array.from(e.target.files);
    setUploadedFiles(files);
    setUploadType('folder');
    setUploadedFile(null);
  }

  function handleSettingChange(field, value) {
    setScormSettings(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function generateScormPackage() {
    if (!uploadedFile && uploadedFiles.length === 0) {
      alert('Please upload a zip file or select folder contents first');
      return;
    }

    setIsProcessing(true);
    const zip = new JSZip();

    try {
      // Add SCORM API and tracking files
      const scormApiJs = `
// SCORM API Interface
var API = null;
var apiHandle = null;
var findAPITries = 0;
var scormSessionStartTime = new Date();
var sessionTime = 0;

function findAPI(win) {
    while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
        findAPITries++;
        if (findAPITries > 500) {
            return null;
        }
        win = win.parent;
    }
    return win.API;
}

function getAPI() {
    if ((API == null) && (apiHandle == null)) {
        apiHandle = findAPI(window);
        if ((apiHandle == null) && (window.opener != null)) {
            apiHandle = findAPI(window.opener);
        }
        if (apiHandle != null) {
            API = apiHandle;
        }
    }
    return API;
}

function initializeSCORM() {
    var api = getAPI();
    if (api != null) {
        var result = api.LMSInitialize("");
        if (result == "true") {
            ${scormSettings.enableProgress ? `
            var completionStatus = api.LMSGetValue("cmi.core.lesson_status");
            if (completionStatus == "not attempted") {
                api.LMSSetValue("cmi.core.lesson_status", "incomplete");
            }
            ` : ''}
            
                         ${scormSettings.enableTimeTracking ? `
             scormSessionStartTime = new Date();
             ` : ''}
            
            return true;
        }
    }
    return false;
}

function setSCORMData(name, value) {
    var api = getAPI();
    if (api != null) {
        return api.LMSSetValue(name, value);
    }
    return false;
}

function getSCORMData(name) {
    var api = getAPI();
    if (api != null) {
        return api.LMSGetValue(name);
    }
    return "";
}

function completeSCORM() {
    var api = getAPI();
    if (api != null) {
                 ${scormSettings.enableTimeTracking ? `
         var endTime = new Date();
         sessionTime = Math.round((endTime - scormSessionStartTime) / 1000);
         var timeString = convertToSCORMTime(sessionTime);
         api.LMSSetValue("cmi.core.session_time", timeString);
         ` : ''}
        
        ${scormSettings.enableProgress ? `
        api.LMSSetValue("cmi.core.lesson_status", "completed");
        ` : ''}
        
        api.LMSCommit("");
        api.LMSFinish("");
        return true;
    }
    return false;
}

function saveProgress(progressData) {
    ${scormSettings.enableProgress ? `
    var api = getAPI();
    if (api != null) {
        api.LMSSetValue("cmi.suspend_data", JSON.stringify(progressData));
        api.LMSCommit("");
    }
    ` : ''}
}

function loadProgress() {
    ${scormSettings.enableProgress ? `
    var api = getAPI();
    if (api != null) {
        var data = api.LMSGetValue("cmi.suspend_data");
        if (data && data !== "") {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.warn("Could not parse suspend data:", data);
            }
        }
    }
    ` : ''}
    return null;
}

function convertToSCORMTime(totalSeconds) {
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    
    return hours.toString().padStart(2, '0') + ':' + 
           minutes.toString().padStart(2, '0') + ':' + 
           seconds.toString().padStart(2, '0');
}

// Auto-initialize SCORM when page loads
window.addEventListener('load', function() {
    initializeSCORM();
});

// Auto-complete SCORM when page unloads (silent)
window.addEventListener('beforeunload', function() {
    completeSCORM();
});
`;

      // Create SCORM manifest
      const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${scormSettings.identifier}" version="1.0" 
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" 
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd 
                              http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd 
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>${scormSettings.version}</schemaversion>
  </metadata>
  
  <organizations default="default_org">
    <organization identifier="default_org">
      <title>${scormSettings.title}</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>${scormSettings.title}</title>
        <adlcp:masteryscore>${scormSettings.masteryScore}</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm-api.js"/>
    </resource>
  </resources>
  
</manifest>`;

      // Initialize default indexHtml for fallback
      let indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${scormSettings.title}</title>
    <script src="scorm-api.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #E6E6F2; color: #0B004A; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; }
        h1 { color: #0B004A; }
    </style>
    <script>
        var scormStartTime = new Date();
        var scormProgress = 0;
        var scormIsCompleted = false;

        window.addEventListener('load', function() {
            const savedProgress = loadProgress();
            if (savedProgress) {
                scormProgress = savedProgress.progress || 0;
                console.log('Loaded progress:', savedProgress);
            }
        });

        function scormSaveProgress(showAlert = true) {
            const progressData = {
                progress: scormProgress,
                timestamp: new Date().toISOString(),
                completed: scormIsCompleted
            };
            saveProgress(progressData);
            console.log('SCORM Progress saved:', progressData);
            if (showAlert) {
                alert('Progress saved successfully!');
            }
        }

        window.addEventListener('beforeunload', function() {
            scormSaveProgress(false);
        });
    </script>
</head>
<body>
    <div class="container">
        <h1>${scormSettings.title}</h1>
        <p>${scormSettings.description}</p>
        <p>No content uploaded. Please upload HTML content to display here.</p>
    </div>
</body>
</html>`;

      // Handle uploaded content
      if (uploadType === 'zip' && uploadedFile) {
        // Extract ZIP file contents
        const uploadedZip = new JSZip();
        const zipData = await uploadedFile.arrayBuffer();
        const loadedZip = await uploadedZip.loadAsync(zipData);
        
        let mainHtmlContent = null;
        
        // Find the main HTML file and extract all content
        for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
          if (!zipEntry.dir) {
            const fileData = await zipEntry.async('arraybuffer');
            
            // Check if this is a main HTML file
            if ((relativePath.toLowerCase().includes('index.html') || 
                 relativePath.toLowerCase().includes('index.htm') ||
                 relativePath.toLowerCase().endsWith('.html')) && !mainHtmlContent) {
              mainHtmlContent = await zipEntry.async('string');
            }
            
            // Add all files to root level (we'll replace the main HTML later)
            zip.file(relativePath, fileData);
          }
        }
        
        // If we found HTML content, inject SCORM tracking into it
        if (mainHtmlContent) {
          // Inject SCORM API script into the head
          const scormInjection = `<script src="scorm-api.js"></script>
          <script>
            // SCORM tracking variables
            var scormStartTime = new Date();
            var scormProgress = 0;
            var scormIsCompleted = false;

            // Load saved progress on start
            window.addEventListener('load', function() {
                const savedProgress = loadProgress();
                if (savedProgress) {
                    scormProgress = savedProgress.progress || 0;
                    console.log('Loaded progress:', savedProgress);
                }
            });

            function scormSaveProgress(showAlert = true) {
                const progressData = {
                    progress: scormProgress,
                    timestamp: new Date().toISOString(),
                    completed: scormIsCompleted
                };
                saveProgress(progressData);
                console.log('SCORM Progress saved:', progressData);
                if (showAlert) {
                    alert('Progress saved successfully!');
                }
            }

            // Auto-save when user navigates away or closes the page
            window.addEventListener('beforeunload', function() {
                scormSaveProgress(false);
            });

            window.addEventListener('pagehide', function() {
                scormSaveProgress(false);
            });

            window.addEventListener('blur', function() {
                scormSaveProgress(false);
            });
          </script>`;
          
          // Inject the SCORM scripts into the head of the main HTML
          if (mainHtmlContent.includes('</head>')) {
            mainHtmlContent = mainHtmlContent.replace('</head>', scormInjection + '</head>');
          } else if (mainHtmlContent.includes('<head>')) {
            mainHtmlContent = mainHtmlContent.replace('<head>', '<head>' + scormInjection);
          } else {
            // If no head tag, add it
            mainHtmlContent = mainHtmlContent.replace('<html>', '<html><head>' + scormInjection + '</head>');
          }
          
          // Replace the main index.html with our enhanced version
          indexHtml = mainHtmlContent;
        } else {
          // If no HTML file found, create a simple file list
          const fileList = Object.keys(loadedZip.files)
            .filter(path => !loadedZip.files[path].dir)
            .map(path => `<li><a href="${path}" target="_blank">${path}</a></li>`)
            .join('');
            
          const enhancedIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Files</title>
    <script src="scorm-api.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #0B004A; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; }
        a { color: #6C2EB7; text-decoration: none; padding: 10px; display: block; border: 1px solid #E6E6F2; border-radius: 8px; }
        a:hover { background: #E6E6F2; }
    </style>
    <script>
        var scormStartTime = new Date();
        var scormProgress = 50;
        var scormIsCompleted = false;

        window.addEventListener('load', function() {
            const savedProgress = loadProgress();
            if (savedProgress) {
                scormProgress = savedProgress.progress || 50;
                console.log('Loaded progress:', savedProgress);
            }
        });

        function scormSaveProgress(showAlert = true) {
            const progressData = {
                progress: scormProgress,
                timestamp: new Date().toISOString(),
                completed: scormIsCompleted
            };
            saveProgress(progressData);
            console.log('SCORM Progress saved:', progressData);
            if (showAlert) {
                alert('Progress saved successfully!');
            }
        }

        window.addEventListener('beforeunload', function() {
            scormSaveProgress(false);
        });
    </script>
</head>
<body>
    <h1>Content Files</h1>
    <ul>${fileList}</ul>
</body>
</html>`;
          indexHtml = enhancedIndexHtml;
        }
        
      } else if (uploadType === 'folder' && uploadedFiles.length > 0) {
        // Add individual files from folder to root level
        let mainHtmlContent = null;
        
        for (const file of uploadedFiles) {
          const relativePath = file.webkitRelativePath || file.name;
          const fileData = await file.arrayBuffer();
          
          // Check if this is a main HTML file
          if ((relativePath.toLowerCase().includes('index.html') || 
               relativePath.toLowerCase().includes('index.htm') ||
               relativePath.toLowerCase().endsWith('.html')) && !mainHtmlContent) {
            mainHtmlContent = await file.text();
          }
          
                                // Add all files to root level (we'll replace the main HTML later)
           zip.file(relativePath, fileData);
        }
        
        // If we found HTML content, inject SCORM tracking into it
        if (mainHtmlContent) {
          // Inject SCORM API script into the head
          const scormInjection = `<script src="scorm-api.js"></script>
          <script>
            // SCORM tracking variables
            var scormStartTime = new Date();
            var scormProgress = 0;
            var scormIsCompleted = false;

            // Load saved progress on start
            window.addEventListener('load', function() {
                const savedProgress = loadProgress();
                if (savedProgress) {
                    scormProgress = savedProgress.progress || 0;
                    console.log('Loaded progress:', savedProgress);
                }
            });

            function scormSaveProgress(showAlert = true) {
                const progressData = {
                    progress: scormProgress,
                    timestamp: new Date().toISOString(),
                    completed: scormIsCompleted
                };
                saveProgress(progressData);
                console.log('SCORM Progress saved:', progressData);
                if (showAlert) {
                    alert('Progress saved successfully!');
                }
            }

            // Auto-save when user navigates away or closes the page
            window.addEventListener('beforeunload', function() {
                scormSaveProgress(false);
            });

            window.addEventListener('pagehide', function() {
                scormSaveProgress(false);
            });

            window.addEventListener('blur', function() {
                scormSaveProgress(false);
            });
          </script>`;
          
          // Inject the SCORM scripts into the head of the main HTML
          if (mainHtmlContent.includes('</head>')) {
            mainHtmlContent = mainHtmlContent.replace('</head>', scormInjection + '</head>');
          } else if (mainHtmlContent.includes('<head>')) {
            mainHtmlContent = mainHtmlContent.replace('<head>', '<head>' + scormInjection);
          } else {
            // If no head tag, add it
            mainHtmlContent = mainHtmlContent.replace('<html>', '<html><head>' + scormInjection + '</head>');
          }
          
          // Replace the main index.html with our enhanced version
          indexHtml = mainHtmlContent;
        } else {
          // If no HTML file found, create a simple file list
          const fileList = uploadedFiles
            .map(file => {
              const path = file.webkitRelativePath || file.name;
              return `<li><a href="${path}" target="_blank">${path}</a></li>`;
            })
            .join('');
            
          const enhancedIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Files</title>
    <script src="scorm-api.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #0B004A; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; }
        a { color: #6C2EB7; text-decoration: none; padding: 10px; display: block; border: 1px solid #E6E6F2; border-radius: 8px; }
        a:hover { background: #E6E6F2; }
    </style>
    <script>
        var scormStartTime = new Date();
        var scormProgress = 50;
        var scormIsCompleted = false;

        window.addEventListener('load', function() {
            const savedProgress = loadProgress();
            if (savedProgress) {
                scormProgress = savedProgress.progress || 50;
                console.log('Loaded progress:', savedProgress);
            }
        });

        function scormSaveProgress(showAlert = true) {
            const progressData = {
                progress: scormProgress,
                timestamp: new Date().toISOString(),
                completed: scormIsCompleted
            };
            saveProgress(progressData);
            console.log('SCORM Progress saved:', progressData);
            if (showAlert) {
                alert('Progress saved successfully!');
            }
        }

        window.addEventListener('beforeunload', function() {
            scormSaveProgress(false);
        });
    </script>
</head>
<body>
    <h1>Content Files</h1>
    <ul>${fileList}</ul>
</body>
</html>`;
          indexHtml = enhancedIndexHtml;
        }
      }

      // Add files to ZIP (after content processing)
      zip.file('imsmanifest.xml', manifest);
      zip.file('scorm-api.js', scormApiJs);
      zip.file('index.html', indexHtml);

      // Generate and download SCORM package
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scormSettings.identifier}_scorm_package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating SCORM package:', error);
      alert('Error generating SCORM package. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  const buttonStyle = {
    background: pearsonColors.amethyst,
    color: pearsonColors.white,
    border: 'none',
    borderRadius: '24px',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    margin: '0.5rem',
    transition: 'background 0.2s'
  };

  return (
    <div>
      <h2 style={{ color: pearsonColors.purple, marginBottom: '1.5rem' }}>🎓 SCORM Builder</h2>
      <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.5 }}>
        Upload your content and convert it to a SCORM-compliant package for use with Adobe Learning Manager and other LMS platforms. 
        Includes progress tracking, time tracking, and completion status features.
      </p>

      {/* Upload Section */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: pearsonColors.lightPurple, borderRadius: '12px' }}>
        <h3 style={{ color: pearsonColors.purple, marginBottom: '1rem' }}>📁 Upload Content</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Choose upload type:
          </label>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                value="zip"
                checked={uploadType === 'zip'}
                onChange={(e) => setUploadType(e.target.value)}
                style={{ marginRight: '0.5rem' }}
              />
              ZIP File
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                value="folder"
                checked={uploadType === 'folder'}
                onChange={(e) => setUploadType(e.target.value)}
                style={{ marginRight: '0.5rem' }}
              />
              Folder Contents
            </label>
          </div>
        </div>

        {uploadType === 'zip' ? (
          <div>
            <UploadLabel htmlFor="scorm-zip-upload">
              {uploadedFile ? '✅ Change ZIP File' : '📁 Upload ZIP File'}
            </UploadLabel>
            <HiddenInput
              id="scorm-zip-upload"
              type="file"
              accept=".zip"
              onChange={handleFileUpload}
            />
            {uploadedFile && (
              <p style={{ margin: '0.5rem 0', color: pearsonColors.purple }}>
                Selected: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)}KB)
              </p>
            )}
          </div>
        ) : (
          <div>
            <UploadLabel htmlFor="scorm-folder-upload">
              {uploadedFiles.length > 0 ? `✅ Change Folder (${uploadedFiles.length} files)` : '📂 Select Folder Contents'}
            </UploadLabel>
            <HiddenInput
              id="scorm-folder-upload"
              type="file"
              webkitdirectory=""
              multiple
              onChange={handleFolderUpload}
            />
            {uploadedFiles.length > 0 && (
              <div style={{ margin: '0.5rem 0' }}>
                <p style={{ color: pearsonColors.purple, marginBottom: '0.5rem' }}>
                  Selected {uploadedFiles.length} files:
                </p>
                <div style={{ maxHeight: '100px', overflow: 'auto', fontSize: '0.9rem', color: '#666' }}>
                  {uploadedFiles.slice(0, 10).map((file, idx) => (
                    <div key={idx}>{file.webkitRelativePath || file.name}</div>
                  ))}
                  {uploadedFiles.length > 10 && <div>... and {uploadedFiles.length - 10} more files</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SCORM Settings */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: pearsonColors.lightPurple, borderRadius: '12px' }}>
        <h3 style={{ color: pearsonColors.purple, marginBottom: '1rem' }}>⚙️ SCORM Settings</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Content Title:
            </label>
            <input
              type="text"
              value={scormSettings.title}
              onChange={(e) => handleSettingChange('title', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `2px solid ${pearsonColors.lightPurple}`,
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Mastery Score (%):
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={scormSettings.masteryScore}
              onChange={(e) => handleSettingChange('masteryScore', parseInt(e.target.value) || 80)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `2px solid ${pearsonColors.lightPurple}`,
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Description:
          </label>
          <textarea
            value={scormSettings.description}
            onChange={(e) => handleSettingChange('description', e.target.value)}
            style={{
              width: '100%',
              height: '80px',
              padding: '0.75rem',
              borderRadius: '8px',
              border: `2px solid ${pearsonColors.lightPurple}`,
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={scormSettings.enableTracking}
              onChange={(e) => handleSettingChange('enableTracking', e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Enable SCORM Tracking
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={scormSettings.enableProgress}
              onChange={(e) => handleSettingChange('enableProgress', e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Enable Progress Saving
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={scormSettings.enableTimeTracking}
              onChange={(e) => handleSettingChange('enableTimeTracking', e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Enable Time Tracking
          </label>
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={generateScormPackage}
          disabled={isProcessing || (!uploadedFile && uploadedFiles.length === 0)}
          style={{
            ...buttonStyle,
            background: isProcessing ? '#95a5a6' : pearsonColors.purple,
            fontSize: '1.1rem',
            padding: '1rem 2rem',
            opacity: (isProcessing || (!uploadedFile && uploadedFiles.length === 0)) ? 0.6 : 1,
            cursor: (isProcessing || (!uploadedFile && uploadedFiles.length === 0)) ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? '⏳ Generating SCORM Package...' : '🎓 Generate SCORM Package'}
        </button>
      </div>

      {/* Information Section */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', fontSize: '0.9rem', color: '#666' }}>
        <h4 style={{ color: pearsonColors.purple, marginBottom: '1rem' }}>📋 About SCORM Packages</h4>
        <ul style={{ lineHeight: 1.6, paddingLeft: '1.5rem' }}>
          <li><strong>Progress Tracking:</strong> Saves user progress automatically when they exit or navigate away</li>
          <li><strong>Time Tracking:</strong> Records total time spent in the content for learning analytics</li>
          <li><strong>Completion Status:</strong> Tracks whether content has been completed by the learner</li>
          <li><strong>LMS Compatibility:</strong> Works with Adobe Learning Manager, Moodle, Blackboard, and other SCORM-compliant systems</li>
          <li><strong>Resume Capability:</strong> Learners can close content and resume where they left off</li>
        </ul>
      </div>
    </div>
  );
}

function ProjectBuilderTab() {
  const [projectBlocks, setProjectBlocks] = useState([]);
  const [projectTitle, setProjectTitle] = useState('My Learning Project');
  const [projectDescription, setProjectDescription] = useState('Interactive learning experience with multiple content types');
  const [isBuilding, setIsBuilding] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);
  const [newBlockType, setNewBlockType] = useState('slide');
  const [editingBlock, setEditingBlock] = useState(null);

  // Content types for blocks
  const blockTypes = {
    slide: { name: 'Slide', icon: '📄', color: '#6C2EB7' },
    video: { name: 'Video/Storylane', icon: '🎥', color: '#e74c3c' },
    scenario: { name: 'Scenario', icon: '🎯', color: '#f39c12' },
    html: { name: 'HTML Demo', icon: '💻', color: '#27ae60' }
  };

  function addContentBlock() {
    const newBlock = {
      id: Date.now(),
      type: newBlockType,
      title: `${blockTypes[newBlockType].name} ${projectBlocks.length + 1}`,
      content: getDefaultContent(newBlockType),
      settings: {}
    };
    setProjectBlocks([...projectBlocks, newBlock]);
    setShowAddContent(false);
  }

  function getDefaultContent(type) {
    switch (type) {
      case 'slide':
        return {
          title: 'New Slide',
          content: 'Add your slide content here...',
          background: '#ffffff',
          images: [],
          audioFile: null
        };
      case 'video':
        return {
          embedCode: '',
          url: '',
          file: null,
          type: 'youtube'
        };
      case 'scenario':
        return {
          scenario: '',
          choices: []
        };
      case 'html':
        return {
          htmlCode: '<div style="padding: 40px; text-align: center;"><h2>HTML Content Block</h2><p>Add your HTML content here</p></div>'
        };
      default:
        return {};
    }
  }

  function updateBlock(blockId, updates) {
    setProjectBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    );
  }

  function deleteBlock(blockId) {
    setProjectBlocks(blocks => blocks.filter(block => block.id !== blockId));
  }

  function moveBlock(fromIndex, toIndex) {
    const blocks = [...projectBlocks];
    const [movedBlock] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, movedBlock);
    setProjectBlocks(blocks);
  }

  function generateProjectHTML() {
    let blocksHTML = '';
    
    projectBlocks.forEach((block, index) => {
      const blockId = `block-${block.id}`;
      let blockContent = '';

      switch (block.type) {
        case 'slide':
          blockContent = `
            <div class="slide-content" style="background: ${block.content.background}; padding: 40px; min-height: 500px;">
              <h2 style="color: #0B004A; margin-bottom: 20px;">${block.content.title}</h2>
              <div style="font-size: 1.1rem; line-height: 1.6;">${block.content.content.replace(/\n/g, '<br>')}</div>
              ${block.content.images.map((img, i) => `<img src="${img.url}" alt="Image ${i+1}" style="max-width: 100%; margin: 20px 0; border-radius: 8px;">`).join('')}
              ${block.content.audioFile ? `<audio controls style="width: 100%; margin: 20px 0;"><source src="${block.content.audioUrl}" type="${block.content.audioFile.type}"></audio>` : ''}
            </div>`;
          break;
          
        case 'video':
          if (block.content.file) {
            blockContent = `<video controls style="width: 100%; max-height: 600px;"><source src="${URL.createObjectURL(block.content.file)}" type="${block.content.file.type}"></video>`;
          } else if (block.content.embedCode) {
            blockContent = block.content.embedCode;
          } else if (block.content.url) {
            let embedUrl = block.content.url;
                         if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
               const match = embedUrl.match(/(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
               if (match) embedUrl = 'https://www.youtube.com/embed/' + match[1];
             }
            blockContent = `<iframe src="${embedUrl}" style="width: 100%; height: 600px; border: none; border-radius: 8px;"></iframe>`;
          }
          break;
          
        case 'scenario':
          blockContent = `
            <div class="scenario-content" style="padding: 40px;">
              <h3 style="color: #0B004A; margin-bottom: 20px;">Scenario</h3>
              <div style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px;">${block.content.scenario.replace(/\n/g, '<br>')}</div>
              <div class="choices">
                ${block.content.choices.map((choice, i) => `
                  <button onclick="selectChoice(${index}, ${i})" style="display: block; width: 100%; margin: 10px 0; padding: 15px; background: #E6E6F2; border: none; border-radius: 8px; text-align: left; cursor: pointer; font-size: 1rem;" onmouseover="this.style.background='#6C2EB7'; this.style.color='white'" onmouseout="this.style.background='#E6E6F2'; this.style.color='black'">
                    ${choice}
                  </button>
                `).join('')}
              </div>
            </div>`;
          break;
          
        case 'html':
          blockContent = block.content.htmlCode;
          break;
      }

      blocksHTML += `
        <div class="content-block" id="${blockId}" style="display: none; min-height: 100vh; position: relative;">
          <div class="block-header" style="background: ${blockTypes[block.type].color}; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; font-size: 1.3rem;">${blockTypes[block.type].icon} ${block.title}</h2>
            <div class="block-nav">
              <span style="font-size: 0.9rem; opacity: 0.9;">Block ${index + 1} of ${projectBlocks.length}</span>
            </div>
          </div>
          <div class="block-body" style="padding: 0;">
            ${blockContent}
          </div>
          <div class="block-footer" style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            ${index > 0 ? `<button onclick="showBlock(${index - 1})" style="background: #6C2EB7; color: white; border: none; padding: 12px 24px; border-radius: 24px; margin: 0 10px; cursor: pointer; font-weight: 600;">← Previous</button>` : ''}
            ${index < projectBlocks.length - 1 ? `<button onclick="showBlock(${index + 1})" style="background: #6C2EB7; color: white; border: none; padding: 12px 24px; border-radius: 24px; margin: 0 10px; cursor: pointer; font-weight: 600;">Next →</button>` : ''}
            ${index === projectBlocks.length - 1 ? `<button onclick="completeProject()" style="background: #27ae60; color: white; border: none; padding: 12px 24px; border-radius: 24px; margin: 0 10px; cursor: pointer; font-weight: 600;">Complete ✓</button>` : ''}
          </div>
        </div>`;
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectTitle}</title>
    <style>
        body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            margin: 0;
            background: #E6E6F2;
            color: #0B004A;
        }
        .project-container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
        }
        .project-header {
            background: #0B004A;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .content-block.active {
            display: block !important;
        }
        .progress-bar {
            background: #E6E6F2;
            height: 6px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
        }
        .progress-fill {
            background: #6C2EB7;
            height: 100%;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="progress-bar">
        <div class="progress-fill" id="progressBar" style="width: 0%;"></div>
    </div>
    
    <div class="project-container">
        <div class="project-header" id="welcomeScreen">
            <h1 style="margin: 0 0 15px 0; font-size: 2.5rem;">${projectTitle}</h1>
            <p style="margin: 0 0 30px 0; font-size: 1.2rem; opacity: 0.9;">${projectDescription}</p>
            <button onclick="startProject()" style="background: #6C2EB7; color: white; border: none; padding: 15px 30px; border-radius: 24px; font-size: 1.1rem; cursor: pointer; font-weight: 600;">Start Learning Experience</button>
        </div>
        
        ${blocksHTML}
    </div>

    <script>
        let currentBlock = -1;
        let totalBlocks = ${projectBlocks.length};
        
        function startProject() {
            document.getElementById('welcomeScreen').style.display = 'none';
            showBlock(0);
        }
        
        function showBlock(blockIndex) {
            // Hide all blocks
            document.querySelectorAll('.content-block').forEach(block => {
                block.classList.remove('active');
            });
            
            // Show target block
            const targetBlock = document.getElementById(\`block-\${${JSON.stringify(projectBlocks.map(b => b.id))}[blockIndex]}\`);
            if (targetBlock) {
                targetBlock.classList.add('active');
                currentBlock = blockIndex;
                updateProgress();
                
                // Scroll to top
                window.scrollTo(0, 0);
            }
        }
        
        function updateProgress() {
            const progress = totalBlocks > 0 ? ((currentBlock + 1) / totalBlocks) * 100 : 0;
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        }
        
        function selectChoice(blockIndex, choiceIndex) {
            alert('Choice selected: ' + choiceIndex + '. In a full implementation, this would handle branching logic.');
            // Move to next block after choice
            if (blockIndex < totalBlocks - 1) {
                showBlock(blockIndex + 1);
            }
        }
        
        function completeProject() {
            alert('Congratulations! You have completed the learning experience.');
            // Reset to welcome screen
            currentBlock = -1;
            document.querySelectorAll('.content-block').forEach(block => {
                block.classList.remove('active');
            });
            document.getElementById('welcomeScreen').style.display = 'block';
            updateProgress();
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (currentBlock >= 0) {
                if (e.key === 'ArrowLeft' && currentBlock > 0) {
                    showBlock(currentBlock - 1);
                } else if (e.key === 'ArrowRight' && currentBlock < totalBlocks - 1) {
                    showBlock(currentBlock + 1);
                }
            }
        });
    </script>
</body>
</html>`;
  }

  async function handleDownloadProject() {
    if (projectBlocks.length === 0) {
      alert('Please add some content blocks first');
      return;
    }

    setIsBuilding(true);
    try {
      const zip = new JSZip();
      const html = generateProjectHTML();
      
      // Add main HTML file
      zip.file('index.html', html);
      
      // Add any uploaded assets from blocks
      for (const block of projectBlocks) {
        if (block.type === 'slide' && block.content.images) {
          block.content.images.forEach((img, index) => {
            if (img.file) {
              zip.file(`images/block_${block.id}_image_${index}.${img.file.name.split('.').pop()}`, img.file);
            }
          });
        }
        if (block.type === 'slide' && block.content.audioFile) {
          zip.file(`audio/block_${block.id}_audio.${block.content.audioFile.name.split('.').pop()}`, block.content.audioFile);
        }
        if (block.type === 'video' && block.content.file) {
          zip.file(`videos/block_${block.id}_video.${block.content.file.name.split('.').pop()}`, block.content.file);
        }
      }
      
      // Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project. Please try again.');
    } finally {
      setIsBuilding(false);
    }
  }

  async function handleDownloadSCORMProject() {
    if (projectBlocks.length === 0) {
      alert('Please add some content blocks first');
      return;
    }

    setIsBuilding(true);
    try {
      const zip = new JSZip();
      
      // Generate the main project HTML
      const projectHTML = generateProjectHTML();
      
      // Create SCORM-enhanced HTML with tracking
      const scormHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectTitle}</title>
    <script src="scorm-api.js"></script>
    <style>
        body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            margin: 0;
            background: #E6E6F2;
            color: #0B004A;
        }
        .project-container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
        }
        .project-header {
            background: #0B004A;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .content-block.active {
            display: block !important;
        }
        .progress-bar {
            background: #E6E6F2;
            height: 6px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
        }
        .progress-fill {
            background: #6C2EB7;
            height: 100%;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    ${projectHTML.split('</head>')[1].split('<script>')[0]}
    
    <script>
        // SCORM Integration
        let scormAPI;
        let startTime = new Date();
        let currentBlock = -1;
        let totalBlocks = ${projectBlocks.length};
        let maxBlockReached = 0;
        
        // Initialize SCORM
        window.addEventListener('load', function() {
            scormAPI = getAPIHandle();
            if (scormAPI) {
                scormAPI.LMSInitialize('');
                scormAPI.LMSSetValue('cmi.core.lesson_status', 'incomplete');
                scormAPI.LMSSetValue('cmi.core.lesson_location', '0');
                scormAPI.LMSCommit('');
                
                // Auto-save progress periodically - but only on exit/navigation
                window.addEventListener('beforeunload', saveProgress);
                window.addEventListener('pagehide', saveProgress);
                document.addEventListener('visibilitychange', function() {
                    if (document.visibilityState === 'hidden') {
                        saveProgress();
                    }
                });
            }
        });
        
        function saveProgress() {
            if (scormAPI && currentBlock >= 0) {
                const progressPercent = Math.round(((maxBlockReached + 1) / totalBlocks) * 100);
                const timeSpent = Math.floor((new Date() - startTime) / 1000);
                
                scormAPI.LMSSetValue('cmi.core.lesson_location', currentBlock.toString());
                scormAPI.LMSSetValue('cmi.core.score.raw', progressPercent.toString());
                scormAPI.LMSSetValue('cmi.core.session_time', formatTime(timeSpent));
                
                if (maxBlockReached >= totalBlocks - 1) {
                    scormAPI.LMSSetValue('cmi.core.lesson_status', 'completed');
                } else {
                    scormAPI.LMSSetValue('cmi.core.lesson_status', 'incomplete');
                }
                
                scormAPI.LMSCommit('');
            }
        }
        
        function formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return hours.toString().padStart(2, '0') + ':' + 
                   minutes.toString().padStart(2, '0') + ':' + 
                   secs.toString().padStart(2, '0');
        }
        
        function startProject() {
            document.getElementById('welcomeScreen').style.display = 'none';
            showBlock(0);
        }
        
        function showBlock(blockIndex) {
            // Hide all blocks
            document.querySelectorAll('.content-block').forEach(block => {
                block.classList.remove('active');
            });
            
                         // Show target block
             const targetBlock = document.getElementById('block-' + ${JSON.stringify(projectBlocks.map(b => b.id))}[blockIndex]);
            if (targetBlock) {
                targetBlock.classList.add('active');
                currentBlock = blockIndex;
                maxBlockReached = Math.max(maxBlockReached, blockIndex);
                updateProgress();
                
                // Scroll to top
                window.scrollTo(0, 0);
                
                // Save progress automatically when moving between blocks
                saveProgress();
            }
        }
        
        function updateProgress() {
            const progress = totalBlocks > 0 ? ((currentBlock + 1) / totalBlocks) * 100 : 0;
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        }
        
        function selectChoice(blockIndex, choiceIndex) {
            // Move to next block after choice
            if (blockIndex < totalBlocks - 1) {
                showBlock(blockIndex + 1);
            }
        }
        
        function completeProject() {
            maxBlockReached = totalBlocks - 1;
            saveProgress();
            alert('Congratulations! You have completed the learning experience.');
            
            // Reset to welcome screen
            currentBlock = -1;
            document.querySelectorAll('.content-block').forEach(block => {
                block.classList.remove('active');
            });
            document.getElementById('welcomeScreen').style.display = 'block';
            updateProgress();
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (currentBlock >= 0) {
                if (e.key === 'ArrowLeft' && currentBlock > 0) {
                    showBlock(currentBlock - 1);
                } else if (e.key === 'ArrowRight' && currentBlock < totalBlocks - 1) {
                    showBlock(currentBlock + 1);
                }
            }
        });
    </script>
</body>
</html>`;

      // Add the enhanced HTML file
      zip.file('index.html', scormHTML);
      
             // Add SCORM API file
       const scormAPI = `
// SCORM 1.2 API Implementation
function getAPIHandle() {
    var theAPI = null;
    var findAPITries = 0;
    
    while ((theAPI == null) && (findAPITries < 500)) {
        findAPITries++;
        
        if (window.parent && window.parent != window) {
            theAPI = findAPI(window.parent);
        }
        
        if ((theAPI == null) && (window.opener != null)) {
            theAPI = findAPI(window.opener);
        }
        
        if (theAPI == null) {
            theAPI = findAPI(window.top);
        }
    }
    
    return theAPI;
}

function findAPI(win) {
    var findAPITries = 0;
    
    while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
        findAPITries++;
        if (findAPITries > 500) {
            return null;
        }
        win = win.parent;
    }
    return win.API;
}
`;

      zip.file('scorm-api.js', scormAPI);
      
             // Create imsmanifest.xml for SCORM compliance
       const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="PROJECT_${Date.now()}" version="1.0" 
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                             http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                             http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
    
    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
    </metadata>
    
    <organizations default="PROJECT_ORG">
        <organization identifier="PROJECT_ORG">
            <title>${projectTitle}</title>
            <item identifier="PROJECT_ITEM" identifierref="PROJECT_RESOURCE">
                <title>${projectTitle}</title>
                <adlcp:masteryscore>80</adlcp:masteryscore>
            </item>
        </organization>
    </organizations>
    
    <resources>
        <resource identifier="PROJECT_RESOURCE" type="webcontent" 
                 adlcp:scormtype="sco" href="index.html">
            <file href="index.html"/>
            <file href="scorm-api.js"/>
        </resource>
    </resources>
</manifest>`;

      zip.file('imsmanifest.xml', manifest);
      
      // Add any uploaded assets from blocks
      for (const block of projectBlocks) {
        if (block.type === 'slide' && block.content.images) {
          block.content.images.forEach((img, index) => {
            if (img.file) {
              zip.file(`images/block_${block.id}_image_${index}.${img.file.name.split('.').pop()}`, img.file);
            }
          });
        }
        if (block.type === 'slide' && block.content.audioFile) {
          zip.file(`audio/block_${block.id}_audio.${block.content.audioFile.name.split('.').pop()}`, block.content.audioFile);
        }
        if (block.type === 'video' && block.content.file) {
          zip.file(`videos/block_${block.id}_video.${block.content.file.name.split('.').pop()}`, block.content.file);
        }
      }
      
      // Generate and download SCORM package
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scorm_project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating SCORM project:', error);
      alert('Error creating SCORM project. Please try again.');
    } finally {
      setIsBuilding(false);
    }
  }

  const buttonStyle = {
    background: pearsonColors.amethyst,
    color: pearsonColors.white,
    border: 'none',
    borderRadius: '24px',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    margin: '0.5rem',
    transition: 'background 0.2s'
  };

  return (
    <div>
      <h2 style={{ color: pearsonColors.purple, marginBottom: '1.5rem' }}>🎨 Project Builder</h2>
      <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.5 }}>
        Combine different types of content (slides, videos, scenarios, HTML demos) into a single unified learning experience.
      </p>

      {/* Project Settings */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: pearsonColors.lightPurple, borderRadius: '12px' }}>
        <h3 style={{ color: pearsonColors.purple, marginBottom: '1rem' }}>📋 Project Settings</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Project Title:
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `2px solid ${pearsonColors.lightPurple}`,
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Description:
          </label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            style={{
              width: '100%',
              height: '80px',
              padding: '0.75rem',
              borderRadius: '8px',
              border: `2px solid ${pearsonColors.lightPurple}`,
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      {/* Content Blocks */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: pearsonColors.purple, margin: 0 }}>📦 Content Blocks ({projectBlocks.length})</h3>
          <button
            onClick={() => setShowAddContent(true)}
            style={{
              ...buttonStyle,
              background: pearsonColors.purple,
              fontSize: '0.9rem'
            }}
          >
            + Add Content Block
          </button>
        </div>

        {/* Content blocks list */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${pearsonColors.lightPurple}` }}>
          {projectBlocks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>No content blocks added yet</p>
              <p>Click "Add Content Block" to start building your project</p>
            </div>
          ) : (
            projectBlocks.map((block, index) => (
              <div key={block.id} style={{ 
                padding: '1rem', 
                borderBottom: index < projectBlocks.length - 1 ? `1px solid ${pearsonColors.lightPurple}` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ 
                    background: blockTypes[block.type].color, 
                    color: 'white', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    marginRight: '1rem',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {blockTypes[block.type].icon} {blockTypes[block.type].name}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: pearsonColors.purple,
                        padding: '4px',
                        width: '200px'
                      }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Block {index + 1} • {block.type}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {index > 0 && (
                    <button
                      onClick={() => moveBlock(index, index - 1)}
                      style={{
                        background: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      ↑
                    </button>
                  )}
                  {index < projectBlocks.length - 1 && (
                    <button
                      onClick={() => moveBlock(index, index + 1)}
                      style={{
                        background: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      ↓
                    </button>
                  )}
                                     <button
                     onClick={() => setEditingBlock(block)}
                     style={{
                       background: pearsonColors.amethyst,
                       color: 'white',
                       border: 'none',
                       padding: '6px 12px',
                       borderRadius: '6px',
                       cursor: 'pointer',
                       fontSize: '0.8rem'
                     }}
                   >
                     Edit
                   </button>
                   <button
                     onClick={() => deleteBlock(block.id)}
                     style={{
                       background: '#e74c3c',
                       color: 'white',
                       border: 'none',
                       padding: '6px 12px',
                       borderRadius: '6px',
                       cursor: 'pointer',
                       fontSize: '0.8rem'
                     }}
                   >
                     Delete
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Content Modal */}
      {showAddContent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: 12,
            maxWidth: 500,
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '1rem', color: pearsonColors.purple }}>Add Content Block</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Content Type:
              </label>
              <select
                value={newBlockType}
                onChange={(e) => setNewBlockType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: `2px solid ${pearsonColors.lightPurple}`,
                  fontSize: '1rem'
                }}
              >
                {Object.entries(blockTypes).map(([key, type]) => (
                  <option key={key} value={key}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddContent(false)}
                style={{
                  ...buttonStyle,
                  background: '#95a5a6'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addContentBlock}
                style={buttonStyle}
              >
                Add Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {editingBlock && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: 12,
            maxWidth: 800,
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '1rem', color: pearsonColors.purple }}>
              Edit {blockTypes[editingBlock.type].icon} {editingBlock.title}
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Block Title:
              </label>
              <input
                type="text"
                value={editingBlock.title}
                onChange={(e) => setEditingBlock({...editingBlock, title: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: `2px solid ${pearsonColors.lightPurple}`,
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Slide Content Editor */}
            {editingBlock.type === 'slide' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Slide Title:
                  </label>
                  <input
                    type="text"
                    value={editingBlock.content.title}
                    onChange={(e) => setEditingBlock({
                      ...editingBlock,
                      content: { ...editingBlock.content, title: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${pearsonColors.lightPurple}`,
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Content:
                  </label>
                  <textarea
                    value={editingBlock.content.content}
                    onChange={(e) => setEditingBlock({
                      ...editingBlock,
                      content: { ...editingBlock.content, content: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      height: '200px',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${pearsonColors.lightPurple}`,
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Background Color:
                  </label>
                  <input
                    type="color"
                    value={editingBlock.content.background}
                    onChange={(e) => setEditingBlock({
                      ...editingBlock,
                      content: { ...editingBlock.content, background: e.target.value }
                    })}
                    style={{
                      width: '100px',
                      height: '40px',
                      borderRadius: '8px',
                      border: `2px solid ${pearsonColors.lightPurple}`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Video Content Editor */}
            {editingBlock.type === 'video' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Video URL or Embed Code:
                  </label>
                  <textarea
                    value={editingBlock.content.url || editingBlock.content.embedCode || ''}
                    onChange={(e) => setEditingBlock({
                      ...editingBlock,
                      content: { 
                        ...editingBlock.content, 
                        url: e.target.value.includes('<') ? '' : e.target.value,
                        embedCode: e.target.value.includes('<') ? e.target.value : ''
                      }
                    })}
                    placeholder="Enter YouTube URL or paste embed code..."
                    style={{
                      width: '100%',
                      height: '100px',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${pearsonColors.lightPurple}`,
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Scenario Content Editor */}
            {editingBlock.type === 'scenario' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Scenario Description:
                  </label>
                  <textarea
                    value={editingBlock.content.scenario}
                    onChange={(e) => setEditingBlock({
                      ...editingBlock,
                      content: { ...editingBlock.content, scenario: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      height: '150px',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${pearsonColors.lightPurple}`,
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: '600' }}>Choices:</label>
                    <button
                      onClick={() => {
                        const newChoices = [...editingBlock.content.choices, `Choice ${editingBlock.content.choices.length + 1}`];
                        setEditingBlock({
                          ...editingBlock,
                          content: { ...editingBlock.content, choices: newChoices }
                        });
                      }}
                      style={{
                        background: pearsonColors.amethyst,
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      + Add Choice
                    </button>
                  </div>
                  
                  {editingBlock.content.choices.map((choice, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={choice}
                        onChange={(e) => {
                          const newChoices = [...editingBlock.content.choices];
                          newChoices[index] = e.target.value;
                          setEditingBlock({
                            ...editingBlock,
                            content: { ...editingBlock.content, choices: newChoices }
                          });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: `1px solid ${pearsonColors.lightPurple}`,
                          fontSize: '0.9rem'
                        }}
                      />
                      <button
                        onClick={() => {
                          const newChoices = editingBlock.content.choices.filter((_, i) => i !== index);
                          setEditingBlock({
                            ...editingBlock,
                            content: { ...editingBlock.content, choices: newChoices }
                          });
                        }}
                        style={{
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HTML Content Editor */}
            {editingBlock.type === 'html' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    HTML Code:
                  </label>
                  <textarea
                    value={editingBlock.content.htmlCode}
                    onChange={(e) => setEditingBlock({
                      ...editingBlock,
                      content: { ...editingBlock.content, htmlCode: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      height: '300px',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${pearsonColors.lightPurple}`,
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setEditingBlock(null)}
                style={{
                  ...buttonStyle,
                  background: '#95a5a6'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateBlock(editingBlock.id, editingBlock);
                  setEditingBlock(null);
                }}
                style={buttonStyle}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleDownloadProject}
          disabled={isBuilding || projectBlocks.length === 0}
          style={{
            ...buttonStyle,
            background: isBuilding ? '#95a5a6' : pearsonColors.purple,
            fontSize: '1.1rem',
            padding: '1rem 2rem',
            opacity: (isBuilding || projectBlocks.length === 0) ? 0.6 : 1,
            cursor: (isBuilding || projectBlocks.length === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {isBuilding ? '⏳ Building Project...' : '📦 Download Project'}
        </button>
        
        <button
          onClick={handleDownloadSCORMProject}
          disabled={isBuilding || projectBlocks.length === 0}
          style={{
            ...buttonStyle,
            background: isBuilding ? '#95a5a6' : pearsonColors.amethyst,
            fontSize: '1.1rem',
            padding: '1rem 2rem',
            opacity: (isBuilding || projectBlocks.length === 0) ? 0.6 : 1,
            cursor: (isBuilding || projectBlocks.length === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {isBuilding ? '⏳ Building SCORM...' : '🎯 Download SCORM Project'}
        </button>
      </div>

      {/* Information Section */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', fontSize: '0.9rem', color: '#666' }}>
        <h4 style={{ color: pearsonColors.purple, marginBottom: '1rem' }}>💡 Project Builder Features</h4>
        <ul style={{ lineHeight: 1.6, paddingLeft: '1.5rem' }}>
          <li><strong>Multi-Content Types:</strong> Combine slides, videos, scenarios, and HTML demos</li>
          <li><strong>Sequential Navigation:</strong> Automatic navigation between content blocks</li>
          <li><strong>Progress Tracking:</strong> Visual progress bar showing learner advancement</li>
          <li><strong>Interactive Elements:</strong> Scenario choices and embedded content</li>
          <li><strong>Responsive Design:</strong> Works on desktop and mobile devices</li>
          <li><strong>Keyboard Navigation:</strong> Arrow keys for easy navigation</li>
        </ul>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(0);
  
  // AI Configuration state
  const [aiConfig, setAiConfig] = useState(() => {
    const saved = localStorage.getItem('aiConfig');
    return saved ? JSON.parse(saved) : { provider: 'openai', apiKey: '', customUrl: '' };
  });
  const [showAIConfig, setShowAIConfig] = useState(false);
  
  // Initialize AI service when config changes
  useEffect(() => {
    if (aiConfig.apiKey || aiConfig.provider === 'ollama') {
      try {
        initializeAI(aiConfig.apiKey, aiConfig.provider);
      } catch (error) {
        console.error('Failed to initialize AI service:', error);
      }
    }
  }, [aiConfig]);

  // Make AI config available globally
  useEffect(() => {
    window.showAIConfig = () => setShowAIConfig(true);
    window.aiConfig = aiConfig;
    return () => {
      delete window.showAIConfig;
      delete window.aiConfig;
    };
  }, [aiConfig]);

  const handleAISave = (newConfig) => {
    setAiConfig(newConfig);
    localStorage.setItem('aiConfig', JSON.stringify(newConfig));
  };

  return (
    <>
      <GlobalStyle />
      <Header>
        <Logo src={logo} alt="Pearson Logo" />
        <Title>Omnicron</Title>
      </Header>
      <Wave src={wave} alt="Pearson Graphic Wave" />
      <Tabs role="tablist" aria-label="Main Tabs">
        {tabNames.map((name, idx) => (
          <Tab
            key={name}
            $active={activeTab === idx}
            onClick={() => setActiveTab(idx)}
            aria-selected={activeTab === idx}
            aria-controls={`tabpanel-${idx}`}
            id={`tab-${idx}`}
            role="tab"
            tabIndex={activeTab === idx ? 0 : -1}
          >
            {name}
          </Tab>
        ))}
      </Tabs>
      <TabPanel role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 0 && <VideoTab />}
        {activeTab === 1 && <ScenarioTab />}
        {activeTab === 2 && <HtmlTab />}
        {activeTab === 3 && <SlideBuilderTab />}
        {activeTab === 4 && <ScormTab />}
        {activeTab === 5 && <ProjectBuilderTab />}
      </TabPanel>
      
      <AIConfigModal
        isOpen={showAIConfig}
        onClose={() => setShowAIConfig(false)}
        onSave={handleAISave}
        currentConfig={aiConfig}
      />
    </>
  );
}

export default App;
