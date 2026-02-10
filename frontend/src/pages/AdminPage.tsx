import { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Tooltip, 
  CircularProgress, 
  Alert, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogContentText,
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText, 
  Snackbar,
  Grid
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '../features/users/usersApi';
// User type that matches the backend
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
  password?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

// Type for user form values
type UserFormValues = {
  name: string;
  email: string;
  role: 'admin' | 'viewer';
  password: string;
  isNewUser: boolean;
};

// Validation schema for the user form
const userValidationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  role: Yup.string().oneOf(['admin', 'viewer']).required('Role is required'),
  password: Yup.string().when('isNewUser', {
    is: true,
    then: (schema) => schema.min(6, 'Password must be at least 6 characters').required('Password is required'),
    otherwise: (schema) => schema.min(6, 'Password must be at least 6 characters'),
  }),
});

const AdminPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // API hooks
  const { data: users, isLoading, isError, error, refetch } = useGetUsersQuery();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const formik = useFormik<UserFormValues>({
    initialValues: {
      name: '',
      email: '',
      role: 'viewer' as const,
      password: '',
      isNewUser: true,
    },
    validationSchema: userValidationSchema,
    onSubmit: async (values: UserFormValues, { resetForm }) => {
      try {
        const userData = {
          name: values.name,
          email: values.email,
          role: values.role,
          ...(values.password && { password: values.password })
        };

        if (selectedUser?.id !== undefined) {
          await updateUser({ id: selectedUser.id.toString(), body: userData }).unwrap();
          setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
        } else {
          // Create user
          await createUser({
            name: values.name,
            email: values.email,
            role: values.role,
            password: values.password
          }).unwrap();
          setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
        }
        refetch();
        handleCloseModal();
        resetForm();
      } catch (err: any) {
        console.error('Failed to save user:', err);
        setSnackbar({ 
          open: true, 
          message: err.data?.message || 'Failed to save user', 
          severity: 'error' 
        });
      }
    },
  });

  const handleOpenModal = (user: Partial<User> | null = null) => {
    setSelectedUser(user || null);
    if (user) {
      formik.setValues({
        name: user.name ?? '',
        email: user.email ?? '',
        role: user.role ?? 'viewer',
        password: '',
        isNewUser: false,
      });
    } else {
      formik.resetForm({
        values: {
          name: '',
          email: '',
          role: 'viewer',
          password: '',
          isNewUser: true,
        },
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    formik.resetForm();
  };

  const handleOpenDeleteDialog = (user: User | Partial<User>) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser?.id !== undefined) {
      try {
        await deleteUser(selectedUser.id.toString()).unwrap();
        setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
        refetch();
      } catch (err: any) {
        console.error('Failed to delete user:', err);
        setSnackbar({ 
          open: true, 
          message: (err as { data?: { message?: string } })?.data?.message || 'Failed to delete user', 
          severity: 'error' 
        });
      }
    }
    handleCloseDeleteDialog();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Error loading users: {error ? (error as Error).message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" component="main">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
          >
            New User
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(users) && users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role}
                      color={user.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(user.createdAt!).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit User">
                      <IconButton color="primary" onClick={() => handleOpenModal(user)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton color="error" onClick={() => handleOpenDeleteDialog(user)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* User Create/Edit Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={3} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Full Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth error={formik.touched.role && Boolean(formik.errors.role)}>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={formik.values.role}
                    label="Role"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                  </Select>
                  {formik.touched.role && formik.errors.role && <FormHelperText>{formik.errors.role}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label={selectedUser ? 'New Password (optional)' : 'Password'}
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{selectedUser?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPage;
