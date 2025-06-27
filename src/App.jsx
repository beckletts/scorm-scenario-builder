import { useState, useEffect } from 'react'
import logo from '../logos/logo.webp'
import wave from '../logos/homepage-banner-image.webp'
import '../logos/pearson-favicon.svg'
import '@fontsource/plus-jakarta-sans'
import styled, { createGlobalStyle } from 'styled-components'
import JSZip from 'jszip'

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
      // Split transcript by double line breaks or slide markers
      const transcriptSections = transcript
        .split(/\n\s*\n|\n---\n|\[Slide \d+\]|\d+\.\s*/)
        .map(section => section.trim())
        .filter(section => section.length > 0);

      if (transcriptSections.length === 0) {
        alert('No valid transcript sections found. Please check your transcript format.');
        setIsProcessingAudio(false);
        return;
      }

      // Estimate audio duration per section based on word count
      const wordsPerMinute = 150; // Average speaking rate
      const totalWords = transcript.split(/\s+/).length;
      const estimatedDuration = (totalWords / wordsPerMinute) * 60; // in seconds
      const sectionsToProcess = Math.min(transcriptSections.length, slides.length);
      const sectionDuration = estimatedDuration / sectionsToProcess;

      console.log(`Processing audio into ${sectionsToProcess} chunks, ${sectionDuration.toFixed(2)}s each`);
      
      // Create audio context for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Convert file to array buffer
      const arrayBuffer = await masterAudioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const actualDuration = audioBuffer.duration;
      const actualSectionDuration = actualDuration / sectionsToProcess;
      
      console.log(`Actual audio duration: ${actualDuration.toFixed(2)}s, section duration: ${actualSectionDuration.toFixed(2)}s`);
      
      const updatedSlides = [...slides];
      const audioChunks = [];
      
      // Create audio chunks for each section
      for (let i = 0; i < sectionsToProcess; i++) {
        const startTime = i * actualSectionDuration;
        const endTime = Math.min((i + 1) * actualSectionDuration, actualDuration);
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
          const endSample = Math.floor(endTime * audioBuffer.sampleRate);
          
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
              <audio controls class="slide-audio" ${slide.audioStartTime ? `data-start="${slide.audioStartTime}" data-duration="${slide.audioDuration}"` : ''}>
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
    
    try {
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

      // Add image files to zip separately to avoid string length issues
      const imageFolder = zip.folder('images');
      const audioFolder = zip.folder('audio');
      
      // Process each slide to add files
      for (const slide of slides) {
        // Add images
        for (const img of slide.images) {
          if (img.file) {
            imageFolder.file(img.name, img.file);
          }
        }
        
        // Add audio files
        if (slide.audioFile) {
          audioFolder.file(slide.audioFile.name, slide.audioFile);
        }
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

  const currentSlideData = slides[currentSlide] || {};

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
        hyperlinks: []
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
      
      {/* Bulk image upload feature */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: pearsonColors.amethyst, borderRadius: 8, color: 'white' }}>
        <h4 style={{ marginBottom: '1rem', color: 'white' }}>🚀 Quick Start: Create Slides from Images</h4>
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
          Upload multiple images to automatically create a slide for each image. You can then add text, audio, and hyperlinks to each slide.
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
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
          
          <div style={{ marginLeft: 'auto' }}>
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
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: pearsonColors.amethyst }}>
          💡 Tip: Use bulk audio setup to automatically split a single audio file across multiple slides, or add audio individually to each slide
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
              🎯 This slide has auto-assigned audio from bulk setup
            </div>
          )}
          
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
               </div>
             ))}
           </div>
           <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: pearsonColors.amethyst }}>
             💡 Click on any slide in the preview to edit it
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
              <div style={{ fontSize: '0.8rem', color: pearsonColors.amethyst, marginBottom: '0.5rem' }}>
                💡 Separate slide content with double line breaks, "---", "[Slide X]", or numbered points
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={`Example transcript with slide breaks:

Welcome to our presentation. This is the introduction slide.

---

Now let's look at the main topic. This content will be on slide 2.

[Slide 3]
Here's the conclusion and final thoughts.`}
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
        {activeTab === 3 && <SlideBuilderTab />}
      </TabPanel>
    </>
  );
}

export default App;
