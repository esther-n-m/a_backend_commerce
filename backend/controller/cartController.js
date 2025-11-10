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
    const { productId, quantity, size, scent , image} = req.body;

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

const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const { itemId, quantity } = req.body; // itemId is the cart item's unique _id (sub-document ID)
    const newQuantity = parseInt(quantity, 10);

    if (newQuantity < 1 || isNaN(newQuantity)) {
        res.status(400);
        throw new Error("Quantity must be at least 1.");
    }

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
        res.status(404);
        throw new Error("Cart not found for this user.");
    }

    // Find the specific item in the items array by its unique _id
    const item = cart.items.find(item => item.id.toString() === itemId); 

    if (!item) {
        res.status(404);
        throw new Error("Item not found in cart.");
    }

    // Update the quantity
    item.quantity = newQuantity;

    // Recalculate total
    cart.total = cart.items.reduce((acc, currentItem) => acc + (currentItem.price * currentItem.quantity), 0);

    const updatedCart = await cart.save();

    res.status(200).json({
        message: "Cart item quantity updated successfully.",
        cart: updatedCart,
    });
});

// @desc    Clear the entire cart
// @route   DELETE /api/cart
// @access  Private

const removeItemFromCart = asyncHandler(async (req, res) => {
    const { itemId } = req.params; // This is the unique _id of the cart item

    // Find the cart by user ID
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
        res.status(404);
        throw new Error("Cart not found for this user.");
    }

    // Use Mongoose's .pull() method to remove the sub-document by its _id
    const originalItemCount = cart.items.length;
    cart.items.pull({ _id: itemId });

    if (cart.items.length === originalItemCount) {
        // If length hasn't changed, the item ID was not found
        res.status(404);
        throw new Error("Item not found in cart.");
    }

    // Recalculate and update the total after removal
    cart.total = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const updatedCart = await cart.save();

    res.status(200).json({
        message: "Item successfully removed from cart.",
        cart: updatedCart,
    });
});

const clearCart = asyncHandler(async (req, res) => {
    // Find and update the cart to set the items array to empty and total to zero
    const cart = await Cart.findOneAndUpdate(
        { userId: req.user.id }, // Use userId as per your model
        { $set: { items: [], total: 0 } }, // Explicitly set items to empty and total to 0
        { new: true, runValidators: true } // Return the new document
    );

    res.status(200).json({ 
        message: 'Cart cleared successfully.', 
        cart: { items: [], total: 0 } // Send a clean response
    });
});

module.exports = {
    getCart,
    addItemToCart,
    clearCart,
    updateCartItemQuantity, 
    removeItemFromCart,
};