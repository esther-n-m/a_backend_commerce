/*
 * Product Utility Functions
 * Loads product data from products.json once and provides simple access functions.
 */
const fs = require("fs");
const path = require("path");

// Use a variable to store products loaded from the JSON file
let products = [];
// This path finds the 'products.json' file in the root directory (one level up from 'utils')
const dataPath = path.join(__dirname, "..", "products.json");

try {
  // Read the file synchronously when the module is loaded
  const productsJson = fs.readFileSync(dataPath, "utf8");
  products = JSON.parse(productsJson);
  console.log(`[Product Util] Loaded ${products.length} products successfully.`);
} catch (error) {
  console.error(
    "[Product Util] Failed to load products.json. Check path or syntax."
  );
  console.error(error.message);
}

/**
 * @desc Returns the entire list of products.
 * @returns {Array} An array of product objects.
 */
const getProducts = () => {
  return products;
};

/**
 * @desc Finds a product by its ID.
 * @param {number|string} id - The ID of the product to find.
 * @returns {Object|undefined} The product object or undefined if not found.
 */
const getProductById = (id) => {
  // Ensure the ID is treated as a number for comparison
  const productId = parseInt(id, 10);
  return products.find((p) => p.id === productId);
};

module.exports = {
  getProducts,
  getProductById,
};
