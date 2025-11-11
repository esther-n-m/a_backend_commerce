/*
 Order Model
 Defines the structure for a final, permanent order placed by a user.
 This replaces the 'cart' after a successful checkout.
*/
const mongoose = require("mongoose");

// Schema for an individual item in the order
const orderItemSchema = new mongoose.Schema({
  // **CRITICAL CHANGE**: Use ObjectId to reference the Product Model
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    default: null,
  },
  scent: {
    type: String,
    default: null,
  },
}, {
  _id: false // Items are part of the order document
});


// Main Order Schema
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [orderItemSchema], // Array of products ordered
  totalAmount: {
    type: Number,
    required: true,
  },
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  transactionId: {
    type: String,
    required: true,
    unique: true, // Unique receipt ID
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Paid', 
  },
  orderStatus: {
    type: String,
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing',
  },
}, {
  timestamps: true 
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;