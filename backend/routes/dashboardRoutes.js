const express = require('express');
const { protect } = require('../middleware/auth');
const { getDashboardStats, getProjectStatus } = require('../controllers/dashboardController');

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// GET /api/dashboard
router.get('/', getDashboardStats);

// GET /api/dashboard/project-status
router.get('/project-status', getProjectStatus);

module.exports = router;
