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

  // 1. Check if the Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (format is "Bearer TOKEN")
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user associated with the token ID
      // Select('-password') excludes the password field from the returned user object
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401); // Unauthorized
        // Throwing an error here is caught by asyncHandler and handled below
        throw new Error("User not found: Invalid token payload"); 
      }

      // 4. Proceed to the next middleware or route handler
      next();
    } catch (error) {
      // Log the specific error and send a general unauthorized message
      console.error("Token Verification Error:", error.message);
      res.status(401); // Unauthorized
      throw new Error("Not authorized, token failed or expired");
    }
  }

  // If no token is found in the header
  if (!token) {
    res.status(401); // Unauthorized
    throw new Error("Not authorized, no token found");
  }
});

module.exports = { protect };
