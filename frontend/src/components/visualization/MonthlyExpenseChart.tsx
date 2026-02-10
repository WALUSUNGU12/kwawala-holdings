import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';

interface MonthlyExpenseChartProps {
  data: Array<{ month: number; total: number }>;
  isLoading: boolean;
  height?: number;
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const MonthlyExpenseChart: React.FC<MonthlyExpenseChartProps> = ({
  data = [],
  isLoading,
  height = 300
}) => {
  // Transform data to include month names and format for the chart
  const chartData = data.map(item => ({
    ...item,
    monthName: monthNames[item.month - 1] || `Month ${item.month}`,
    formattedTotal: formatCurrency(item.total)
  }));

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <Typography variant="body1" color="textSecondary">
          No monthly expense data available
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, height }}>
      <Typography variant="h6" gutterBottom>
        Monthly Expenses
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="monthName" 
            angle={-45} 
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tickFormatter={(value) => `MWK ${value.toLocaleString()}`}
            width={100}
          />
          <Tooltip 
            formatter={(value) => [formatCurrency(Number(value)), 'Total']}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Legend />
          <Bar 
            dataKey="total" 
            name="Total Expenses" 
            fill="#8884d8" 
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};
