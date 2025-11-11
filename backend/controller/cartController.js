// controllers/cartController.js (OVERWRITE THIS FILE)

/*
 * Cart Controller: UPDATED to use Mongoose .populate() and the Product Model.
 * Removed dependency on products.json and the getProductDetails helper.
 */
const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart'); 
const Product = require('../models/Product'); // Import the Product Model

// Helper function to calculate cart total (stays the same)
const calculateTotal = (items) => {
    return items.reduce((acc, item) => acc + (item.productId.price * item.quantity), 0);
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private 
const getCart = asyncHandler(async (req, res) => {
    // Use .populate('items.productId') to fetch all product details 
    // and replace the productId with the full Product document.
    let cart = await Cart.findOne({ user: req.user.id })
        .populate({
            path: 'items.productId',
            model: 'Product', // Ensure this matches the model name in Product.js
            select: 'name price image category', // Only select the fields needed for the cart
        });

    if (!cart) {
        // If no cart exists, create a new one to ensure the user always has a cart document
        cart = await Cart.create({ user: req.user.id, items: [], total: 0 });
    }

    // Since items are now populated, they have 'productId.price' and 'productId.name'
    // Recalculate total to ensure accuracy based on current product prices
    cart.total = calculateTotal(cart.items);
    await cart.save(); // Save the recalculation (optional, but good practice)

    res.status(200).json(cart);
});


// @desc    Add or update an item in the cart
// @route   POST /api/cart
// @access  Private
const addItemToCart = asyncHandler(async (req, res) => {
    // Only productId, quantity, size, and scent come from the request
    const { productId, quantity, size, scent } = req.body;
    
    // 1. Fetch Product details from the database to ensure price and name are correct
    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found or invalid ID.");
    }
    
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        // If cart doesn't exist, create it
        cart = await Cart.create({ user: req.user.id, items: [], total: 0 });
    }

    const itemIndex = cart.items.findIndex(item => 
        item.productId.equals(productId) && item.size === size && item.scent === scent
    );

    if (itemIndex > -1) {
        // Item found: Update quantity
        cart.items[itemIndex].quantity += quantity;
    } else {
        // Item not found: Add new item. 
        // Note: We only store productId (ObjectId), quantity, size, and scent. 
        // Name and price will be fetched via .populate() in getCart.
        const newItem = {
            productId: product._id,
            quantity,
            size: size || null,
            scent: scent || null,
        };
        cart.items.push(newItem);
    }
    
    // Recalculate total (Note: This total calc is complex without population, 
    // so it's best handled in getCart or by the frontend for simple displays. 
    // For now, we set a temporary total.)
    // A robust solution here would involve a pre-save hook for calculating the total.
    // For now, we'll rely on the frontend or the logic in getCart for the correct total.
    
    const updatedCart = await cart.save();

    // Re-populate the cart to return the full, correct product data
    const populatedCart = await updatedCart.populate({
        path: 'items.productId',
        model: 'Product',
        select: 'name price image category',
    });
    
    // Final total calculation before sending response
    populatedCart.total = calculateTotal(populatedCart.items);

    res.status(200).json(populatedCart);
});


// @desc    Update an item's quantity in the cart
// @route   PUT /api/cart/update/:itemId
// @access  Private
const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const { itemId } = req.params; // Mongoose _id of the cart item (sub-document)
    const { quantity } = req.body;

    if (isNaN(quantity) || quantity < 1) {
        res.status(400);
        throw new Error("Quantity must be a positive number.");
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
        res.status(404);
        throw new Error("Cart not found for this user.");
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

    if (itemIndex === -1) {
        res.status(404);
        throw new Error("Item not found in cart.");
    }

    // Update the quantity
    cart.items[itemIndex].quantity = quantity;

    // Save and re-populate (similar to addItemToCart)
    const updatedCart = await cart.save();
    
    const populatedCart = await updatedCart.populate({
        path: 'items.productId',
        model: 'Product',
        select: 'name price image category',
    });
    
    populatedCart.total = calculateTotal(populatedCart.items);

    res.status(200).json({
        message: "Cart item quantity updated.",
        cart: populatedCart,
    });
});


// @desc    Remove an item entirely from the cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
const removeItemFromCart = asyncHandler(async (req, res) => {
    const { itemId } = req.params; 

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        res.status(404);
        throw new Error("Cart not found for this user.");
    }

    const originalItemCount = cart.items.length;
    // Use Mongoose's .pull() method to remove the sub-document by its _id
    cart.items.pull({ _id: itemId });

    if (cart.items.length === originalItemCount) {
        // If length hasn't changed, the item ID was not found
        res.status(404);
        throw new Error("Item not found in cart.");
    }

    // Save and re-populate
    const updatedCart = await cart.save();
    
    const populatedCart = await updatedCart.populate({
        path: 'items.productId',
        model: 'Product',
        select: 'name price image category',
    });

    populatedCart.total = calculateTotal(populatedCart.items);

    res.status(200).json({
        message: "Item successfully removed from cart.",
        cart: populatedCart,
    });
});

// @desc Remove all items from the cart
// @route DELETE /api/cart/clear
// @access Private
const clearCart = asyncHandler(async (req, res) => {
    // Find and update the cart to set the items array to empty and total to zero
    const cart = await Cart.findOneAndUpdate(
        { user: req.user.id }, 
        { $set: { items: [], total: 0 } }, 
        { new: true, runValidators: true } 
    );

    res.status(200).json({
        message: "Cart successfully cleared.",
        cart,
    });
});


module.exports = {
    getCart,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCart,
};