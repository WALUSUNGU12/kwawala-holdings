import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/formatters';
import { useGetExpensesByProjectQuery } from '../features/expenses/expenseApi';
import { MonthlyExpenseChart } from '../components/visualization/MonthlyExpenseChart';
import { AnnualExpenseChart } from '../components/visualization/AnnualExpenseChart';
import { ProjectSelector } from '../components/visualization/ProjectSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  CircularProgress,
  List,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

interface Expense {
  id: number;
  amount: string;
  description: string;
  date: string;
}

interface ProjectManager {
  id: number;
  name: string;
  email: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  totalExpenses: string;
  expenses: Expense[];
  creator: ProjectManager;
}

const LandingPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Fetch expense data for the selected project
  const { data: projectExpenses, isLoading: isLoadingExpenses } = useGetExpensesByProjectQuery(
    { projectId: selectedProjectId },
    { skip: !selectedProjectId }
  );
  
  // Extract data for charts
  const monthlyExpenses = projectExpenses?.monthly || [];
  const annualExpenses = projectExpenses?.annual || [];

  // Prepare chart data for project status
  const projectChartData = projects.map((project) => ({
    name: project.name,
    status: project.status === 'in progress' ? 1 : 0,
  }));
  
  // Find the currently selected project
  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);
  
  // Format Y-axis tick values (commented out since it's not used)
  // const formatYAxis = (v: number) => `MWK ${v.toLocaleString()}`;

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    // Scroll to expenses section
    document.getElementById('expenses-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'primary';
      case 'on hold':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/projects/landing');

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setProjects(data.data);
        } else {
          setProjects([]);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Calculate total expenses across all projects
  const totalExpenses = projects.reduce((sum, project) => {
    return sum + (parseFloat(project.totalExpenses) || 0);
  }, 0);

  // Calculate total expenses for display
  const totalAllExpenses = projects
    .reduce((sum, p) => sum + parseFloat(p.totalExpenses || '0'), 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
  // Get project name for display
  const selectedProjectName = projects.find(p => p.id.toString() === selectedProjectId)?.name || 'All Projects';

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', p: 3 }}>
      <Container maxWidth="lg">
        {/* Total Expenses Card */}
        <Card sx={{ mb: 4, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Total Expenses Across All Projects</Typography>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h4">
                {formatCurrency(totalExpenses)}
              </Typography>
              <Typography variant="body2">
                {projects.length} projects
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Project Selection */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>Select a Project</Typography>
          <ProjectSelector 
            projects={projects.map(p => ({ id: p.id.toString(), name: p.name }))}
            selectedProject={selectedProjectId}
            onProjectChange={handleProjectSelect}
            isLoading={loading}
            label="Select Project to View Expenses"
          />
          {selectedProjectId && (
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Viewing expenses for: <strong>{selectedProjectName}</strong>
            </Typography>
          )}
        </Box>

        {/* ==================== SUMMARY CARDS ==================== */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Projects
                </Typography>
                <Typography variant="h4">{projects.length}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Projects
                </Typography>
                <Typography variant="h4">
                  {projects.filter((p) => p.status.toLowerCase() === 'in progress').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Expenses
                </Typography>
                <Typography variant="h4">{formatCurrency(totalAllExpenses)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ==================== EXPENSE VISUALIZATIONS ==================== */}
        <Grid container spacing={4} sx={{ mb: 5 }}>
          {/* Monthly Expenses Chart */}
          <Grid item xs={12} md={6}>
            <MonthlyExpenseChart 
              data={monthlyExpenses}
              isLoading={isLoadingExpenses || loading}
              height={400}
            />
          </Grid>

          {/* Annual Expenses Chart */}
          <Grid item xs={12} md={6}>
            <AnnualExpenseChart 
              data={annualExpenses}
              isLoading={isLoadingExpenses || loading}
              height={400}
            />
          </Grid>
        </Grid>

        {/* ==================== PROJECT STATUS ==================== */}
        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Status
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={projectChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => (v === 1 ? 'Active' : 'Inactive')} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="status" stroke="#82ca9d" name="Active Status" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ==================== ALL PROJECTS TABLE ==================== */}
        <Card elevation={3} sx={{ mb: 5 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Projects
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell align="right">Total Expenses</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id} hover>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={project.status}
                          color={getStatusColor(project.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(project.startDate)}</TableCell>
                      <TableCell>{project.endDate ? formatDate(project.endDate) : 'Ongoing'}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(project.totalExpenses || '0')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* ==================== PROJECT SELECTION ==================== */}
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                  onClick={() => handleProjectSelect(project.id.toString())}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6">{project.name}</Typography>
                      <Chip 
                        label={project.status} 
                        color={getStatusColor(project.status) as any} 
                        size="small" 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {project.description || 'No description available'}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                      {formatCurrency(project.totalExpenses || '0')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ==================== SELECTED PROJECT EXPENSES ==================== */}
        <Box id="expenses-section" sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {selectedProject ? `${selectedProject.name} Expenses` : 'Select a project to view expenses'}
          </Typography>
          
          {selectedProject && (
            <Card sx={{ mt: 2, mb: 4 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                  <Box>
                    <Typography variant="h6" gutterBottom>{selectedProject.name}</Typography>
                    <Chip
                      label={selectedProject.status}
                      color={getStatusColor(selectedProject.status) as any}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    <Typography variant="body1" paragraph>
                      {selectedProject.description || 'No description available.'}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h5" color="primary">
                      {formatCurrency(selectedProject.totalExpenses || '0')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Expenses
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h6" gutterBottom>Expense Details</Typography>
                {selectedProject.expenses?.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedProject.expenses.map((expense: Expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{formatDate(expense.date)}</TableCell>
                            <TableCell>{expense.description || 'No description'}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(expense.amount || '0')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No expenses recorded for this project.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        <Grid container spacing={3}>
          {(selectedProject ? [selectedProject] : projects).map((project) => (
            <Grid item xs={12} key={project.id}>
              <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6">{project.name}</Typography>
                    <Chip
                      label={project.status}
                      color={getStatusColor(project.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {project.description || 'No description available.'}
                  </Typography>

                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Project Manager:
                    </Typography>
                    <Typography variant="body2">{project.creator?.name || 'Not assigned'}</Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <div>
                      <Typography variant="subtitle2" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography variant="body2">{formatDate(project.startDate)}</Typography>
                    </div>

                    <div>
                      <Typography variant="subtitle2" color="text.secondary" align="right">
                        {project.endDate ? 'End Date' : 'Status'}
                      </Typography>
                      <Typography variant="body2" align="right">
                        {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
                      </Typography>
                    </div>
                  </Box>

                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Expenses
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(project.totalExpenses || '0')}
                    </Typography>
                  </Box>

                  {project.expenses?.length > 0 && (
                    <Box mt={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Recent Expenses:
                      </Typography>

                      <List dense>
                        {project.expenses.slice(0, 3).map((expense) => (
                          <Box key={expense.id} display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2">{expense.description || 'Expense'}</Typography>
                            <Typography variant="body2">
                              {formatCurrency(expense.amount || '0')}
                            </Typography>
                          </Box>
                        ))}

                        {project.expenses.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{project.expenses.length - 3} more expenses
                          </Typography>
                        )}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default LandingPage;