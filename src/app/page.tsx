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

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [scenarios, setScenarios] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(false);
    setVideoUrl('');
    setVideoFile(null);
    setHtmlFile(null);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(event.currentTarget);
      if (tabValue === 0 && scenarios) {
        const scenariosData = scenarios.split('---').map(scenario => {
          const [question, answer] = scenario.trim().split('\n\n');
          return { question, answer, type: 'customer_service' };
        });
        formData.append('scenarios', JSON.stringify(scenariosData));
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
          Customer Service Scenario Builder
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
              <Tab label="Paste Scenarios" />
              <Tab label="Video" />
              <Tab label="URL" />
              <Tab label="Upload HTML" />
            </Tabs>
          </Box>

          <form onSubmit={handleSubmit}>
            <TabPanel value={tabValue} index={0}>
              <Typography variant="body1" gutterBottom>
                Paste your scenarios using the following format:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Question or Scenario Description<br/>
                <br/>
                Answer or Expected Response<br/>
                <br/>
                --- (three dashes to separate scenarios)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                value={scenarios}
                onChange={(e) => setScenarios(e.target.value)}
                placeholder={`Customer asks about refund policy\n\nExplain that refunds can be processed within 30 days of purchase with a valid receipt\n\n---\n\nCustomer complains about late delivery\n\nApologize for the delay, verify tracking information, and offer compensation if applicable`}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="body1" gutterBottom>
                Enter a YouTube or Vimeo video URL, or upload a video file (MP4 recommended).
              </Typography>
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
                accept="video/mp4,video/webm,video/ogg"
                ref={fileInputRef}
                onChange={handleVideoFileChange}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="body1" gutterBottom>
                Enter a knowledge base article URL or a <b>Storylane link</b>.<br />
                <span style={{ color: '#005C9E' }}>
                  If you enter a Storylane link (e.g., <code>https://pearson.storylane.io/share/...</code>), the generated SCORM package will embed the Storylane experience and provide a "Close" button that marks the course as completed.
                </span>
              </Typography>
              <TextField
                fullWidth
                name="url"
                label="Knowledge Base Article or Storylane URL"
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
      </Box>
    </Container>
  );
} 