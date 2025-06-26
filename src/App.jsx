import { useState, useEffect } from 'react'
import logo from '../logos/logo.webp'
import wave from '../logos/homepage-banner-image.webp'
import '../logos/pearson-favicon.svg'
import '@fontsource/plus-jakarta-sans'
import styled, { createGlobalStyle } from 'styled-components'
import JSZip from 'jszip'
import PizZip from 'pizzip'

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
  'PowerPoint',
  'Slide Builder',
];

function VideoTab() {
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [previewType, setPreviewType] = useState(''); // 'iframe' or 'video'

  function handleInputChange(e) {
    setInput(e.target.value);
    setFile(null);
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f);
    setInput('');
  }

  function handlePreview() {
    if (file) {
      setPreviewType('video');
      setEmbedUrl(URL.createObjectURL(file));
    } else if (input) {
      // YouTube, Storylane, or other embed
      let url = input.trim();
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Convert to embed URL
        const match = url.match(/(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
        if (match) {
          url = `https://www.youtube.com/embed/${match[1]}`;
        }
      } else if (url.includes('storylane.io')) {
        // Storylane embed
        url = url.replace('/p/', '/embed/');
      }
      setPreviewType('iframe');
      setEmbedUrl(url);
    }
  }

  async function handleDownloadZip() {
    const zip = new JSZip();
    let html = '';
    if (previewType === 'iframe') {
      html = `<html><body style="margin:0;padding:0;"><iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe></body></html>`;
      zip.file('index.html', html);
    } else if (previewType === 'video' && file) {
      html = `<html><body style="margin:0;padding:0;"><video src="video/${file.name}" controls style="width:100%;height:auto;"></video></body></html>`;
      zip.file('index.html', html);
      zip.folder('video').file(file.name, file);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'video_content.zip';
    a.click();
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handlePreview(); }} aria-label="Video or Storylane Submission">
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
        {embedUrl && (
          <button type="button" style={{ ...buttonStyle, marginLeft: 16 }} onClick={handleDownloadZip} aria-label="Download as zip">Download as Zip</button>
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

  function handlePreview() {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.scenarios || !Array.isArray(parsed.scenarios)) throw new Error('Invalid schema');
      setScenarios(parsed.scenarios);
      setError('');
    } catch (e) {
      setError('Invalid JSON or schema.');
      setScenarios([]);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setJson(evt.target.result);
      // Optionally auto-preview
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed.scenarios || !Array.isArray(parsed.scenarios)) throw new Error('Invalid schema');
        setScenarios(parsed.scenarios);
        setError('');
      } catch (e) {
        setError('Invalid JSON or schema.');
        setScenarios([]);
      }
    };
    reader.readAsText(file);
  }

  async function handleDownloadZip() {
    const zip = new JSZip();
    let html = `<html><body style=\"font-family:'Plus Jakarta Sans',Arial,sans-serif;\"><h2>Scenarios</h2><ul>`;
    scenarios.forEach(s => {
      html += `<li><strong>Q:</strong> ${s.question}<br/><strong>A:</strong> ${s.answer}</li>`;
    });
    html += '</ul></body></html>';
    zip.file('scenarios.html', html);
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scenarios.zip';
    a.click();
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handlePreview(); }} aria-label="Scenario Submission">
      <label htmlFor="scenario-json" style={{ fontWeight: 600 }}>Paste Scenario JSON:</label>
      <textarea
        id="scenario-json"
        value={json}
        onChange={e => setJson(e.target.value)}
        rows={8}
        style={{ width: '100%', margin: '0.5rem 0 1rem 0', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc', fontFamily: 'monospace' }}
        aria-describedby="scenario-json-desc"
        placeholder='Example: {"scenarios":[{"question":"How do I reset my password?","answer":"Click Forgot password on the login page and follow the instructions."}]}'
      />
      <div id="scenario-json-desc" style={{ fontSize: '0.9rem', color: pearsonColors.amethyst, marginBottom: '1rem' }}>
        Use the schema: {`{"scenarios":[{"question":"...","answer":"..."}]}`}
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
        <button type="button" style={{ ...buttonStyle, marginLeft: 16 }} onClick={handleDownloadZip} aria-label="Download as zip">Download as Zip</button>
      )}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <div style={{ marginTop: 24 }}>
        {scenarios.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {scenarios.map((s, i) => (
              <li key={i} style={{ marginBottom: 16, background: pearsonColors.lightPurple, borderRadius: 8, padding: 12 }}>
                <strong>Q:</strong> {s.question}<br />
                <strong>A:</strong> {s.answer}
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}

function HtmlTab() {
  const [html, setHtml] = useState('');
  const [preview, setPreview] = useState('');

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

  return (
    <form onSubmit={e => { e.preventDefault(); handlePreview(); }} aria-label="HTML Code Submission">
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
        <button type="button" style={{ ...buttonStyle, marginLeft: 16 }} onClick={handleDownloadZip} aria-label="Download as zip">Download as Zip</button>
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

function PowerPointTab() {
  const [file, setFile] = useState(null);
  const [slides, setSlides] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(e) {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    
    // Reset previous state
    setError('');
    setSlides([]);
    
    // Check file extension
    if (!uploadedFile.name.toLowerCase().endsWith('.pptx')) {
      setError('Please upload a .pptx file (PowerPoint 2007 or later). .ppt files are not supported.');
      return;
    }
    
    // Check file size (limit to 50MB)
    if (uploadedFile.size > 50 * 1024 * 1024) {
      setError('File too large. Please upload a PowerPoint file smaller than 50MB.');
      return;
    }
    
    // Check minimum file size (PPTX files are usually at least a few KB)
    if (uploadedFile.size < 1024) {
      setError('File appears to be corrupted or empty.');
      return;
    }
    
    setFile(uploadedFile);
  }

  async function extractPowerPointContent() {
    if (!file) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      // Read file as array buffer with better error handling
      const reader = new FileReader();
      
      const arrayBuffer = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file - file may be corrupted'));
        reader.onabort = () => reject(new Error('File reading was aborted'));
        reader.readAsArrayBuffer(file);
      });
      
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('File is empty or corrupted');
      }
      
      // Check if it's a valid ZIP file by looking for ZIP signature
      const uint8Array = new Uint8Array(arrayBuffer);
      const zipSignature = [0x50, 0x4B]; // "PK" - ZIP file signature
      if (uint8Array[0] !== zipSignature[0] || uint8Array[1] !== zipSignature[1]) {
        throw new Error('File is not a valid PPTX format. Please ensure you\'re uploading a PowerPoint 2007+ (.pptx) file, not an older .ppt file.');
      }
      
      let zip;
      try {
        zip = new PizZip(arrayBuffer);
      } catch (zipError) {
        if (zipError.message.includes('central directory')) {
          throw new Error('File appears to be corrupted, password-protected, or not a valid PowerPoint file. Please try:\n• A different .pptx file\n• Removing password protection\n• Re-saving the file in PowerPoint');
        } else if (zipError.message.includes('zip')) {
          throw new Error('Invalid PowerPoint file format. Please ensure this is a valid .pptx file.');
        } else {
          throw new Error(`Failed to read PowerPoint file: ${zipError.message}`);
        }
      }
      
      // Check if it's a valid PPTX file structure
      if (!zip.files['[Content_Types].xml']) {
        throw new Error('This doesn\'t appear to be a valid PowerPoint file. Missing required PPTX structure.');
      }
      
      // Check for presentation.xml
      if (!zip.files['ppt/presentation.xml']) {
        throw new Error('Invalid PowerPoint file - missing presentation data.');
      }
      
      // Extract slide content from PPTX structure
      const extractedSlides = [];
      const slideFiles = Object.keys(zip.files)
        .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
        .sort((a, b) => {
          // Sort numerically by slide number
          const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
          const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
          return aNum - bNum;
        });
      
      if (slideFiles.length === 0) {
        throw new Error('No slides found in PowerPoint file. The file may be empty or corrupted.');
      }
      
      // Extract relationship mappings for images
      const slideRelationships = {};
      for (let i = 0; i < slideFiles.length; i++) {
        const slideNum = i + 1;
        const relPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
        if (zip.files[relPath]) {
          try {
            const relXml = zip.file(relPath).asText();
            const relationships = {};
            const relMatches = relXml.match(/<Relationship[^>]*>/g) || [];
            relMatches.forEach(rel => {
              const idMatch = rel.match(/Id="([^"]*)"/);
              const targetMatch = rel.match(/Target="([^"]*)"/) || rel.match(/Target='([^']*)'/);
              if (idMatch && targetMatch) {
                let target = targetMatch[1];
                // Convert relative path to absolute path within the zip
                if (target.startsWith('../media/')) {
                  target = 'ppt/' + target.substring(3);
                } else if (!target.startsWith('ppt/')) {
                  target = 'ppt/slides/' + target;
                }
                relationships[idMatch[1]] = target;
              }
            });
            slideRelationships[slideNum] = relationships;
          } catch (relError) {
            console.warn(`Error processing relationships for slide ${slideNum}:`, relError);
            slideRelationships[slideNum] = {};
          }
        } else {
          slideRelationships[slideNum] = {};
        }
      }

      // Extract images with better mapping
      const imageFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/media/') && /\.(png|jpg|jpeg|gif|svg|bmp|wmf|emf)$/i.test(name)
      );
      
      const images = {};
      const imagesByPath = {};
      for (const imagePath of imageFiles) {
        try {
          const imageData = zip.file(imagePath).asUint8Array();
          const extension = imagePath.split('.').pop().toLowerCase();
          const mimeType = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp',
            'wmf': 'image/wmf',
            'emf': 'image/emf'
          }[extension] || 'image/png';
          
          const blob = new Blob([imageData], { type: mimeType });
          const imageUrl = URL.createObjectURL(blob);
          const imageName = imagePath.split('/').pop();
          
          images[imageName] = imageUrl;
          imagesByPath[imagePath] = imageUrl;
        } catch (imageError) {
          console.warn(`Error processing image ${imagePath}:`, imageError);
        }
      }

      for (let i = 0; i < slideFiles.length; i++) {
        try {
          const slideXml = zip.file(slideFiles[i]).asText();
          const slideContent = parseSlideXML(slideXml, i + 1);
          
          // Map image IDs to actual image URLs for this slide
          const slideImages = [];
          const slideRels = slideRelationships[i + 1] || {};
          
          slideContent.imageIds.forEach(imageId => {
            const imagePath = slideRels[imageId];
            if (imagePath && imagesByPath[imagePath]) {
              slideImages.push({
                id: imageId,
                url: imagesByPath[imagePath],
                path: imagePath,
                name: imagePath.split('/').pop()
              });
            }
          });
          
          slideContent.slideImages = slideImages;
          slideContent.allImages = images;
          extractedSlides.push(slideContent);
        } catch (slideError) {
          console.warn(`Error processing slide ${i + 1}:`, slideError);
          // Continue with other slides but add a placeholder
          extractedSlides.push({
            slideNumber: i + 1,
            title: `Slide ${i + 1} (Content Error)`,
            content: ['Content could not be extracted from this slide.'],
            slideImages: [],
            allImages: images,
            xmlContent: ''
          });
        }
      }
      
      setSlides(extractedSlides);
      
      if (extractedSlides.length === 0) {
        throw new Error('No content could be extracted from the PowerPoint file');
      }
      
    } catch (err) {
      console.error('PowerPoint processing error:', err);
      let errorMessage = err.message;
      
      // Provide more helpful error messages
      if (errorMessage.includes('central directory')) {
        errorMessage = 'File appears to be corrupted, password-protected, or not a valid PowerPoint file. Please try:\n• A different .pptx file\n• Removing password protection\n• Re-saving the file in PowerPoint';
      } else if (errorMessage.includes('zip file')) {
        errorMessage = 'This file is not a valid PowerPoint format. Please ensure you\'re uploading a .pptx file (PowerPoint 2007 or later), not a .ppt file.';
      }
      
      setError(errorMessage);
      setSlides([]);
    } finally {
      setIsProcessing(false);
    }
  }

  function parseSlideXML(xmlContent, slideNumber) {
    // Basic XML parsing to extract text content
    const textMatches = xmlContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
    const textContent = textMatches.map(match => {
      const text = match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '');
      return text.trim();
    }).filter(text => text.length > 0);
    
    // Extract image references from the slide
    const imageRefs = [];
    
    // Look for image relationships in the XML
    const imageMatches = xmlContent.match(/<a:blip[^>]*r:embed="([^"]*)"[^>]*>/g) || [];
    const imageIds = imageMatches.map(match => {
      const embedMatch = match.match(/r:embed="([^"]*)"/);
      return embedMatch ? embedMatch[1] : null;
    }).filter(id => id);
    
    // Also look for direct image references
    const directImageMatches = xmlContent.match(/<pic:pic[^>]*>.*?<\/pic:pic>/gs) || [];
    directImageMatches.forEach(picMatch => {
      const blipMatch = picMatch.match(/<a:blip[^>]*r:embed="([^"]*)"[^>]*>/);
      if (blipMatch && blipMatch[1] && !imageIds.includes(blipMatch[1])) {
        imageIds.push(blipMatch[1]);
      }
    });
    
    // Look for shapes and other visual elements
    const shapeMatches = xmlContent.match(/<p:sp[^>]*>.*?<\/p:sp>/gs) || [];
    const visualElements = [];
    
    shapeMatches.forEach(shape => {
      // Check if shape contains images
      const hasImage = shape.includes('<a:blip') || shape.includes('<pic:pic');
      if (hasImage) {
        visualElements.push('image');
      }
      
      // Check for other visual elements like charts, tables, etc.
      if (shape.includes('<c:chart')) {
        visualElements.push('chart');
      }
      if (shape.includes('<a:tbl')) {
        visualElements.push('table');
      }
    });
    
    // Extract title (usually the first large text block)
    const title = textContent[0] || `Slide ${slideNumber}`;
    const content = textContent.slice(1);
    
    return {
      slideNumber,
      title,
      content,
      imageIds,
      visualElements,
      xmlContent // Keep original for advanced processing
    };
  }

  function generateInteractiveHTML() {
    if (slides.length === 0) return '';
    
    const slideHTML = slides.map((slide, index) => `
      <div class="slide" id="slide-${index}" ${index === 0 ? 'style="display: block;"' : 'style="display: none;"'}>
        <div class="slide-header">
          <h2>${slide.title}</h2>
          <span class="slide-number">${slide.slideNumber} / ${slides.length}</span>
        </div>
        <div class="slide-content">
          ${slide.content.map(text => `<p>${text}</p>`).join('')}
          ${slide.slideImages && slide.slideImages.length > 0 ? `
            <div class="slide-images">
              ${slide.slideImages.map(img => `
                <div class="image-container">
                  <img src="${img.url}" alt="Slide image" class="slide-image" />
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${slide.visualElements && slide.visualElements.length > 0 ? `
            <div class="visual-indicators">
              <p><em>This slide contains: ${slide.visualElements.join(', ')}</em></p>
            </div>
          ` : ''}
        </div>
        <div class="slide-navigation">
          ${index > 0 ? `<button onclick="showSlide(${index - 1})" class="nav-btn prev-btn">← Previous</button>` : ''}
          ${index < slides.length - 1 ? `<button onclick="showSlide(${index + 1})" class="nav-btn next-btn">Next →</button>` : ''}
        </div>
      </div>
    `).join('');
    
    const thumbnailHTML = slides.map((slide, index) => `
      <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="showSlide(${index})">
        <div class="thumb-number">${slide.slideNumber}</div>
        <div class="thumb-title">${slide.title}</div>
      </div>
    `).join('');
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Presentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
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
            max-width: 800px;
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
        
        .slide-content p {
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }
        
        .slide-images {
            margin: 2rem 0;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .image-container {
            text-align: center;
            margin: 1rem 0;
        }
        
        .slide-image {
            max-width: 100%;
            max-height: 400px;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(11,0,74,0.1);
            object-fit: contain;
        }
        
        .visual-indicators {
            margin-top: 1rem;
            padding: 0.75rem;
            background: #E6E6F2;
            border-radius: 8px;
            font-style: italic;
            color: #6C2EB7;
        }
        
        @media (max-width: 768px) {
            .slide-image {
                max-height: 250px;
            }
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
        }
    </style>
</head>
<body>
    <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
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
        
        function showSlide(slideIndex) {
            // Hide current slide
            document.getElementById('slide-' + currentSlide).style.display = 'none';
            document.querySelector('.thumbnail.active').classList.remove('active');
            
            // Show new slide
            currentSlide = slideIndex;
            document.getElementById('slide-' + currentSlide).style.display = 'block';
            document.querySelectorAll('.thumbnail')[currentSlide].classList.add('active');
            
            // Update progress bar
            updateProgress();
        }
        
        function updateProgress() {
            const progress = ((currentSlide + 1) / totalSlides) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' && currentSlide > 0) {
                showSlide(currentSlide - 1);
            } else if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
                showSlide(currentSlide + 1);
            }
        });
        
        // Initialize progress bar
        updateProgress();
    </script>
</body>
</html>`;
  }

  async function handleDownloadZip() {
    if (slides.length === 0) return;
    
    const zip = new JSZip();
    const html = generateInteractiveHTML();
    
    zip.file('index.html', html);
    zip.file('README.txt', `Interactive PowerPoint Presentation
    
Generated from: ${file.name}
Total slides: ${slides.length}

Instructions:
1. Open index.html in a web browser
2. Use the sidebar to navigate between slides
3. Use arrow keys for keyboard navigation
4. Upload to your LMS as a zip file

Created with HTMLwiz - Pearson Education`);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${file.name.replace('.pptx', '')}_interactive.zip`;
    a.click();
  }

  return (
    <div aria-label="PowerPoint to Interactive HTML">
      <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Convert PowerPoint to Interactive HTML:</h3>
      
      <UploadLabel tabIndex={0} htmlFor="pptx-upload">Upload PowerPoint File (.pptx)
        <HiddenInput
          id="pptx-upload"
          type="file"
          accept=".pptx"
          onChange={handleFileChange}
          aria-label="Upload PowerPoint file"
        />
      </UploadLabel>
      
      {file && (
        <div style={{ margin: '1rem 0' }}>
          <p style={{ color: pearsonColors.amethyst, fontSize: '0.9rem' }}>
            Selected: {file.name}
          </p>
        </div>
      )}
      
      {file && (
        <button 
          type="button" 
          style={{ ...buttonStyle, marginRight: 16 }} 
          onClick={extractPowerPointContent}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Extract Content'}
        </button>
      )}
      
      {slides.length > 0 && (
        <button 
          type="button" 
          style={{ ...buttonStyle }} 
          onClick={handleDownloadZip}
          aria-label="Download interactive presentation as zip"
        >
          Download Interactive HTML
        </button>
      )}
      
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      
      {slides.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ marginBottom: '1rem' }}>Extracted Slides Preview:</h4>
          <div style={{ background: pearsonColors.lightPurple, borderRadius: 8, padding: 16, maxHeight: 400, overflowY: 'auto' }}>
            {slides.map((slide, index) => (
              <div key={index} style={{ marginBottom: 16, padding: 12, background: 'white', borderRadius: 8 }}>
                <strong>Slide {slide.slideNumber}: {slide.title}</strong>
                <div style={{ marginTop: 8, fontSize: '0.9rem' }}>
                  {slide.content.slice(0, 3).map((text, i) => (
                    <p key={i} style={{ margin: '4px 0' }}>{text}</p>
                  ))}
                  {slide.content.length > 3 && <p style={{ fontStyle: 'italic' }}>...and {slide.content.length - 3} more items</p>}
                  {slide.slideImages && slide.slideImages.length > 0 && (
                    <div style={{ marginTop: 8, padding: 8, background: pearsonColors.lightPurple, borderRadius: 4 }}>
                      <strong style={{ color: pearsonColors.purple }}>📷 Images found: {slide.slideImages.length}</strong>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {slide.slideImages.map((img, imgIndex) => (
                          <img 
                            key={imgIndex} 
                            src={img.url} 
                            alt={`Slide ${slide.slideNumber} image ${imgIndex + 1}`}
                            style={{ 
                              width: 60, 
                              height: 40, 
                              objectFit: 'cover', 
                              borderRadius: 4,
                              border: `1px solid ${pearsonColors.amethyst}`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {slide.visualElements && slide.visualElements.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: '0.8rem', color: pearsonColors.amethyst, fontStyle: 'italic' }}>
                      Visual elements: {slide.visualElements.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Initialize slides when count changes
  useEffect(() => {
    const newSlides = Array.from({ length: slideCount }, (_, index) => {
      const existingSlide = slides[index];
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
    setSlides(newSlides);
    if (currentSlide >= slideCount) {
      setCurrentSlide(Math.max(0, slideCount - 1));
    }
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
      const reader = new FileReader();
      reader.onload = (event) => {
        updateSlide('audioFile', file);
        updateSlide('audioUrl', event.target.result);
      };
      reader.readAsDataURL(file);
    }
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
      
      // Replace the selected text with hyperlink markup
      const linkMarkup = `<a href="${linkUrl}" target="_blank" class="slide-link">${linkText}</a>`;
      slide.content = slide.content.replace(selectedText, linkMarkup);
      
      // Store hyperlink for reference
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
    const slideHTML = slides.map((slide, index) => `
      <div class="slide" id="slide-${index}" ${index === 0 ? 'style="display: block;"' : 'style="display: none;"'}>
        <div class="slide-header">
          <h2>${slide.title || `Slide ${slide.id}`}</h2>
          <span class="slide-number">${slide.id} / ${slides.length}</span>
        </div>
        <div class="slide-content">
          <div class="slide-text">
            ${slide.content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
          </div>
          ${slide.images.length > 0 ? `
            <div class="slide-images">
              ${slide.images.map(img => `
                <div class="image-container">
                  <img src="${img.url}" alt="${img.name}" class="slide-image" />
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${slide.audioUrl ? `
            <div class="audio-container">
              <audio controls class="slide-audio">
                <source src="${slide.audioUrl}" type="${slide.audioFile.type}">
                Your browser does not support the audio element.
              </audio>
            </div>
          ` : ''}
        </div>
        <div class="slide-navigation">
          ${index > 0 ? `<button onclick="showSlide(${index - 1})" class="nav-btn prev-btn">← Previous</button>` : ''}
          ${index < slides.length - 1 ? `<button onclick="showSlide(${index + 1})" class="nav-btn next-btn">Next →</button>` : ''}
        </div>
      </div>
    `).join('');

    const thumbnailHTML = slides.map((slide, index) => `
      <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="showSlide(${index})">
        <div class="thumb-number">${slide.id}</div>
        <div class="thumb-title">${slide.title || `Slide ${slide.id}`}</div>
        ${slide.images.length > 0 ? '<div class="thumb-indicator">📷</div>' : ''}
        ${slide.audioUrl ? '<div class="thumb-indicator">🔊</div>' : ''}
      </div>
    `).join('');

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
        }
    </style>
</head>
<body>
    <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
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
        
        function showSlide(slideIndex) {
            // Hide current slide
            document.getElementById('slide-' + currentSlide).style.display = 'none';
            document.querySelector('.thumbnail.active').classList.remove('active');
            
            // Show new slide
            currentSlide = slideIndex;
            document.getElementById('slide-' + currentSlide).style.display = 'block';
            document.querySelectorAll('.thumbnail')[currentSlide].classList.add('active');
            
            // Update progress bar
            updateProgress();
        }
        
        function updateProgress() {
            const progress = ((currentSlide + 1) / totalSlides) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' && currentSlide > 0) {
                showSlide(currentSlide - 1);
            } else if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
                showSlide(currentSlide + 1);
            }
        });
        
        // Initialize progress bar
        updateProgress();
    </script>
</body>
</html>`;
  }

  async function handleDownloadZip() {
    if (slides.length === 0) return;
    
    setIsBuilding(true);
    const zip = new JSZip();
    const html = generateCustomHTML();
    
    zip.file('index.html', html);
    zip.file('README.txt', `Custom Interactive Presentation

Total slides: ${slides.length}
Created with: HTMLwiz Slide Builder

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

Created with HTMLwiz - Pearson Education`);
    
    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `custom_presentation_${slides.length}_slides.zip`;
      a.click();
    } finally {
      setIsBuilding(false);
    }
  }

  const currentSlideData = slides[currentSlide] || {};

  return (
    <div aria-label="Custom Slide Builder">
      <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Build Custom Interactive Presentation:</h3>
      
      {/* Number of slides selector */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: pearsonColors.lightPurple, borderRadius: 8 }}>
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
            Add Images:
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            style={{
              padding: '0.5rem',
              borderRadius: 4,
              border: `1px solid ${pearsonColors.amethyst}`,
              width: '100%'
            }}
          />
          
          {currentSlideData.images && currentSlideData.images.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {currentSlideData.images.map((img, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img
                    src={img.url}
                    alt={img.name}
                    style={{ 
                      width: 100, 
                      height: 80, 
                      objectFit: 'cover', 
                      borderRadius: 4,
                      border: `2px solid ${pearsonColors.amethyst}`
                    }}
                  />
                  <button
                    onClick={() => removeImage(index)}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audio upload */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Add Audio (optional):
          </label>
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

      {/* Download button */}
      <button 
        type="button" 
        style={{ ...buttonStyle }} 
        onClick={handleDownloadZip}
        disabled={isBuilding || slides.length === 0}
        aria-label="Download custom presentation as zip"
      >
        {isBuilding ? 'Building Presentation...' : 'Download Interactive Presentation'}
      </button>

      {/* Preview */}
      {slides.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Presentation Preview:</h4>
          <div style={{ background: pearsonColors.lightPurple, borderRadius: 8, padding: 16, maxHeight: 400, overflowY: 'auto' }}>
            {slides.map((slide, index) => (
              <div key={index} style={{ 
                marginBottom: 16, 
                padding: 12, 
                background: 'white', 
                borderRadius: 8,
                border: currentSlide === index ? `2px solid ${pearsonColors.purple}` : '1px solid #ddd'
              }}>
                <strong>Slide {slide.id}: {slide.title || `Untitled Slide`}</strong>
                <div style={{ marginTop: 8, fontSize: '0.9rem' }}>
                  {slide.content && <p style={{ margin: '4px 0' }}>{slide.content.substring(0, 100)}...</p>}
                  {slide.images.length > 0 && (
                    <div style={{ margin: '8px 0', color: pearsonColors.amethyst }}>
                      📷 {slide.images.length} image(s)
                    </div>
                  )}
                  {slide.audioUrl && (
                    <div style={{ margin: '8px 0', color: pearsonColors.amethyst }}>
                      🔊 Audio included
                    </div>
                  )}
                  {slide.hyperlinks.length > 0 && (
                    <div style={{ margin: '8px 0', color: pearsonColors.amethyst }}>
                      🔗 {slide.hyperlinks.length} hyperlink(s)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <GlobalStyle />
      <Header>
        <Logo src={logo} alt="Pearson Logo" />
        <Title>HTMLwiz</Title>
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
        {activeTab === 3 && <PowerPointTab />}
        {activeTab === 4 && <SlideBuilderTab />}
      </TabPanel>
    </>
  );
}

export default App;
