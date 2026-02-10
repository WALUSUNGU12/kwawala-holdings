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

interface AnnualExpenseChartProps {
  data: Array<{ year: number; total: number }>;
  isLoading: boolean;
  height?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const AnnualExpenseChart: React.FC<AnnualExpenseChartProps> = ({
  data = [],
  isLoading,
  height = 300,
}) => {
  // Format data for the chart
  const chartData = data.map((item) => ({
    ...item,
    formattedTotal: formatCurrency(item.total),
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
          No annual expense data available
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, height }}>
      <Typography variant="h6" gutterBottom>
        Annual Expenses (Last 5 Years)
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
            height={50}
          />
          <YAxis
            tickFormatter={(value) => `MWK ${value.toLocaleString()}`}
            width={100}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), 'Total']}
            labelFormatter={(label) => `Year: ${label}`}
          />
          <Legend />
          <Bar
            dataKey="total"
            name="Total Expenses"
            fill="#82ca9d"
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};
