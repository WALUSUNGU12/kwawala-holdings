import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { Project } from '../types';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO } from 'date-fns';
import { useCreateProjectMutation, useUpdateProjectMutation, useGetProjectByIdQuery } from '../features/projects/projectsApi';

// Validation Schema
const validationSchema = Yup.object({
  name: Yup.string().required('Project name is required'),
  description: Yup.string(),
  status: Yup.string().required('Status is required'),
  startDate: Yup.date().required('Start date is required'),
  endDate: Yup.date()
    .min(Yup.ref('startDate'), 'End date must be after start date')
    .nullable(),
  totalBudget: Yup.number()
    .typeError('Must be a number')
    .positive('Budget must be positive')
    .nullable(),
  clientName: Yup.string(),
  clientEmail: Yup.string().email('Invalid email'),
  notes: Yup.string(),
});

interface ProjectFormProps {
  onClose: () => void;
  project: Project | null;
  onSuccess: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onClose, project, onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(project?.id || id);
  const [error, setError] = useState('');

  // API Hooks
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const { 
    data: existingProject, 
    isLoading: isLoadingProject, 
    error: loadError 
  } = useGetProjectByIdQuery(id || '', { skip: !id });

  const isLoading = isCreating || isUpdating || (isEditMode && isLoadingProject);

  // Get current user
  const { user } = useSelector((state: RootState) => state.auth);
  
  
  const initialStatus = project?.status || 'active';

  // Define form values type that matches the form state
  type ProjectStatusType = 'active' | 'completed' | 'on_hold' | 'cancelled';
  
  interface ProjectFormValues {
    name: string;
    description: string;
    status: ProjectStatusType;
    startDate: Date | null;
    endDate: Date | null;
    totalBudget: string;
    clientName: string;
    clientEmail: string;
    notes: string;
  }

  const formik = useFormik<ProjectFormValues>({
    initialValues: {
      name: project?.name || '',
      description: project?.description || '',
      status: initialStatus,
      startDate: project?.startDate ? new Date(project.startDate) : new Date(),
      endDate: project?.endDate ? new Date(project.endDate) : null,
      totalBudget: project?.totalBudget?.toString() || '',
      clientName: project?.clientName || '',
      clientEmail: project?.clientEmail || '',
      notes: project?.notes || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Prepare the project data for API submission
        const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'Expenses'> & { createdBy?: number } = {
          name: values.name,
          description: values.description || null,
          status: values.status,
          startDate: values.startDate ? values.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          endDate: values.endDate ? values.endDate.toISOString().split('T')[0] : null,
          totalBudget: values.totalBudget ? parseFloat(values.totalBudget) : null,
          clientName: values.clientName || null,
          clientEmail: values.clientEmail || null,
          notes: values.notes || null,
          createdBy: user?.id
        };

        if (isEditMode && id) {
          // For updates, remove createdBy and send only the update data
          const { createdBy, ...updateData } = projectData;
          await updateProject({ 
            id, 
            body: updateData 
          }).unwrap();
          onSuccess();
          onClose();
        } else {
          // For creation, include createdBy
          await createProject(projectData).unwrap();
          onSuccess();
          onClose();
        }
      } catch (err: any) {
        console.error('Error saving project:', err);
        setError(err.data?.message || 'An error occurred while saving the project');
      }
    },
  });

  // Load project data in edit mode
  useEffect(() => {
    if (existingProject) {
      formik.setValues({
        name: existingProject.name,
        description: existingProject.description || '',
        status: existingProject.status,
        startDate: existingProject.startDate ? parseISO(existingProject.startDate) : new Date(),
        endDate: existingProject.endDate ? parseISO(existingProject.endDate) : null,
        totalBudget: existingProject.totalBudget ? existingProject.totalBudget.toString() : '',
        clientName: existingProject.clientName || '',
        clientEmail: existingProject.clientEmail || '',
        notes: existingProject.notes || '',
      });
    }
  }, [existingProject]);

  // Handle loading and error states
  if (isEditMode && isLoadingProject) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (isEditMode && loadError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading project: {JSON.stringify(loadError)}
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader 
                title={isEditMode ? 'Edit Project' : 'New Project'} 
                titleTypographyProps={{ variant: 'h5' }}
              />
              <Divider />
              <CardContent>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label="Project Name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                      disabled={isLoading}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="description"
                      name="description"
                      label="Description"
                      multiline
                      rows={4}
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.description && Boolean(formik.errors.description)}
                      helperText={formik.touched.description && formik.errors.description}
                      disabled={isLoading}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="status-label">Status</InputLabel>
                      <Select
                        labelId="status-label"
                        id="status"
                        name="status"
                        value={formik.values.status}
                        label="Status"
                        onChange={formik.handleChange}
                        error={formik.touched.status && Boolean(formik.errors.status)}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="on_hold">On Hold</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="totalBudget"
                      name="totalBudget"
                      label="Total Budget"
                      type="number"
                      value={formik.values.totalBudget}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.totalBudget && Boolean(formik.errors.totalBudget)}
                      helperText={formik.touched.totalBudget && formik.errors.totalBudget}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Start Date"
                      value={formik.values.startDate}
                      onChange={(date) => formik.setFieldValue('startDate', date, true)}
                      inputFormat="MM/dd/yyyy"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                          helperText={formik.touched.startDate && formik.errors.startDate as string}
                          onBlur={formik.handleBlur}
                          name="startDate"
                          disabled={isLoading}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="End Date (Optional)"
                      value={formik.values.endDate}
                      onChange={(date) => formik.setFieldValue('endDate', date, true)}
                      inputFormat="MM/dd/yyyy"
                      minDate={formik.values.startDate}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                          helperText={(formik.touched.endDate && formik.errors.endDate as string) || 'Leave empty for ongoing projects'}
                          onBlur={formik.handleBlur}
                          name="endDate"
                          disabled={isLoading}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="clientName"
                      name="clientName"
                      label="Client Name"
                      value={formik.values.clientName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={isLoading}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="clientEmail"
                      name="clientEmail"
                      label="Client Email"
                      type="email"
                      value={formik.values.clientEmail}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.clientEmail && Boolean(formik.errors.clientEmail)}
                      helperText={formik.touched.clientEmail && formik.errors.clientEmail}
                      disabled={isLoading}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="notes"
                      name="notes"
                      label="Notes"
                      multiline
                      rows={3}
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={isLoading}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Actions" />
              <Divider />
              <CardContent>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={isLoading || !formik.isValid}
                    fullWidth
                  >
                    {isLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : isEditMode ? (
                      'Update Project'
                    ) : (
                      'Create Project'
                    )}
                  </Button>

                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => navigate(-1)}
                    disabled={isLoading}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </Box>

                {isEditMode && (
                  <Box mt={4}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Project Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {existingProject?.createdAt 
                          ? format(parseISO(existingProject.createdAt), 'PPpp') 
                          : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mt={1}>
                      <Typography variant="caption" color="textSecondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {existingProject?.updatedAt 
                          ? format(parseISO(existingProject.updatedAt), 'PPpp') 
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </LocalizationProvider>
  );
};

export default ProjectForm;
