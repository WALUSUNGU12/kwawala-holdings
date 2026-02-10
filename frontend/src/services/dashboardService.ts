import axios from 'axios';

// Using import.meta.env for Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/dashboard`
  : 'http://localhost:5000/api/dashboard';

// Common axios config with auth
const createAuthConfig = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout – prevents hanging forever
});

// ────────────────────────────────────────────────
// Types (exported so DashboardPage & other components can use them)
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalExpenses: number;
  budgetUtilization: number;    // percentage (0-100)
  totalBudget: number;
}

export type ProjectStatusData = Array<{
  name: string;     // e.g. "Active", "Completed", "On Hold"
  value: number;    // count of projects in that status
}>;

/**
 * Fetch main dashboard statistics
 * @param token JWT authentication token
 * @throws Error with status code information if request fails
 */
export const getDashboardStats = async (token: string): Promise<DashboardStats> => {
  try {
    const response = await axios.get<DashboardStats>(
      API_BASE_URL,
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 401) {
        throw new Error('Authentication failed – please log in again');
      }
      if (status === 403) {
        throw new Error('You do not have permission to view dashboard data');
      }
      if (status && status >= 500) {
        throw new Error('Server error – please try again later');
      }

      throw new Error(`Failed to fetch dashboard stats (${status || 'network'}): ${message}`);
    }

    throw new Error(`Unexpected error fetching dashboard stats: ${String(error)}`);
  }
};

/**
 * Fetch project status distribution for pie chart
 * @param token JWT authentication token
 * @throws Error with status code information if request fails
 */
export const getProjectStatusData = async (token: string): Promise<ProjectStatusData> => {
  try {
    const response = await axios.get<ProjectStatusData>(
      `${API_BASE_URL}/project-status`,
      createAuthConfig(token)
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 401) {
        throw new Error('Authentication failed – please log in again');
      }

      throw new Error(`Failed to fetch project status (${status || 'network'}): ${message}`);
    }

    throw new Error(`Unexpected error fetching project status: ${String(error)}`);
  }
};