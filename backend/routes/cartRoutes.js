/*
 * Cart Routes (routes/cartRoutes.js)
 * Implements the secure API endpoints for all shopping cart operations (CRUD).
 * All routes are protected and require a valid user token.
 */
const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");

// Core Dependencies
const { protect } = require("../middleware/authMiddleware");
const Cart = require("../models/Cart"); // Uses the Cart model you provided
const { getProductById } = require("../utils/productUtils"); // Needs the product data utility

/**
 * @route GET /api/cart
 * @desc Fetch the authenticated user's cart (creates one if it doesn't exist)
 * @access Private
 */
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    // Find the cart document linked to the authenticated user's ID
    let cart = await Cart.findOne({ user: req.user.id });

    if (cart) {
      // Cart found, send it back
      res.json(cart);
    } else {
      // No cart found for this user, create an empty one and save it
      cart = await Cart.create({
        user: req.user.id,
        items: [],
      });
      res.status(200).json(cart);
    }
  })
);

/**
 * @route POST /api/cart/add
 * @desc Add a new item (or increase quantity of existing item) to the cart
 * @access Private
 */
router.post(
  "/add",
  protect,
  asyncHandler(async (req, res) => {
    const { productId, quantity = 1, options = {} } = req.body;

    if (!productId) {
      res.status(400);
      throw new Error("Missing required field: productId");
    }

    // 1. Fetch current cart, creating it if necessary
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // 2. Look up product details using utility (for price, name, image, etc.)
    const productDetails = getProductById(productId);

    if (!productDetails) {
      res.status(404);
      throw new Error(`Product with ID ${productId} not found.`);
    }

    // 3. Check if item already exists in the cart (matching productId and options)
    const existingItemIndex = cart.items.findIndex((item) => {
      // This is a simple comparison, but more robust checks might be needed for complex options
      const optionsMatch = JSON.stringify(item.options || {}) === JSON.stringify(options || {});
      return item.productId === parseInt(productId) && optionsMatch;
    });

    if (existingItemIndex > -1) {
      // Item exists: increase quantity
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Item is new: add to cart's items array
      cart.items.push({
        productId: productDetails.id,
        name: productDetails.name,
        price: productDetails.price,
        image: productDetails.image,
        quantity: parseInt(quantity),
        options: options, // Save selected options
      });
    }

    // 4. Save the updated cart and return the result
    cart.updatedAt = Date.now();
    const updatedCart = await cart.save();
    res.status(200).json(updatedCart);
  })
);

/**
 * @route PUT /api/cart/update-quantity
 * @desc Update the quantity of a specific item in the cart
 * @access Private
 */
router.put(
  "/update-quantity",
  protect,
  asyncHandler(async (req, res) => {
    const { itemId, newQuantity } = req.body; // itemId is the _id of the item in the 'items' array

    if (!itemId || newQuantity === undefined || newQuantity < 1) {
      res.status(400);
      throw new Error("Invalid item ID or quantity.");
    }

    // Find the cart by user ID
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      res.status(404);
      throw new Error("Cart not found for this user.");
    }

    // Find the specific item within the cart's items array using the sub-document _id
    const item = cart.items.id(itemId);

    if (!item) {
      res.status(404);
      throw new Error("Item not found in cart.");
    }

    // Update quantity
    item.quantity = parseInt(newQuantity);

    // Save the updated cart and return the result
    cart.updatedAt = Date.now();
    const updatedCart = await cart.save();
    res.status(200).json(updatedCart);
  })
);

/**
 * @route DELETE /api/cart/remove/:itemId
 * @desc Remove a specific item entirely from the cart
 * @access Private
 */
router.delete(
  "/remove/:itemId",
  protect,
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    // Find the cart by user ID
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      res.status(404);
      throw new Error("Cart not found for this user.");
    }

    // Use Mongoose's .pull() method to remove the sub-document by its _id
    // This is equivalent to removing the item from the array
    cart.items.pull({ _id: itemId });

    // Save the updated cart
    cart.updatedAt = Date.now();
    const updatedCart = await cart.save();

    res.status(200).json({
      message: "Item successfully removed from cart.",
      cart: updatedCart,
    });
  })
);

/**
 * @route DELETE /api/cart/clear
 * @desc Remove all items from the cart
 * @access Private
 */
router.delete(
  "/clear",
  protect,
  asyncHandler(async (req, res) => {
    // Find and update the cart to set the items array to empty
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], updatedAt: Date.now() },
      { new: true, runValidators: true } // Return the new document
    );

    if (!cart) {
      res.status(404);
      throw new Error("Cart not found for this user.");
    }

    res.status(200).json({
      message: "Cart cleared successfully.",
      cart: cart,
    });
  })
);

module.exports = router;