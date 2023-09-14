// Import necessary libraries and modules
const express = require('express');
const { check } = require('express-validator');
const dashboardController = require('../controllers/dashboardController');
const blogsController = require('../controllers/blogsController');
const requireAuthMiddleware = require('../middlewares/authMiddleware');
const blogValidator = require('../validators/blogValidator');
const configureStorage = require('../middlewares/multerMiddleware');

// Create an Express Router for admin routes
const blogsRoutes = express.Router();

blogsRoutes.get('/', requireAuthMiddleware, blogsController.renderBlogs);

blogsRoutes.get('/create', requireAuthMiddleware, blogsController.renderCreateBlog);

const destinationPath = '../public/img/blogs';
const upload = configureStorage(destinationPath);

blogsRoutes.post('/add-blog', upload.single('image'), requireAuthMiddleware, [
    check('title').notEmpty().withMessage('Tilte is required'),
    check('content').notEmpty().withMessage('Content is required'),
], blogsController.addBlog);

blogsRoutes.get('/edit/:id', requireAuthMiddleware, blogsController.renderEditBlog);

blogsRoutes.put('/edit/:id', upload.single('image'), requireAuthMiddleware, [
    check('title').notEmpty().withMessage('Tilte is required'),
    check('content').notEmpty().withMessage('Content is required'),
], blogsController.editBlog);

blogsRoutes.post('/delete/:id', requireAuthMiddleware, blogsController.deleteBlog);

// Export the adminRouter for use in the application
module.exports = blogsRoutes;
