/*
 Cart Model
 Defines the structure for a shopping cart associated with a user.
 Each cart document stores an array of items (products) with their quantity and selected options.
 */
// models/Cart.js (OVERWRITE THIS FILE)

/*
 Cart Model
 UPDATED: productId now references the Product Model (ObjectId).
 Removed: name, price - these should be populated from the Product Model.
*/
const mongoose = require("mongoose");

// --- 1. Define the Cart Item Sub-Schema ---
const cartItemSchema = new mongoose.Schema({
  // **CRITICAL CHANGE**: The 'id' now references the Product document's _id
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  // Options remain here as they are specific to the cart item
  size: { 
    type: String, 
    default: null 
  },
  scent: { 
    type: String, 
    default: null 
  },
}, { 
  _id: false 
});


// --- 2. Define the Main Cart Schema ---
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',        
    required: true,
    unique: true,       
  },
  items: [cartItemSchema], // Array of cart items
  total: {
    type: Number,
    required: true,
    default: 0
  },
}, { 
  timestamps: true 
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;