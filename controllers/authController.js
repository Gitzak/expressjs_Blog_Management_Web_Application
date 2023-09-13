const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const axios = require('axios');

const secretKey = process.env.SECRET_KEY;

const urlUsers = 'http://localhost:3000/users'

async function checkAuthenticated(req, res, next) {
    if (req.session.auth) {
        try {
            const response = await axios.get(urlUsers);
            const users = response.data;

            jwt.verify(req.cookies.token_jwt, secretKey, (err, decoded) => {
                if (err) {
                    next();
                } else {
                    if (decoded.sessionId !== req.session.sid) {
                        next();
                    }
                    res.redirect('/dashboard');
                }
            });
        } catch (error) {
            console.error(error);
            next();
        }
    } else {
        next();
    }
}

function renderRegisterPage(req, res) {
    const locals = {
        title: "Create an Account!",
    };
    res.render('auth/register', { errors: [], message: '', layout: 'layouts/main_auth', locals: locals });
}

async function registerUser(req, res) {
    const locals = {
        title: "Create an Account!",
    };

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('auth/register', { errors: errors.array(), message: '', layout: 'layouts/main_auth', locals: locals });
    }

    const { username, password, email } = req.body;

    try {
        const response = await axios.get(urlUsers);
        const users = response.data;

        const userExists = users.find(user => user.username === username || user.email === email);
        if (userExists) {
            return res.render('auth/register', {
                errors: [],
                message: 'Username or email already exists. Please choose different ones.',
                layout: 'layouts/main_auth',
                locals: locals
            });
        }

        const avatar = req.file;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            username,
            password: hashedPassword,
            email,
            avatar: avatar ? avatar.filename : null,
        };

        await axios.post(urlUsers, newUser);

        const sessionId = req.session.sid;

        const token = jwt.sign({ user: newUser, sessionId }, secretKey, { expiresIn: '1d' });
        res.cookie('token_jwt', token);

        req.session.auth = true;

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.render('error', { message: 'Registration failed', layout: 'layouts/main' });
    }
}

function renderLoginPage(req, res) {
    const locals = {
        title: "Login",
    };
    res.render('auth/login', { errors: [], message: '', layout: 'layouts/main_auth', locals: locals });
}

async function loginUser(req, res) {
    const locals = {
        title: "Login",
    };

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('auth/login', { errors: errors.array(), message: '', layout: 'layouts/main_auth', locals: locals });
    }

    const { email, password } = req.body;

    try {
        const response = await axios.get(urlUsers);
        const users = response.data;

        const user = users.find(user => user.email === email);

        if (!user) {
            return res.render('auth/login', {
                errors: [],
                message: 'User not found.',
                layout: 'layouts/main_auth',
                locals: locals
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.render('auth/login', {
                errors: [],
                message: 'Invalid password.',
                layout: 'layouts/main_auth',
                locals: locals
            });
        }

        delete user.password;

        const sessionId = req.session.sid;

        const token = jwt.sign({ user, sessionId }, secretKey, { expiresIn: '1d' });
        res.cookie('token_jwt', token);

        req.session.auth = true;

        res.redirect('/blogs');
    } catch (error) {
        console.error(error);
        res.render('error', { message: 'Login failed', layout: 'layouts/main' });
    }
}

function logoutUser(req, res) {
    req.session.destroy();
    res.clearCookie('token_jwt');
    res.redirect('/auth/login');
}

module.exports = {
    checkAuthenticated,
    renderRegisterPage,
    registerUser,
    renderLoginPage,
    loginUser,
    logoutUser,
};
