//  REQUIRED MODULES 
require("dotenv").config(); //  Load environment variables first!
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");  
const userRoutes = require("./routes/userRoutes"); 
const mpesaRoutes = require("./routes/mpesaRoutes");
// Assuming you have a cartRoutes file that defines the cart API
const cartRoutes = require("./routes/cartRoutes"); 

//  CONFIGURATION 
const app = express();
const PORT = process.env.PORT || 5000;
let products = [];

//  DATABASE CONNECTION
mongoose
  
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch((err) => console.error(" MongoDB connection error:", err));

//  MIDDLEWARE 
app.use(express.json());
// Allow all origins for CORS during development/testing
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());// Use of cookie-parser middleware

// Serve static images safely
app.use("/images", express.static(path.join(__dirname, "images")));

//  LOAD LOCAL PRODUCTS 
try {
  const dataPath = path.join(__dirname, "products.json");
  // Check if file exists to prevent hard crash
  if (fs.existsSync(dataPath)) {
    const productsJson = fs.readFileSync(dataPath, "utf8");
    products = JSON.parse(productsJson);
    console.log(` Loaded ${products.length} products successfully.`);
  } else {
    console.error("products.json not found. Product routes will return empty array.");
  }
} catch (error) {
  console.error("Failed to load products.json. Check path or syntax.");
  console.error(error.message);
}

//  ROUTES 
app.get("/", (req, res) => {
  res.send(" Pillows & Candles Backend is Running...");
});

//  Link User Routes to the server
app.use("/api/users", userRoutes); 

//  Link Mpesa Routes to the server
app.use("/api/mpesa", mpesaRoutes); 

//  Link Cart Routes to the server
app.use("/api/cart", cartRoutes); 

// --- NEW ROUTE: Get All Products ---
app.get("/api/products", (req, res) => {
    // Returns the entire array of products loaded from the JSON file
    res.status(200).json(products);
});

//  EXISTING ROUTE: Get Single Product
app.get("/api/products/:id", (req, res) => {
    // Extract the ID from the URL parameters and ensure it's treated as a number
    const productId = parseInt(req.params.id);

    // Find the product in the local array
    const product = products.find(p => p.id === productId);

    if (product) {
        // If the product is found, return it
        res.status(200).json(product);
    } else {
        // If no product matches the ID, return a 404
        res.status(404).json({ message: "Product not found" });
    }
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || "An unexpected server error occurred.",
  });
});

//  START SERVER
app.listen(PORT, () => console.log(` Pillows & Candles Backend running on port ${PORT}`));
