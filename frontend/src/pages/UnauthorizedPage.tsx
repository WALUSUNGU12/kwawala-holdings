import { Button, Container, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="sm">
      <Paper sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <LockIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
        <Typography component="h1" variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          You do not have the necessary permissions to view this page. Please contact your administrator if you believe this is an error.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate(-1)} 
          sx={{ mt: 3 }}
        >
          Go Back
        </Button>
      </Paper>
    </Container>
  );
};

export default UnauthorizedPage;
