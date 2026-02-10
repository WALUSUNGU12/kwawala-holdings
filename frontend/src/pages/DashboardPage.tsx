import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getDashboardStats, getProjectStatusData } from '../services/dashboardService';
import axios from 'axios';
import RefreshIcon from '@mui/icons-material/Refresh';

// Replace with your real auth hook/context
const useAuth = () => {
  // In real app → from context / RTK Query / Zustand / etc.
  return { token: localStorage.getItem('token') };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const formatCurrency = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  // For MWK: return `MWK ${value.toLocaleString('en-US')}`;
};

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalExpenses: number;
  budgetUtilization: number;
  totalBudget: number;
}

interface ProjectStatus {
  name: string;
  value: number;
}

interface ExpenseCategoryItem {
  name: string;
  amount: number;
}

interface RecentExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface RecentProject {
  id: string;
  name: string;
  status: string;
  totalBudget: number;
}

const DashboardPage = () => {
  const theme = useTheme();
  const { token } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalExpenses: 0,
    budgetUtilization: 0,
    totalBudget: 0,
  });

  const [projectStatusData, setProjectStatusData] = useState<ProjectStatus[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<ExpenseCategoryItem[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Please log in to view the dashboard');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statsRes, statusRes] = await Promise.all([
          getDashboardStats(token),
          getProjectStatusData(token),
        ]);

        setStats(statsRes);

        // Assuming getProjectStatusData returns array like [{name: "Active", value: 12}, ...]
        setProjectStatusData(statusRes || []);

        // Placeholder – in real app these should come from separate API calls
        // or be computed from real expense/project lists
        setExpenseByCategory([
          { name: 'Office', amount: statsRes.totalExpenses * 0.4 },
          { name: 'Travel', amount: statsRes.totalExpenses * 0.25 },
          { name: 'Equipment', amount: statsRes.totalExpenses * 0.2 },
          { name: 'Other', amount: statsRes.totalExpenses * 0.15 },
        ].filter(item => item.amount > 0));

        // Initialize empty arrays for recent items
        setRecentExpenses([]);
        setRecentProjects([]);
      } catch (err: unknown) {
        console.error('Dashboard fetch error:', err);

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            setError('Session expired. Please log in again.');
            localStorage.removeItem('token');
            // Optionally: navigate to login
            return;
          }
        }

        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={() => window.location.reload()}
          startIcon={<RefreshIcon />}
        >
          Refresh Data
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Projects
              </Typography>
              <Typography variant="h4">{stats.totalProjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Projects
              </Typography>
              <Typography variant="h4">{stats.activeProjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4">{formatCurrency(stats.totalExpenses, 'USD')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Budget Utilization
              </Typography>
              <Typography variant="h4">{stats.budgetUtilization.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 420 }}>
            <Typography variant="h6" gutterBottom>
              Expenses by Category
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={expenseByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(val: number) => [formatCurrency(val), 'Amount']} />
                <Legend />
                <Bar dataKey="amount" fill={theme.palette.primary.main} name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 420 }}>
            <Typography variant="h6" gutterBottom>
              Project Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={projectStatusData.length > 0 ? projectStatusData : [{ name: 'No data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={110}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(projectStatusData.length > 0 ? projectStatusData : [{ name: 'No data', value: 1 }]).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Items */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Expenses
            </Typography>
            <Divider sx={{ my: 2 }} />
            {recentExpenses.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No recent expenses found
              </Typography>
            ) : (
              recentExpenses.map((exp) => (
                <Box key={exp.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">{exp.description}</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      {formatCurrency(exp.amount)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      {exp.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(exp.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Projects
            </Typography>
            <Divider sx={{ my: 2 }} />
            {recentProjects.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No recent projects
              </Typography>
            ) : (
              recentProjects.map((proj) => (
                <Box key={proj.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1">{proj.name}</Typography>
                  <Box display="flex" justifyContent="space-between" mt={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {proj.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {proj.totalBudget ? formatCurrency(proj.totalBudget) : '—'}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;