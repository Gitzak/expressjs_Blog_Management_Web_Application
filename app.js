const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressLayout = require('express-ejs-layouts');
const path = require('path');
const methodOverride = require('method-override');
const flash = require('connect-flash')


// Load environment variables from .env
dotenv.config();

// JWT secret key
const secretKey = process.env.SECRET_KEY;

const port = process.env.PORT || 8500;

const app = express();

const oneDay = 1000 * 60 * 60 * 24;

// Middlewares
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(
    session({
        secret: secretKey,
        resave: false,
        saveUninitialized: true,
        cookie: { path: '/', httpOnly: true, secure: false, maxAge: oneDay }
    })
);
app.use(flash());

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(expressLayout);
app.set('layout', './layouts/main_app');
app.set('views', path.join(__dirname, './views'));

// Include the root route
const rootRoutes = require('./routes/rootRoutes');
app.use('/', rootRoutes);

// Include authentication routes from the "auth" folder
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/dashboard', adminRoutes);

const blogsRoutes = require('./routes/blogsRoutes');
app.use('/blogs', blogsRoutes);

const articlesRoutes = require('./routes/articlesRoutes');
app.use('/articles', articlesRoutes);

// Start the server on port 3000
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
