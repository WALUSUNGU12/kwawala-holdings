import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  TableSortLabel,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
// format is not used, removing to fix warning
import { useGetExpensesQuery, useDeleteExpenseMutation } from '../features/expenses/expensesApi';
import { useGetProjectsQuery } from '../features/projects/projectsApi';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import Paper from '@mui/material/Paper';

type Order = 'asc' | 'desc';
type ExpenseStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface FilterState {
  projectId: string;
  status: ExpenseStatus;
  search: string;
  startDate: Date | null;
  endDate: Date | null;
}

const ExpensesPage = () => {
    const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Expense>('date');
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';
  
  // Fetch projects for filtering (admin only)
  const { data: projectsData } = useGetProjectsQuery(undefined, { skip: !isAdmin });
  const projects = projectsData || [];
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    projectId: 'all',
    status: 'all',
    search: '',
    startDate: null,
    endDate: null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Fetch expenses data
  const { data, isLoading, isError, error, refetch } = useGetExpensesQuery(undefined);
  const [deleteExpense] = useDeleteExpenseMutation();

  const expenses: Expense[] = data || [];

  // Handle delete expense
  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteExpense(expenseToDelete.id).unwrap();
      setSnackbar({ open: true, message: 'Expense deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      refetch();
    } catch (err: unknown) {
      const errorMessage = (err as { data?: { message?: string } })?.data?.message || 'Failed to delete expense';
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  // Handle sort
  const handleRequestSort = (property: keyof Expense) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle project selection in filter
  // Removed unused handleProjectFilterChange

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    const searchTerm = filters.search.toLowerCase();
    const statusFilter = filters.status;
    
    return expenses
      .filter((expense: Expense) => {
        const matchesSearch = 
          (expense.description?.toLowerCase().includes(searchTerm) ||
          expense.category?.toLowerCase().includes(searchTerm) ||
          (expense.Project?.name?.toLowerCase().includes(searchTerm) ?? false));
        
        const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
        
        // Handle project ID whether it's a string or object
        let projectId: string | undefined;
        if (expense.projectId) {
          projectId = typeof expense.projectId === 'string' 
            ? expense.projectId 
            : (expense.projectId as { id: string })?.id;
        }
        const matchesProject = filters.projectId === 'all' || projectId === filters.projectId;
        
        try {
          const expenseDate = new Date(expense.date);
          const startDate = filters.startDate ? new Date(filters.startDate) : null;
          const endDate = filters.endDate ? new Date(filters.endDate) : null;
          
          const startDateObj = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : null;
          const endDateObj = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;
          
          const matchesStartDate = !startDateObj || expenseDate >= startDateObj;
          const matchesEndDate = !endDateObj || expenseDate <= endDateObj;
          
          return matchesSearch && matchesStatus && matchesProject && matchesStartDate && matchesEndDate;
        } catch (e) {
          console.error('Error processing date:', e);
          return false;
        }
      })
      .sort((a, b) => {
        let comparison = 0;
        const aValue = a[orderBy as keyof Expense];
        const bValue = b[orderBy as keyof Expense];
        
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (orderBy === 'amount') {
          const aAmount = typeof aValue === 'number' ? aValue : parseFloat(String(aValue));
          const bAmount = typeof bValue === 'number' ? bValue : parseFloat(String(bValue));
          comparison = aAmount < bAmount ? -1 : 1;
        } else if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }
        
        return order === 'asc' ? comparison : -comparison;
      });
  }, [expenses, filters, order, orderBy]);

  // Pagination
  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get status chip properties
  const getStatusChipProps = (status: string) => {
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    const baseProps = {
      size: 'small' as const,
      variant: 'outlined' as const,
      label,
      sx: { minWidth: 100 }
    };
    
    switch (status) {
      case 'approved':
        return { ...baseProps, color: 'success' as const, icon: <CheckCircleIcon /> };
      case 'pending':
        return { ...baseProps, color: 'warning' as const, icon: <PendingIcon /> };
      case 'rejected':
        return { ...baseProps, color: 'error' as const, icon: <CancelIcon /> };
      default:
        return { ...baseProps, color: 'default' as const };
    }
  };

  if (isLoading) return <LinearProgress />;
  if (isError) return <Alert severity="error">Error loading expenses: {error?.toString()}</Alert>;
  
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Expenses
          </Typography>
          <Box display="flex" gap={2}>
            {isAdmin && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FilterListIcon />}
                onClick={() => {
                  // Toggle advanced filters
                  setFilters({
                    ...filters,
                    startDate: null,
                    endDate: null
                  });
                }}
              >
                Advanced Filters
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/expenses/new')}
            >
              New Expense
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 3, p: 2 }}>
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search expenses..."
              InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              sx={{ flex: 1, maxWidth: 400 }}
            />
            
            {/* Project Filter (Admin Only) */}
            {isAdmin && (
              <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Project</InputLabel>
                <Select
                  value={filters.projectId}
                  onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
                  label="Project"
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {/* Status Filter */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as ExpenseStatus }))}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === 'date' ? order : false}>
                  <TableSortLabel active={orderBy === 'date'} direction={orderBy === 'date' ? order : 'asc'} onClick={() => handleRequestSort('date')}>
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                {isAdmin && <TableCell>Project</TableCell>}
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((expense) => (
                    <TableRow key={expense.id} hover>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          {expense.Project?.name || 'No project'}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(expense.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          {...getStatusChipProps(expense.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(expense)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No expenses found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredExpenses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Container>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this expense? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExpensesPage;
