import { Box, Container, Typography, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
        p: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          display="flex"
          flexDirection={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: { xs: 1, md: 0 } }}>
            © {currentYear} Kwawala Holdings. All rights reserved.
          </Typography>
          <Box>
            <MuiLink
              component={Link}
              to="/privacy"
              color="inherit"
              sx={{ mx: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Privacy Policy
            </MuiLink>
            <MuiLink
              component={Link}
              to="/terms"
              color="inherit"
              sx={{ mx: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Terms of Service
            </MuiLink>
            <MuiLink
              component={Link}
              to="/contact"
              color="inherit"
              sx={{ ml: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Contact Us
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
