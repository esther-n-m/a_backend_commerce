// routes/cartRoutes.js (OVERWRITE THIS FILE)

/*
 * Cart Routes (routes/cartRoutes.js)
 * Refactored to call controller functions directly (better MVC separation).
 */
const express = require("express");
const router = express.Router();
const {
    getCart,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCart
} = require("../controllers/cartController");

// Use the correct middleware file
const { protect } = require("../middleware/authMiddleware");

// Routes now call the imported controller functions directly
router.get("/", protect, getCart);
router.post("/", protect, addItemToCart);
router.put("/update/:itemId", protect, updateCartItemQuantity);
router.delete("/remove/:itemId", protect, removeItemFromCart);
router.delete("/clear", protect, clearCart);

module.exports = router;