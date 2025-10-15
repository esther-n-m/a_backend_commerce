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

//  CONFIGURATION 
const app = express();
// Use process.env.PORT for dynamic port assignment on platforms like Render
const PORT = process.env.PORT || 5000;
// Use a placeholder for the live frontend URL; this will be set on Render
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"; 
let products = [];

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

//  MIDDLEWARE 
app.use(express.json());
app.use(cors(corsOptions)); // Apply the restricted CORS configuration
app.use(cookieParser());// Use of cookie-parser middleware

// Serve static images safely
app.use("/images", express.static(path.join(__dirname, "images")));

//  LOAD LOCAL PRODUCTS 
try {
  const dataPath = path.join(__dirname, "products.json");
  const productsJson = fs.readFileSync(dataPath, "utf8");
  products = JSON.parse(productsJson);
  console.log(` Loaded ${products.length} products successfully.`);
} catch (error) {
  console.error("Failed to load products.json. Check path or syntax.");
  console.error(error.message);
}

//  ROUTES 
app.get("/", (req, res) => {
  res.send(" Pillows & Candles Backend is Running...");
});

// Route to fetch all products for the main page
app.get("/api/products", (req, res) => {
    // Since products are loaded locally, we can serve them directly
    res.json(products);
});

// Route to fetch a single product by ID
app.get("/api/products/:id", (req, res) => {
    // Extract the ID from the URL parameters and ensure it's treated as a number
    const productId = parseInt(req.params.id);

    // Find the product in the local array
    const product = products.find(p => p.id === productId);

    if (product) {
        // If the product is found, return it as JSON
        res.json(product);
    } else {
        // If not found, return a 404 error
        res.status(404).json({ message: "Product not found" });
    }
});


//  Link User Routes to the server
app.use("/api/users", userRoutes); 

//  Link Mpesa Routes to the server
app.use("/api/mpesa", mpesaRoutes); 


//  START SERVER 
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
