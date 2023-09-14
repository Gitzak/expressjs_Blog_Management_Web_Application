// Import necessary libraries and modules
const express = require('express');
const articlesController = require('../controllers/articlesController');

// Create an Express Router for admin routes
const articlesRoutes = express.Router();

articlesRoutes.get('/', articlesController.renderArticles);

articlesRoutes.get('/:slug', articlesController.renderSingleArticle);

// Export the adminRouter for use in the application
module.exports = articlesRoutes;
