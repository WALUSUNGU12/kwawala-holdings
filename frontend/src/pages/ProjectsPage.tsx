import { useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import React from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  TablePagination,
  Chip,
  TableSortLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import ProjectForm from '../components/ProjectForm';
import { useGetProjectsQuery, useDeleteProjectMutation } from '../features/projects/projectsApi';
import { Project } from '../types';

type ProjectStatus = 'all' | 'active' | 'completed' | 'on_hold' | 'cancelled';
type Order = 'asc' | 'desc';

// Remove the ProjectFormProps since it's now defined in the ProjectForm component

const ProjectsPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('asc');
  // Define sortable fields based on Project type
  type SortableField = keyof Pick<Project, 'name' | 'status' | 'startDate' | 'endDate' | 'totalBudget'>;
  const [orderBy, setOrderBy] = useState<SortableField>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  const navigate = useNavigate();

  // Fetch projects
  const { data: projects = [], isLoading, isError, refetch } = useGetProjectsQuery();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  // Handle sorting with type safety
  const handleSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle status filter change
  const handleStatusFilterChange = (event: SelectChangeEvent<ProjectStatus>) => {
    setStatusFilter(event.target.value as ProjectStatus);
    setPage(0);
  };

  // Filter and sort projects
  const filteredProjects = React.useMemo(() => {
    return [...projects]
      .filter((project) => {
        const matchesSearch = 
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        const aValue = a[orderBy];
        const bValue = b[orderBy];
        
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }
        
        return order === 'asc' ? comparison : -comparison;
      });
  }, [projects, searchTerm, statusFilter, order, orderBy]);

  // Handle delete project
  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  // Handle request sort for table headers
  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    
    try {
      await deleteProject(selectedProject.id).unwrap();
      setSnackbar({
        open: true,
        message: 'Project deleted successfully',
        severity: 'success'
      });
      refetch();
    } catch (error) {
      console.error('Failed to delete project:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete project',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'on_hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Alert severity="error" sx={{ m: 2 }}>
          Error loading projects. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Add/Edit Project Dialog */}
        {isAddDialogOpen || isEditDialogOpen ? (
          <ProjectForm
            onClose={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedProject(null);
            }}
            project={selectedProject || null}
            onSuccess={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedProject(null);
              refetch();
              setSnackbar({
                open: true,
                message: `Project ${selectedProject ? 'updated' : 'created'} successfully`,
                severity: 'success'
              });
            }}
          />
        ) : null}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="delete-dialog-title"
        >
          <DialogTitle id="delete-dialog-title">
            Delete Project
          </DialogTitle>
          <DialogContent>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this project? This action cannot be undone.
              </Typography>
            </DialogContent>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error"
              variant="contained"
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={20} /> : null}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Page Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Projects
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedProject(null);
              setIsAddDialogOpen(true);
            }}
          >
            Add Project
          </Button>
        </Box>

        {/* Search and Filter */}
        <Box display="flex" gap={2} mb={3}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 250 }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Projects Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? order : 'asc'}
                    onClick={() => handleRequestSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'startDate'}
                    direction={orderBy === 'startDate' ? order : 'asc'}
                    onClick={() => handleRequestSort('startDate')}
                  >
                    Start Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'totalBudget'}
                    direction={orderBy === 'totalBudget' ? order : 'asc'}
                    onClick={() => handleRequestSort('totalBudget')}
                  >
                    Budget
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((project) => (
                    <TableRow key={project.id} hover>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={project.status ? project.status.replace('_', ' ') : 'Unknown'}
                          color={getStatusColor(project.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(project.startDate)}</TableCell>
                      <TableCell>{project.endDate ? formatDate(project.endDate) : '-'}</TableCell>
                      <TableCell>
                        {project.totalBudget ? formatCurrency(project.totalBudget) : 'Open Budget'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => {
                            setSelectedProject(project);
                            setIsEditDialogOpen(true);
                          }}
                          color="primary"
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            navigate(`/expenses/new?projectId=${project.id}`);
                          }}
                          color="primary"
                          size="small"
                          title="Add Expense"
                          sx={{ ml: 1 }}
                        >
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(project)}
                          color="error"
                          size="small"
                          sx={{ ml: 1 }}
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
                      No projects found. Try adjusting your search or filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {filteredProjects.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredProjects.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </TableContainer>
      </Container>
    </Box>
  );
};

export default ProjectsPage;
