/*
 * User Routes
 * Defines API endpoints for user-related actions, including registration, login, and fetching a protected profile.
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler"); // Utility for handling async errors

// Dependencies
const User = require("../models/User"); 
const { protect } = require("../middleware/authMiddleware"); // CRITICAL: Import the authentication middleware

const router = express.Router();

// function to generate a JWT
const generateToken = (id) => {
    // Uses the secret key from your .env file
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d", // Token expires in 7 days
    });
};

// 1. POST /api/users/register - Handles new user creation
router.post("/register", asyncHandler(async (req, res) => {
    // Destructure name, email, and password from the request body
    const { name, email, password } = req.body;

    // A. Check if user already exists (using the email field)
    const existing = await User.findOne({ email });
    if (existing) {
        res.status(400); // Set status before throwing error
        throw new Error("User already exists with this email address.");
    }

    // Since the Mongoose pre-save hook in models/User.js handles the hashing,
    // we can simply create the user here.
    const newUser = await User.create({ 
      name, 
      email, 
      password // The User model will automatically hash this before saving!
    });

    if (newUser) {
      // D. Generate token and send response
      const token = generateToken(newUser._id);

      res.status(201).json({ 
        message: "User registered successfully!", 
        user: { id: newUser._id, name: newUser.name, email: newUser.email },
        token, // Send the token back after registration
      });
    } else {
        res.status(400);
        throw new Error("Invalid user data received.");
    }
}));


// 2. POST /api/users/login - Handles user sign-in
router.post("/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // A. Find the user by email (we need to explicitly select the password hash for comparison)
    const user = await User.findOne({ email }).select('+password'); 
    
    if (!user) {
        res.status(404);
        throw new Error("Invalid credentials (User not found).");
    }

    // B. Compare the provided password with the stored hashed password
    // This uses the matchPassword method defined in models/User.js
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
        res.status(401); // Use 401 Unauthorized for bad password
        throw new Error("Invalid credentials (Password mismatch).");
    }

    // C. Generate a JWT upon successful login
    const token = generateToken(user._id);

    // D. Send success response with token (exclude password when sending user data)
    res.json({ 
        message: "Login successful", 
        user: { id: user._id, name: user.name, email: user.email },
        token 
    });
}));


// 3. GET /api/users/profile - Fetches authenticated user details
// CRITICAL: This route uses the 'protect' middleware to ensure a valid token is present
/**
 * @route GET /api/users/profile
 * @desc Get user profile data
 * @access Private (Requires JWT token)
 */
router.get(
  "/profile",
  protect, // The protect middleware attaches the user object (req.user)
  asyncHandler(async (req, res) => {
    // The protect middleware ensures req.user is set and the password is NOT included
    if (req.user) {
      // We send the user object which contains ID, name, email, and createdAt
      res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      });
    } else {
      res.status(404);
      throw new Error("User not found in request context.");
    }
  })
);


// Export the router to be used in server.js
module.exports = router;
