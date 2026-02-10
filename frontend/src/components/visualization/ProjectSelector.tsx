import React from 'react';
import { FormControl, InputLabel, MenuItem, Select, FormHelperText, Box, SelectChangeEvent } from '@mui/material';

interface ProjectSelectorProps {
  projects: Array<{ id: string; name: string }>;
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  isLoading?: boolean;
  label?: string;
  size?: 'small' | 'medium';
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProject,
  onProjectChange,
  isLoading = false,
  label = 'Select Project',
  size = 'medium',
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onProjectChange(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 200 }}>
      <FormControl fullWidth size={size} disabled={isLoading}>
        <InputLabel id="project-select-label">{label}</InputLabel>
        <Select
          labelId="project-select-label"
          id="project-select"
          value={selectedProject}
          label={label}
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>All Projects</em>
          </MenuItem>
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </Select>
        {isLoading && <FormHelperText>Loading projects...</FormHelperText>}
      </FormControl>
    </Box>
  );
};
