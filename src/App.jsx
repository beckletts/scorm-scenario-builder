import { useState } from 'react'
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
  background: ${({ active }) => (active ? pearsonColors.purple : pearsonColors.white)};
  color: ${({ active }) => (active ? pearsonColors.white : pearsonColors.purple)};
  border: none;
  border-radius: 24px;
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${({ active }) => (active ? '0 2px 8px rgba(11,0,74,0.10)' : 'none')};
  transition: background 0.2s, color 0.2s;
  outline: ${({ active }) => (active ? '2px solid #6C2EB7' : 'none')};
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
            active={activeTab === idx}
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
      </TabPanel>
    </>
  );
}

export default App;
