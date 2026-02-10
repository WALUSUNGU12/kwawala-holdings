import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFormik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { 
  ExpensePayload,
  ExpenseFormValues,
  RootState
} from '../features/expenses/expenseTypes';

import { 
  useCreateExpenseMutation, 
  useUpdateExpenseMutation, 
  useGetExpenseByIdQuery 
} from '../features/expenses/expenseApi';

import { useGetProjectsQuery } from '../features/projects/projectsApi';
import { Project as ProjectType } from '../types'; // adjust path if needed

// Replace this with your real selector (from RTK / Redux)
const useAppSelector = <T,>(selector: (state: RootState) => T): T => {
  // TEMP MOCK – REPLACE WITH REAL IMPLEMENTATION
  const mockAuth = {
    user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' as const },
    token: 'mock-token',
    isAuthenticated: true,
    loading: false,
    error: null,
  };
  return selector({ auth: mockAuth } as RootState);
};

const categories = [
  { value: 'office',    label: 'Office Supplies' },
  { value: 'travel',    label: 'Travel' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other',     label: 'Other' },
];

interface ExpenseFormProps {
  // Add props if needed later
}

const ExpenseForm: React.FC<ExpenseFormProps> = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const isEditMode = Boolean(id);
  const isAdmin = user?.role === 'admin';

  const [searchParams] = useSearchParams();
  const defaultProjectId = searchParams.get('projectId') || '';

  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();

  const { data: existingExpense, isLoading: isLoadingExpense, isError: isExpenseError } = 
    useGetExpenseByIdQuery(id!, { skip: !isEditMode });

  const { data: projectsData = [], isLoading: isLoadingProjects } = useGetProjectsQuery();
  const projects = projectsData as ProjectType[];

  const [submitError, setSubmitError] = useState<string | null>(null);

  const formik = useFormik<ExpenseFormValues>({
    enableReinitialize: true,
    initialValues: {
      projectId: defaultProjectId || '',
      date: new Date(),
      description: '',
      amount: 0,
      category: 'office',
      status: 'pending' as const,
      receiptUrl: null,
    },
    validationSchema: Yup.object({
      projectId: Yup.string().required('Project is required'),
      date: Yup.date()
        .required('Expense date is required')
        .max(new Date(), 'Date cannot be in the future')
        .nullable(),
      description: Yup.string()
        .required('Description is required')
        .max(500, 'Max 500 characters'),
      amount: Yup.number()
        .required('Amount is required')
        .positive('Amount must be positive')
        .typeError('Must be a valid number'),
      category: Yup.string().required('Category is required'),
      status: Yup.string()
        .oneOf(['pending', 'approved', 'rejected'] as const)
        .required('Status is required'),
      receiptUrl: Yup.string().url('Must be a valid URL').nullable(),
    }),
    onSubmit: async (
      values: ExpenseFormValues,
      { setSubmitting }: FormikHelpers<ExpenseFormValues>
    ) => {
      setSubmitError(null);
      setSubmitting(true);

      try {
        const expenseData: ExpensePayload = {
          projectId: values.projectId,
          description: values.description,
          amount: Number(values.amount),
          date: values.date instanceof Date ? values.date.toISOString() : new Date().toISOString(),
          category: values.category,
          status: values.status,
          receiptUrl: values.receiptUrl || undefined,
        };

        if (isEditMode && id) {
          await updateExpense({ id, body: expenseData }).unwrap();
        } else {
          await createExpense(expenseData).unwrap();
        }

        navigate('/expenses');
      } catch (error) {
        console.error('Failed to save expense:', error);
        setSubmitError(
          error instanceof Error ? error.message : 'Failed to save expense. Please try again.'
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Sync existing expense data into formik when loaded
  useEffect(() => {
    if (existingExpense) {
      formik.setValues({
        projectId: existingExpense.projectId || '',
        date: existingExpense.date ? new Date(existingExpense.date) : new Date(),
        description: existingExpense.description || '',
        amount: Number(existingExpense.amount) || 0,
        category: existingExpense.category || 'office',
        status: existingExpense.status || 'pending',
        receiptUrl: existingExpense.receiptUrl || null,
      });
    }
  }, [existingExpense]);

  const handleCancel = () => navigate(-1);

  if (isLoadingExpense || (isEditMode && !existingExpense) || isLoadingProjects) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (isExpenseError) {
    return (
      <Box p={4}>
        <Typography color="error">
          Error loading expense data. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <form onSubmit={formik.handleSubmit} noValidate>
        <Card>
          <CardHeader
            title={isEditMode ? 'Edit Expense' : 'New Expense'}
            titleTypographyProps={{ variant: 'h6' }}
            action={
              isEditMode && (
                <Chip
                  label={formik.values.status.toUpperCase()}
                  color={
                    formik.values.status === 'approved' ? 'success' :
                    formik.values.status === 'rejected' ? 'error' : 'warning'
                  }
                  size="small"
                  sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}
                  icon={
                    formik.values.status === 'approved' ? <CheckCircleIcon /> :
                    formik.values.status === 'rejected' ? <CancelIcon /> :
                    <PendingActionsIcon />
                  }
                />
              )
            }
          />
          <Divider />
          <CardContent>
            {submitError && (
              <Typography color="error" variant="body2" mb={2}>
                {submitError}
              </Typography>
            )}

            <Grid container spacing={3}>
              {/* Project */}
              <Grid item xs={12} md={6}>
                <FormControl 
                  fullWidth 
                  error={formik.touched.projectId && Boolean(formik.errors.projectId)}
                >
                  <InputLabel>Project *</InputLabel>
                  <Select
                    name="projectId"
                    value={formik.values.projectId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Project *"
                    disabled={isEditMode || !!defaultProjectId || isLoadingProjects}
                  >
                    {isLoadingProjects ? (
                      <MenuItem disabled>Loading projects...</MenuItem>
                    ) : projects.length > 0 ? (
                      projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No projects available</MenuItem>
                    )}
                  </Select>
                  {formik.touched.projectId && formik.errors.projectId && (
                    <FormHelperText>{formik.errors.projectId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Date */}
              <Grid item xs={12} md={6}>
<LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date *"
                    value={formik.values.date}
                    onChange={(newValue) => {
                      formik.setFieldValue('date', newValue);
                    }}
                    maxDate={new Date()}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        name="date"
                        error={formik.touched.date && Boolean(formik.errors.date)}
                        helperText={formik.touched.date && formik.errors.date as string}
                        onBlur={formik.handleBlur}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description}
                  multiline
                  rows={3}
                  disabled={formik.isSubmitting}
                />
              </Grid>

              {/* Amount */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Amount *"
                  name="amount"
                  type="number"
                  value={formik.values.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    formik.setFieldValue('amount', value === '' ? 0 : Number(value));
                  }}
                  onBlur={formik.handleBlur}
                  error={formik.touched.amount && Boolean(formik.errors.amount)}
                  helperText={formik.touched.amount && formik.errors.amount}
                  disabled={formik.isSubmitting}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">MWK</InputAdornment>,
                    inputProps: {
                      min: 0,
                      step: '0.01'
                    }
                  }}
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} md={6}>
                <FormControl 
                  fullWidth 
                  error={formik.touched.category && Boolean(formik.errors.category)}
                >
                  <InputLabel>Category *</InputLabel>
                  <Select
                    name="category"
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Category *"
                    disabled={formik.isSubmitting}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.category && formik.errors.category && (
                    <FormHelperText>{formik.errors.category}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Status – Admin only */}
              {isAdmin && (
                <Grid item xs={12} md={6}>
                  <FormControl 
                    fullWidth 
                    error={formik.touched.status && Boolean(formik.errors.status)}
                  >
                    <InputLabel>Status *</InputLabel>
                    <Select
                      name="status"
                      value={formik.values.status}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      label="Status *"
                      disabled={formik.isSubmitting}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                    {formik.touched.status && formik.errors.status && (
                      <FormHelperText>{formik.errors.status}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}

              {/* Receipt URL */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Receipt URL (optional)"
                  name="receiptUrl"
                  value={formik.values.receiptUrl ?? ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.receiptUrl && Boolean(formik.errors.receiptUrl)}
                  helperText={formik.touched.receiptUrl && formik.errors.receiptUrl}
                  disabled={formik.isSubmitting}
                />
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={formik.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={formik.isSubmitting || !formik.isValid}
                    startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : null}
                  >
                    {isEditMode ? 'Update' : 'Create'} Expense
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </form>
    </LocalizationProvider>
  );
};

export default ExpenseForm;