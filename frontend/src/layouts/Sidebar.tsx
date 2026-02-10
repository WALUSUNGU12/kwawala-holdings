import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Divider,
  Drawer,
  Typography,
  useMediaQuery,
  Theme,
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  Receipt as ReceiptIcon,
  AdminPanelSettings as AdminIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { NavItem } from './NavItem';

const items = [
  {
    href: '/dashboard',
    icon: <DashboardIcon fontSize="small" />,
    title: 'Dashboard',
  },
  {
    href: '/projects',
    icon: <FolderIcon fontSize="small" />,
    title: 'Projects',
  },
  {
    href: '/expenses',
    icon: <ReceiptIcon fontSize="small" />,
    title: 'Expenses',
  },
  {
    href: '/admin',
    icon: <AdminIcon fontSize="small" />,
    title: 'Admin',
    adminOnly: true,
  },
  {
    href: '/profile',
    icon: <ProfileIcon fontSize="small" />,
    title: 'Profile',
  },
];

interface SidebarProps {
  onClose: () => void;
  open: boolean;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const { open, onClose } = props;
  const router = useLocation();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'), {
    defaultMatches: true,
    noSsr: false,
  });
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    // Optional: Redirect to login page after logout
    window.location.href = '/login';
  };

  useEffect(() => {
    if (open) {
      onClose();
    }
  }, [router.pathname]);

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <Typography color="inherit" variant="h5">
              Kwawala Holdings
            </Typography>
        </Box>
      </div>
      <Divider
        sx={{
          borderColor: '#2D3748',
          my: 3,
        }}
      />
      <Box sx={{ flexGrow: 1 }}>
        {items.map((item) => (
          <NavItem
            key={item.title}
            icon={item.icon}
            href={item.href}
            title={item.title}
          />
        ))}
      </Box>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'none',
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  if (lgUp) {
    return (
      <Drawer
        anchor="left"
        open
        PaperProps={{
          sx: {
            backgroundColor: 'neutral.900',
            color: '#FFFFFF',
            width: 280,
          },
        }}
        variant="permanent"
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="left"
      onClose={onClose}
      open={open}
      PaperProps={{
        sx: {
          backgroundColor: 'neutral.900',
          color: '#FFFFFF',
          width: 280,
        },
      }}
      sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
      variant="temporary"
    >
      {content}
    </Drawer>
  );
};
