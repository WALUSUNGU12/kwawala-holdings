import React from 'react';
import { NavLink as RouterLink } from 'react-router-dom';
import { Box, Button, ListItem } from '@mui/material';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
}

export const NavItem: React.FC<NavItemProps> = (props) => {
  const { href, icon, title, ...others } = props;

  return (
    <ListItem
      disableGutters
      sx={{
        display: 'flex',
        mb: 0.5,
        py: 0,
        px: 2,
      }}
      {...others}
    >
      <Button
        component={RouterLink}
        to={href}
        startIcon={icon}
        disableRipple
        sx={{
          backgroundColor: 'rgba(255,255,255, 0.08)',
          borderRadius: 1,
          color: 'neutral.300',
          fontWeight: 'fontWeightBold',
          justifyContent: 'flex-start',
          px: 3,
          textAlign: 'left',
          textTransform: 'none',
          width: '100%',
          '&.active': {
            backgroundColor: 'rgba(255,255,255, 0.08)',
            color: 'secondary.main',
            fontWeight: 'fontWeightBold',
          },
          '& .MuiButton-startIcon': {
            color: 'neutral.400',
          },
          '&:hover': {
            backgroundColor: 'rgba(255,255,255, 0.08)',
          },
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          {title}
        </Box>
      </Button>
    </ListItem>
  );
};
