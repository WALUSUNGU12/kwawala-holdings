import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Breadcrumbs, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Chip, 
  CircularProgress, 
  Container, 
  Divider, 
  Grid, 
  IconButton, 
  Menu, 
  MenuItem, 
  Paper, 
  Tab, 
  Tabs, 
  Typography, 
  useTheme, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  LinearProgress, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Snackbar 
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  NoteAdd as NoteAddIcon,
  FileCopy as FileCopyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format, parseISO, isAfter, subDays, addDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useGetProjectByIdQuery, useDeleteProjectMutation } from '../features/projects/projectsApi';
import { useGetExpensesByProjectQuery } from '../features/expenses/expensesApi';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Expense } from '../types';

// Status chip component
const StatusChip = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'success' as const, icon: <CheckCircleIcon fontSize="small" /> };
      case 'on_hold':
        return { label: 'On Hold', color: 'warning' as const, icon: <WarningIcon fontSize="small" /> };
      case 'completed':
        return { label: 'Completed', color: 'primary' as const, icon: <InfoIcon fontSize="small" /> };
      case 'cancelled':
        return { label: 'Cancelled', color: 'error' as const, icon: <ErrorIcon fontSize="small" /> };
      default:
        return { label: status, color: 'default' as const, icon: <InfoIcon fontSize="small" /> };
    }
  };

  const { label, color, icon } = getStatusConfig(status);

  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      variant="outlined"
      size="small"
      sx={{ textTransform: 'capitalize' }}
    />
  );
};

// Project detail tabs
const TabPanel = (props: { children: React.ReactNode; value: number; index: number }) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });

  // Fetch project and expenses data
  const { data: project, isLoading, isError, error } = useGetProjectByIdQuery(id || '');
  const { data: expensesData } = useGetExpensesByProjectQuery(id || '', { skip: !id });
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const expenses = expensesData || [];
  const loading = isLoading || isDeleting;

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle menu open/close
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle delete project
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    try {
      await deleteProject(id).unwrap();
      setSnackbar({
        open: true,
        message: 'Project deleted successfully',
        severity: 'success',
      });
      navigate('/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete project',
        severity: 'error',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Calculate project stats
  const projectStats = React.useMemo(() => {
    if (!project) return null;
    
    const totalExpenses = expenses.reduce((sum: number, exp: Expense) => sum + parseFloat(exp.amount), 0);
    const remainingBudget = (project.totalBudget || 0) - totalExpenses;
    const budgetUtilization = project.totalBudget ? (totalExpenses / project.totalBudget) * 100 : 0;
    
    // Calculate days remaining if end date is in the future
    let daysRemaining = null;
    if (project.endDate) {
      const endDate = parseISO(project.endDate);
      const today = new Date();
      if (isAfter(endDate, today)) {
        const diffTime = endDate.getTime() - today.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
    
    // Calculate time elapsed
    let timeElapsed = null;
    if (project.startDate) {
      const startDate = parseISO(project.startDate);
      const endDate = project.endDate ? parseISO(project.endDate) : new Date();
      const totalDuration = project.endDate 
        ? (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        : (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      
      const elapsedDuration = project.endDate 
        ? (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        : totalDuration;
      
      timeElapsed = {
        percentage: Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100)),
        label: `${Math.round(elapsedDuration)} of ${Math.round(totalDuration)} days`,
      };
    }
    
    // Expenses by category
    const expensesByCategory = expenses.reduce((acc: Record<string, number>, exp: Expense) => {
      if (!acc[exp.category]) {
        acc[exp.category] = 0;
      }
      acc[exp.category] += parseFloat(exp.amount);
      return acc;
    }, {} as Record<string, number>);
    
    // Recent activities (combine project updates and expenses)
    const recentActivities = [
      ...expenses.map((exp: Expense) => ({
        ...exp,
        type: 'expense',
        date: exp.date,
        title: `Expense: ${exp.description || 'No description'}`,
        amount: exp.amount,
      })),
      {
        id: 'project-created',
        type: 'project',
        date: project.createdAt,
        title: 'Project created',
        description: 'Project was created',
      },
      ...(project.updatedAt !== project.createdAt ? [{
        id: 'project-updated',
        type: 'project',
        date: project.updatedAt,
        title: 'Project updated',
        description: 'Project details were updated',
      }] : []),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
    
    // Expenses over time (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const expensesOverTime = Array.from({ length: 30 }, (_, i) => {
      const date = addDays(thirtyDaysAgo, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dailyExpenses = expenses.filter((exp: Expense) => exp.date === dateStr);
      const total = dailyExpenses.reduce((sum: number, exp: Expense) => sum + parseFloat(exp.amount), 0);
      
      return {
        date: format(date, 'MMM dd'),
        amount: total,
        count: dailyExpenses.length,
      };
    });
    
    return {
      totalExpenses,
      remainingBudget,
      budgetUtilization,
      daysRemaining,
      timeElapsed,
      expensesByCategory,
      recentActivities,
      expensesOverTime,
    };
  }, [project, expenses]);

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (isError || !project) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error ? `Error loading project: ${JSON.stringify(error)}` : 'Project not found'}
      </Alert>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Box mb={3}>
        <Breadcrumbs aria-label="breadcrumb">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            color="inherit"
            size="small"
          >
            Back
          </Button>
          <Button component={RouterLink} to="/projects" color="inherit">
            Projects
          </Button>
          <Typography color="text.primary">{project.name}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Project header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Typography variant="h4" component="h1">
              {project.name}
            </Typography>
            <StatusChip status={project.status} />
          </Box>
          
          {project.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {project.description}
            </Typography>
          )}
          
          <Box display="flex" gap={3} mt={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}>
              <CalendarIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
              </Typography>
            </Box>
            
            {project.clientName && (
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {project.clientName}
                </Typography>
              </Box>
            )}
            
            {project.clientEmail && (
              <Box display="flex" alignItems="center" gap={1}>
                <EmailIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {project.clientEmail}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/projects/${project.id}/edit`)}
          >
            Edit
          </Button>
          
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => { navigate(`/projects/${project.id}/duplicate`); handleMenuClose(); }}>
              <FileCopyIcon fontSize="small" sx={{ mr: 1 }} />
              Duplicate Project
            </MenuItem>
            <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete Project
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Stats cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {project.totalBudget ? formatCurrency(project.totalBudget) : 'Not set'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {projectStats ? formatCurrency(projectStats.totalExpenses) : '$0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Remaining Budget
              </Typography>
              <Typography 
                variant="h5" 
                fontWeight="bold"
                color={projectStats && projectStats.remainingBudget < 0 ? 'error.main' : 'inherit'}
              >
                {projectStats ? formatCurrency(projectStats.remainingBudget) : '$0.00'}
                {projectStats && projectStats.remainingBudget < 0 && (
                  <Typography variant="caption" color="error" display="block">
                    Over budget!
                  </Typography>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Budget Utilization
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {projectStats ? projectStats.budgetUtilization.toFixed(1) : '0'}%
                </Typography>
              </Box>
              <Box position="relative" display="flex" alignItems="center">
                <Box width="100%" mr={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={projectStats ? Math.min(100, projectStats.budgetUtilization) : 0} 
                    color={projectStats && projectStats.budgetUtilization > 100 ? 'error' : 'primary'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Box>
              {projectStats && projectStats.daysRemaining !== null && (
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  {projectStats.daysRemaining} days remaining
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <span>Expenses</span>
                {expenses.length > 0 && (
                  <Chip 
                    label={expenses.length} 
                    size="small" 
                    sx={{ ml: 1, height: 20 }} 
                  />
                )}
              </Box>
            } 
            icon={<AttachMoneyIcon />} 
            iconPosition="start" 
          />
          <Tab label="Timeline" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Documents" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Team" icon={<PersonIcon />} iconPosition="start" />
        </Tabs>
        
        <Divider />
        
        {/* Tab content */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader 
                  title="Expenses Over Time" 
                  action={
                    <Button 
                      size="small" 
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(`/expenses/new?projectId=${project.id}`)}
                    >
                      Add Expense
                    </Button>
                  }
                />
                <Divider />
                <CardContent sx={{ height: 400 }}>
                  {expenses.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={projectStats?.expensesOverTime || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} itemStyle={{ color: '#333' }} labelStyle={{ color: '#333' }} formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="amount" name="Amount" fill={theme.palette.primary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box 
                      display="flex" 
                      flexDirection="column" 
                      alignItems="center" 
                      justifyContent="center" 
                      height="100%"
                      textAlign="center"
                      p={3}
                    >
                      <ReceiptIcon color="action" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No expenses yet
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Track your project expenses to see visualizations and insights here.
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(`/expenses/new?projectId=${project.id}`)}
                      >
                        Add Your First Expense
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Budget Breakdown" />
                <Divider />
                <CardContent sx={{ height: 400 }}>
                  {Object.keys(projectStats?.expensesByCategory || {}).length > 0 ? (
                    <Box height="100%" display="flex" flexDirection="column">
                      <Box flexGrow={1}>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={Object.entries(projectStats?.expensesByCategory || {}).map(([name, value]) => ({
                                name,
                                value: Number(value),
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {Object.keys(projectStats?.expensesByCategory || {}).map((_, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={[
                                    theme.palette.primary.main,
                                    theme.palette.secondary.main,
                                    theme.palette.success.main,
                                    theme.palette.error.main,
                                    theme.palette.warning.main,
                                    theme.palette.info.main,
                                  ][index % 6]} 
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} itemStyle={{ color: '#333' }} labelStyle={{ color: '#333' }} formatter={(value: number) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Categories
                        </Typography>
                        <List dense disablePadding>
                          {(Object.entries(projectStats?.expensesByCategory || {}) as [string, number][]).map(([category, amount]) => (
                            <ListItem key={category} disableGutters disablePadding>
                              <Box width="100%" display="flex" justifyContent="space-between">
                                <Typography variant="body2">{category}</Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {formatCurrency(Number(amount))}
                                </Typography>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </Box>
                  ) : (
                    <Box 
                      display="flex" 
                      flexDirection="column" 
                      alignItems="center" 
                      justifyContent="center" 
                      height="100%"
                      textAlign="center"
                      p={3}
                    >
                      <AttachMoneyIcon color="action" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body2" color="textSecondary">
                        No expense categories to display yet.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Recent Activities" />
                <Divider />
                <CardContent>
                  {projectStats?.recentActivities && projectStats.recentActivities.length > 0 ? (
                    <List disablePadding>
                      {projectStats.recentActivities.map((activity: any) => (
                        <ListItem key={`${activity.type}-${activity.id}`} divider>
                          <ListItemAvatar>
                            <Avatar>
                              {activity.type === 'expense' ? (
                                <ReceiptIcon />
                              ) : activity.type === 'project' ? (
                                <DescriptionIcon />
                              ) : (
                                <InfoIcon />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={activity.title}
                            secondary={
                              <>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                  display="block"
                                >
                                  {activity.description || 'No description'}
                                </Typography>
                                {format(parseISO(activity.date), 'PPpp')}
                                {activity.amount && (
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="primary"
                                    sx={{ ml: 1 }}
                                  >
                                    {formatCurrency(activity.amount)}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Typography variant="body2" color="textSecondary">
                        No recent activities to display.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Expenses tab */}
        <TabPanel value={tabValue} index={1}>
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Project Expenses
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/expenses/new?projectId=${project.id}`)}
            >
              Add Expense
            </Button>
          </Box>
          
          {expenses.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map((expense: Expense) => (
                    <TableRow key={expense.id} hover>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {expense.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={expense.category} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(expense.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={expense.status} 
                          size="small" 
                          color={
                            expense.status === 'approved' ? 'success' :
                            expense.status === 'pending' ? 'warning' :
                            'default'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/expenses/${expense.id}`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <ReceiptIcon color="action" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Expenses Yet
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Track your project expenses to keep your budget on track.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/expenses/new?projectId=${project.id}`)}
              >
                Add Your First Expense
              </Button>
            </Paper>
          )}
        </TabPanel>
        
        {/* Timeline tab */}
        <TabPanel value={tabValue} index={2}>
          <Box textAlign="center" py={4}>
            <TimelineIcon color="action" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Project Timeline
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Visual timeline and milestones coming soon.
            </Typography>
          </Box>
        </TabPanel>
        
        {/* Documents tab */}
        <TabPanel value={tabValue} index={3}>
          <Box textAlign="center" py={4}>
            <DescriptionIcon color="action" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Project Documents
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Upload and manage project documents here.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<NoteAddIcon />}
              onClick={() => {}}
              disabled
            >
              Upload Document
            </Button>
          </Box>
        </TabPanel>
        
        {/* Team tab */}
        <TabPanel value={tabValue} index={4}>
          <Box textAlign="center" py={4}>
            <PersonIcon color="action" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Project Team
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Manage team members and their roles for this project.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {}}
              disabled
            >
              Invite Team Member
            </Button>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Project notes */}
      {project.notes && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Project Notes" />
          <Divider />
          <CardContent>
            <Typography variant="body1" whiteSpace="pre-line">
              {project.notes}
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Project
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the project "{project.name}"? This action cannot be undone and will also delete all associated expenses.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            autoFocus
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProjectDetailPage;
