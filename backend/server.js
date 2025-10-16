//  REQUIRED MODULES 
require("dotenv").config(); //  Load environment variables first!
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");  
// const errorHandler = require("./middleware/errorMiddleware"); 

// Import all route files
const userRoutes = require("./routes/userRoutes"); 
const mpesaRoutes = require("./routes/mpesaRoutes");
const productRoutes = require("./routes/productRoutes"); 
const cartRoutes = require("./routes/cartRoutes"); 

//  CONFIGURATION 
const app = express();
const PORT = process.env.PORT || 5000;

// NEW: Use an array of allowed origins (e.g., comma-separated list in Render ENV)
// Default to common development and the primary Vercel domain.
const FRONTEND_URLS = (
  process.env.FRONTEND_URLS || 
  "http://localhost:3000,https://a-frontend-commerce.vercel.app" // Add more URLs here if needed
).split(',').map(s => s.trim());

let products = []; // Local product cache

// ... (DATABASE CONNECTION section)

// --- PRODUCTION-READY CORS CONFIGURATION (UPDATED) ---
const corsOptions = {
    // Dynamic origin check to support multiple domains (including Vercel previews)
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
        if (!origin) return callback(null, true);
        
        // 1. Check for an exact match in the allowed list
        if (FRONTEND_URLS.includes(origin)) {
            return callback(null, true);
        }

        // 2. Allow Vercel preview domains using a pattern check
        // This covers https://a-frontend-commerce-hqr0uzk4c-novas-projects-c6380da0.vercel.app
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        // 3. Block all other origins
        console.log(`CORS Policy Blocked Origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allow common HTTP methods
    credentials: true, // MUST be true for setting/reading cookies
};

//This exposes your physical 'images' folder at the public path '/images'
app.use('/images', express.static(path.join(__dirname, 'images')));


//  MIDDLEWARE 
app.use(cors(corsOptions));
app.use(express.json()); // Essential for POST requests (like adding to cart)
app.use(express.urlencoded({ extended: false })); // Essential for form data
app.use(cookieParser()); // Enables cookie parsing (used for JWTs)

//  LOAD PRODUCTS 
try {
  const dataPath = path.join(__dirname, "products.json");
  const productsJson = fs.readFileSync(dataPath, "utf8");
  products = JSON.parse(productsJson);
  console.log(` Loaded ${products.length} products successfully.`);
} catch (error) {
  console.error("Failed to load products.json. Check path or syntax.");
  console.error(error.message);
}


//ROUTE MOUNTING SECTION 
app.get("/", (req, res) => {
  res.send(" Pillows & Candles Backend is Running...");
});


// 1. PRODUCT ROUTES 
app.use("/api/products", productRoutes);

// 2. USER ROUTES 
app.use("/api/users", userRoutes);

// 3. CART ROUTES 
app.use("/api/cart", cartRoutes);

// 4. MPESA/PAYMENT ROUTES 
app.use("/api/mpesa", mpesaRoutes);

//  ERROR HANDLING MIDDLEWARE 
// This function catches all errors from routes and other middleware.
const errorHandler = (err, req, res, next) => {
    // If the status code is still 200 (OK), change it to 500 (Server Error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Send the error response
    res.json({
        message: err.message,
        // Only show stack trace if not in production
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

// Apply the error handler middleware (must be the last app.use)
app.use(errorHandler);


//  START SERVER 
app.listen(PORT, () => console.log(` Server started on port ${PORT}`));