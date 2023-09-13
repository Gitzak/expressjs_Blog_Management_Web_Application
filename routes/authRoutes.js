// Import necessary libraries and modules
const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const configureStorage = require('../middlewares/multerMiddleware');

// Create an Express Router for authentication routes
const authRouter = express.Router();

// Define routes for registration
authRouter.get('/register', authController.checkAuthenticated, authController.renderRegisterPage);

const destinationPath = '../public/img/avatar';
const upload = configureStorage(destinationPath);
authRouter.post('/register', upload.single('image'), [
    check('username').notEmpty().withMessage('Username is required'),
    check('password').notEmpty().withMessage('Password is required'),
    check('email').isEmail().withMessage('Invalid email address'),
    // Custom validation for the uploaded image
    check('image').custom((value, { req }) => {
        if (!req.file) {
            return true;
        }
        // Check the file type (PNG, JPEG, JPG)
        const allowedFileTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedFileTypes.includes(req.file.mimetype)) {
            throw new Error('Invalid file type. Only PNG, JPEG, and JPG are allowed');
        }
        return true;
    }),
], authController.registerUser);

// Define routes for login
authRouter.get('/login', authController.checkAuthenticated, authController.renderLoginPage);

authRouter.post('/login', [
    check('email').notEmpty().withMessage('Email is required'),
    check('password').notEmpty().withMessage('Password is required'),
], authController.loginUser);

// Define a route for logout
authRouter.get('/logout', authController.logoutUser);

// Export the authRouter for use in the application
module.exports = authRouter;
