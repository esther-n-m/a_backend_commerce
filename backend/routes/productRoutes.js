/*
 * Product Routes (routes/productRoutes.js)
 * Defines public endpoints for fetching all products and individual product details.
 * It uses the 'productUtils' module to access the data from products.json.
 */
// routes/productRoutes.js (OVERWRITE THIS FILE)

/*
 * Product Routes: Now queries the MongoDB 'Product' model directly.
 */
const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler"); // Use this for all async route handlers
const Product = require("../models/Product"); // Import the new Mongoose Product Model

/**
 * @route GET /api/products
 * @desc Get all products from MongoDB
 * @access Public
 */
router.get("/", asyncHandler(async (req, res) => {
  // Simple query to fetch all products from the database
  const products = await Product.find({});

  if (products && products.length > 0) {
    res.json(products);
  } else {
    // Return 200 with an empty array if the database has no products yet (e.g., before seeding)
    res.json([]); 
  }
}));

/**
 * @route GET /api/products/:id
 * @desc Get a single product by MongoDB _id
 * @access Public
 */
router.get("/:id", asyncHandler(async (req, res) => {
  const productId = req.params.id;
  
  // Find a product by its MongoDB ObjectId
  const product = await Product.findById(productId);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found with that ID.");
  }
}));

module.exports = router;