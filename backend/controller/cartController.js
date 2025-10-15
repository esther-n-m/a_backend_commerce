const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart'); // Assuming the Cart model is one directory up
const products = require('../../products.json'); // Used to confirm product details

/**
 * Helper function to find a product in the local JSON data.
 * @param {number} productId The ID of the product.
 * @returns {object|undefined} The product object or undefined.
 */
const getProductDetails = (productId) => {
    return products.find(p => p.id === productId);
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private (Requires JWT via protect middleware)
const getCart = asyncHandler(async (req, res) => {
    // req.user is set by the protect middleware in authMiddleware.js
    const cart = await Cart.findOne({ userId: req.user.id });

    if (cart) {
        // Return the cart found in the database
        res.status(200).json(cart);
    } else {
        // If no cart exists, return an empty cart structure
        res.status(200).json({ userId: req.user.id, items: [], total: 0 });
    }
});

// @desc    Add or update an item in the cart
// @route   POST /api/cart
// @access  Private
const addItemToCart = asyncHandler(async (req, res) => {
    const { productId, quantity, size, scent } = req.body;

    // 1. Basic validation and finding product details
    if (!productId || !quantity || quantity < 1) {
        res.status(400);
        throw new Error('Product ID and a valid quantity (>= 1) are required.');
    }
    const productData = getProductDetails(productId);
    if (!productData) {
        res.status(404);
        throw new Error('Product not found with that ID.');
    }

    // 2. Determine unique identifier for the item (product ID + options)
    // This is crucial for products with options like size/scent.
    const uniqueItemKey = `${productId}-${size || 'none'}-${scent || 'none'}`;

    // 3. Find or create the user's cart
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
        // Create a new cart if one doesn't exist
        cart = await Cart.create({ userId: req.user.id, items: [] });
    }

    // 4. Check if item already exists in the cart (by its unique key)
    let itemIndex = cart.items.findIndex(
        item => `${item.productId}-${item.size || 'none'}-${item.scent || 'none'}` === uniqueItemKey
    );

    if (itemIndex > -1) {
        // Item exists: update quantity
        cart.items[itemIndex].quantity = quantity;
    } else {
        // Item does not exist: add a new item
        cart.items.push({
            productId: productData.id,
            name: productData.name,
            price: productData.price,
            quantity: quantity,
            size: size || null,
            scent: scent || null,
        });
    }

    // 5. Recalculate total (This should be done using a pre-save hook on the Cart model in a robust system)
    cart.total = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // 6. Save the updated cart
    await cart.save();
    res.status(200).json({ message: 'Cart updated successfully', cart });
});

// @desc    Clear the entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    // Delete the entire cart document for the authenticated user
    const result = await Cart.deleteOne({ userId: req.user.id });

    if (result.deletedCount === 0) {
        // Cart was already empty or didn't exist, which is fine for clearing
        res.status(200).json({ message: 'Cart was already empty or cleared successfully.', items: [], total: 0 });
        return;
    }

    res.status(200).json({ message: 'Cart cleared successfully.', items: [], total: 0 });
});

module.exports = {
    getCart,
    addItemToCart,
    clearCart,
};