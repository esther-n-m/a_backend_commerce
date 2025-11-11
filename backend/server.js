
require("dotenv").config(); // Load environment variables first!
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");  
// const errorHandler = require("./middleware/errorMiddleware"); // Assuming this is defined/imported elsewhere

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
        // Allow requests with no origin (like mobile apps, curl) and listed origins
        if (!origin || FRONTEND_URLS.includes(origin)) {
            callback(null, true);
        } else {
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
app.use('/images', express.static(path.join(__dirname, 'images')));


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


// Server Listener
const startServer = async () => {
    try {
        // Await Mongoose connection here (assuming this part is already in your file)
        // await mongoose.connect(process.env.MONGO_URI);
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

startServer();