const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { protect, authorize } = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');
const Expense = require('../models/Expense');

// @desc    Get all projects with expenses for landing page
// @route   GET /api/projects/landing
// @access  Public
router.get('/landing', async (req, res) => {
  try {
    const projects = await Project.findAll({
      attributes: ['id', 'name', 'description', 'status', 'startDate', 'endDate'],
      include: [
        {
          model: Expense,
          as: 'expenses',
          attributes: ['id', 'amount', 'description', 'date'],
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate total expenses for each project
    const projectsWithTotals = projects.map(project => {
      const projectData = project.get({ plain: true });
      const totalExpenses = projectData.expenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount || 0), 0
      );
      
      return {
        ...projectData,
        totalExpenses: totalExpenses.toFixed(2)
      };
    });

    res.json({
      success: true,
      count: projectsWithTotals.length,
      data: projectsWithTotals
    });
  } catch (err) {
    console.error('Error in /api/projects/landing:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Admin
router.post(
  '/',
  [
    protect,
    authorize('admin'),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('startDate', 'Start date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Add user to req.body
      req.body.createdBy = req.user.id;

      const project = await Project.create(req.body);
      
      res.status(201).json({
        success: true,
        data: project
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // For admin, get all projects
    // For viewers, only get active projects
    let whereClause = {};
    if (req.user.role === 'viewer') {
      whereClause = {
        status: 'active'
      };
    }

    const projects = await Project.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Expense,
          as: 'expenses',
          include: [
            {
              model: User,
              as: 'addedByUser',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to the project
    if (req.user.role === 'viewer' && project.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Admin
router.put(
  '/:id',
  [
    protect,
    authorize('admin')
  ],
  async (req, res) => {
    try {
      let project = await Project.findByPk(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Update project
      project = await project.update(req.body);

      res.json({
        success: true,
        data: project
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
router.delete(
  '/:id',
  [
    protect,
    authorize('admin')
  ],
  async (req, res) => {
    try {
      const project = await Project.findByPk(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      await project.destroy();

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

// @desc    Get projects summary
// @route   GET /api/projects/summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'viewer') {
      whereClause = {
        status: 'active'
      };
    }

    const projects = await Project.findAll({
      where: whereClause,
      include: [
        {
          model: Expense,
          as: 'expenses',
          attributes: ['amount']
        }
      ]
    });

    const summary = projects.map(project => {
      const totalExpenses = project.expenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount || 0),
        0
      );

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        totalBudget: project.totalBudget,
        totalExpenses,
        remainingBudget: project.totalBudget ? project.totalBudget - totalExpenses : null,
        startDate: project.startDate,
        endDate: project.endDate
      };
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
