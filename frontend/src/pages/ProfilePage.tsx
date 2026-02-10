import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  CardActions,
  Avatar,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
// Remove unused imports
import { RootState } from '../app/store';
import { 
  useUpdateProfileMutation, 
  useGetProfileQuery, 
  useChangePasswordMutation 
} from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';

// Validation schema for profile update
const profileValidationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

// Validation schema for password change
const passwordValidationSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(6, 'New password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth) || {};
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  const [tabValue, setTabValue] = useState(0);
  // API hooks
  const { data: profileData, isLoading: isLoadingProfile, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Set initial form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      profileFormik.setValues({
        name: profileData.name || '',
        email: profileData.email || '',
      });
    }
  }, [profileData]);

  const profileFormik = useFormik({
    initialValues: {
      name: '',
      email: '',
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      try {
        const updatedUser = await updateProfile(values).unwrap();
        dispatch(setCredentials({ user: updatedUser, token: localStorage.getItem('token') || '' }));
        setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
        refetch();
      } catch (err: any) {
        console.error('Failed to update profile:', err);
        setSnackbar({ open: true, message: err.data?.message || 'Failed to update profile', severity: 'error' });
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting, setFieldError }) => {
      try {
        await changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        }).unwrap();
        
        setSnackbar({ 
          open: true, 
          message: 'Password changed successfully', 
          severity: 'success' 
        });
        
        resetForm();
        setSubmitting(false);
        
      } catch (err: any) {
        console.error('Failed to change password:', err);
        
        // Handle different error cases
        const errorMessage = err.data?.message || 'Failed to change password';
        
        if (errorMessage.toLowerCase().includes('current password')) {
          setFieldError('currentPassword', errorMessage);
        } else if (errorMessage.toLowerCase().includes('new password')) {
          setFieldError('newPassword', errorMessage);
        } else {
          setSnackbar({ 
            open: true, 
            message: errorMessage, 
            severity: 'error' 
          });
        }
      }
    },
  });

  useEffect(() => {
    if (profileData) {
      profileFormik.setValues({
        name: profileData.name,
        email: profileData.email,
      });
    }
  }, [profileData]);

  if (isLoadingProfile) {
    return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          p: 3,
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              My Profile
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {/* Profile Details Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        mb: 3, 
                        bgcolor: 'primary.main',
                        fontSize: '3rem'
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h5" component="div" align="center" gutterBottom>
                      {user?.name}
                    </Typography>
                    <Typography 
                      color="text.secondary" 
                      variant="body2" 
                      sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 'medium'
                      }}
                    >
                      {user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : ''}
                    </Typography>
                  </Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ p: 2 }}>
                  <Button 
                    fullWidth 
                    variant="outlined"
                    component="label"
                    disabled={isUpdatingProfile}
                  >
                    Change Avatar
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          console.log('Selected file:', file);
                        }
                      }}
                    />
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Profile and Password Forms */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="profile tabs"
                  variant="fullWidth"
                  sx={{
                    '& .MuiTabs-indicator': {
                      height: 3,
                    },
                  }}
                >
                  <Tab label="Profile" {...a11yProps(0)} />
                  <Tab label="Security" {...a11yProps(1)} />
                </Tabs>
                
                <TabPanel value={tabValue} index={0}>
                  <Card>
                    <CardHeader title="Profile Information" subheader="Update your personal details" />
                    <Divider />
                    <form onSubmit={profileFormik.handleSubmit}>
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              id="name"
                              name="name"
                              label="Full Name"
                              value={profileFormik.values.name}
                              onChange={profileFormik.handleChange}
                              onBlur={profileFormik.handleBlur}
                              error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                              helperText={profileFormik.touched.name && profileFormik.errors.name}
                              disabled={isUpdatingProfile}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              id="email"
                              name="email"
                              label="Email Address"
                              type="email"
                              value={profileFormik.values.email}
                              onChange={profileFormik.handleChange}
                              onBlur={profileFormik.handleBlur}
                              error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                              helperText={profileFormik.touched.email && profileFormik.errors.email}
                              disabled={isUpdatingProfile}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                      <Divider />
                      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                        <Button
                          color="primary"
                          variant="contained"
                          type="submit"
                          disabled={isUpdatingProfile || !profileFormik.dirty}
                          sx={{ minWidth: 150 }}
                        >
                          {isUpdatingProfile ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : 'Save Changes'}
                        </Button>
                      </CardActions>
                    </form>
                  </Card>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Card sx={{ mt: 2 }}>
                    <CardHeader title="Change Password" subheader="Update your password" />
                    <Divider />
                    <form onSubmit={passwordFormik.handleSubmit}>
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              id="currentPassword"
                              name="currentPassword"
                              label="Current Password"
                              type="password"
                              value={passwordFormik.values.currentPassword}
                              onChange={passwordFormik.handleChange}
                              onBlur={passwordFormik.handleBlur}
                              error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                              helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              id="newPassword"
                              name="newPassword"
                              label="New Password"
                              type="password"
                              value={passwordFormik.values.newPassword}
                              onChange={passwordFormik.handleChange}
                              onBlur={passwordFormik.handleBlur}
                              error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                              helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              id="confirmPassword"
                              name="confirmPassword"
                              label="Confirm New Password"
                              type="password"
                              value={passwordFormik.values.confirmPassword}
                              onChange={passwordFormik.handleChange}
                              onBlur={passwordFormik.handleBlur}
                              error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                              helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                      <Divider />
                      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                        <Button 
                          type="submit" 
                          variant="contained" 
                          color="primary" 
                          disabled={!passwordFormik.isValid || !passwordFormik.dirty || isChangingPassword}
                        >
                          {isChangingPassword ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : 'Change Password'}
                        </Button>
                      </CardActions>
                    </form>
                  </Card>
                </TabPanel>
              </Paper>
            </Grid>
          </Grid>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert 
              onClose={() => setSnackbar({ ...snackbar, open: false })} 
              severity={snackbar.severity}
              variant="filled"
              sx={{ 
                width: '100%',
                '& .MuiAlert-message': {
                  display: 'flex',
                  alignItems: 'center'
                }
              }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  );
};

export default ProfilePage;
