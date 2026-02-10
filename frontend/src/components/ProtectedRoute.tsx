import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, setCredentials, logout } from '../features/auth/authSlice';
import { useGetProfileQuery } from '../features/auth/authApi';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'viewer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const shouldFetchProfile = Boolean(token) && !isAuthenticated;
  const { data: profileData, isFetching, isError } = useGetProfileQuery(undefined, {
    skip: !shouldFetchProfile,
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (profileData && token) {
      dispatch(setCredentials({ user: profileData, token }));
      setLoading(false);
    }
  }, [dispatch, profileData, token]);

  useEffect(() => {
    if (token && !isFetching && !profileData) {
      setLoading(false);
    }
  }, [isFetching, profileData, token]);

  useEffect(() => {
    if (isError) {
      dispatch(logout());
      setLoading(false);
    }
  }, [dispatch, isError]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" mt={2}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if the user has the required role
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to unauthorized page or dashboard
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // If authenticated and has required role, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
