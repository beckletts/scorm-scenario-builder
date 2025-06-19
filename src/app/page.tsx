'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import Image from 'next/image';
import { styled } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const Input = styled('input')({
  display: 'none',
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const exampleSchema = `{
  "scenarios": [
    {
      "question": "How do I reset my password?",
      "answer": "Click 'Forgot password' on the login page and follow the instructions."
    },
    {
      "question": "How do I contact support?",
      "answer": "Email support@example.com or call 0800-123-456."
    }
  ]
}`;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [jsonText, setJsonText] = useState('');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(false);
    setVideoUrl('');
    setVideoFile(null);
    setHtmlFile(null);
    setJsonText('');
    setJsonFile(null);
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setVideoFile(event.target.files[0]);
    }
  };

  const handleHtmlFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setHtmlFile(event.target.files[0]);
    }
  };

  const handleJsonFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setJsonFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setJsonText(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(exampleSchema);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(event.currentTarget);
      if (tabValue === 0) {
        let parsed;
        try {
          parsed = JSON.parse(jsonText);
        } catch (e) {
          throw new Error('Invalid JSON. Please check your input.');
        }
        if (!parsed || !Array.isArray(parsed.scenarios)) {
          throw new Error('JSON must have a "scenarios" array.');
        }
        formData.append('scenarios', JSON.stringify(parsed.scenarios));
      }
      if (tabValue === 1) {
        if (videoUrl) {
          formData.append('videoUrl', videoUrl);
        }
        if (videoFile) {
          formData.append('videoFile', videoFile);
        }
      }
      if (tabValue === 3 && htmlFile) {
        formData.append('htmlFile', htmlFile);
      }
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate SCORM package');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scenario.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: 'primary.main' }}>
          SCORM Builder
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              SCORM package generated successfully!
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="input method tabs">
              <Tab label="Scenario Builder" />
              <Tab label="Video" />
              <Tab label="Storylane" />
              <Tab label="Upload HTML" />
            </Tabs>
          </Box>

          <form onSubmit={handleSubmit}>
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ flexGrow: 1 }}>
                  Paste your JSON below or upload a .json file. You can use the example schema for AI prompts.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopySchema}
                  sx={{ ml: 2 }}
                >
                  Copy Example Schema
                </Button>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={10}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder={exampleSchema}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ height: '60px', mb: 2 }}
                onClick={() => jsonInputRef.current?.click()}
              >
                {jsonFile ? jsonFile.name : 'Click to Upload JSON File'}
              </Button>
              <Input
                id="json-file-input"
                name="jsonFile"
                type="file"
                accept="application/json,.json"
                ref={jsonInputRef}
                onChange={handleJsonFileChange}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="body1" gutterBottom>
                Enter a YouTube or Vimeo video URL, or upload a video file (MP4 recommended).
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <b>Accepted file types:</b> Only <b>.mp4</b> files (H.264/AAC) are supported for maximum compatibility with browsers and LMSs.<br />
                If your video does not play, please convert it to .mp4 format.<br />
                You can also use YouTube or Vimeo links.
              </Alert>
              <TextField
                fullWidth
                name="videoUrl"
                label="YouTube or Vimeo URL"
                variant="outlined"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                sx={{ mb: 2 }}
              />
              <Divider sx={{ my: 2 }}>OR</Divider>
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ height: '100px', mb: 2 }}
                onClick={() => fileInputRef.current?.click()}
              >
                {videoFile ? videoFile.name : 'Click to Upload Video File (MP4)'}
              </Button>
              <Input
                id="video-file-input"
                name="videoFile"
                type="file"
                accept="video/mp4"
                ref={fileInputRef}
                onChange={handleVideoFileChange}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="body1" gutterBottom>
                Enter a <b>Storylane link</b> below.<br />
                <span style={{ color: '#005C9E' }}>
                  The generated SCORM package will embed the Storylane experience and provide a "Close" button that marks the course as completed.<br />
                  Example: <code>https://pearson.storylane.io/share/...</code>
                </span>
              </Typography>
              <TextField
                fullWidth
                name="url"
                label="Storylane URL"
                variant="outlined"
                placeholder="https://pearson.storylane.io/share/kmkr7hvxxm5a"
                sx={{ mb: 2 }}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Typography variant="body1" gutterBottom>
                Upload an HTML file (exported from Claude, Copilot, etc.). The app will wrap your HTML in a SCORM-compliant package and add a "Close" button that marks the course as completed.
              </Typography>
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ height: '100px', mb: 2 }}
                onClick={() => htmlInputRef.current?.click()}
              >
                {htmlFile ? htmlFile.name : 'Click to Upload HTML File'}
              </Button>
              <Input
                id="html-file-input"
                name="htmlFile"
                type="file"
                accept="text/html,.html"
                ref={htmlInputRef}
                onChange={handleHtmlFileChange}
              />
            </TabPanel>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ minWidth: 200 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate SCORM Package'}
              </Button>
            </Box>
          </form>
        </Paper>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity="success" variant="filled">
            Example schema copied to clipboard!
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
} 