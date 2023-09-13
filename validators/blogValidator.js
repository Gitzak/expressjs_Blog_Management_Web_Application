const { check } = require('express-validator');

const addBlogValidator = (req, res, next) => {
    [
        check('title').notEmpty().withMessage('Tilte is required'),
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
    ]
};

module.exports = { addBlogValidator };