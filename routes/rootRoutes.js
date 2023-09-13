// Import necessary libraries and modules
const express = require('express');
const rootRoutes = express.Router();

rootRoutes.get('/', (req, res) => {
    if (req.session.auth) {
        if (req.cookies.token_jwt) {
            res.redirect('/dashboard');
        } else {
            res.redirect('/auth/login');
        }
    } else {
        res.redirect('/auth/login');
    }
});

module.exports = rootRoutes;