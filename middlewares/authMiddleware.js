// Import the necessary libraries and retrieve the secret key from environment variables
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

// function to require authentication for protected routes
function requireAuthMiddleware(req, res, next) {
    if (!req.session.auth) {
        return res.redirect('/auth/login');
    }
    // Verify the JWT token
    jwt.verify(req.cookies.token_jwt, secretKey, (err, decoded) => {
        if (err) {
            return res.redirect('/auth/login');
        } else {
            if (decoded.sessionId === req.session.sid) {
                req.decoded = decoded;
                next();
            } else {
                res.redirect('/auth/login');
            }
        }
    });
}

// Export the middleware function for use in protected routes
module.exports = requireAuthMiddleware;
