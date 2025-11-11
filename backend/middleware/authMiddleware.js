/*
 * Auth Middleware
 * Middleware to verify a JWT token from the request header 
 * and attach the authenticated user's ID to the request object (req.user).
 */
const jwt = require("jsonwebtoken");
// Note: This path assumes 'models' is a sibling directory to 'middleware' inside the backend folder.
const User = require("../models/User"); 
const asyncHandler = require("express-async-handler"); // Utility for handling async errors

/**
 * @desc Protects routes by checking for a valid JWT token in the Authorization header.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check for the token in the HttpOnly Cookie (NEW)
    if (req.cookies.token) {
        token = req.cookies.token;
    } 
    // 2. Fallback: Check the Authorization header (Existing Bearer token logic)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

  // If no token exists at all (i.e., header missing or not Bearer)
   if (!token) { 
    res.status(401); 
    throw new Error("Not authorized, no token found");
   } 
   try
    {
       // 2. Verify token using the secret key from .env 
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // 3. Find user by ID embedded in the token payload 
        req.user = await User.findById(decoded.id).select("-password"); 
        if (!req.user) 
          {
             res.status(401); 
          throw new Error("User not found: Invalid token payload"); 
        } 
        next(); 
          // 4. Proceed to the next middleware or route handler 
          } 
          catch (error) { 
            // Catch token failure (expired, invalid signature, etc.) 
            console.error("Token Verification Error:", error.message); 
            res.status(401); 
            throw new Error("Not authorized, token failed or expired"); }
});

module.exports = { protect };
