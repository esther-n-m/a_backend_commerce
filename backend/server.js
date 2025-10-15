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
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"; 
let products = []; // Local product cache

//  DATABASE CONNECTION
mongoose
  
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch((err) => console.error(" MongoDB connection error:", err));

//  PRODUCTION-READY CORS CONFIGURATION 
const corsOptions = {
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true, 
};

//  MIDDLEWARE 
app.use(cors(corsOptions));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 
app.use(cookieParser()); 

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