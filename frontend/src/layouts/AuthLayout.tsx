import React from 'react';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '../theme';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
        }}
      >
        <CssBaseline />
        <Container component="main" maxWidth="md" sx={{ mt: 8, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {children}
          </Box>
        </Container>
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[200]
                : theme.palette.grey[800],
          }}
        >
          <Container maxWidth="sm">
            <Box sx={{ textAlign: 'center' }}>
              <img
                src="/logo.png"
                alt="KWAWALA HOLDINGS"
                style={{ height: 40, marginBottom: 8 }}
              />
              <p>© {new Date().getFullYear()} KWAWALA HOLDINGS. All rights reserved.</p>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AuthLayout;
