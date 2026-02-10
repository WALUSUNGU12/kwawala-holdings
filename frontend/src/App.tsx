import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from './features/auth/authSlice';
import { setAuthToken } from './features/auth/authApi';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import MainLayout from './layouts/MainLayout';

// Pages
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectForm from './components/ProjectForm';
import ExpenseForm from './components/ExpenseForm';
import ExpensesPage from './pages/ExpensesPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import LandingPage from './pages/LandingPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Initialize auth token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage />
              )
            }
          />
        </Route>

        {/* Protected Routes - Wrapped in MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout><Outlet /></MainLayout>}>

          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/new" element={
            <ProjectForm 
              onClose={() => window.history.back()} 
              project={null} 
              onSuccess={() => window.location.href = '/projects'}
            />
          } />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/edit" element={
            <ProjectForm 
              onClose={() => window.history.back()}
              project={null}
              onSuccess={() => window.location.href = '/projects'}
            />
          } />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="expenses/new" element={<ExpenseForm />} />
          <Route path="expenses/:id/edit" element={<ExpenseForm />} />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* Admin Only Route */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="admin/*" element={<AdminPage />} />
          </Route>
        </Route>
        </Route>

        {/* Public Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
