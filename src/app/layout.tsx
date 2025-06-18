import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import ThemeRegistry from '../components/ThemeRegistry';
import '@fontsource/plus-jakarta-sans/300.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>SCORM Scenario Builder - Pearson</title>
        <meta name="description" content="Create SCORM-compliant training scenarios from customer service queries" />
      </head>
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
} 