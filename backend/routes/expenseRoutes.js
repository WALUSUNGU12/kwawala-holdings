const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { Op, fn, col, literal } = require('sequelize');
const { protect, authorize } = require('../middleware/auth');
const Project = require('../models/Project');
const Expense = require('../models/Expense');
const User = require('../models/User');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const whereClause = {};

    if (req.user.role === 'viewer') {
      whereClause.status = 'approved';
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [
        {
          model: Project,
          attributes: ['id', 'name', 'status'],
        },
        {
          model: User,
          as: 'addedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['date', 'DESC']],
    });

    return res.json({
      success: true,
      data: expenses,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      include: [
        {
          model: Project,
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'addedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.json({ success: true, data: expenses });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Add expense to project
// @route   POST /api/expenses
// @access  Private/Admin
router.post(
  '/',
  [
    protect,
    authorize('admin'),
    [
      check('projectId', 'Project ID is required').not().isEmpty(),
      check('amount', 'Amount is required and must be greater than 0').isFloat({ gt: 0 }),
      check('category', 'Category is required').not().isEmpty(),
      check('date', 'Date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { projectId, amount, category, description, date, receiptUrl } = req.body;

      // Check if project exists
      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Create expense
      const expense = await Expense.create({
        projectId,
        amount,
        category,
        description,
        date,
        receiptUrl,
        addedBy: req.user.id
      });

      // Get the created expense with user details
      const expenseWithUser = await Expense.findByPk(expense.id, {
        include: [
          {
            model: User,
            as: 'addedByUser',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: expenseWithUser
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @desc    Get all expenses for a project
// @route   GET /api/expenses/project/:projectId
// @access  Private
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, category } = req.query;

    // Check if user has access to the project
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (req.user.role === 'viewer' && project.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    // Build where clause
    const whereClause = { projectId };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Add category filter if provided
    if (category) {
      whereClause.category = category;
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'addedByUser',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['date', 'DESC']]
    });

    res.json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'addedByUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Project,
          attributes: ['id', 'name']
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findByPk(expense.projectId);
    if (req.user.role === 'viewer' && project.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this expense'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private/Admin
router.put(
  '/:id',
  [
    protect,
    authorize('admin')
  ],
  async (req, res) => {
    try {
      let expense = await Expense.findByPk(req.params.id);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      // Update expense
      expense = await expense.update(req.body);

      // Get the updated expense with user details
      const updatedExpense = await Expense.findByPk(expense.id, {
        include: [
          {
            model: User,
            as: 'addedByUser',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedExpense
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
router.delete(
  '/:id',
  [
    protect,
    authorize('admin')
  ],
  async (req, res) => {
    try {
      const expense = await Expense.findByPk(req.params.id);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      await expense.destroy();

      res.json({
        success: true,
        data: {}
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @desc    Get expense summary by category
// @route   GET /api/expenses/summary/:projectId
// @access  Private
router.get('/summary/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user has access to the project
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (req.user.role === 'viewer' && project.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    // Build where clause
    const whereClause = { projectId };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get expenses grouped by category
    const expensesByCategory = await Expense.findAll({
      where: whereClause,
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'expenseCount']
      ],
      group: ['category'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
    });

    // Get total expenses
    const totalExpenses = await Expense.sum('amount', {
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        byCategory: expensesByCategory,
        totalExpenses: totalExpenses || 0,
        project: {
          id: project.id,
          name: project.name,
          totalBudget: project.totalBudget
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get monthly expenses for a project
// @route   GET /api/expenses/project/:projectId/monthly
// @access  Private
router.get('/project/:projectId/monthly', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const monthlyExpenses = await Expense.findAll({
      attributes: [
        [fn('MONTH', col('date')), 'month'],
        [fn('SUM', col('amount')), 'total']
      ],
      where: {
        projectId,
        date: {
          [Op.and]: [
            { [Op.gte]: new Date(`${year}-01-01`) },
            { [Op.lt]: new Date(`${parseInt(year) + 1}-01-01`) }
          ]
        }
      },
      group: [fn('MONTH', col('date'))],
      order: [[fn('MONTH', col('date')), 'ASC']],
      raw: true
    });

    // Format the response to include all months with 0 for months with no expenses
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyExpenses.find(exp => parseInt(exp.month) === i + 1);
      return {
        month: i + 1,
        total: monthData ? parseFloat(monthData.total) : 0,
        year: parseInt(year)
      };
    });

    res.json({ success: true, data: months });
  } catch (err) {
    console.error('Error fetching monthly expenses:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @desc    Get annual expenses for a project
// @route   GET /api/expenses/project/:projectId/annual
// @access  Private
router.get('/project/:projectId/annual', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { years = 5 } = req.query;
    
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - years + 1;

    const annualExpenses = await Expense.findAll({
      attributes: [
        [fn('YEAR', col('date')), 'year'],
        [fn('SUM', col('amount')), 'total']
      ],
      where: {
        projectId,
        date: {
          [Op.and]: [
            { [Op.gte]: new Date(`${startYear}-01-01`) },
            { [Op.lt]: new Date(`${currentYear + 1}-01-01`) }
          ]
        }
      },
      group: [fn('YEAR', col('date'))],
      order: [[fn('YEAR', col('date')), 'ASC']],
      raw: true
    });

    // Format the response to include all years in the range
    const yearsData = [];
    for (let year = startYear; year <= currentYear; year++) {
      const yearData = annualExpenses.find(exp => parseInt(exp.year) === year);
      yearsData.push({
        year,
        total: yearData ? parseFloat(yearData.total) : 0
      });
    }

    res.json({ success: true, data: yearsData });
  } catch (err) {
    console.error('Error fetching annual expenses:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @desc    Get expense summary for all projects
// @route   GET /api/expenses/summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Get monthly summary for current year
    const monthlySummary = await Expense.findAll({
      attributes: [
        [fn('MONTH', col('date')), 'month'],
        [fn('SUM', col('amount')), 'total']
      ],
      where: {
        date: {
          [Op.and]: [
            { [Op.gte]: new Date(`${currentYear}-01-01`) },
            { [Op.lt]: new Date(`${currentYear + 1}-01-01`) }
          ]
        }
      },
      group: [fn('MONTH', col('date'))],
      raw: true
    });

    // Get annual summary for last 5 years
    const annualSummary = await Expense.findAll({
      attributes: [
        [fn('YEAR', col('date')), 'year'],
        [fn('SUM', col('amount')), 'total']
      ],
      where: {
        date: {
          [Op.gte]: new Date(`${currentYear - 4}-01-01`),
          [Op.lt]: new Date(`${currentYear + 1}-01-01`)
        }
      },
      group: [fn('YEAR', col('date'))],
      order: [[fn('YEAR', col('date')), 'ASC']],
      raw: true
    });

    // Get project-wise summary
    const projectSummary = await Project.findAll({
      attributes: [
        'id',
        'name',
        [
          literal('(SELECT SUM(amount) FROM expenses WHERE expenses.projectId = Project.id)'),
          'totalExpenses'
        ]
      ],
      order: [[literal('totalExpenses'), 'DESC']]
    });

    // Format monthly data to include all months
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlySummary.find(m => parseInt(m.month) === i + 1);
      return {
        month: i + 1,
        total: monthData ? parseFloat(monthData.total) : 0
      };
    });

    // Format annual data to include all years
    const annualData = [];
    for (let year = currentYear - 4; year <= currentYear; year++) {
      const yearData = annualSummary.find(y => parseInt(y.year) === year);
      annualData.push({
        year,
        total: yearData ? parseFloat(yearData.total) : 0
      });
    }

    res.json({
      success: true,
      data: {
        monthly: monthlyData,
        annual: annualData,
        projects: projectSummary
      }
    });
  } catch (err) {
    console.error('Error fetching expense summary:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
