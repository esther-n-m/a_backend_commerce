//  REQUIRED MODULES 
require("dotenv").config(); //  Load environment variables first!
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");  
const errorHandler = require("./middleware/errorMiddleware"); // Assuming you have this for clean error handling

// Import all route files
const userRoutes = require("./routes/userRoutes"); 
const mpesaRoutes = require("./routes/mpesaRoutes");
const productRoutes = require("./routes/productRoutes"); 
const cartRoutes = require("./routes/cartRoutes"); // CRITICAL: Import your Cart routes


//  CONFIGURATION 
const app = express();
// Use process.env.PORT for dynamic port assignment on platforms like Render
const PORT = process.env.PORT || 5000;
// Use a placeholder for the live frontend URL; this will be set on Render
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"; 
let products = []; // Local product cache

//  DATABASE CONNECTION
mongoose
  
  .connect(process.env.MONGO_URI) // Uses the MONGO_URI environment variable
  .then(() => console.log(" MongoDB connected"))
  .catch((err) => console.error(" MongoDB connection error:", err));

// --- PRODUCTION-READY CORS CONFIGURATION ---
const corsOptions = {
  // Only allow requests from the specific frontend URL (set in Render) or localhost for testing.
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allow common HTTP methods
  credentials: true, // MUST be true for setting/reading cookies (like JWT) and sending headers
};

// --- MIDDLEWARE ---
app.use(cors(corsOptions));
app.use(express.json()); // Allows parsing of JSON request body
app.use(express.urlencoded({ extended: false })); // Allows parsing of URL-encoded data
app.use(cookieParser()); // Enables cookie parsing

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

//  CORRECTED ROUTE MOUNTING SECTION 


app.get("/", (req, res) => {
  res.send(" Pillows & Candles Backend is Running...");
});

// 1. PRODUCT ROUTES (Publicly accessible for fetching products)
// This links all routes defined in productRoutes.js (e.g., '/', '/:id') to the '/api/products' base path
app.use("/api/products", productRoutes);

// 2. USER ROUTES (Registration, Login)
app.use("/api/users", userRoutes);

// 3. CART ROUTES (Protected, requires token)
// This links all cart routes to the '/api/cart' base path
app.use("/api/cart", cartRoutes);

// 4. MPESA/PAYMENT ROUTES (Protected, requires token)
app.use("/api/mpesa", mpesaRoutes);


//  END CORRECTED ROUTE MOUNTING SECTION 



// Error Handling Middleware 
app.use(errorHandler);

//  START SERVER 
app.listen(PORT, () => console.log(` Server started on port ${PORT}`));