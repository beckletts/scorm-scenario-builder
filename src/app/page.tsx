'use client';

import { useState } from 'react';
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(event.currentTarget);
      
      // If we're on the scenarios tab, parse and add scenarios to formData
      if (tabValue === 0 && scenarios) {
        const scenariosData = scenarios.split('---').map(scenario => {
          const [question, answer] = scenario.trim().split('\n\n');
          return { question, answer, type: 'customer_service' };
        });
        formData.append('scenarios', JSON.stringify(scenariosData));
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
              <Tab label="Upload File" />
              <Tab label="Enter URL" />
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
              <label htmlFor="file-input">
                <Input
                  id="file-input"
                  name="file"
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                />
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ height: '100px' }}
                >
                  Click to Upload File (XLSX, CSV, or PDF)
                </Button>
              </label>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <TextField
                fullWidth
                name="url"
                label="Knowledge Base Article URL"
                variant="outlined"
                placeholder="https://..."
                sx={{ mb: 2 }}
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