import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const drawerWidth = 240;

const Navbar: React.FC = () => {
  return (
    <AppBar 
      position="fixed"
      sx={{
        width: `calc(100% - ${drawerWidth}px)`,
        ml: `${drawerWidth}px`,
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Dashboard
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
