// Import necessary libraries and modules
const express = require('express');
const { check } = require('express-validator');
const dashboardController = require('../controllers/dashboardController');
const blogsController = require('../controllers/blogsController');
const requireAuthMiddleware = require('../middlewares/authMiddleware');

// Create an Express Router for admin routes
const addminRouter = express.Router();

addminRouter.get('/', requireAuthMiddleware, dashboardController.renderDashboard);

// Export the adminRouter for use in the application
module.exports = addminRouter;
