import React from 'react';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

interface MainNavbarProps {
  onSidebarOpen: () => void;
}

export const MainNavbar: React.FC<MainNavbarProps> = (props) => {
  const { onSidebarOpen, ...other } = props;

  return (
    <AppBar
      sx={{
        left: {
          lg: 280,
        },
        width: {
          lg: 'calc(100% - 280px)',
        },
      }}
      {...other}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: 64,
          left: 0,
          px: 2,
        }}
      >
        <IconButton
          onClick={onSidebarOpen}
          sx={{
            display: {
              xs: 'inline-flex',
              lg: 'none',
            },
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>
    </AppBar>
  );
};
