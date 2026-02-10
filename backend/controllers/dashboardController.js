const { Project, Expense } = require('../models');
const asyncHandler = require('express-async-handler');
const { sequelize } = require('../config/db');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Get total number of projects
    const totalProjects = await Project.count({
      where: { createdBy: req.user.id }
    });

    // Get active projects (not completed or on hold)
    const activeProjects = await Project.count({
      where: {
        createdBy: req.user.id,
        status: 'active'
      }
    });

    // Get total expenses across all projects
    const totalExpensesResult = await Expense.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      include: [{
        model: Project,
        where: { createdBy: req.user.id },
        attributes: []
      }],
      raw: true
    });

    const totalExpenses = parseFloat(totalExpensesResult?.totalAmount || 0);

    // Calculate budget utilization (assuming projects have a budget field)
    const projectsWithBudget = await Project.findAll({
      where: { createdBy: req.user.id },
      attributes: ['totalBudget']
    });

    const totalBudget = projectsWithBudget.reduce((sum, project) => {
      return sum + (parseFloat(project.totalBudget) || 0);
    }, 0);

    const budgetUtilization = totalBudget > 0 
      ? (totalExpenses / totalBudget) * 100 
      : 0;

    res.json({
      totalProjects,
      activeProjects,
      totalExpenses,
      budgetUtilization: parseFloat(budgetUtilization.toFixed(2)),
      totalBudget
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get project status distribution
// @route   GET /api/dashboard/project-status
// @access  Private
const getProjectStatus = asyncHandler(async (req, res) => {
  try {
    const statusCounts = await Project.findAll({
      where: { createdBy: req.user.id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Map status to user-friendly names
    const statusMap = {
      'active': 'Active',
      'inactive': 'Inactive',
      'completed': 'Completed',
      'on_hold': 'On Hold'
    };

    const result = statusCounts.map(item => ({
      name: statusMap[item.status] || item.status,
      value: parseInt(item.count, 10)
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching project status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = {
  getDashboardStats,
  getProjectStatus
};
