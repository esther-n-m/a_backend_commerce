/**
 * Authentication Middleware (protect.js)
 * * This middleware verifies the JWT sent by the client.
 * If the token is valid, it attaches the user's ID (req.user) to the request 
 * for use in protected routes like cartRoutes.
 */
const jwt = require('jsonwebtoken');
// IMPORTANT: We need access to the User model to fetch user details
const User = require('../models/User'); 

// Middleware function to protect routes
const protect = async (req, res, next) => {
    let token;

    // 1. Check for the token in the Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: "Bearer TOKEN")
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token using the secret key from .env
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Find user by ID embedded in the token payload
            // We select everything BUT the password field for security
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found.' });
            }

            // 4. Proceed to the next middleware or route handler
            next();

        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            // If verification fails (e.g., token expired or invalid signature)
            return res.status(401).json({ message: 'Not authorized, token failed or expired.' });
        }
    }

    if (!token) {
        // If no token is found at all
        res.status(401).json({ message: 'Not authorized, no token provided.' });
    }
};

module.exports = { protect };
