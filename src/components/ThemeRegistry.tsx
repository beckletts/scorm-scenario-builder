'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { themeOptions } from '../theme/theme';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const theme = createTheme(themeOptions);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
} 