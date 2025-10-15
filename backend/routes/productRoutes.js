/*
 * Product Routes (routes/productRoutes.js)
 * Defines public endpoints for fetching all products and individual product details.
 * It uses the 'productUtils' module to access the data from products.json.
 */
const express = require("express");
const router = express.Router();
// Import the utility functions to access the local product data
const { getProducts, getProductById } = require("../utils/productUtils");

/**
 * @route GET /api/products
 * @desc Get all products
 * @access Public
 */
router.get("/", (req, res) => {
  const products = getProducts();
  if (products.length > 0) {
    // Successfully loaded and sending all products
    res.json(products);
  } else {
    // If the utility failed to load products, return a 500 error
    res.status(500).json({ message: "Product data is unavailable. Check products.json file." });
  }
});

/**
 * @route GET /api/products/:id
 * @desc Get a single product by ID
 * @access Public
 */
router.get("/:id", (req, res) => {
  // Use req.params.id to get the ID from the URL (e.g., /api/products/1)
  const productId = req.params.id;
  const product = getProductById(productId);

  if (product) {
    // Product found
    res.json(product);
  } else {
    // Product not found with the given ID
    res.status(404).json({ message: `Product with ID ${productId} not found.` });
  }
});

module.exports = router;
