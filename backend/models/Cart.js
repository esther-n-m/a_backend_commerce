/*
 Cart Model
 Defines the structure for a shopping cart associated with a user.
 Each cart document stores an array of items (products) with their quantity and selected options.
 */
const mongoose = require("mongoose");

// --- 1. Define the Cart Item Sub-Schema ---
// This schema describes an individual product entry within the cart's 'items' array.
const cartItemSchema = new mongoose.Schema({
  // The 'id' from the products.json file (which is a number)
  productId: { 
    type: Number, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  // Options (e.g., for products that require a specific size or scent)
  size: { 
    type: String, 
    default: null 
  },
  scent: { 
    type: String, 
    default: null 
  },
}, { 
  // Disable automatic _id creation for sub-documents to keep the array cleaner
  _id: false 
});


// --- 2. Define the Main Cart Schema ---
const cartSchema = new mongoose.Schema({
  // Link the cart to a specific user (critical for an e-commerce application)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',        // Reference the 'User' model
    required: true,
    unique: true,       // Ensures one cart per user (a single active cart)
    index: true         // Index for fast lookups by user ID
  },
  
  // The array of products in the cart, using the sub-schema defined above
  items: [cartItemSchema],

}, {
  // Automatically manage 'createdAt' and 'updatedAt' fields
  timestamps: true
});

// --- 3. Export the Model ---
module.exports = mongoose.model("Cart", cartSchema);
