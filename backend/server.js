
require("dotenv").config(); // Load environment variables first!
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");  
// const errorHandler = require("./middleware/errorMiddleware"); // Assuming this is defined/imported elsewhere
const path = require('path'); // Node.js built-in module for working with file and directory paths

const Product = require("./models/Product"); // Adjust path if needed
const productsData = require('./products.json');

// Function to run the product import
const importData = async () => {
    try {
        // Check if the products collection is already populated
        const productCount = await Product.countDocuments();
        if (productCount > 0) {
             console.log(`Products collection already has ${productCount} items. Skipping initial import.`);
             return; // Exit if data is already present
        }

        // Delete existing data (optional, but good for clean start)
        await Product.deleteMany({}); 

        // Insert all products from the JSON file
        await Product.insertMany(productsData); 

        console.log(' Data Imported: Products collection created and populated.');

    } catch (error) {
        console.error(' Error during data import:', error.message);
    }
};

// Import all route files
const userRoutes = require("./routes/userRoutes"); 
const mpesaRoutes = require("./routes/mpesaRoutes");
const productRoutes = require("./routes/productRoutes"); 
const cartRoutes = require("./routes/cartRoutes"); 

//  CONFIGURATION 
const app = express();
const PORT = process.env.PORT || 5000;



// NEW: Use an array of allowed origins
const FRONTEND_URLS = (
  process.env.FRONTEND_URLS || 
  "http://localhost:3000,https://a-frontend-commerce.vercel.app" 
).split(',').map(s => s.trim());

// REMOVED: let products = []; // Local product cache is no longer needed

// ... (DATABASE CONNECTION section - Assume this connects to MongoDB)

// --- PRODUCTION-READY CORS CONFIGURATION (UPDATED) ---
const corsOptions = {
    // Dynamic origin check to support multiple domains
    origin: (origin, callback) => {
        
        // Check if the origin is explicitly allowed
        const isAllowed = FRONTEND_URLS.includes(origin);

        if (isAllowed) {
            //  Echo back the allowed origin string. 
            // This is required when credentials: true is set.
            callback(null, origin); 
            
        } else if (!origin) {
            // Allow requests with no origin (e.g., Postman, server-to-server)
            callback(null, true);
            
        } else {
            // Block all other origins
            callback(new Error('Not allowed by CORS'));
        }
    },
    // CRITICAL: Allows cookies/credentials to be sent (needed for HttpOnly cookie)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// --- MIDDLEWARE ---
app.use(cors(corsOptions));
app.use(express.json()); // Body parser for raw JSON
app.use(express.urlencoded({ extended: false })); // Body parser for form data
app.use(cookieParser()); // Cookie parser for accessing req.cookies.token
app.use('/images', express.static(path.join(__dirname, 'backend', 'images')));

// REMOVED: Local product file loading logic
/*
try {
  const dataPath = path.join(__dirname, "products.json");
  const productsJson = fs.readFileSync(dataPath, "utf8");
  products = JSON.parse(productsJson);
  console.log(` Loaded ${products.length} products successfully.`);
} catch (error) {
  console.error("Failed to load products.json. Check path or syntax.");
  console.error(error.message);
}
*/


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
// Assuming the error handler is correctly defined or imported
const errorHandler = (err, req, res, next) => {
    // If the status code is still 200 (OK), change it to 500 (Server Error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Send the error response
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};
app.use(errorHandler);


const connectDB = async () => {
    try {
        // git  CRITICAL FIX: Add the mongoose.connect call here
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};


// Server Listener
const startServer = async () => {
    try {
        // 1. AWAIT the successful database connection before starting the server
        await connectDB(); 

        await importData();

        // 2. Start the Express server
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        // If connectDB fails, it already handles exiting the process (exit(1))
        // This catch block is mostly for catastrophic server start failures now
        console.error(`Server Startup Error: ${error.message}`);
        process.exit(1);
    }
};

startServer();

